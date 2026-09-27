// ─────────────────────────────────────────────────────────────────────
// Fitur Generate CV (Form Manual → Pratinjau Live → Hasil → Simpan DB).
//
// Alur:
//  1. User mengisi form manual di view-create-cv (step 1..5).
//     Setiap ketikan langsung memperbarui "Pratinjau Live Dokumen".
//  2. Draft otomatis disimpan ke SERVER per akun (POST /backend/cv.php?draft=1
//     → tabel cv_drafts) — bukan localStorage — sehingga draft terikat ke
//     akun: ganti akun → form kosong/milik akun lain, tidak bocor.
//  3. Tombol "Hasilkan CV ATS" memakai 1 poin (payment gate), menyimpan
//     dokumen ke backend PHP (POST /backend/cv.php → MySQL/phpMyAdmin),
//     lalu menampilkan hasil CV di view-cv-result.
//  4. Hasil bisa disalin teks / diunduh sebagai PDF (window.print).
// ─────────────────────────────────────────────────────────────────────

import { getToken, getStoredUser } from "./auth";
import { showToast } from "./toast";
import { spendPointForGenerate } from "./points";
import { hideAllViews, showView } from "../views/router";

const API_BASE =
  (import.meta.env?.VITE_API_BASE_URL as string | undefined) ||
  resolveBackendBase();

function resolveBackendBase(): string {
  if (typeof window === "undefined") return "";
  const { origin, pathname } = window.location;
  const idx = pathname.toLowerCase().indexOf("/jagocv---salman");
  if (idx >= 0) {
    return `${origin}${pathname.slice(0, idx)}/jagoCV---Salman/backend`;
  }
  return `${origin}/backend`;
}

const LEGACY_DRAFT_KEY = "jagocv_draft_cv"; // draft lama (localStorage) — hanya untuk migrasi

// ── Tipe ─────────────────────────────────────────────────────────────

export interface CvExperience {
  company: string;
  position: string;
  start_date: string;
  end_date: string;
  current: boolean;
  description: string;
}

export interface CvEducation {
  institution: string;
  degree: string;
  field_of_study: string;
  start_year: string;
  end_year: string;
}

export interface CvFormData {
  full_name: string;
  target_role: string;
  email: string;
  phone: string;
  location: string;
  linkedin_url: string;
  portfolio_url: string;
  summary: string;
  experiences: CvExperience[];
  education: CvEducation[];
  skills: string[];
  layout: string;
  photo_data_url: string | null;
}

// ── Util kecil ───────────────────────────────────────────────────────

function val(id: string): string {
  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
  return el?.value.trim() ?? "";
}

/** Escape HTML agar isi form aman dirender ke dokumen. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Ubah "2024-05" menjadi "Mei 2024"; string lain dikembalikan apa adanya. */
export function fmtMonth(value: string): string {
  if (!/^\d{4}-\d{2}$/.test(value)) return value;
  const [y, m] = value.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${names[Number(m) - 1]} ${y}`;
}

/** Normalisasi tema dari kedua grup radio (kiri & kolom kanan). */
function normalizeLayout(raw: string): string {
  if (raw === "ats-standard" || raw === "standar") return "standar";
  if (raw === "modern-creative" || raw === "tech") return "tech";
  if (raw === "entry-level" || raw === "entry") return "entry";
  return "standar";
}

export function readSelectedLayout(): string {
  const left = document.querySelector<HTMLInputElement>('input[name="ats-layout"]:checked');
  const right = document.querySelector<HTMLInputElement>('input[name="cv_layout"]:checked');
  return normalizeLayout(left?.value ?? right?.value ?? "standar");
}

// ── Draft CV per akun (tersimpan di server, bukan localStorage) ──────

// Cache in-memory selama sesi, terikat ke user yang sedang login agar
// ganti akun tidak pernah menampilkan draft milik akun lain.
let draftOwner: number | null = null;
let draftData: CvFormData | null = null;
let draftSaveTimer: number | null = null;
let draftEpoch = 0; // naik saat draft dihapus → timer autosave lama jadi kedaluwarsa
let suppressDraftSave = false; // true saat form sedang dikosongkan (logout)

function currentUserId(): number | null {
  return getStoredUser()?.id ?? null;
}

function draftHeaders(): Record<string, string> {
  const token = getToken();
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

/**
 * Muat draft milik user yang sedang login dari server.
 * Cache in-memory dipakai bila sudah pernah dimuat untuk akun yang sama.
 */
export async function loadCvDraftForUser(): Promise<CvFormData | null> {
  const uid = currentUserId();
  const token = getToken();
  if (uid === null || !token) return null;
  if (draftOwner === uid) return draftData ? normalizeDraft(draftData) : null;

  try {
    const res = await fetch(`${API_BASE}/cv.php?draft=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok: boolean; draft?: unknown };
    draftOwner = uid;
    draftData = data.ok ? normalizeDraft(data.draft) : null;
  } catch {
    return null; // server tidak terjangkau — form tetap kosong, bukan draft akun lain
  }
  return draftData;
}

/** Isi ulang form dari draft server milik user yang sedang login. */
export async function restoreCvDraftForCurrentUser(): Promise<void> {
  const draft = await loadCvDraftForUser();
  if (draft && currentUserId() !== null && draftOwner === currentUserId()) {
    restoreCvFormFromDraft(draft);
  }
}

/** Reset cache draft sesi (dipanggil saat logout sebelum user lain masuk). */
export function resetCvDraftSession(): void {
  draftOwner = null;
  draftData = null;
}

/** Simpan draft ke server (debounce 800ms agar tidak request di tiap ketikan). */
function queueDraftSave(data: CvFormData): void {
  if (suppressDraftSave) return; // form sedang dikosongkan → jangan timpa draft server
  const uid = currentUserId();
  if (uid === null || !getToken()) return; // belum login → jangan simpan
  if (draftSaveTimer !== null) window.clearTimeout(draftSaveTimer);
  // Kunci timer ke akun & epoch yang memicunya: bila user logout/ganti akun/
  // generate sebelum timer jalan, data lama tidak pernah tersimpan ulang.
  const scheduledFor = uid;
  const scheduledEpoch = draftEpoch;
  draftSaveTimer = window.setTimeout(() => {
    draftSaveTimer = null;
    if (
      suppressDraftSave ||
      draftEpoch !== scheduledEpoch ||
      currentUserId() !== scheduledFor ||
      !getToken()
    )
      return;
    void (async () => {
      try {
        await fetch(`${API_BASE}/cv.php?draft=1`, {
          method: "POST",
          headers: draftHeaders(),
          body: JSON.stringify(data),
        });
      } catch {
        /* server tidak terjangkau — draft berikutnya akan menyimpan ulang */
      }
    })();
  }, 800);
}

/**
 * Hapus draft di server (setelah CV berhasil dibuat) + reset cache sesi
 * + bersihkan draft legacy di localStorage bila masih ada.
 */
export async function clearCvDraft(): Promise<void> {
  resetCvDraftSession();
  draftEpoch++; // batalkan autosave yang sedang terjadwal/berjalan
  if (draftSaveTimer !== null) {
    window.clearTimeout(draftSaveTimer);
    draftSaveTimer = null;
  }
  try {
    localStorage.removeItem(LEGACY_DRAFT_KEY);
  } catch {
    /* abaikan */
  }
  const token = getToken();
  if (!token) return;
  try {
    await fetch(`${API_BASE}/cv.php?draft=1`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    /* abaikan */
  }
}

/**
 * Migrasi sekali: draft lama di localStorage (jagocv_draft_cv) dipindah
 * ke akun yang sedang login (bila server belum punya), lalu key dihapus
 * supaya tidak pernah bocor ke akun lain di browser yang sama.
 */
function migrateLegacyDraft(): void {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEGACY_DRAFT_KEY);
  } catch {
    return;
  }
  if (!raw) return;

  const token = getToken();
  if (!token || currentUserId() === null) {
    // Tidak ada sesi: draft anonim tidak bisa dipindahkan — buang saja.
    try {
      localStorage.removeItem(LEGACY_DRAFT_KEY);
    } catch {
      /* abaikan */
    }
    return;
  }

  void (async () => {
    try {
      const res = await fetch(`${API_BASE}/cv.php?draft=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return; // jangan hapus legacy dulu bila server bermasalah
      const data = (await res.json()) as { ok: boolean; draft?: unknown };
      if (data.ok && !data.draft) {
        const push = await fetch(`${API_BASE}/cv.php?draft=1`, {
          method: "POST",
          headers: draftHeaders(),
          body: raw ?? "",
        });
        if (push.ok) {
          const parsed = normalizeDraft(JSON.parse(raw ?? ""));
          if (parsed) {
            draftOwner = currentUserId();
            draftData = parsed;
            restoreCvFormFromDraft(parsed);
          }
        }
      }
      try {
        localStorage.removeItem(LEGACY_DRAFT_KEY);
      } catch {
        /* abaikan */
      }
    } catch {
      /* server tidak terjangkau — migrasi diulang saat load berikutnya */
    }
  })();
}

/**
 * Kosongkan seluruh field form CV di DOM sehingga form benar-benar baru.
 * Reset mencakup: field identitas, SEMUA blok pengalaman/pendidikan
 * (termasuk hasil clone "Tambah Peran/Pendidikan" — sisakan 1 blok kosong),
 * checkbox "masih bekerja", foto profil, tema CV (kembali ke standar),
 * dan wizard kembali ke step 1.
 */
export function clearCvFormDom(): void {
  suppressDraftSave = true;
  const ids = [
    "cv-full-name",
    "cv-target-role",
    "cv-email",
    "cv-phone",
    "cv-location",
    "cv-linkedin-url",
    "cv-portfolio-url",
    "cv-summary",
    "cv-skills",
  ];
  ids.forEach((id) => {
    const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
    if (el) el.value = "";
  });
  document
    .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      '#view-create-cv input[name="exp_company"], #view-create-cv input[name="exp_position"], #view-create-cv input[name="exp_start"], #view-create-cv input[name="exp_end"], #view-create-cv textarea[name="exp_description"], #view-create-cv input[name="edu_institution"], #view-create-cv input[name="edu_degree"], #view-create-cv input[name="edu_field"], #view-create-cv input[name="edu_start"], #view-create-cv input[name="edu_end"]',
    )
    .forEach((el) => {
      el.value = "";
    });
  document
    .querySelectorAll<HTMLInputElement>('#view-create-cv input[name="exp_current"]')
    .forEach((el) => {
      el.checked = false;
    });

  // Blok pengalaman & pendidikan dinamis: sisakan 1 blok kosong per step
  // supaya user kembali ke kondisi awal, bukan deretan blok yang dulu diisi.
  const stripClones = (stepId: string, blockClass: string): void => {
    const step = document.getElementById(stepId);
    if (!step) return;
    const blocks = Array.from(step.querySelectorAll<HTMLElement>(`.${blockClass}`));
    blocks.slice(1).forEach((b) => b.remove());
  };
  stripClones("cv-step-2", "cv-exp-block");
  stripClones("cv-step-3", "cv-edu-block");

  // Reset tema CV ke "standar" di kedua grup radio + sorot kartu pertama.
  const atsStandard = document.querySelector<HTMLInputElement>('input[name="ats-layout"][value="standar"]');
  const cvStandard = document.querySelector<HTMLInputElement>('input[name="cv_layout"][value="ats-standard"]');
  if (atsStandard) atsStandard.checked = true;
  if (cvStandard) cvStandard.checked = true;
  document.querySelectorAll<HTMLElement>(".cv-layout-card").forEach((card, i) => {
    if (i === 0) {
      card.classList.add("selected", "border-blue-500", "bg-blue-50", "dark:bg-[#1E5EFF]/10");
      card.classList.remove("border-slate-200", "dark:border-[#2A3143]", "bg-transparent");
      card.querySelector(".layout-check-badge")?.classList.remove("hidden");
    } else {
      card.classList.remove("selected", "border-blue-500", "bg-blue-50", "dark:bg-[#1E5EFF]/10");
      card.classList.add("border-slate-200", "dark:border-[#2A3143]", "bg-transparent");
      card.querySelector(".layout-check-badge")?.classList.add("hidden");
    }
  });

  const photoInput = document.getElementById("cv-photo-input") as HTMLInputElement | null;
  if (photoInput) {
    delete photoInput.dataset.previewUrl;
    photoInput.value = "";
    const label = photoInput.closest("label");
    label?.querySelector("img.cv-photo-preview")?.remove();
    label?.querySelector("svg")?.classList.remove("opacity-0");
    label?.querySelector("span")?.classList.remove("opacity-0");
  }

  // Wizard kembali ke step 1 (form baru = pengisian dari awal).
  sessionStorage.removeItem("jagocv_cv_step");
  (window as any).goToCvStep?.(1);

  updateCvLivePreview();
  suppressDraftSave = false;
}

// ── Baca & pulihkan form ─────────────────────────────────────────────

/** Kumpulkan seluruh data form manual dari DOM, lalu simpan sebagai draft. */
export function collectCvForm(): CvFormData {
  const experiences: CvExperience[] = [];
  document
    .querySelectorAll<HTMLInputElement>('#view-create-cv input[name="exp_company"]')
    .forEach((companyEl, i) => {
      const scope = companyEl.closest(".cv-exp-block") ?? companyEl.closest("#cv-step-2");
      const pick = (sel: string): HTMLInputElement | HTMLTextAreaElement | null =>
        scope?.querySelector(sel) ?? null;
      const endEl = pick('input[name="exp_end"]');
      const currentEl = pick('input[name="exp_current"]') as HTMLInputElement | null;
      const descEl = pick('textarea[name="exp_description"]');
      const exp: CvExperience = {
        company: companyEl.value.trim(),
        position: (pick('input[name="exp_position"]') as HTMLInputElement | null)?.value.trim() ?? "",
        start_date: (pick('input[name="exp_start"]') as HTMLInputElement | null)?.value ?? "",
        end_date: currentEl?.checked ? "" : (endEl as HTMLInputElement | null)?.value ?? "",
        current: Boolean(currentEl?.checked),
        description: (descEl as HTMLTextAreaElement | null)?.value.trim() ?? "",
      };
      // Lewati blok yang benar-benar kosong (mis. klon "Tambah Peran" belum diisi).
      if (exp.company || exp.position || exp.description) experiences.push(exp);
      void i;
    });

  const education: CvEducation[] = [];
  document
    .querySelectorAll<HTMLInputElement>('#view-create-cv input[name="edu_institution"]')
    .forEach((instEl) => {
      const scope = instEl.closest(".cv-edu-block") ?? instEl.closest("#cv-step-3");
      const pick = (sel: string): HTMLInputElement | null => scope?.querySelector(sel) ?? null;
      const edu: CvEducation = {
        institution: instEl.value.trim(),
        degree: pick('input[name="edu_degree"]')?.value.trim() ?? "",
        field_of_study: pick('input[name="edu_field"]')?.value.trim() ?? "",
        start_year: pick('input[name="edu_start"]')?.value.trim() ?? "",
        end_year: pick('input[name="edu_end"]')?.value.trim() ?? "",
      };
      if (edu.institution || edu.degree) education.push(edu);
    });

  const skills = val("cv-skills")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const photoEl = document.getElementById("cv-photo-input") as HTMLInputElement | null;
  const photoDataUrl = photoEl?.dataset.previewUrl || null;

  const data: CvFormData = {
    full_name: val("cv-full-name"),
    target_role: val("cv-target-role"),
    email: val("cv-email"),
    phone: val("cv-phone"),
    location: val("cv-location"),
    linkedin_url: val("cv-linkedin-url"),
    portfolio_url: val("cv-portfolio-url"),
    summary: val("cv-summary"),
    experiences,
    education,
    skills,
    layout: readSelectedLayout(),
    photo_data_url: photoDataUrl,
  };

  // Draft per akun: autosave ke server (debounced).
  queueDraftSave(data);
  return data;
}

/** Isi ulang form dari draft server milik akun yang sedang login. */
export function restoreCvFormFromDraft(data: CvFormData): void {
  const setVal = (id: string, value: string): void => {
    const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
    if (el) el.value = value;
  };
  setVal("cv-full-name", data.full_name);
  setVal("cv-target-role", data.target_role);
  setVal("cv-email", data.email);
  setVal("cv-phone", data.phone);
  setVal("cv-location", data.location);
  setVal("cv-linkedin-url", data.linkedin_url);
  setVal("cv-portfolio-url", data.portfolio_url);
  setVal("cv-summary", data.summary);
  setVal("cv-skills", data.skills.join(", "));

  // Blok pengalaman pertama di HTML statis — isi bila ada draft.
  if (data.experiences.length > 0) {
    const exp = data.experiences[0];
    const block = document.querySelector<HTMLElement>("#cv-step-2 .cv-exp-block");
    if (block) {
      const fill = (sel: string, value: string): void => {
        const el = block.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement | null;
        if (el) el.value = value;
      };
      fill('input[name="exp_company"]', exp.company);
      fill('input[name="exp_position"]', exp.position);
      fill('input[name="exp_start"]', exp.start_date);
      if (!exp.current) fill('input[name="exp_end"]', exp.end_date);
      fill('textarea[name="exp_description"]', exp.description);
      if (exp.current) {
        const cb = block.querySelector('input[name="exp_current"]') as HTMLInputElement | null;
        if (cb) cb.checked = true;
      }
    }
  }

  if (data.education.length > 0) {
    const edu = data.education[0];
    const block = document.querySelector<HTMLElement>("#cv-step-3 .cv-edu-block");
    if (block) {
      const fill = (sel: string, value: string): void => {
        const el = block.querySelector(sel) as HTMLInputElement | null;
        if (el) el.value = value;
      };
      fill('input[name="edu_institution"]', edu.institution);
      fill('input[name="edu_degree"]', edu.degree);
      fill('input[name="edu_field"]', edu.field_of_study);
      fill('input[name="edu_start"]', edu.start_year);
      fill('input[name="edu_end"]', edu.end_year);
    }
  }

  if (data.photo_data_url) {
    setPhotoPreview(data.photo_data_url);
  }

  updateCvLivePreview();
}

// ── Foto profil ──────────────────────────────────────────────────────

function setPhotoPreview(dataUrl: string): void {
  const input = document.getElementById("cv-photo-input") as HTMLInputElement | null;
  if (!input) return;
  input.dataset.previewUrl = dataUrl;

  const label = input.closest("label");
  if (!label) return;
  let img = label.querySelector("img.cv-photo-preview") as HTMLImageElement | null;
  if (!img) {
    img = document.createElement("img");
    img.className = "cv-photo-preview absolute inset-0 w-full h-full object-cover";
    label.appendChild(img);
  }
  img.src = dataUrl;
  const icon = label.querySelector("svg");
  const text = label.querySelector("span");
  icon?.classList.add("opacity-0");
  text?.classList.add("opacity-0");
}

function bindPhotoInput(): void {
  const input = document.getElementById("cv-photo-input") as HTMLInputElement | null;
  if (!input) return;
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(String(reader.result));
      updateCvLivePreview();
    };
    reader.readAsDataURL(file);
  });
}

// ── Pratinjau Live ───────────────────────────────────────────────────

/**
 * Render pratinjau mini (rasio A4) di kolom kanan builder.
 * Dipanggil otomatis pada setiap input form & perubahan tema.
 */
export function updateCvLivePreview(): void {
  const root = document.getElementById("cv-live-preview");
  if (!root) return;

  const data = collectCvForm();
  const e = escapeHtml;
  const name = data.full_name || "Nama Anda";
  const role = data.target_role || "Peran Target";
  const contacts = [data.email, data.phone, data.location].filter(Boolean).map(e);
  const skillList = data.skills.slice(0, 12);

  const expItems = data.experiences
    .map(
      (x) => `
      <div class="mb-2">
        <div class="flex justify-between gap-2">
          <span class="font-bold text-[9px] text-slate-800 truncate">${e(x.company || "Perusahaan")}</span>
          <span class="text-[8px] text-slate-500 shrink-0">${e([fmtMonth(x.start_date), x.current ? "Sekarang" : fmtMonth(x.end_date)].filter(Boolean).join(" – "))}</span>
        </div>
        <div class="text-[8px] italic text-slate-600 truncate">${e(x.position || "Jabatan")}</div>
        ${x.description ? `<div class="text-[7.5px] text-slate-600 leading-snug line-clamp-2">${e(x.description)}</div>` : ""}
      </div>`,
    )
    .join("");

  const eduItems = data.education
    .map(
      (x) => `
      <div class="mb-2">
        <div class="font-bold text-[9px] text-slate-800 truncate">${e(x.institution || "Institusi")}</div>
        <div class="text-[8px] italic text-slate-600 truncate">${e([x.degree, x.field_of_study].filter(Boolean).join(" – ") || "Gelar")}</div>
        <div class="text-[8px] text-slate-500">${e([x.start_year, x.end_year].filter(Boolean).join(" – "))}</div>
      </div>`,
    )
    .join("");

  const skillsHtml = skillList.length
    ? `<div class="flex flex-wrap gap-1">${skillList.map((s) => `<span class="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-[7px] font-semibold text-blue-700">${e(s)}</span>`).join("")}</div>`
    : `<div class="text-[8px] text-slate-400">Keahlian Anda...</div>`;

  const headerBlock = `
    <div class="${data.layout === "tech" ? "px-3 pt-3 pb-2" : "text-center px-3 pt-3 pb-2 border-b border-slate-200"}">
      ${data.photo_data_url && data.layout !== "tech" ? `<img src="${data.photo_data_url}" class="w-10 h-10 rounded-full object-cover mx-auto mb-1 border border-slate-200" />` : ""}
      <div class="font-extrabold text-[12px] text-slate-900 leading-tight uppercase truncate">${e(name)}</div>
      <div class="text-[8.5px] font-semibold text-blue-600 truncate">${e(role)}</div>
      <div class="text-[7px] text-slate-500 mt-0.5 truncate">${contacts.join(" · ") || "email · telepon · lokasi"}</div>
    </div>`;

  const summaryBlock = data.summary
    ? `<div class="px-3 mb-2">
         <div class="text-[8px] font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-0.5 mb-1">Ringkasan</div>
         <div class="text-[7.5px] text-slate-600 leading-snug line-clamp-3">${e(data.summary)}</div>
       </div>`
    : "";

  const bodyCol = `
    ${summaryBlock}
    <div class="px-3 mb-2">
      <div class="text-[8px] font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-0.5 mb-1">Pengalaman</div>
      ${expItems || '<div class="text-[8px] text-slate-400">Pengalaman kerja Anda...</div>'}
    </div>
    <div class="px-3">
      <div class="text-[8px] font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-0.5 mb-1">Pendidikan</div>
      ${eduItems || '<div class="text-[8px] text-slate-400">Riwayat pendidikan...</div>'}
    </div>`;

  let html = "";
  if (data.layout === "tech") {
    html = `
      <div class="flex h-full text-left">
        <div class="w-1/3 bg-slate-900 text-white p-3 flex flex-col gap-2">
          ${data.photo_data_url ? `<img src="${data.photo_data_url}" class="w-12 h-12 rounded-full object-cover mx-auto border-2 border-cyan-400/60" />` : ""}
          <div class="text-[7px] font-extrabold uppercase tracking-wider text-cyan-300 border-b border-white/20 pb-0.5">Kontak</div>
          <div class="text-[7px] text-slate-300 leading-snug break-words">${contacts.join("<br/>") || "email · telp"}</div>
          <div class="text-[7px] font-extrabold uppercase tracking-wider text-cyan-300 border-b border-white/20 pb-0.5 mt-1">Keahlian</div>
          <div class="flex flex-wrap gap-0.5">${skillList.map((s) => `<span class="px-1 py-0.5 rounded bg-white/10 text-[6.5px] text-cyan-200">${e(s)}</span>`).join("") || '<span class="text-[7px] text-slate-400">-</span>'}</div>
        </div>
        <div class="flex-1 flex flex-col">
          <div class="px-3 pt-3 pb-2 border-b border-slate-200">
            <div class="font-extrabold text-[12px] text-slate-900 leading-tight truncate">${e(name)}</div>
            <div class="text-[8.5px] font-semibold text-cyan-600 truncate">${e(role)}</div>
          </div>
          <div class="pt-2">${bodyCol}</div>
        </div>
      </div>`;
  } else if (data.layout === "entry") {
    html = `
      <div class="h-full">
        <div class="bg-emerald-500/90 text-white px-3 py-2 text-center">
          ${data.photo_data_url ? `<img src="${data.photo_data_url}" class="w-10 h-10 rounded-full object-cover mx-auto mb-1 border-2 border-white/70" />` : ""}
          <div class="font-extrabold text-[12px] leading-tight uppercase truncate">${e(name)}</div>
          <div class="text-[8.5px] font-semibold truncate">${e(role)}</div>
          <div class="text-[7px] truncate opacity-90">${contacts.join(" · ") || "email · telepon"}</div>
        </div>
        <div class="pt-2">${bodyCol}${skillsBlockForEntry(skillsHtml)}</div>
      </div>`;
  } else {
    html = `
      <div class="h-full">
        ${headerBlock}
        <div class="pt-2">${bodyCol}${skillsBlockForEntry(skillsHtml)}</div>
      </div>`;
  }

  root.innerHTML = html;
}

function skillsBlockForEntry(skillsHtml: string): string {
  return `
    <div class="px-3 mt-2">
      <div class="text-[8px] font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-0.5 mb-1">Keahlian</div>
      ${skillsHtml}
    </div>`;
}

/** Pasang listener agar pratinjau live mengikuti setiap perubahan form. */
export function bindCvLivePreview(): void {
  const container = document.getElementById("container-cv-manual");
  if (container && !container.dataset.livePreviewBound) {
    container.dataset.livePreviewBound = "1";
    container.addEventListener("input", updateCvLivePreview);
    container.addEventListener("change", updateCvLivePreview);
  }
  bindPhotoInput();

  // Draft per akun: pulihkan dari server (bila user sudah login, mis. saat
  // refresh) dan migrasikan draft legacy localStorage satu kali.
  void restoreCvDraftForCurrentUser();
  migrateLegacyDraft();

  updateCvLivePreview();
}

// ── Render hasil CV (dokumen A4) ─────────────────────────────────────

/** Render CV lengkap ke #cv-document-container di view-cv-result. */
export function renderCvResult(data: CvFormData, root: HTMLElement | null): void {
  const container = document.getElementById("cv-document-container") ?? root;
  if (!container) return;

  const e = escapeHtml;
  const name = data.full_name || "Nama Anda";
  const role = data.target_role;

  const contacts: string[] = [];
  if (data.email) contacts.push(contactItem(mailIcon(), data.email));
  if (data.phone) contacts.push(contactItem(phoneIcon(), data.phone));
  if (data.location) contacts.push(contactItem(pinIcon(), data.location));
  if (data.linkedin_url) contacts.push(contactItem(linkIcon(), data.linkedin_url));
  if (data.portfolio_url) contacts.push(contactItem(globeIcon(), data.portfolio_url));

  const contactLine = contacts
    .map((c, i) => (i > 0 ? '<span class="text-slate-400">|</span>' : "") + c)
    .join(" ");

  const photoTop =
    data.photo_data_url && data.layout !== "tech"
      ? `<img src="${data.photo_data_url}" class="w-20 h-20 rounded-full object-cover mx-auto mb-3 border border-slate-300 shadow-sm" />`
      : "";

  const summarySection = data.summary
    ? `
    <section class="mb-6">
      <h2 class="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-800 pb-1 mb-3">Ringkasan Profesional</h2>
      <p class="text-slate-900 text-justify leading-relaxed">${e(data.summary)}</p>
    </section>`
    : "";

  const expSection = data.experiences.length
    ? `
    <section class="mb-6">
      <h2 class="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-800 pb-1 mb-3">Pengalaman Kerja</h2>
      ${data.experiences
        .map((x) => {
          const period = [fmtMonth(x.start_date), x.current ? "Sekarang" : fmtMonth(x.end_date)]
            .filter(Boolean)
            .join(" – ");
          const bullets = x.description
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean)
            .map((l) => `<li>${e(l)}</li>`)
            .join("");
          return `
          <div class="mb-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
              <h3 class="font-bold text-slate-900 text-base">${e(x.company || "-")}</h3>
              <span class="font-semibold text-slate-900 text-sm">${e(period)}</span>
            </div>
            <h4 class="font-semibold text-slate-900 italic mb-1">${e(x.position || "-")}</h4>
            ${bullets ? `<ul class="list-disc pl-5 text-slate-900 space-y-1">${bullets}</ul>` : ""}
          </div>`;
        })
        .join("")}
    </section>`
    : "";

  const eduSection = data.education.length
    ? `
    <section class="mb-6">
      <h2 class="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-800 pb-1 mb-3">Pendidikan</h2>
      ${data.education
        .map((x) => {
          const years = [x.start_year, x.end_year].filter(Boolean).join(" – ");
          const title = [x.degree, x.field_of_study].filter(Boolean).join(" – ");
          return `
          <div class="mb-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
              <h3 class="font-bold text-slate-900 text-base">${e(x.institution || "-")}</h3>
              <span class="font-semibold text-slate-900 text-sm">${e(years)}</span>
            </div>
            <h4 class="font-semibold text-slate-900 italic">${e(title || "-")}</h4>
          </div>`;
        })
        .join("")}
    </section>`
    : "";

  const skillsSection = data.skills.length
    ? `
    <section class="mb-6">
      <h2 class="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-800 pb-1 mb-3">Keahlian</h2>
      <ul class="text-slate-900 space-y-1">
        <li><span class="font-bold text-slate-900">Keterampilan:</span> ${data.skills.map(e).join(", ")}</li>
      </ul>
    </section>`
    : "";

  const roleLine = role
    ? `<p class="text-sm font-semibold text-slate-600 uppercase tracking-widest mb-2">${e(role)}</p>`
    : "";

  container.setAttribute("id", "cv-document-container");
  container.setAttribute("data-print-area", "1");
  container.className =
    "max-w-4xl mx-auto bg-white border border-slate-200 rounded-md shadow-2xl p-8 sm:p-12 text-slate-900 font-sans leading-relaxed text-sm relative";
  container.innerHTML = `
    <header class="text-center mb-8 border-b-2 border-slate-900 pb-6">
      ${photoTop}
      <h1 class="text-3xl font-bold text-slate-900 tracking-tight mb-1 uppercase">${e(name)}</h1>
      ${roleLine}
      <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-slate-900 font-medium">
        ${contactLine}
      </div>
    </header>
    ${summarySection}
    ${expSection}
    ${eduSection}
    ${skillsSection}
  `;
}

function contactItem(icon: string, text: string): string {
  return `<span class="flex items-center gap-1">${icon}<span class="break-all">${escapeHtml(text)}</span></span>`;
}

// Ikon kecil (stroke, sesuai gaya Tailwind di dokumen hasil).
function mailIcon(): string {
  return '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>';
}
function phoneIcon(): string {
  return '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>';
}
function pinIcon(): string {
  return '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>';
}
function linkIcon(): string {
  return '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>';
}
function globeIcon(): string {
  return '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>';
}

// ── Unduh PDF & salin teks ───────────────────────────────────────────

/** Unduh PDF lewat dialog print browser (pilih "Save as PDF"). */
export function downloadCvPdf(): void {
  const doc = document.getElementById("cv-document-container");
  if (!doc) return;

  let style = document.getElementById("cv-print-style") as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = "cv-print-style";
    document.head.appendChild(style);
  }
  style.textContent = `
    @media print {
      body * { visibility: hidden !important; }
      #cv-document-container, #cv-document-container * { visibility: visible !important; }
      #cv-document-container {
        position: absolute !important; left: 0; top: 0; width: 100%;
        box-shadow: none !important; border: none !important; border-radius: 0 !important;
        background: #fff !important; color: #111 !important;
      }
      .js-global-chat { display: none !important; }
    }
  `;

  const cleanup = (): void => {
    style?.remove();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  showToast("Pilih \"Save as PDF\" pada dialog cetak untuk mengunduh CV Anda.");
  setTimeout(() => window.print(), 150);
}

/** Salin seluruh teks CV ke clipboard. */
export function copyCvText(): void {
  const doc = document.getElementById("cv-document-container");
  if (!doc) return;
  const text = doc.innerText;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => showToast("Teks CV disalin ke clipboard!"))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text: string): void {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
    showToast("Teks CV disalin ke clipboard!");
  } catch {
    showToast("Gagal menyalin teks.");
  }
  ta.remove();
}

/** Pasang aksi tombol "Salin Teks" & "Unduh PDF" pada view hasil. */
export function bindCvResultActions(): void {
  const btnCopy = document.getElementById("btn-copy-cv-text");
  const btnPdf = document.getElementById("btn-download-cv-pdf");
  btnCopy?.addEventListener("click", copyCvText);
  btnPdf?.addEventListener("click", downloadCvPdf);
}

// ── Simpan ke backend (MySQL/phpMyAdmin) ─────────────────────────────

interface CvSaveResponse {
  ok: boolean;
  message?: string;
  document?: { id: number; doc_code: string; title: string; type: string; status: string };
}

/**
 * Kirim data CV ke POST /backend/cv.php (butuh token login).
 * Bila gagal (mis. server mati), tetap kembalikan true agar pratinjau
 * hasil tetap tampil — sinkronisasi DB bisa diulang user nanti.
 */
export async function saveCvToServer(data: CvFormData): Promise<boolean> {
  const token = getToken();
  if (!token) {
    showToast("Sesi berakhir. Silakan login ulang untuk menyimpan CV.");
    return false;
  }

  try {
    const res = await fetch(`${API_BASE}/cv.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const result = (await res.json().catch(() => null)) as CvSaveResponse | null;

    if (res.status === 401) {
      showToast(result?.message ?? "Sesi tidak valid. Silakan login ulang.");
      return false;
    }
    if (!result || !result.ok) {
      showToast(result?.message ?? "Gagal menyimpan CV ke server.");
      return false;
    }

    showToast(
      `CV tersimpan sebagai ${result.document?.doc_code ?? "dokumen baru"} di akun Anda ✅`,
    );
    return true;  } catch {
    showToast(
      "CV ditampilkan, tetapi /backend/cv.php tidak terjangkau. Buka /backend/ping.php di browser untuk diagnosa koneksi.",
    );
    return false;
  }
}

// ── Alur generate utama ──────────────────────────────────────────────

/** Pastikan draft dari server punya bentuk lengkap sebelum dipakai. */
function normalizeDraft(raw: unknown): CvFormData | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Partial<CvFormData>;
  return {
    full_name: typeof d.full_name === "string" ? d.full_name : "",
    target_role: typeof d.target_role === "string" ? d.target_role : "",
    email: typeof d.email === "string" ? d.email : "",
    phone: typeof d.phone === "string" ? d.phone : "",
    location: typeof d.location === "string" ? d.location : "",
    linkedin_url: typeof d.linkedin_url === "string" ? d.linkedin_url : "",
    portfolio_url: typeof d.portfolio_url === "string" ? d.portfolio_url : "",
    summary: typeof d.summary === "string" ? d.summary : "",
    experiences: Array.isArray(d.experiences) ? d.experiences : [],
    education: Array.isArray(d.education) ? d.education : [],
    skills: Array.isArray(d.skills) ? d.skills : [],
    layout: typeof d.layout === "string" ? d.layout : "standar",
    photo_data_url: typeof d.photo_data_url === "string" ? d.photo_data_url : null,
  };
}

/**
 * Alur lengkap tombol "Hasilkan CV ATS":
 * validasi form → payment gate (1 poin) → simpan ke DB → render hasil.
 */
export async function generateCvFromManualForm(): Promise<void> {
  // Baca langsung dari form (bukan draft tersimpan) supaya selalu data terbaru.
  const data = collectCvForm();

  if (!data.full_name) {
    showToast("Nama Lengkap wajib diisi (Step 1) sebelum menghasilkan CV.");
    (window as any).goToCvStep?.(1);
    document.getElementById("cv-full-name")?.focus();
    return;
  }
  if (!data.email) {
    showToast("Alamat Email wajib diisi (Step 1) sebelum menghasilkan CV.");
    (window as any).goToCvStep?.(1);
    document.getElementById("cv-email")?.focus();
    return;
  }

  // Payment gate: pakai 1 poin; bila habis, modal top up ditampilkan.
  const allowed = await spendPointForGenerate();
  if (!allowed) return;

  // Simpan ke MySQL via backend PHP (gagal tidak menghentikan pratinjau).
  const saved = await saveCvToServer(data);

  if (saved) {
    // CV sudah jadi dokumen di server → hapus draft per akun & kosongkan
    // form supaya siap untuk dokumen berikutnya.
    await clearCvDraft();
    clearCvFormDom();
  } else {
    // Simpan gagal → draft lama tidak boleh dianggap masih valid.
    // Hapus juga di server agar user berikutnya memulai dari form kosong.
    await clearCvDraft();
  }

  renderCvResult(data, document.getElementById("view-cv-result"));
  hideAllViews();
  showView(document.getElementById("view-cv-result"));
  showToast("CV ATS berhasil dibuat! Pratinjau dokumen siap diperiksa. ✨");
}
