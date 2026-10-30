/**
 * Menu 2 — Katalog & Manajemen Template (CV ATS, Resume, Web Portfolio).
 *
 * Struktur halaman (tanpa modal untuk edit):
 *   list   → grid kartu katalog + filter + metrik
 *   detail → halaman detail satu template (metadata, pratinjau, aksi)
 *   edit   → halaman edit tersendiri (form penuh + pratinjau live)
 *
 * Aturan navigasi:
 *   - Simpan / Batal pada halaman edit → langsung kembali ke halaman list.
 *   - Keluar dengan perubahan belum disimpan → modal konfirmasi
 *     (Simpan & keluar / Buang perubahan / Lanjut mengedit).
 *
 * Pratinjau visual memakai registry `templateLayouts.ts` sehingga kategori
 * Resume & Portfolio memakai renderer yang sama dengan halaman pengguna.
 */
import { adminApi } from "../api";
import { esc, showToast, openModal, closeModal, confirmDialog, setButtonLoading } from "../ui";
import { formatAngka, formatRupiah, formatTanggal } from "../format";
import { setAdminNavGuard, showAdminView } from "../shell";
import {
  findLayout,
  fitPreviews,
  layoutsFor,
  renderTemplatePreview,
  type TemplateCategory,
} from "./templateLayouts";

interface Template {
  id: number;
  name: string;
  category: TemplateCategory;
  description: string;
  thumbnail_url: string | null;
  layout_key: string | null;
  engine_version: string;
  status: "draft" | "published" | "archived";
  usage_count: number;
  created_at: string;
  updated_at: string;
  config: Record<string, unknown>;
  token_package_id: number | null;
  token: {
    id: number;
    name: number | string;
    token_amount: number;
    cost_per_generate: number;
    is_active: boolean;
  } | null;
}

interface TokenOption {
  id: number;
  name: string;
  token_amount: number;
  cost_per_generate: number;
  is_active: boolean;
}

interface TemplateList {
  summary: { total: number; "CV ATS": number; Resume: number; Portfolio: number; nonaktif: number };
  templates: Template[];
}

/** Nilai form edit (semua string agar mudah dibandingkan untuk deteksi perubahan). */
interface Draft {
  name: string;
  category: TemplateCategory;
  status: "draft" | "published" | "archived";
  engine_version: string;
  layout_key: string;
  thumbnail_url: string;
  token_package_id: string;
  description: string;
  config_json: string;
}

const CATEGORIES: TemplateCategory[] = ["CV ATS", "Resume", "Portfolio"];

const el = (): HTMLElement => document.getElementById("view-templates") as HTMLElement;

const state = {
  q: "",
  chip: "all" as "all" | TemplateCategory | "nonaktif",
  list: null as TemplateList | null,
  page: "list" as "list" | "detail" | "edit",
  detailId: 0,
  editingId: 0, // 0 = template baru
  draft: null as Draft | null,
  baseline: "",
  tokens: [] as TokenOption[],
  busy: false,
};

let previewBound = false;
let guardActive = false;

export function mountTemplatesView(): void {
  bindPreviewFitting();
  // Saat menu dibuka kembali, selalu mulai dari daftar (kecuali sedang
  // di halaman edit dengan perubahan — ditangani nav guard).
  if (state.page !== "edit") {
    state.page = "list";
    state.draft = null;
    state.baseline = "";
    clearGuard();
  }
  state.tokens = [];
  void load();
}

function bindPreviewFitting(): void {
  if (previewBound) return;
  previewBound = true;
  const refit = debounce(() => fitPreviews(document.getElementById("view-templates") ?? document), 120);
  window.addEventListener("resize", refit);
  window.addEventListener("orientationchange", refit);
}

// ── Data ─────────────────────────────────────────────────────────────

async function load(): Promise<void> {
  const host = el();
  if (state.page === "list" && !state.list) {
    host.innerHTML = `<div class="animate-pulse"><div class="h-8 w-64 max-w-full rounded-lg bg-slate-200 mb-6"></div><div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">${Array.from(
      { length: 3 },
    )
      .map(() => `<div class="h-72 rounded-2xl bg-slate-200/70"></div>`)
      .join("")}</div></div>`;
  }
  try {
    state.list = await adminApi<TemplateList>("templates.php", { query: { q: state.q } });
    if (state.page === "list") renderList();
    else if (state.page === "detail") renderDetail(state.detailId);
    else if (state.page === "edit" && state.editingId > 0) {
      // Muat ulang data template bila belum ada di cache.
      const t = findTemplate(state.editingId);
      if (!t) {
        showToast("Template tidak ditemukan.", "error");
        gotoList();
      }
    }
  } catch (e) {
    host.innerHTML = `<div class="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">${esc(
      (e as Error).message,
    )}</div>`;
  }
}

function findTemplate(id: number): Template | undefined {
  return state.list?.templates.find((t) => t.id === id);
}

async function loadTokenOptions(): Promise<TokenOption[]> {
  if (state.tokens.length > 0) return state.tokens;
  try {
    const data = await adminApi<{ tokens: TokenOption[] }>("tokens.php", { query: { status: "" } });
    state.tokens = data.tokens ?? [];
  } catch {
    state.tokens = [];
  }
  return state.tokens;
}

// ── Navigasi internal + penjaga perubahan belum disimpan ─────────────

function clearGuard(): void {
  if (!guardActive) return;
  guardActive = false;
  setAdminNavGuard(null);
}

function armGuard(): void {
  if (guardActive) return;
  guardActive = true;
  setAdminNavGuard((nextId) => {
    if (state.page !== "edit" || !isDirty()) return false;
    // Ada perubahan belum disimpan → tahan navigasi, tampilkan konfirmasi.
    void promptUnsaved(nextId === "view-templates" ? "list" : nextId);
    return true;
  });
}

function gotoList(): void {
  clearGuard();
  state.page = "list";
  state.draft = null;
  state.baseline = "";
  state.editingId = 0;
  window.scrollTo({ top: 0, behavior: "auto" });
  // Tampilkan cache dulu (paint instan), lalu segarkan dari server agar
  // perubahan yang baru disimpan langsung terlihat di daftar.
  if (state.list) renderList();
  void load();
}

function gotoDetail(id: number): void {
  clearGuard();
  state.page = "detail";
  state.detailId = id;
  state.draft = null;
  state.baseline = "";
  window.scrollTo({ top: 0, behavior: "auto" });
  renderDetail(id);
}

function gotoEdit(id: number): void {
  state.page = "edit";
  state.editingId = id;
  state.draft = draftOf(id > 0 ? findTemplate(id) ?? null : null);
  state.baseline = JSON.stringify(state.draft);
  armGuard();
  window.scrollTo({ top: 0, behavior: "auto" });
  renderEdit();
}

function isDirty(): boolean {
  return state.draft !== null && JSON.stringify(state.draft) !== state.baseline;
}

/**
 * Konfirmasi perubahan belum disimpan. Tiga pilihan:
 *   Simpan & keluar · Buang perubahan · Lanjut mengedit
 * Setelah dikonfirmasi, navigasi langsung ke tujuan (default: daftar).
 */
async function promptUnsaved(target: string): Promise<void> {
  const t = state.editingId > 0 ? findTemplate(state.editingId) : null;
  const modal = openModal({
    title: "Perubahan belum disimpan",
    subtitle: t ? `Template — ${t.name}` : "Template baru",
    body: `
      <p class="text-sm text-slate-600">Ada perubahan pada form yang belum disimpan. Pilih tindakan sebelum meninggalkan halaman ini.</p>
      <p id="unsaved-error" class="hidden text-xs font-medium text-rose-600 mt-3"></p>`,
    footer: `
      <button data-act="stay" class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-white">Lanjut Mengedit</button>
      <button data-act="discard" class="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 text-sm font-semibold hover:bg-rose-50">Buang Perubahan</button>
      <button data-act="save" class="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold">Simpan &amp; Keluar</button>`,
  });

  const err = modal.querySelector("#unsaved-error") as HTMLElement;
  const go = (id: string): void => {
    closeModal();
    clearGuard();
    state.page = "list";
    state.draft = null;
    state.baseline = "";
    state.editingId = 0;
    if (id === "list" || id === "view-templates") {
      window.scrollTo({ top: 0, behavior: "auto" });
      if (state.list) renderList();
      void load();
    } else {
      showAdminView(id);
    }
  };

  (modal.querySelector('[data-act="stay"]') as HTMLButtonElement).addEventListener("click", closeModal);
  (modal.querySelector('[data-act="discard"]') as HTMLButtonElement).addEventListener("click", () => go(target));
  const saveBtn = modal.querySelector('[data-act="save"]') as HTMLButtonElement;
  saveBtn.addEventListener("click", () => {
    setButtonLoading(saveBtn, true);
    void saveDraft()
      .then(() => go(target))
      .catch((e: Error) => {
        err.textContent = e.message;
        err.classList.remove("hidden");
      })
      .finally(() => setButtonLoading(saveBtn, false));
  });
}

// ── Halaman: daftar ──────────────────────────────────────────────────

function renderList(): void {
  const host = el();
  const s = state.list!;
  const shown = filtered();

  host.innerHTML = `
    <div class="mb-6 flex flex-col gap-4 sm:mb-7 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
      <div class="min-w-0">
        <p class="text-[11px] font-bold tracking-wide text-slate-400">KATALOG DESAIN &amp; DOKUMEN <span class="text-slate-300">•</span> <span class="text-slate-500">Engine Core v2.4</span></p>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 leading-tight">Katalog &amp; Manajemen Template CV</h1>
        <p class="text-sm text-slate-500 mt-1 max-w-xl">Atur status publikasi, integrasi renderer engine, kategori ATS/Visual, dan pantau pemakaian template secara langsung.</p>
      </div>
      <button id="tpl-new" class="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-5 py-2.5 transition-colors shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>
        Tambah Template Baru
      </button>
    </div>

    <!-- Metrik per kategori (menumpuk vertikal di layar kecil) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      ${metricCard("TOTAL TEMPLATE PUBLISHED", countCat(s, "CV ATS"), "Sampul ATS", "Kategori CV ATS", "mint")}
      ${metricCard("TOTAL TEMPLATE PUBLISHED", countCat(s, "Resume"), "Resume", "Kategori Resume", "rose")}
      ${metricCard("TOTAL TEMPLATE PUBLISHED", countCat(s, "Portfolio"), "Portfolio", "Kategori Web Portfolio", "navy")}
    </div>

    <!-- Filter + pencarian -->
    <div class="mt-5 sm:mt-6 rounded-2xl bg-white border border-slate-100 p-3.5 sm:p-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div class="flex gap-2 overflow-x-auto table-scroll -mx-1 px-1 pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
          ${chip("all", `Semua Template (${s.summary.total})`)}
          ${chip("CV ATS", `CV ATS (${s.summary["CV ATS"]})`)}
          ${chip("Resume", `Resume (${s.summary.Resume})`)}
          ${chip("Portfolio", `Portfolio (${s.summary.Portfolio})`)}
          ${chip("nonaktif", `Arsip/Nonaktif (${s.summary.nonaktif})`)}
        </div>
        <div class="relative lg:ml-auto lg:w-64 shrink-0">
          <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round"><path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"></path></svg>
          <input id="tpl-search" type="text" placeholder="Cari nama template / tag…" value="${esc(state.q)}"
                 class="w-full rounded-full bg-slate-100 border border-transparent pl-10 pr-4 py-2 text-sm outline-none focus:border-slate-300 focus:bg-white transition-colors">
        </div>
      </div>
    </div>

    <div class="mt-4 rounded-2xl bg-white border border-amber-200/70 px-4 sm:px-5 py-3.5 flex items-start gap-3">
      <svg class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4m0-4h.01"></path></svg>
      <p class="text-xs text-slate-600 leading-relaxed">Penonaktifan template <b>tidak akan menghapus dokumen lama pengguna</b> (payload CV tersimpan per dokumen), namun mencegah pemakaian renderer ini untuk dokumen baru.</p>
    </div>

    <div id="tpl-grid" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 mt-5 sm:mt-6">
      ${shown.length === 0
        ? `<div class="sm:col-span-2 xl:col-span-3 rounded-2xl border-2 border-dashed border-slate-200 py-14 px-4 text-center">
             <p class="text-slate-500 font-semibold">Belum ada template yang cocok.</p>
             <button id="tpl-empty-new" class="mt-3 rounded-full bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 hover:bg-slate-800">+ Template Baru</button>
           </div>`
        : shown.map(cardHtml).join("")}
    </div>`;

  host.querySelectorAll<HTMLButtonElement>("[data-chip]").forEach((b) =>
    b.addEventListener("click", () => {
      state.chip = b.dataset.chip as typeof state.chip;
      renderList();
    }),
  );

  const search = host.querySelector("#tpl-search") as HTMLInputElement;
  let t: number | undefined;
  search.addEventListener("input", () => {
    window.clearTimeout(t);
    t = window.setTimeout(() => {
      state.q = search.value.trim();
      void load();
    }, 350);
  });

  (host.querySelector("#tpl-new") as HTMLButtonElement).addEventListener("click", () => gotoEdit(0));
  host.querySelector("#tpl-empty-new")?.addEventListener("click", () => gotoEdit(0));
  bindCards();
  requestAnimationFrame(() => fitPreviews(host));
}

function filtered(): Template[] {
  const list = state.list?.templates ?? [];
  if (state.chip === "all") return list;
  if (state.chip === "nonaktif") return list.filter((t) => t.status !== "published");
  return list.filter((t) => t.category === state.chip);
}

function countCat(s: TemplateList, cat: TemplateCategory): number {
  return s.templates.filter((t) => t.category === cat && t.status === "published").length;
}

function metricCard(
  label: string,
  value: number,
  unit: string,
  caption: string,
  tone: "mint" | "rose" | "navy",
): string {
  const skin =
    tone === "mint"
      ? { box: "bg-[#d3f3e5]", label: "text-emerald-900/80", num: "text-emerald-950", unit: "text-emerald-800/70", cap: "text-emerald-900/70" }
      : tone === "rose"
        ? { box: "bg-[#fbd9dd]", label: "text-rose-900/80", num: "text-rose-950", unit: "text-rose-900/70", cap: "text-rose-900/70" }
        : { box: "bg-slate-900 text-white", label: "text-white/70", num: "text-white", unit: "text-white/70", cap: "text-white/60" };
  return `<div class="min-w-0 rounded-2xl ${skin.box} p-5 sm:p-6">
      <p class="text-[11px] font-bold tracking-wide ${skin.label}">${esc(label)}</p>
      <p class="mt-2 text-3xl sm:text-4xl font-extrabold ${skin.num} tabular-nums">${value} <span class="text-base sm:text-lg font-bold ${skin.unit}">${esc(unit)}</span></p>
      <p class="mt-3 text-xs ${skin.cap}">${esc(caption)}</p>
    </div>`;
}

function chip(id: string, label: string): string {
  const on = state.chip === id;
  return `<button data-chip="${esc(id)}" class="px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
    on ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
  }">${esc(label)}</button>`;
}

// ── Kartu template ───────────────────────────────────────────────────

function statusBadge(t: Template, floating = true): string {
  const pos = floating ? "absolute top-3 left-3" : "";
  if (t.status === "published") {
    return `<span class="${pos} inline-flex items-center gap-1.5 rounded-full bg-emerald-500/95 text-white text-[11px] font-bold px-2.5 py-1"><span class="w-1.5 h-1.5 rounded-full bg-white"></span> Aktif</span>`;
  }
  if (t.status === "draft") {
    return `<span class="${pos} inline-flex items-center gap-1.5 rounded-full bg-amber-400/95 text-amber-950 text-[11px] font-bold px-2.5 py-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-800"></span> Draft</span>`;
  }
  return `<span class="${pos} inline-flex items-center gap-1.5 rounded-full bg-rose-500/95 text-white text-[11px] font-bold px-2.5 py-1"><span class="w-1.5 h-1.5 rounded-full bg-white"></span> Nonaktif</span>`;
}

function cardHtml(t: Template): string {
  const layout = findLayout(t.layout_key);

  return `
  <article class="rounded-2xl bg-white border border-slate-100 overflow-hidden flex flex-col" data-card="${t.id}">
    <button data-detail="${t.id}" class="relative block w-full h-44 sm:h-48 bg-slate-100 text-left group" aria-label="Lihat detail ${esc(t.name)}">
      ${renderTemplatePreview({
        category: t.category,
        layoutKey: t.layout_key,
        config: t.config,
        thumbnailUrl: t.thumbnail_url,
        name: t.name,
        fit: "crop",
        className: "absolute inset-0 w-full h-full",
      })}
      ${statusBadge(t)}
      <span class="absolute top-3 right-3 rounded-full bg-white/95 text-slate-700 text-[10px] font-bold px-2.5 py-1 shadow-sm">${esc(t.category)}</span>
      <span class="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors"></span>
    </button>

    <div class="p-4 sm:p-5 flex flex-col flex-1 min-w-0">
      <div class="flex flex-wrap items-center gap-2 min-w-0">
        <h3 class="font-extrabold text-slate-900 break-words min-w-0">${esc(t.name)}</h3>
        <span class="rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold px-2 py-0.5 shrink-0">${esc(t.engine_version)} Engine</span>
      </div>
      <p class="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">${esc(t.description || "—")}</p>

      <div class="mt-4 grid grid-cols-2 gap-2 text-[10px] font-bold">
        <div class="rounded-xl bg-slate-50 border border-slate-100 p-3 min-w-0">
          <p class="text-slate-400 tracking-wide">TOTAL PENGGUNAAN</p>
          <p class="text-slate-800 text-sm mt-0.5">${formatAngka(t.usage_count)}x download</p>
        </div>
        <div class="rounded-xl bg-slate-50 border border-slate-100 p-3 min-w-0">
          <p class="text-slate-400 tracking-wide">RENDERER</p>
          <p class="text-slate-800 text-sm mt-0.5 truncate" title="${esc(layout?.label ?? "Kustom")}">${esc(t.layout_key ?? "Kustom")}</p>
        </div>
        <div class="rounded-xl ${t.token ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"} border p-3 col-span-2 min-w-0">
          <p class="${t.token ? "text-emerald-700/70" : "text-amber-700/70"} tracking-wide">TOKEN / BIAYA GENERATE</p>
          ${t.token
            ? `<p class="text-slate-800 text-sm mt-0.5 break-words">${esc(String(t.token.name))} · ${formatRupiah(t.token.cost_per_generate)}/generate</p>
               <p class="text-[10px] font-medium ${t.token.is_active ? "text-emerald-700" : "text-rose-600"} mt-0.5">${t.token.is_active ? `${formatAngka(t.token.token_amount)} token tersedia` : "Token nonaktif — generate diblokir"}</p>`
            : `<p class="text-amber-800 text-sm mt-0.5">Belum dipasang</p>
               <p class="text-[10px] font-medium text-amber-700 mt-0.5">Generate tidak dibatasi token</p>`}
        </div>
      </div>

      <p class="mt-3 text-[11px] text-slate-400">Diperbarui ${esc(formatTanggal(t.updated_at))}</p>

      <div class="mt-auto pt-4 mt-4 border-t border-slate-50 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <button data-toggle="${t.id}" class="relative inline-flex w-11 h-6 items-center rounded-full transition-colors shrink-0 ${t.status === "published" ? "bg-emerald-500" : "bg-slate-300"}" aria-label="Ubah status ${esc(t.name)}">
            <span class="inline-block w-5 h-5 bg-white rounded-full shadow transition-transform ${t.status === "published" ? "translate-x-[22px]" : "translate-x-0.5"}"></span>
          </button>
          <span class="text-xs font-bold ${t.status === "published" ? "text-emerald-600" : "text-slate-400"}">${t.status === "published" ? "Aktif" : t.status === "draft" ? "Draft" : "Nonaktif"}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button data-detail="${t.id}" class="rounded-full bg-slate-100 text-slate-700 text-xs font-bold px-3.5 py-1.5 hover:bg-slate-200 transition-colors whitespace-nowrap">Detail</button>
          <button data-delete="${t.id}" title="Hapus template" class="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"></path></svg>
          </button>
        </div>
      </div>
    </div>
  </article>`;
}

function bindCards(): void {
  const host = el();

  host.querySelectorAll<HTMLButtonElement>("[data-detail]").forEach((b) =>
    b.addEventListener("click", () => gotoDetail(Number(b.dataset.detail))),
  );

  host.querySelectorAll<HTMLButtonElement>("[data-toggle]").forEach((b) =>
    b.addEventListener("click", async () => {
      const t = findTemplate(Number(b.dataset.toggle));
      if (!t) return;
      const toPublished = t.status !== "published";
      const { confirmed } = await confirmDialog({
        title: toPublished ? "Publikasikan template?" : "Nonaktifkan template?",
        message: `<b>${esc(t.name)}</b> — ${
          toPublished
            ? "template akan tersedia di katalog halaman pengguna."
            : "template di-commit ke draft; dokumen lama pengguna tidak terhapus, dokumen baru tidak bisa memakai renderer ini."
        }`,
        confirmText: toPublished ? "Publikasikan" : "Jadikan Draft",
        danger: !toPublished,
      });
      if (!confirmed) return;
      try {
        await adminApi("templates.php", {
          method: "PUT",
          body: { id: t.id, ...payloadOfTemplate(t), status: toPublished ? "published" : "draft" },
        });
        showToast(toPublished ? "Template dipublikasikan." : "Template dinonaktifkan.");
        await load();
      } catch (e) {
        showToast((e as Error).message, "error");
      }
    }),
  );

  host.querySelectorAll<HTMLButtonElement>("[data-delete]").forEach((b) =>
    b.addEventListener("click", async () => {
      const t = findTemplate(Number(b.dataset.delete));
      if (!t) return;
      const { confirmed } = await confirmDialog({
        title: "Hapus template?",
        message: `<b>${esc(t.name)}</b> — template yang masih dipakai dokumen <b>tidak</b> akan bisa dihapus (409).`,
        confirmText: "Hapus",
        danger: true,
        confirmType: "HAPUS",
      });
      if (!confirmed) return;
      try {
        await adminApi("templates.php", { method: "DELETE", query: { id: t.id } });
        showToast("Template dihapus.");
        void load();
      } catch (e) {
        showToast((e as Error).message, "error");
      }
    }),
  );
}

// ── Halaman: detail ──────────────────────────────────────────────────

function renderDetail(id: number): void {
  const host = el();
  const t = findTemplate(id);
  if (!t) {
    host.innerHTML = `<div class="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">Template tidak ditemukan.</div>
      <button data-back class="mt-3 rounded-full bg-slate-900 text-white text-sm font-semibold px-5 py-2.5">Kembali</button>`;
    host.querySelector("[data-back]")?.addEventListener("click", gotoList);
    return;
  }

  const layout = findLayout(t.layout_key);

  host.innerHTML = `
    <div class="mb-5 flex flex-col gap-3 sm:mb-6">
      <button data-back class="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors self-start">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
        Kembali ke Manajemen Template
      </button>
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            ${statusBadge(t, false)}
            <span class="rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1">${esc(t.category)}</span>
            <span class="rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold px-2.5 py-1">${esc(t.engine_version)} Engine</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2 leading-tight break-words">${esc(t.name)}</h1>
          <p class="text-sm text-slate-500 mt-1 max-w-2xl">${esc(t.description || "Tanpa deskripsi.")}</p>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center shrink-0">
          <button data-edit class="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-5 py-2.5 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            Edit Template
          </button>
          <button data-toggle class="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold px-5 py-2.5 transition-colors">
            ${t.status === "published" ? "Nonaktifkan" : "Publikasikan"}
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
      <!-- Pratinjau visual (renderer kategori Resume/Portfolio ikut) -->
      <div class="lg:col-span-2 min-w-0">
        <div class="rounded-2xl bg-white border border-slate-100 p-4 sm:p-5 lg:sticky lg:top-24">
          <div class="flex items-center justify-between gap-2 mb-3">
            <h2 class="text-sm font-extrabold text-slate-900">Pratinjau Layout</h2>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">${esc(t.category)}</span>
          </div>
          <div class="rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
            ${renderTemplatePreview({
              category: t.category,
              layoutKey: t.layout_key,
              config: t.config,
              thumbnailUrl: t.thumbnail_url,
              name: t.name,
              fit: "width",
              className: "w-full",
            })}
          </div>
          <p class="mt-3 text-[11px] text-slate-400 leading-relaxed">${esc(layout?.hint ?? "Template kustom tanpa renderer engine — pratinjau memakai thumbnail admin.")}</p>
        </div>
      </div>

      <!-- Metadata + aksi -->
      <div class="lg:col-span-3 min-w-0 space-y-4 sm:space-y-5">
        <div class="rounded-2xl bg-white border border-slate-100 p-4 sm:p-6">
          <h2 class="text-sm font-extrabold text-slate-900 mb-3">Informasi Template</h2>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${infoTile("KATEGORI", t.category)}
            ${infoTile("STATUS", t.status === "published" ? "Aktif / Published" : t.status === "draft" ? "Draft" : "Nonaktif")}
            ${infoTile("RENDERER", layout ? layout.label : "Kustom (tanpa renderer)")}
            ${infoTile("VERSI ENGINE", t.engine_version)}
            ${infoTile("TOTAL PENGGUNAAN", `${formatAngka(t.usage_count)}x download`)}
            ${infoTile("DIBUAT", formatTanggal(t.created_at))}
            ${infoTile("DIPERBARUI", formatTanggal(t.updated_at))}
            ${infoTile("ID TEMPLATE", `#${t.id}`)}
          </dl>
        </div>

        <div class="rounded-2xl ${t.token ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"} border p-4 sm:p-6">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-sm font-extrabold ${t.token ? "text-emerald-900" : "text-amber-900"}">Token &amp; Biaya Generate</h2>
            <button data-goto-token class="rounded-full bg-white/70 hover:bg-white text-slate-700 text-[11px] font-bold px-3 py-1.5 transition-colors">Kelola Token</button>
          </div>
          ${t.token
            ? `<p class="mt-2 text-sm font-bold text-slate-800">${esc(String(t.token.name))}</p>
               <div class="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                 <div class="rounded-xl bg-white/70 px-3 py-2"><p class="text-[10px] font-bold text-slate-400">KUOTA</p><p class="font-bold text-slate-800">${formatAngka(t.token.token_amount)} token</p></div>
                 <div class="rounded-xl bg-white/70 px-3 py-2"><p class="text-[10px] font-bold text-slate-400">BIAYA / GENERATE</p><p class="font-bold text-slate-800">${formatRupiah(t.token.cost_per_generate)}</p></div>
                 <div class="rounded-xl bg-white/70 px-3 py-2"><p class="text-[10px] font-bold text-slate-400">STATUS</p><p class="font-bold ${t.token.is_active ? "text-emerald-700" : "text-rose-600"}">${t.token.is_active ? "Aktif" : "Nonaktif"}</p></div>
               </div>`
            : `<p class="mt-2 text-sm text-amber-800">Belum dipasang — generate dengan template ini tidak dibatasi token.</p>`}
        </div>

        <div class="rounded-2xl bg-white border border-slate-100 p-4 sm:p-6">
          <h2 class="text-sm font-extrabold text-slate-900 mb-2">Konfigurasi Renderer (config JSON)</h2>
          <pre class="rounded-xl bg-slate-900 text-slate-100 text-[11px] leading-relaxed p-3.5 overflow-x-auto table-scroll">${esc(
            JSON.stringify(t.config ?? {}, null, 2),
          )}</pre>
          ${t.thumbnail_url
            ? `<p class="mt-3 text-[11px] text-slate-400 break-all">Thumbnail kustom: <span class="font-mono">${esc(t.thumbnail_url)}</span></p>`
            : ""}
        </div>

        <div class="rounded-2xl bg-white border border-slate-100 p-4 sm:p-6">
          <h2 class="text-sm font-extrabold text-slate-900 mb-1">Zona Berbahaya</h2>
          <p class="text-xs text-slate-500 mb-3">Template yang sudah dipakai dokumen tidak bisa dihapus — nonaktifkan saja agar dokumen lama tetap utuh.</p>
          <button data-delete class="inline-flex items-center gap-2 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-semibold px-4 py-2 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"></path></svg>
            Hapus Template
          </button>
        </div>
      </div>
    </div>`;

  host.querySelector("[data-back]")?.addEventListener("click", gotoList);
  host.querySelector("[data-edit]")?.addEventListener("click", () => gotoEdit(t.id));
  host.querySelector("[data-goto-token]")?.addEventListener("click", () => showAdminView("view-tokens"));

  host.querySelector("[data-toggle]")?.addEventListener("click", async () => {
    const toPublished = t.status !== "published";
    const { confirmed } = await confirmDialog({
      title: toPublished ? "Publikasikan template?" : "Nonaktifkan template?",
      message: `<b>${esc(t.name)}</b> — ${toPublished ? "template akan tersedia di katalog halaman pengguna." : "template di-commit ke draft; dokumen lama pengguna tidak terhapus."}`,
      confirmText: toPublished ? "Publikasikan" : "Jadikan Draft",
      danger: !toPublished,
    });
    if (!confirmed) return;
    try {
      await adminApi("templates.php", {
        method: "PUT",
        body: { id: t.id, ...payloadOfTemplate(t), status: toPublished ? "published" : "draft" },
      });
      showToast(toPublished ? "Template dipublikasikan." : "Template dinonaktifkan.");
      await load();
    } catch (e) {
      showToast((e as Error).message, "error");
    }
  });

  host.querySelector("[data-delete]")?.addEventListener("click", async () => {
    const { confirmed } = await confirmDialog({
      title: "Hapus template?",
      message: `<b>${esc(t.name)}</b> — template yang masih dipakai dokumen <b>tidak</b> akan bisa dihapus (409).`,
      confirmText: "Hapus",
      danger: true,
      confirmType: "HAPUS",
    });
    if (!confirmed) return;
    try {
      await adminApi("templates.php", { method: "DELETE", query: { id: t.id } });
      showToast("Template dihapus.");
      await load();
      gotoList();
    } catch (e) {
      showToast((e as Error).message, "error");
    }
  });

  requestAnimationFrame(() => fitPreviews(host));
}

function infoTile(label: string, value: string): string {
  return `<div class="min-w-0 rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5">
      <dt class="text-[10px] font-bold tracking-wide text-slate-400">${esc(label)}</dt>
      <dd class="text-sm font-bold text-slate-800 mt-0.5 break-words">${esc(value)}</dd>
    </div>`;
}

// ── Halaman: edit ────────────────────────────────────────────────────

function draftOf(t: Template | null): Draft {
  const category = t?.category ?? "CV ATS";
  const defaultLayout = layoutsFor(category)[0]?.key ?? "";
  return {
    name: t?.name ?? "",
    category,
    status: t?.status ?? "draft",
    engine_version: t?.engine_version ?? "v2.4",
    layout_key: t?.layout_key ?? "",
    thumbnail_url: t?.thumbnail_url ?? "",
    token_package_id: t?.token_package_id ? String(t.token_package_id) : "",
    description: t?.description ?? "",
    // Template baru: config mengikuti renderer default kategori agar
    // config.layout tidak menyimpang dari layout_key yang dipilih.
    config_json: JSON.stringify(t?.config ?? (defaultLayout ? { layout: defaultLayout } : {}), null, 2),
  };
}

function renderEdit(): void {
  const host = el();
  const d = state.draft;
  if (!d) return;
  const isNew = state.editingId === 0;

  host.innerHTML = `
    <div class="mb-5 flex flex-col gap-3 sm:mb-6">
      <button data-cancel class="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors self-start">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
        Batal &amp; kembali ke Manajemen Template
      </button>
      <div class="min-w-0">
        <p class="text-[11px] font-bold tracking-wide text-slate-400">MANAJEMEN TEMPLATE <span class="text-slate-300">•</span> <span class="text-slate-500">${isNew ? "Template Baru" : `Edit #${state.editingId}`}</span></p>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 leading-tight break-words">${isNew ? "Tambah Template Baru" : `Edit Template — ${esc(d.name || "Tanpa nama")}`}</h1>
        <p class="text-sm text-slate-500 mt-1 max-w-2xl">Perubahan disimpan ke katalog; pratinjau di kanan mengikuti renderer kategori yang dipilih.</p>
      </div>
    </div>

    <form id="tpl-form" class="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5" novalidate>
      <div class="lg:col-span-3 min-w-0 space-y-4 sm:space-y-5">
        <section class="rounded-2xl bg-white border border-slate-100 p-4 sm:p-6">
          <h2 class="text-sm font-extrabold text-slate-900 mb-3">Identitas</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            ${field("Nama template *", `<input id="tf-name" value="${esc(d.name)}" maxlength="100" class="tf-input" placeholder="mis. Modern Minimalist ATS">`)}
            ${field("Kategori *", `<select id="tf-category" class="tf-input">
              ${CATEGORIES.map((c) => `<option value="${c}" ${d.category === c ? "selected" : ""}>${c}</option>`).join("")}
            </select>`)}
            ${field("Status", `<select id="tf-status" class="tf-input">
              <option value="draft" ${d.status === "draft" ? "selected" : ""}>Draft</option>
              <option value="published" ${d.status === "published" ? "selected" : ""}>Published</option>
              <option value="archived" ${d.status === "archived" ? "selected" : ""}>Archived</option>
            </select>`)}
            ${field("Versi engine", `<input id="tf-engine" value="${esc(d.engine_version)}" class="tf-input" placeholder="v2.4">`)}
            <div class="sm:col-span-2">
              ${field(
                "Deskripsi",
                `<input id="tf-desc" value="${esc(d.description)}" maxlength="255" class="tf-input" placeholder="Dokumen didukung: CV ATS & Resume Standar">`,
              )}
            </div>
          </div>
        </section>

        <section class="rounded-2xl bg-white border border-slate-100 p-4 sm:p-6">
          <h2 class="text-sm font-extrabold text-slate-900 mb-1">Renderer &amp; Tampilan</h2>
          <p class="text-xs text-slate-400 mb-3">Layout menentukan pratinjau dan renderer yang dipakai halaman pengguna. Daftar mengikuti kategori terpilih.</p>
          <div class="grid grid-cols-1 gap-3.5">
            ${field("Layout renderer", `<select id="tf-layout" class="tf-input"></select>`)}
            <div id="tpl-layout-grid" class="grid grid-cols-2 sm:grid-cols-4 gap-2"></div>
            ${field("Thumbnail kustom (URL https, opsional)", `<input id="tf-thumb" value="${esc(d.thumbnail_url)}" class="tf-input" placeholder="https://…">`)}
          </div>
        </section>

        <section class="rounded-2xl bg-white border border-slate-100 p-4 sm:p-6">
          <h2 class="text-sm font-extrabold text-slate-900 mb-1">Token &amp; Biaya</h2>
          <p class="text-xs text-slate-400 mb-3">Biaya &amp; kuota generate mengikuti token yang dipasang. Atur daftar token di Transaksi &amp; Komersial → Manajemen Token.</p>
          <select id="tf-token" class="tf-input"></select>
          <p id="tf-token-hint" class="text-[11px] text-slate-400 mt-1.5"></p>
        </section>

        <section class="rounded-2xl bg-white border border-slate-100 p-4 sm:p-6">
          <h2 class="text-sm font-extrabold text-slate-900 mb-1">config_json</h2>
          <p class="text-xs text-slate-400 mb-3">Harus object JSON valid. Kunci <span class="font-mono">layout</span> dipakai renderer; <span class="font-mono">accent</span> (hex) mengubah warna aksen.</p>
          <textarea id="tf-config" rows="7" spellcheck="false" class="tf-input font-mono text-xs">${esc(d.config_json)}</textarea>
        </section>

        <p id="tf-error" class="hidden rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-xs font-medium text-rose-700"></p>
      </div>

      <!-- Pratinjau live + aksi -->
      <div class="lg:col-span-2 min-w-0">
        <div class="rounded-2xl bg-white border border-slate-100 p-4 sm:p-5 lg:sticky lg:top-24">
          <div class="flex items-center justify-between gap-2 mb-3">
            <h2 class="text-sm font-extrabold text-slate-900">Pratinjau Langsung</h2>
            <span id="tpl-preview-tag" class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">${esc(d.category)}</span>
          </div>
          <div id="tpl-preview-box" class="rounded-xl overflow-hidden border border-slate-100 bg-slate-50"></div>
          <p id="tpl-preview-hint" class="mt-3 text-[11px] text-slate-400 leading-relaxed"></p>

          <div class="mt-4 flex flex-col gap-2">
            <button type="submit" id="tf-save" class="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 transition-colors">${isNew ? "Buat Template" : "Simpan Perubahan"}</button>
            <button type="button" data-cancel class="w-full rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold py-2.5 hover:bg-slate-50 transition-colors">Batal</button>
          </div>
        </div>
      </div>
    </form>`;

  // Isi dropdown layout + token (async).
  void hydrateEditForm();
  bindEditForm();
  refreshEditPreview();
}

async function hydrateEditForm(): Promise<void> {
  const d = state.draft;
  if (!d) return;
  const host = el();

  const layoutSel = host.querySelector("#tf-layout") as HTMLSelectElement | null;
  const tokenSel = host.querySelector("#tf-token") as HTMLSelectElement | null;

  const tokens = await loadTokenOptions();
  if (!state.draft) return;

  if (tokenSel) {
    tokenSel.innerHTML = `<option value="">— Tanpa token (generate tidak dibatasi) —</option>${tokens
      .map(
        (tk) =>
          `<option value="${tk.id}" ${state.draft!.token_package_id === String(tk.id) ? "selected" : ""}>${esc(
            tk.name,
          )} · ${formatAngka(tk.token_amount)} token · ${formatRupiah(tk.cost_per_generate)}/generate${tk.is_active ? "" : " (nonaktif)"}</option>`,
      )
      .join("")}`;
    const hint = host.querySelector("#tf-token-hint") as HTMLElement | null;
    if (hint) {
      hint.textContent =
        tokens.length === 0
          ? "Belum ada token — buat dulu di Manajemen Token agar biaya generate bisa diatur."
          : "Token nonaktif membuat generate dengan template ini diblokir.";
    }
  }

  if (layoutSel) {
    const opts = layoutsFor(state.draft!.category);
    const current = state.draft!.layout_key;
    const valid = opts.some((o) => o.key === current);
    layoutSel.innerHTML = `<option value="">Kustom (tanpa renderer)</option>${opts
      .map((o) => `<option value="${o.key}" ${current === o.key ? "selected" : ""}>${esc(o.label)}</option>`)
      .join("")}`;
    if (!valid && current !== "") {
      // Layout lama tidak tersedia untuk kategori ini → jatuhkan ke kustom.
      state.draft!.layout_key = "";
      layoutSel.value = "";
    }
    renderLayoutCards();
  }
  refreshEditPreview();
}

/** Kartu pilihan layout (klik = pilih) dengan pratinjau mini. */
function renderLayoutCards(): void {
  const host = el();
  const grid = host.querySelector("#tpl-layout-grid");
  const d = state.draft;
  if (!grid || !d) return;

  const opts = layoutsFor(d.category);
  if (opts.length === 0) {
    grid.innerHTML = `<p class="col-span-2 sm:col-span-4 text-xs text-slate-400">Belum ada renderer untuk kategori ini.</p>`;
    return;
  }

  grid.innerHTML =
    `<button type="button" data-layout="" class="rounded-xl border ${d.layout_key === "" ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200 hover:border-slate-300"} p-2 text-left transition-colors">
       <div class="h-16 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">Kustom</div>
       <p class="mt-1.5 text-[11px] font-bold text-slate-700">Tanpa renderer</p>
     </button>` +
    opts
      .map(
        (o) => `
      <button type="button" data-layout="${o.key}" class="rounded-xl border ${d.layout_key === o.key ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200 hover:border-slate-300"} p-2 text-left transition-colors">
        <div class="relative h-16 rounded-lg overflow-hidden bg-slate-100">
          ${renderTemplatePreview({
            category: o.category,
            layoutKey: o.key,
            config: parsedConfig(),
            name: o.label,
            fit: "crop",
            className: "absolute inset-0 w-full h-full",
          })}
        </div>
        <p class="mt-1.5 text-[11px] font-bold text-slate-700 leading-tight">${esc(o.key)}</p>
      </button>`,
      )
      .join("");

  grid.querySelectorAll<HTMLButtonElement>("[data-layout]").forEach((b) =>
    b.addEventListener("click", () => {
      if (!state.draft) return;
      state.draft.layout_key = b.dataset.layout ?? "";
      const sel = host.querySelector("#tf-layout") as HTMLSelectElement | null;
      if (sel) sel.value = state.draft.layout_key;
      syncConfigLayout();
      renderLayoutCards();
      refreshEditPreview();
    }),
  );

  requestAnimationFrame(() => fitPreviews(grid));
}

/**
 * Selaraskan `config.layout` dengan layout yang dipilih. Hanya menyentuh kunci
 * yang sudah ada (atau menambahkannya saat layout dipilih) agar config lain
 * milik admin tidak tersentuh.
 */
function syncConfigLayout(): void {
  const d = state.draft;
  if (!d) return;
  const cfg = parsedConfig();
  if (d.layout_key === "") {
    if ("layout" in cfg) delete cfg.layout;
  } else {
    cfg.layout = d.layout_key;
  }
  d.config_json = JSON.stringify(cfg, null, 2);
  const ta = el().querySelector("#tf-config") as HTMLTextAreaElement | null;
  if (ta) ta.value = d.config_json;
}

function parsedConfig(): Record<string, unknown> {
  const raw = state.draft?.config_json ?? "";
  try {
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function refreshEditPreview(): void {
  const host = el();
  const d = state.draft;
  const box = host.querySelector("#tpl-preview-box");
  if (!box || !d) return;

  const layout = findLayout(d.layout_key);
  box.innerHTML = renderTemplatePreview({
    category: d.category,
    layoutKey: d.layout_key,
    config: parsedConfig(),
    thumbnailUrl: d.thumbnail_url.trim() || null,
    name: d.name || "Template baru",
    fit: "width",
    className: "w-full",
  });

  const tag = host.querySelector("#tpl-preview-tag");
  if (tag) tag.textContent = d.category;

  const hint = host.querySelector("#tpl-preview-hint");
  if (hint) {
    hint.textContent = d.thumbnail_url.trim()
      ? "Memakai thumbnail kustom dari URL di atas."
      : layout
        ? layout.hint
        : "Layout kustom: pratinjau generik karena tidak ada renderer engine yang dipetakan.";
  }

  requestAnimationFrame(() => fitPreviews(box));
}

function bindEditForm(): void {
  const host = el();
  const form = host.querySelector("#tpl-form") as HTMLFormElement | null;
  if (!form) return;

  const sync = (): void => {
    const d = state.draft;
    if (!d) return;
    const get = (id: string): string => (host.querySelector(id) as HTMLInputElement | null)?.value ?? "";
    d.name = get("#tf-name");
    d.category = (get("#tf-category") || "CV ATS") as TemplateCategory;
    d.status = (get("#tf-status") || "draft") as Draft["status"];
    d.engine_version = get("#tf-engine");
    d.layout_key = get("#tf-layout");
    d.thumbnail_url = get("#tf-thumb");
    d.token_package_id = get("#tf-token");
    d.description = get("#tf-desc");
    d.config_json = (host.querySelector("#tf-config") as HTMLTextAreaElement | null)?.value ?? "";
  };

  const onChange = (e: Event): void => {
    const target = e.target as HTMLElement;
    sync();
    if (target.id === "tf-layout") syncConfigLayout();
    if (target.id === "tf-category") {
      // Kategori berubah → daftar layout ikut berubah.
      const sel = host.querySelector("#tf-layout") as HTMLSelectElement | null;
      if (sel && state.draft) {
        const opts = layoutsFor(state.draft.category);
        sel.innerHTML = `<option value="">Kustom (tanpa renderer)</option>${opts
          .map((o) => `<option value="${o.key}">${esc(o.label)}</option>`)
          .join("")}`;
        sel.value = state.draft.layout_key;
        if (!opts.some((o) => o.key === state.draft!.layout_key)) {
          state.draft.layout_key = "";
          sel.value = "";
        }
        syncConfigLayout();
      }
      renderLayoutCards();
    }
    refreshEditPreview();
  };

  form.addEventListener("input", onChange);
  form.addEventListener("change", onChange);

  host.querySelectorAll("[data-cancel]").forEach((b) => b.addEventListener("click", () => void handleCancel()));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    sync();
    const btn = host.querySelector("#tf-save") as HTMLButtonElement;
    setButtonLoading(btn, true);
    void saveDraft()
      .then(() => {
        showToast(state.editingId > 0 ? "Template diperbarui." : "Template dibuat.");
        gotoList();
      })
      .catch((err: Error) => {
        const box = host.querySelector("#tf-error") as HTMLElement | null;
        if (box) {
          box.textContent = err.message;
          box.classList.remove("hidden");
          box.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          showToast(err.message, "error");
        }
      })
      .finally(() => setButtonLoading(btn, false));
  });
}

/** Batal: langsung kembali ke daftar; bila ada perubahan, minta konfirmasi. */
async function handleCancel(): Promise<void> {
  if (isDirty()) {
    await promptUnsaved("list");
    return;
  }
  gotoList();
}

async function saveDraft(): Promise<void> {
  const d = state.draft;
  if (!d) throw new Error("Tidak ada data untuk disimpan.");

  if (!d.name.trim()) throw new Error("Nama template wajib diisi.");
  if (d.name.trim().length > 100) throw new Error("Nama template maksimal 100 karakter.");

  let config: Record<string, unknown> = {};
  const raw = d.config_json.trim();
  if (raw !== "" && raw !== "{}") {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new TypeError("bukan object");
      config = parsed as Record<string, unknown>;
    } catch {
      throw new Error("config_json harus JSON object yang valid.");
    }
  }

  const payload = {
    name: d.name.trim(),
    category: d.category,
    status: d.status,
    engine_version: d.engine_version.trim() || "v2.4",
    layout_key: d.layout_key,
    thumbnail_url: d.thumbnail_url.trim(),
    description: d.description.trim(),
    token_package_id: d.token_package_id || null,
    config_json: JSON.stringify(config),
  };

  if (state.editingId > 0) {
    await adminApi("templates.php", { method: "PUT", body: { id: state.editingId, ...payload } });
  } else {
    await adminApi("templates.php", { method: "POST", body: payload });
  }
  state.baseline = JSON.stringify(d);
  clearGuard();
}

// ── Util ─────────────────────────────────────────────────────────────

function field(label: string, control: string): string {
  return `<div class="min-w-0">
      <label class="block text-xs font-semibold text-slate-600 mb-1.5">${label}</label>
      ${control}
    </div>`;
}

function payloadOfTemplate(t: Template): Record<string, unknown> {
  return {
    name: t.name,
    category: t.category,
    description: t.description,
    thumbnail_url: t.thumbnail_url ?? "",
    engine_version: t.engine_version,
    layout_key: t.layout_key ?? "",
    token_package_id: t.token_package_id ?? null,
    config_json: JSON.stringify(t.config ?? {}),
    status: t.status,
  };
}

function debounce(fn: () => void, ms: number): () => void {
  let t: number | undefined;
  return () => {
    window.clearTimeout(t);
    t = window.setTimeout(fn, ms);
  };
}

