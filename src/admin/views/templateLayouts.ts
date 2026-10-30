/**
 * Registry renderer layout template — jembatan antara katalog admin (Menu 2)
 * dan tema visual yang benar-benar dipakai halaman pengguna.
 *
 * Satu sumber kebenaran untuk:
 *   - daftar layout valid per kategori (CV ATS / Resume / Portfolio),
 *   - label + keterangan yang tampil di form & halaman detail,
 *   - pratinjau visual yang meniru keluaran renderer user, sehingga kartu
 *     katalog, halaman detail, dan form edit menampilkan preview yang SAMA
 *     untuk layout yang sama (integrasi resume & portofolio).
 *
 * Pemetaan ke aplikasi pengguna:
 *   CV ATS    → `src/js/utils/cvData.ts` (`layout`: standar | tech | entry)
 *   Resume    → `src/html/design-resume.html` langkah 5 "Pilih Layout Visual"
 *   Portfolio → `src/html/build-portfolio.html` "7. Gaya Tata Letak Akhir"
 *
 * Preview digambar pada kanvas logis 380×520 px lalu diskalakan ke lebar
 * kontainer (lihat `fitPreviews`) — tajam di thumbnail kartu maupun panel
 * besar halaman detail, tanpa duplikasi markup.
 */
import { esc } from "../ui";

export type TemplateCategory = "CV ATS" | "Resume" | "Portfolio";

export const PREVIEW_W = 380;
export const PREVIEW_H = 520;

export interface LayoutOption {
  key: string;
  label: string;
  category: TemplateCategory;
  /** Keterangan singkat: tema mana di aplikasi pengguna yang diwakili. */
  hint: string;
  /** Warna aksen default (bisa ditimpa `config.accent`). */
  accent: string;
  render: (accent: string) => string;
}

// ── Data contoh untuk pratinjau ──────────────────────────────────────

const SAMPLE = {
  name: "Salman Uyat",
  initials: "SU",
  role: "Frontend Developer",
  email: "salman@email.com",
  phone: "+62 812 3456 7890",
  location: "Jakarta, ID",
  website: "jagocv.link/salmanuyat",
  summary:
    "Membangun aplikasi web interaktif dan mengeksplorasi utilitas AI untuk memberikan pengalaman digital yang mulus.",
  experiences: [
    { company: "Nusantara Digital", role: "Frontend Engineer", period: "2022 – Sekarang", desc: "Membangun dashboard analitik & design system internal." },
    { company: "Studio Kreatif", role: "Web Developer", period: "2020 – 2022", desc: "Landing page, integrasi API, dan optimasi performa." },
  ],
  education: [
    { school: "Universitas Indonesia", degree: "S1 Ilmu Komputer", period: "2016 – 2020" },
  ],
  skills: ["TypeScript", "React", "Tailwind", "Node.js", "Figma"],
  projects: [
    { name: "JagoCV", tag: "SaaS" },
    { name: "KasirKu", tag: "POS" },
    { name: "DataViz", tag: "Analitik" },
    { name: "Porto AI", tag: "AI" },
  ],
  links: ["Lihat Resume Saya", "Cek GitHub Saya", "Terhubung di LinkedIn"],
};

// ── Potongan markup bersama ──────────────────────────────────────────

function sectionTitle(text: string, accent: string, dark = false): string {
  return `<p class="text-[8.5px] font-extrabold uppercase tracking-[0.12em] ${
    dark ? "text-white/70 border-white/20" : "text-slate-700 border-slate-200"
  } border-b pb-1 mb-1.5" ${dark ? "" : `style="border-color:${accent}33"`}>${esc(text)}</p>`;
}

function experienceList(accent: string, compact = false): string {
  return SAMPLE.experiences
    .map(
      (x) => `
      <div class="mb-2">
        <div class="flex items-baseline justify-between gap-2">
          <span class="text-[9.5px] font-bold text-slate-900 truncate">${esc(x.company)}</span>
          <span class="text-[8px] text-slate-500 shrink-0">${esc(x.period)}</span>
        </div>
        <p class="text-[8.5px] font-semibold" style="color:${accent}">${esc(x.role)}</p>
        ${compact ? "" : `<p class="text-[8px] text-slate-600 leading-snug mt-0.5">${esc(x.desc)}</p>`}
      </div>`,
    )
    .join("");
}

function educationList(_accent: string): string {
  return SAMPLE.education
    .map(
      (x) => `
      <div class="mb-2">
        <div class="text-[9.5px] font-bold text-slate-900 truncate">${esc(x.school)}</div>
        <div class="text-[8.5px] text-slate-600">${esc(x.degree)}</div>
        <div class="text-[8px] text-slate-500">${esc(x.period)}</div>
      </div>`,
    )
    .join("");
}

function skillChips(accent: string, dark = false): string {
  return `<div class="flex flex-wrap gap-1">${SAMPLE.skills
    .map(
      (s) =>
        `<span class="rounded px-1.5 py-0.5 text-[7.5px] font-semibold ${
          dark ? "bg-white/10 text-white/90" : ""
        }" ${dark ? "" : `style="background:${accent}14;color:${accent};border:1px solid ${accent}33"`}>${esc(s)}</span>`,
    )
    .join("")}</div>`;
}

/** Blok isi CV standar (dipakai varian standar & entry). */
function cvBody(accent: string): string {
  return `
    <div class="mt-3">
      ${sectionTitle("Ringkasan", accent)}
      <p class="text-[8.5px] text-slate-600 leading-snug">${esc(SAMPLE.summary)}</p>
    </div>
    <div class="mt-3">
      ${sectionTitle("Pengalaman Kerja", accent)}
      ${experienceList(accent)}
    </div>
    <div class="mt-3">
      ${sectionTitle("Pendidikan", accent)}
      ${educationList(accent)}
    </div>
    <div class="mt-3">
      ${sectionTitle("Keahlian", accent)}
      ${skillChips(accent)}
    </div>`;
}

/** Tumpukan tombol tautan (gaya link-in-bio). */
function linkStack(accent: string, variant: "neon" | "klasik" | "kaca"): string {
  const skin =
    variant === "neon"
      ? (i: number) =>
          i === 0
            ? `style="background:${accent}26;border-color:${accent}80;color:#e0e7ff;box-shadow:0 0 14px ${accent}55"`
            : `style="background:rgba(255,255,255,0.04);border-color:${accent}40;color:#e2e8f0"`
      : variant === "klasik"
        ? () => `style="background:#fff;border-color:#e2e8f0;color:#334155"`
        : () => `style="background:rgba(255,255,255,0.55);border-color:rgba(255,255,255,0.8);color:#1e293b"`;

  return `<div class="space-y-1.5">${SAMPLE.links
    .map(
      (l, i) =>
        `<div class="w-full py-2 rounded-xl text-center text-[8px] font-semibold border" ${skin(i)}>${esc(l)}</div>`,
    )
    .join("")}</div>`;
}

/** Grid proyek 2 kolom. */
function projectGrid(accent: string, variant: "gelap" | "terang" | "kaca"): string {
  const card =
    variant === "gelap"
      ? `class="aspect-square rounded-2xl border border-white/10 p-2 flex flex-col justify-end" style="background:linear-gradient(140deg, ${accent}33 0%, rgba(15,23,42,0.9) 70%)"`
      : variant === "kaca"
        ? `class="aspect-square rounded-2xl border border-white/70 p-2 flex flex-col justify-end" style="background:rgba(255,255,255,0.5);backdrop-filter:blur(4px)"`
        : `class="rounded-xl border border-slate-200 overflow-hidden"`;
  const title = variant === "terang" ? "text-slate-900" : "text-white";
  const sub = variant === "terang" ? "text-slate-500" : "text-white/60";

  return `<div class="grid grid-cols-2 gap-2">${SAMPLE.projects
    .map(
      (p) =>
        variant === "terang"
          ? `<div ${card}>
               <div class="h-10" style="background:linear-gradient(135deg,${accent}22,${accent}05)"></div>
               <div class="p-1.5">
                 <p class="text-[8px] font-bold ${title} truncate">${esc(p.name)}</p>
                 <p class="text-[6.5px] ${sub}">${esc(p.tag)}</p>
               </div>
             </div>`
          : `<div ${card}>
               <p class="text-[8px] font-bold ${title} truncate">${esc(p.name)}</p>
               <p class="text-[6.5px] ${sub}">${esc(p.tag)}</p>
             </div>`,
    )
    .join("")}</div>`;
}

// ── Renderer CV ATS (mencerminkan src/js/utils/cvData.ts) ────────────

function cvStandar(accent: string): string {
  return `
  <div class="h-full bg-white flex flex-col px-7 py-6 text-slate-800">
    <div class="text-center pb-3 border-b border-slate-200">
      <div class="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 mx-auto mb-2"></div>
      <p class="text-[15px] font-extrabold uppercase tracking-tight text-slate-900 leading-tight">${esc(SAMPLE.name)}</p>
      <p class="text-[10px] font-semibold" style="color:${accent}">${esc(SAMPLE.role)}</p>
      <p class="text-[8px] text-slate-500 mt-1">${esc(SAMPLE.email)} · ${esc(SAMPLE.phone)} · ${esc(SAMPLE.location)}</p>
    </div>
    ${cvBody(accent)}
  </div>`;
}

function cvTech(accent: string): string {
  return `
  <div class="h-full bg-white flex text-slate-800">
    <aside class="w-[34%] bg-slate-900 text-white px-4 py-6 flex flex-col gap-3">
      <div class="w-14 h-14 rounded-full bg-white/10 border-2 mx-auto" style="border-color:${accent}99"></div>
      <div>
        <p class="text-[8px] font-extrabold uppercase tracking-wider" style="color:${accent}">Kontak</p>
        <div class="mt-1 space-y-0.5 text-[7.5px] text-slate-300 leading-snug break-words">
          <p>${esc(SAMPLE.email)}</p><p>${esc(SAMPLE.phone)}</p><p>${esc(SAMPLE.location)}</p>
        </div>
      </div>
      <div>
        <p class="text-[8px] font-extrabold uppercase tracking-wider" style="color:${accent}">Keahlian</p>
        <div class="mt-1">${skillChips(accent, true)}</div>
      </div>
    </aside>
    <div class="flex-1 px-5 py-6">
      <div class="pb-2 border-b border-slate-200">
        <p class="text-[15px] font-extrabold text-slate-900 leading-tight">${esc(SAMPLE.name)}</p>
        <p class="text-[10px] font-semibold" style="color:${accent}">${esc(SAMPLE.role)}</p>
      </div>
      <div class="mt-3">
        ${sectionTitle("Ringkasan", accent)}
        <p class="text-[8.5px] text-slate-600 leading-snug">${esc(SAMPLE.summary)}</p>
      </div>
      <div class="mt-3">
        ${sectionTitle("Pengalaman Kerja", accent)}
        ${experienceList(accent, true)}
      </div>
      <div class="mt-3">
        ${sectionTitle("Pendidikan", accent)}
        ${educationList(accent)}
      </div>
    </div>
  </div>`;
}

function cvEntry(accent: string): string {
  return `
  <div class="h-full bg-white flex flex-col text-slate-800">
    <div class="px-6 py-5 text-center text-white" style="background:${accent}">
      <div class="w-12 h-12 rounded-full bg-white/25 border-2 border-white/70 mx-auto mb-2"></div>
      <p class="text-[15px] font-extrabold uppercase leading-tight">${esc(SAMPLE.name)}</p>
      <p class="text-[10px] font-semibold opacity-90">${esc(SAMPLE.role)}</p>
      <p class="text-[8px] opacity-80 mt-0.5">${esc(SAMPLE.email)} · ${esc(SAMPLE.phone)}</p>
    </div>
    <div class="px-7 pb-6">${cvBody(accent)}</div>
  </div>`;
}

// ── Renderer Resume (mencerminkan design-resume.html langkah 5) ──────

/** Tema 1 — Prisma Modern: header terpusat, aksen tegas. */
function resumePrisma(accent: string): string {
  return `
  <div class="h-full bg-white flex flex-col text-slate-800">
    <div class="px-7 pt-6 pb-4 text-center">
      <div class="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-[12px] font-bold text-white"
           style="background:linear-gradient(135deg,${accent},${accent}b3)">${SAMPLE.initials}</div>
      <p class="text-[16px] font-extrabold tracking-tight text-slate-900 leading-tight">${esc(SAMPLE.name)}</p>
      <p class="text-[10px] font-bold uppercase tracking-[0.16em]" style="color:${accent}">${esc(SAMPLE.role)}</p>
      <div class="mt-2 h-[2px] w-14 mx-auto rounded-full" style="background:${accent}"></div>
      <p class="text-[7.5px] text-slate-500 mt-2">${esc(SAMPLE.email)} · ${esc(SAMPLE.phone)} · ${esc(SAMPLE.location)}</p>
    </div>
    <div class="px-7 pb-6 flex-1">
      <div class="mt-1">
        ${sectionTitle("Profil", accent)}
        <p class="text-[8.5px] text-slate-600 leading-snug">${esc(SAMPLE.summary)}</p>
      </div>
      <div class="mt-3">
        ${sectionTitle("Pengalaman", accent)}
        ${experienceList(accent)}
      </div>
      <div class="mt-3">
        ${sectionTitle("Pendidikan", accent)}
        ${educationList(accent)}
      </div>
      <div class="mt-3">
        ${sectionTitle("Keahlian", accent)}
        ${skillChips(accent)}
      </div>
    </div>
  </div>`;
}

/** Tema 2 — Dua Kolom Klasik: sidebar netral + isi utama. */
function resumeDuaKolom(accent: string): string {
  return `
  <div class="h-full bg-white flex text-slate-800">
    <aside class="w-[35%] bg-slate-100 px-4 py-6 flex flex-col gap-3 border-r border-slate-200">
      <div class="w-14 h-14 rounded-full bg-white border border-slate-300 mx-auto flex items-center justify-center text-[11px] font-bold text-slate-500">${SAMPLE.initials}</div>
      <div>
        <p class="text-[7.5px] font-extrabold uppercase tracking-[0.12em] text-slate-500 border-b border-slate-300 pb-1 mb-1">Kontak</p>
        <div class="space-y-0.5 text-[7.5px] text-slate-600 leading-snug break-words">
          <p>${esc(SAMPLE.email)}</p><p>${esc(SAMPLE.phone)}</p><p>${esc(SAMPLE.location)}</p><p>${esc(SAMPLE.website)}</p>
        </div>
      </div>
      <div>
        <p class="text-[7.5px] font-extrabold uppercase tracking-[0.12em] text-slate-500 border-b border-slate-300 pb-1 mb-1">Keahlian</p>
        <div class="flex flex-wrap gap-1">${SAMPLE.skills
          .map((s) => `<span class="rounded bg-white border border-slate-300 px-1.5 py-0.5 text-[7px] font-semibold text-slate-600">${esc(s)}</span>`)
          .join("")}</div>
      </div>
    </aside>
    <div class="flex-1 px-5 py-6">
      <p class="text-[15px] font-extrabold text-slate-900 leading-tight">${esc(SAMPLE.name)}</p>
      <p class="text-[9.5px] font-semibold" style="color:${accent}">${esc(SAMPLE.role)}</p>
      <div class="mt-3">
        ${sectionTitle("Ringkasan", accent)}
        <p class="text-[8.5px] text-slate-600 leading-snug">${esc(SAMPLE.summary)}</p>
      </div>
      <div class="mt-3">
        ${sectionTitle("Pengalaman", accent)}
        ${experienceList(accent)}
      </div>
      <div class="mt-3">
        ${sectionTitle("Pendidikan", accent)}
        ${educationList(accent)}
      </div>
    </div>
  </div>`;
}

/** Tema 3 — Mode Gelap Kreatif: latar gelap + header gradien. */
function resumeGelap(accent: string): string {
  return `
  <div class="h-full flex flex-col text-slate-100" style="background:#1E293B">
    <div class="px-6 pt-6 pb-5 relative overflow-hidden">
      <div class="absolute inset-x-0 top-0 h-[3px]" style="background:linear-gradient(90deg,#a855f7,#ec4899)"></div>
      <div class="flex items-center gap-3">
        <div class="w-14 h-14 rounded-full border-2 flex items-center justify-center text-[12px] font-bold text-white shrink-0"
             style="background:rgba(255,255,255,0.12);border-color:${accent}99">${SAMPLE.initials}</div>
        <div class="min-w-0">
          <p class="text-[15px] font-extrabold text-white leading-tight truncate">${esc(SAMPLE.name)}</p>
          <p class="text-[9.5px] font-semibold" style="color:${accent}">${esc(SAMPLE.role)}</p>
          <p class="text-[7px] text-slate-400 mt-0.5 truncate">${esc(SAMPLE.email)} · ${esc(SAMPLE.phone)}</p>
        </div>
      </div>
    </div>
    <div class="px-6 pb-6 flex-1">
      <div>
        ${sectionTitle("Profil", accent, true)}
        <p class="text-[8px] text-slate-300 leading-snug">${esc(SAMPLE.summary)}</p>
      </div>
      <div class="mt-3">
        ${sectionTitle("Pengalaman", accent, true)}
        ${SAMPLE.experiences
          .map(
            (x) => `<div class="mb-2">
              <div class="flex items-baseline justify-between gap-2">
                <span class="text-[9px] font-bold text-white truncate">${esc(x.company)}</span>
                <span class="text-[7.5px] text-slate-400 shrink-0">${esc(x.period)}</span>
              </div>
              <p class="text-[8px] font-semibold" style="color:${accent}">${esc(x.role)}</p>
            </div>`,
          )
          .join("")}
      </div>
      <div class="mt-3">
        ${sectionTitle("Keahlian", accent, true)}
        ${skillChips(accent, true)}
      </div>
    </div>
  </div>`;
}

/** Tema 4 — Grid Portofolio: sorotan proyek dalam grid warna. */
function resumeGridPortofolio(accent: string): string {
  const tones = ["#f43f5e", "#3b82f6", "#f59e0b", "#10b981"];
  return `
  <div class="h-full bg-white flex flex-col text-slate-800">
    <div class="px-6 pt-6 pb-4">
      <p class="text-[16px] font-extrabold text-slate-900 leading-tight">${esc(SAMPLE.name)}</p>
      <p class="text-[10px] font-semibold" style="color:${accent}">${esc(SAMPLE.role)}</p>
      <p class="text-[7.5px] text-slate-500 mt-1">${esc(SAMPLE.email)} · ${esc(SAMPLE.phone)} · ${esc(SAMPLE.location)}</p>
    </div>
    <div class="px-6 flex-1">
      ${sectionTitle("Portofolio Proyek", accent)}
      <div class="grid grid-cols-2 gap-2">
        ${SAMPLE.projects
          .map(
            (p, i) => `<div class="rounded-lg p-2 h-14 flex flex-col justify-end" style="background:${tones[i % 4]}1a;border:1px solid ${tones[i % 4]}40">
              <p class="text-[8px] font-bold text-slate-800 truncate">${esc(p.name)}</p>
              <p class="text-[6.5px]" style="color:${tones[i % 4]}">${esc(p.tag)}</p>
            </div>`,
          )
          .join("")}
      </div>
      <div class="mt-3">
        ${sectionTitle("Pengalaman", accent)}
        ${experienceList(accent, true)}
      </div>
      <div class="mt-3">
        ${sectionTitle("Pendidikan", accent)}
        ${educationList(accent)}
      </div>
    </div>
  </div>`;
}

/** Tema 5 — Banner Korporat: header warna penuh. */
function resumeBanner(accent: string): string {
  return `
  <div class="h-full bg-white flex flex-col text-slate-800">
    <div class="px-6 py-5 text-white" style="background:${accent}">
      <p class="text-[15px] font-extrabold uppercase tracking-tight leading-tight">${esc(SAMPLE.name)}</p>
      <p class="text-[9.5px] font-semibold opacity-90">${esc(SAMPLE.role)}</p>
      <div class="mt-1.5 flex flex-wrap gap-x-2 text-[7px] opacity-85">
        <span>${esc(SAMPLE.email)}</span><span>${esc(SAMPLE.phone)}</span><span>${esc(SAMPLE.location)}</span>
      </div>
    </div>
    <div class="px-7 py-5 flex-1">
      <div>
        ${sectionTitle("Ringkasan Eksekutif", accent)}
        <p class="text-[8.5px] text-slate-600 leading-snug">${esc(SAMPLE.summary)}</p>
      </div>
      <div class="mt-3">
        ${sectionTitle("Pengalaman", accent)}
        ${experienceList(accent)}
      </div>
      <div class="mt-3">
        ${sectionTitle("Pendidikan", accent)}
        ${educationList(accent)}
      </div>
      <div class="mt-3">
        ${sectionTitle("Keahlian", accent)}
        ${skillChips(accent)}
      </div>
    </div>
  </div>`;
}

/** Tema 6 — Timeline Akademik: riwayat dalam garis waktu. */
function resumeTimeline(accent: string): string {
  const node = (title: string, sub: string, period: string) => `
    <div class="relative pl-4 mb-2.5">
      <span class="absolute left-0 top-[3px] w-[6px] h-[6px] rounded-full" style="background:${accent}"></span>
      <span class="absolute left-[2.5px] top-[9px] bottom-[-6px] w-[1px]" style="background:${accent}33"></span>
      <p class="text-[9px] font-bold text-slate-900 truncate">${esc(title)}</p>
      <p class="text-[8px] text-slate-600">${esc(sub)}</p>
      <p class="text-[7px] text-slate-400">${esc(period)}</p>
    </div>`;

  return `
  <div class="h-full bg-white flex flex-col text-slate-800">
    <div class="px-7 pt-6 pb-4 border-b" style="border-color:${accent}26">
      <p class="text-[16px] font-extrabold text-slate-900 leading-tight">${esc(SAMPLE.name)}</p>
      <p class="text-[10px] font-semibold" style="color:${accent}">${esc(SAMPLE.role)}</p>
      <p class="text-[7.5px] text-slate-500 mt-1">${esc(SAMPLE.email)} · ${esc(SAMPLE.phone)}</p>
    </div>
    <div class="px-7 py-4 flex-1">
      <div>
        ${sectionTitle("Pendidikan", accent)}
        ${SAMPLE.education.map((e) => node(e.school, e.degree, e.period)).join("")}
      </div>
      <div class="mt-3">
        ${sectionTitle("Pengalaman", accent)}
        ${SAMPLE.experiences.map((e) => node(e.company, e.role, e.period)).join("")}
      </div>
      <div class="mt-3">
        ${sectionTitle("Keahlian", accent)}
        ${skillChips(accent)}
      </div>
    </div>
  </div>`;
}

// ── Renderer Web Portfolio (mencerminkan build-portfolio.html) ───────

/** Tema 1 — Bento Gelap: bingkai ponsel gelap + bento grid. */
function portfolioBento(accent: string): string {
  return `
  <div class="h-full bg-slate-100 flex items-center justify-center p-4">
    <div class="w-full h-full rounded-[26px] border-[6px] border-slate-200 overflow-hidden bg-[#0F172A] relative"
         style="background-image:radial-gradient(circle at 50% 0%, ${accent}26 0%, transparent 70%)">
      <div class="h-full overflow-hidden px-5 py-6 text-white flex flex-col">
        <div class="text-center">
          <div class="w-14 h-14 rounded-full bg-white/10 border-2 mx-auto mb-2 flex items-center justify-center text-[13px] font-bold" style="border-color:${accent}80">${SAMPLE.initials}</div>
          <p class="text-[14px] font-bold leading-tight">${esc(SAMPLE.name)} <span style="color:${accent}">🚀</span></p>
          <p class="text-[9px] font-medium" style="color:${accent}">${esc(SAMPLE.role)}</p>
          <p class="text-[7.5px] text-slate-400 mt-1 leading-snug">${esc(SAMPLE.summary)}</p>
        </div>
        <div class="mt-3 space-y-1.5">
          ${SAMPLE.links
            .map(
              (l, i) =>
                `<div class="w-full py-2 rounded-xl text-center text-[8px] font-semibold ${
                  i === 0 ? "border" : "border border-slate-700 bg-white/5 text-slate-200"
                }" ${i === 0 ? `style="background:${accent}1f;border-color:${accent}55;color:${accent}"` : ""}>${esc(l)}</div>`,
            )
            .join("")}
        </div>
        <div class="mt-3">${projectGrid(accent, "gelap")}</div>
      </div>
    </div>
  </div>`;
}

/** Tema 2 — Linktree Neon: tumpukan tautan bercahaya. */
function portfolioNeon(accent: string): string {
  return `
  <div class="h-full flex items-center justify-center p-4" style="background:#0B1221">
    <div class="w-full h-full rounded-[26px] border overflow-hidden flex flex-col px-5 py-6 text-white"
         style="border-color:${accent}4d;box-shadow:inset 0 0 40px ${accent}26">
      <div class="text-center">
        <div class="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-[14px] font-bold text-white"
             style="background:${accent}33;border:2px solid ${accent};box-shadow:0 0 18px ${accent}80">${SAMPLE.initials}</div>
        <p class="text-[14px] font-extrabold leading-tight">${esc(SAMPLE.name)}</p>
        <p class="text-[9px] font-semibold" style="color:${accent}">${esc(SAMPLE.role)}</p>
        <p class="text-[7.5px] text-slate-400 mt-1 leading-snug">${esc(SAMPLE.summary)}</p>
      </div>
      <div class="mt-4">${linkStack(accent, "neon")}</div>
      <div class="mt-4">
        ${sectionTitle("Proyek", accent, true)}
        ${projectGrid(accent, "gelap")}
      </div>
    </div>
  </div>`;
}

/** Tema 3 — Standar Klasik: tautan minimalis berlatar terang. */
function portfolioKlasik(accent: string): string {
  return `
  <div class="h-full bg-white flex flex-col px-6 py-7 text-slate-800">
    <div class="text-center">
      <div class="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 mx-auto mb-3 flex items-center justify-center text-[14px] font-bold text-slate-500">${SAMPLE.initials}</div>
      <p class="text-[15px] font-extrabold text-slate-900 leading-tight">${esc(SAMPLE.name)}</p>
      <p class="text-[9.5px] font-semibold" style="color:${accent}">${esc(SAMPLE.role)}</p>
      <p class="text-[7.5px] text-slate-500 mt-1 leading-snug">${esc(SAMPLE.summary)}</p>
    </div>
    <div class="mt-4">${linkStack(accent, "klasik")}</div>
    <div class="mt-4">
      ${sectionTitle("Proyek", accent)}
      ${projectGrid(accent, "terang")}
    </div>
    <div class="mt-auto pt-3 text-center text-[7px] text-slate-400">${esc(SAMPLE.website)}</div>
  </div>`;
}

/** Tema 4 — Dev Terminal: gaya konsol monospace. */
function portfolioTerminal(accent: string): string {
  const line = (t: string, dim = false) =>
    `<p class="text-[7.5px] leading-relaxed ${dim ? "text-slate-500" : "text-slate-300"}"><span style="color:${accent}">$</span> ${esc(t)}</p>`;
  return `
  <div class="h-full flex flex-col p-4" style="background:#05070a">
    <div class="w-full h-full rounded-xl border flex flex-col overflow-hidden" style="border-color:${accent}40">
      <div class="flex items-center gap-1 px-3 py-2 border-b" style="border-color:${accent}26;background:rgba(255,255,255,0.03)">
        <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span class="ml-2 text-[6.5px] text-slate-500" style="font-family:ui-monospace,monospace">~/portfolio</span>
      </div>
      <div class="flex-1 px-4 py-4 overflow-hidden" style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace">
        <p class="text-[10px] font-bold" style="color:${accent}">${esc(SAMPLE.name)}</p>
        ${line(`whoami → ${SAMPLE.role}`)}
        ${line(`cat about.txt`)}
        <p class="text-[7px] text-slate-400 leading-relaxed mb-1">${esc(SAMPLE.summary)}</p>
        ${line("ls projects/")}
        <div class="grid grid-cols-2 gap-1 mb-1">
          ${SAMPLE.projects
            .map(
              (p) =>
                `<p class="text-[7px] text-slate-300">▸ ${esc(p.name)} <span class="text-slate-600">#${esc(p.tag)}</span></p>`,
            )
            .join("")}
        </div>
        ${line("cat contacts.json")}
        <p class="text-[7px] text-slate-400">${esc(SAMPLE.email)}</p>
        <p class="text-[7px] text-slate-400">${esc(SAMPLE.website)}</p>
        <p class="text-[7.5px] mt-1" style="color:${accent}">$ <span class="animate-pulse">▌</span></p>
      </div>
    </div>
  </div>`;
}

/** Tema 5 — Editorial Serif: tata letak majalah. */
function portfolioEditorial(accent: string): string {
  return `
  <div class="h-full flex flex-col px-7 py-7" style="background:#fdfbf7;color:#1c1917">
    <div class="border-b pb-3" style="border-color:${accent}33">
      <p class="text-[6.5px] font-bold uppercase tracking-[0.28em]" style="color:${accent}">Portofolio</p>
      <p class="text-[19px] leading-tight mt-1" style="font-family:Georgia,'Times New Roman',serif">${esc(SAMPLE.name)}</p>
      <p class="text-[9px] italic text-stone-500">${esc(SAMPLE.role)}</p>
    </div>
    <p class="text-[8px] leading-relaxed text-stone-600 mt-3" style="font-family:Georgia,serif">${esc(SAMPLE.summary)}</p>
    <div class="mt-3">
      <p class="text-[7px] font-bold uppercase tracking-[0.2em] mb-1.5" style="color:${accent}">Karya Terpilih</p>
      ${SAMPLE.projects
        .map(
          (p) => `<div class="flex items-baseline justify-between border-b border-stone-200 py-1">
            <span class="text-[8.5px]" style="font-family:Georgia,serif">${esc(p.name)}</span>
            <span class="text-[6.5px] uppercase tracking-wider text-stone-400">${esc(p.tag)}</span>
          </div>`,
        )
        .join("")}
    </div>
    <div class="mt-auto pt-3 flex items-center justify-between text-[6.5px] uppercase tracking-[0.14em] text-stone-400">
      <span>${esc(SAMPLE.email)}</span><span>${esc(SAMPLE.website)}</span>
    </div>
  </div>`;
}

/** Tema 6 — Aura Kaca: glassmorphism lembut. */
function portfolioAura(accent: string): string {
  return `
  <div class="h-full flex flex-col px-5 py-6"
       style="background:linear-gradient(150deg,${accent}33 0%,#eef2ff 45%,#fdf2f8 100%)">
    <div class="rounded-[22px] border border-white/80 px-5 py-5 flex flex-col flex-1"
         style="background:rgba(255,255,255,0.55);backdrop-filter:blur(6px);box-shadow:0 8px 24px rgba(15,23,42,0.08)">
      <div class="text-center">
        <div class="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-[13px] font-bold text-white"
             style="background:linear-gradient(140deg,${accent},${accent}99);box-shadow:0 6px 16px ${accent}4d">${SAMPLE.initials}</div>
        <p class="text-[14px] font-extrabold text-slate-900 leading-tight">${esc(SAMPLE.name)}</p>
        <p class="text-[9px] font-semibold" style="color:${accent}">${esc(SAMPLE.role)}</p>
        <p class="text-[7.5px] text-slate-500 mt-1 leading-snug">${esc(SAMPLE.summary)}</p>
      </div>
      <div class="mt-3">${linkStack(accent, "kaca")}</div>
      <div class="mt-3">${projectGrid(accent, "kaca")}</div>
    </div>
  </div>`;
}

// ── Registry ─────────────────────────────────────────────────────────

export const LAYOUTS: LayoutOption[] = [
  // CV ATS — `layout` pada payload CV (src/js/utils/cvData.ts).
  {
    key: "standar",
    label: "Standar (ATS Minimalist)",
    category: "CV ATS",
    hint: "Layout CV ATS satu kolom — `layout: standar` pada cvData.ts.",
    accent: "#2563eb",
    render: cvStandar,
  },
  {
    key: "tech",
    label: "Tech (Dua Kolom Gelap)",
    category: "CV ATS",
    hint: "Layout CV ATS dua kolom dengan sidebar gelap — `layout: tech` pada cvData.ts.",
    accent: "#06b6d4",
    render: cvTech,
  },
  {
    key: "entry",
    label: "Entry (Header Berwarna)",
    category: "CV ATS",
    hint: "Layout CV ATS dengan header berwarna — `layout: entry` pada cvData.ts.",
    accent: "#10b981",
    render: cvEntry,
  },

  // Resume — langkah 5 "Pilih Layout Visual" (design-resume.html).
  {
    key: "prisma-modern",
    label: "Prisma Modern",
    category: "Resume",
    hint: "Tema Resume “Prisma Modern”: header terpusat dengan aksen tegas (design-resume langkah 5).",
    accent: "#4f46e5",
    render: resumePrisma,
  },
  {
    key: "dua-kolom-klasik",
    label: "Dua Kolom Klasik",
    category: "Resume",
    hint: "Tema Resume “Dua Kolom Klasik”: sidebar kontak netral + isi utama (design-resume langkah 5).",
    accent: "#475569",
    render: resumeDuaKolom,
  },
  {
    key: "mode-gelap-kreatif",
    label: "Mode Gelap Kreatif",
    category: "Resume",
    hint: "Tema Resume “Mode Gelap Kreatif”: latar gelap dengan gradien ungu–pink (design-resume langkah 5).",
    accent: "#a855f7",
    render: resumeGelap,
  },
  {
    key: "grid-portofolio",
    label: "Grid Portofolio",
    category: "Resume",
    hint: "Tema Resume “Grid Portofolio”: sorotan proyek dalam grid warna (design-resume langkah 5).",
    accent: "#0ea5e9",
    render: resumeGridPortofolio,
  },
  {
    key: "banner-korporat",
    label: "Banner Korporat",
    category: "Resume",
    hint: "Tema Resume “Banner Korporat”: header warna penuh yang tegas (design-resume langkah 5).",
    accent: "#059669",
    render: resumeBanner,
  },
  {
    key: "timeline-akademik",
    label: "Timeline Akademik",
    category: "Resume",
    hint: "Tema Resume “Timeline Akademik”: riwayat dalam garis waktu (design-resume langkah 5).",
    accent: "#6366f1",
    render: resumeTimeline,
  },

  // Portfolio — "7. Gaya Tata Letak Akhir" (build-portfolio.html).
  {
    key: "bento-gelap",
    label: "Bento Gelap",
    category: "Portfolio",
    hint: "Tema Portfolio “Bento Gelap”: bingkai ponsel gelap dengan bento grid proyek (build-portfolio langkah 7).",
    accent: "#06b6d4",
    render: portfolioBento,
  },
  {
    key: "linktree-neon",
    label: "Linktree Neon",
    category: "Portfolio",
    hint: "Tema Portfolio “Linktree Neon”: tumpukan tautan bercahaya (build-portfolio langkah 7).",
    accent: "#6366f1",
    render: portfolioNeon,
  },
  {
    key: "standar-klasik",
    label: "Standar Klasik",
    category: "Portfolio",
    hint: "Tema Portfolio “Standar Klasik”: daftar tautan minimalis berlatar terang (build-portfolio langkah 7).",
    accent: "#334155",
    render: portfolioKlasik,
  },
  {
    key: "dev-terminal",
    label: "Dev Terminal",
    category: "Portfolio",
    hint: "Tema Portfolio “Dev Terminal”: konsol monospace hijau (build-portfolio langkah 7).",
    accent: "#22c55e",
    render: portfolioTerminal,
  },
  {
    key: "editorial-serif",
    label: "Editorial Serif",
    category: "Portfolio",
    hint: "Tema Portfolio “Editorial Serif”: tata letak majalah dengan tipografi serif (build-portfolio langkah 7).",
    accent: "#b45309",
    render: portfolioEditorial,
  },
  {
    key: "aura-kaca",
    label: "Aura Kaca",
    category: "Portfolio",
    hint: "Tema Portfolio “Aura Kaca”: kartu glassmorphism lembut (build-portfolio langkah 7).",
    accent: "#8b5cf6",
    render: portfolioAura,
  },
];

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Layout valid untuk satu kategori (dipakai form edit & validasi). */
export function layoutsFor(category: TemplateCategory): LayoutOption[] {
  return LAYOUTS.filter((l) => l.category === category);
}

export function findLayout(key: string | null | undefined): LayoutOption | undefined {
  if (!key) return undefined;
  return LAYOUTS.find((l) => l.key === key);
}

/** Label ramah untuk `layout_key` (fallback: "Kustom"). */
export function layoutLabel(key: string | null | undefined): string {
  return findLayout(key)?.label ?? "Kustom (tanpa renderer)";
}

function accentOf(config: Record<string, unknown> | undefined, fallback: string): string {
  const raw = config?.accent;
  return typeof raw === "string" && HEX.test(raw) ? raw : fallback;
}

/**
 * Pratinjau visual template: memakai thumbnail kustom bila admin mengunggahnya,
 * selain itu dirender dari renderer layout yang cocok (integrasi dengan sistem
 * template).
 *
 * Mode skala (`fit`):
 *   width   → kontainer mengikuti tinggi halaman penuh (halaman detail/edit)
 *   crop    → skala selebar kontainer, sisi bawah dipotong (thumbnail kartu)
 *   contain → muat utuh dalam kotak bertinggi tetap
 */
export function renderTemplatePreview(opts: {
  category: TemplateCategory;
  layoutKey: string | null;
  config?: Record<string, unknown>;
  thumbnailUrl?: string | null;
  name?: string;
  fit?: "width" | "crop" | "contain";
  className?: string;
}): string {
  const fit = opts.fit ?? "width";

  if (opts.thumbnailUrl) {
    return `<div class="tpl-preview ${opts.className ?? ""}" data-tpl-preview data-fit="contain">
      <img src="${esc(opts.thumbnailUrl)}" alt="${esc(opts.name ?? "Pratinjau template")}" class="absolute inset-0 w-full h-full object-cover">
    </div>`;
  }

  const layout = findLayout(opts.layoutKey);
  if (!layout) {
    const initial = (opts.name ?? "T").trim().charAt(0).toUpperCase() || "T";
    return `<div class="tpl-preview ${opts.className ?? ""} flex items-center justify-center bg-slate-100" data-tpl-preview data-fit="contain">
      <div class="text-center px-4">
        <div class="w-14 h-14 rounded-2xl bg-white border border-slate-200 mx-auto flex items-center justify-center text-xl font-extrabold text-slate-400">${esc(initial)}</div>
        <p class="mt-2 text-[11px] font-semibold text-slate-500">Layout kustom</p>
        <p class="text-[10px] text-slate-400">Tanpa renderer engine</p>
      </div>
    </div>`;
  }

  const accent = accentOf(opts.config, layout.accent);
  return `<div class="tpl-preview ${opts.className ?? ""}" data-tpl-preview data-fit="${fit}">
    <div class="tpl-preview-page">${layout.render(accent)}</div>
  </div>`;
}

/**
 * Skalakan setiap `[data-tpl-preview]` di dalam root agar pas dengan lebar
 * (atau kotak) kontainernya. Idempoten — aman dipanggil ulang saat resize.
 */
export function fitPreviews(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-tpl-preview]").forEach((el) => {
    const page = el.querySelector<HTMLElement>(".tpl-preview-page");
    if (!page) return;

    // `.tpl-preview-page` berposisi absolute; kontainer wajib menjadi containing
    // block-nya. Kalau pemanggil tidak memberi utility `absolute/relative`,
    // set relative di sini (aman: tidak menimpa `absolute` dari Tailwind).
    if (getComputedStyle(el).position === "static") el.style.position = "relative";

    const w = el.clientWidth;
    if (w <= 0) return;

    const fit = el.dataset.fit ?? "width";
    let scale = w / PREVIEW_W;
    if (fit === "contain") {
      const h = el.clientHeight;
      if (h > 0) scale = Math.min(scale, h / PREVIEW_H);
    }

    page.style.setProperty("--tpl-scale", String(scale));
    page.style.left = `${Math.max(0, (w - PREVIEW_W * scale) / 2)}px`;
    if (fit === "contain") {
      const h = el.clientHeight;
      page.style.top = `${Math.max(0, (h - PREVIEW_H * scale) / 2)}px`;
    } else {
      page.style.top = "0px";
    }
    // Hanya mode "width" yang mengatur tinggi kontainer; "crop" membiarkan
    // tinggi tetap dari kelas CSS sehingga sisi bawah terpotong rapi.
    el.style.height = fit === "width" ? `${Math.round(PREVIEW_H * scale)}px` : "";
  });
}
