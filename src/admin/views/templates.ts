/**
 * Menu 2 — Katalog & Manajemen Template CV (UI terkunci ke desain patokan).
 * CRUD via /backend/admin/templates.php. Metrik tanpa sumber data tidak ditampilkan
 * (rating ★, conversion rate, dsb. — lihat ADMIN_IMPLEMENTATION.md Menu 2).
 */
import { adminApi } from "../api";
import { esc, initialAvatar, showToast, openModal, closeModal, confirmDialog, setButtonLoading } from "../ui";
import { formatAngka, formatRupiah, formatTanggal } from "../format";

interface Template {
  id: number;
  name: string;
  category: "CV ATS" | "Resume" | "Portfolio";
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
    name: string;
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

const CATEGORIES = ["CV ATS", "Resume", "Portfolio"] as const;
const LAYOUT_KEYS = [
  { value: "", label: "Kustom (tanpa renderer)" },
  { value: "standar", label: "standar — Modern Minimalist ATS" },
  { value: "tech", label: "tech — Tech Specialist Pro" },
  { value: "entry", label: "entry — Fresh Graduate Entry" },
];

const el = (): HTMLElement => document.getElementById("view-templates") as HTMLElement;

const state = {
  q: "",
  chip: "all" as "all" | "CV ATS" | "Resume" | "Portfolio" | "nonaktif",
  list: null as TemplateList | null,
  loading: false,
  /** Daftar token aktif+nonaktif untuk dropdown di form (dimuat sekali). */
  tokens: [] as TokenOption[],
};

export function mountTemplatesView(): void {
  state.tokens = []; // selalu segarkan daftar token saat menu dibuka
  void load();
}

/** Ambil daftar token untuk pilihan di form Tambah/Edit template. */
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

async function load(): Promise<void> {
  const host = el();
  try {
    state.list = await adminApi<TemplateList>("templates.php", {
      query: { q: state.q },
    });
    render(host);
  } catch (e) {
    host.innerHTML = `<div class="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">${esc((e as Error).message)}</div>`;
  }
}

// ── Halaman ──────────────────────────────────────────────────────────

function render(host: HTMLElement): void {
  const s = state.list!;
  host.innerHTML = `
    <!-- Header (D3, tanpa polling — grid direfresh manual) -->
    <div class="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[11px] font-bold tracking-wide text-slate-400">KATALOG DESAIN &amp; DOKUMEN <span class="text-slate-300">•</span> <span class="text-slate-500">Engine Core</span></p>
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Katalog &amp; Manajemen Template CV</h1>
        <p class="text-sm text-slate-500 mt-1 max-w-xl">Atur status publikasi, integrasi renderer engine, kategori ATS/Visual, dan pantau pemakaian template secara langsung.</p>
      </div>
      <button id="tpl-new" class="inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-5 py-2.5 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>
        Tambah Template Baru
      </button>
    </div>

    <!-- 3 kartu ringkas per kategori (D4) -->
    <div class="grid md:grid-cols-3 gap-5">
      <div class="rounded-2xl bg-[#d3f3e5] p-6"><p class="text-[11px] font-bold tracking-wide text-emerald-900/80">TOTAL TEMPLATE PUBLISHED</p><p class="mt-2 text-4xl font-extrabold text-emerald-950">${countCat(s, "CV ATS")} <span class="text-lg font-bold text-emerald-800/70">Sampul ATS</span></p><p class="mt-3 text-xs text-emerald-900/70">Kategori CV ATS</p></div>
      <div class="rounded-2xl bg-[#fbd9dd] p-6"><p class="text-[11px] font-bold tracking-wide text-rose-900/80">TOTAL TEMPLATE PUBLISHED</p><p class="mt-2 text-4xl font-extrabold text-rose-950">${countCat(s, "Resume")} <span class="text-lg font-bold text-rose-900/70">Resume</span></p><p class="mt-3 text-xs text-rose-900/70">Kategori Resume</p></div>
      <div class="rounded-2xl bg-slate-900 text-white p-6"><p class="text-[11px] font-bold tracking-wide text-white/70">TOTAL TEMPLATE PUBLISHED</p><p class="mt-2 text-4xl font-extrabold">${countCat(s, "Portfolio")} <span class="text-lg font-bold text-white/70">Portfolio</span></p><p class="mt-3 text-xs text-white/60">Kategori Web Portfolio</p></div>
    </div>

    <!-- Bar chip filter (D5) + pencarian -->
    <div class="mt-6 rounded-2xl bg-white border border-slate-100 p-4 flex flex-wrap items-center gap-3">
      ${chip("all", `Semua Template (${s.summary.total})`)}
      ${chip("CV ATS", `CV ATS (${s.summary["CV ATS"]})`)}
      ${chip("Resume", `Resume (${s.summary.Resume})`)}
      ${chip("Portfolio", `Portfolio (${s.summary.Portfolio})`)}
      ${chip("nonaktif", `Arsip/Nonaktif (${s.summary.nonaktif})`)}
      <input id="tpl-search" type="text" placeholder="Cari nama template / tag…" value="${esc(state.q)}"
             class="ml-auto rounded-full bg-slate-100 border border-transparent px-4 py-2 text-sm outline-none focus:border-slate-300 w-56">
    </div>

    <!-- Info banner aturan bisnis (D6) -->
    <div class="mt-4 rounded-2xl bg-white border border-amber-200/70 px-5 py-3.5 flex items-start gap-3">
      <svg class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4m0-4h.01"></path></svg>
      <p class="text-xs text-slate-600 leading-relaxed">Penonaktifan template <b>tidak akan menghapus dokumen lama pengguna</b> (payload CV tersimpan per dokumen), namun mencegah pemakaian renderer ini untuk dokumen baru.</p>
    </div>

    <!-- Grid kartu template (D10) -->
    <div id="tpl-grid" class="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
      ${s.templates.length === 0 ? `<div class="md:col-span-2 xl:col-span-3 rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
        <p class="text-slate-500 font-semibold">Belum ada template yang cocok.</p>
        <button id="tpl-empty-new" class="mt-3 rounded-full bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 hover:bg-slate-800">+ Template Baru</button>
      </div>` : s.templates.map(cardHtml).join("")}
    </div>`;

  // — Binding —
  host.querySelectorAll<HTMLButtonElement>("[data-chip]").forEach((b) =>
    b.addEventListener("click", () => {
      state.chip = b.dataset.chip as typeof state.chip;
      render(host);
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

  (host.querySelector("#tpl-new") as HTMLButtonElement).addEventListener("click", () => openForm(null));
  host.querySelector("#tpl-empty-new")?.addEventListener("click", () => openForm(null));
  bindCards();
}

function countCat(s: TemplateList, cat: Template["category"]): number {
  return s.templates.filter((t) => t.category === cat && t.status === "published").length;
}

function chip(id: string, label: string): string {
  const on = state.chip === id;
  return `<button data-chip="${esc(id)}" class="px-4 py-2 rounded-full text-xs font-bold transition-colors ${on ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}">${esc(label)}</button>`;
}

// ── Kartu template ───────────────────────────────────────────────────

function cardHtml(t: Template): string {
  const badge =
    t.status === "published"
      ? `<span class="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/95 text-white text-[11px] font-bold px-2.5 py-1"><span class="w-1.5 h-1.5 rounded-full bg-white"></span> Aktif</span>`
      : t.status === "draft"
        ? `<span class="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-amber-400/95 text-amber-950 text-[11px] font-bold px-2.5 py-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-800"></span> Draft</span>`
        : `<span class="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-rose-500/95 text-white text-[11px] font-bold px-2.5 py-1"><span class="w-1.5 h-1.5 rounded-full bg-white"></span> Nonaktif</span>`;

  const thumb = t.thumbnail_url
    ? `<img src="${esc(t.thumbnail_url)}" alt="${esc(t.name)}" class="absolute inset-0 w-full h-full object-cover" loading="lazy">`
    : `<div class="absolute inset-0 flex items-center justify-center">
         ${t.layout_key
           ? `<pre class="hidden"></pre><div class="w-40 h-52 bg-white rounded-xl shadow-lg border border-slate-200 p-3 flex flex-col gap-2"><div class="h-2 w-20 bg-slate-800 rounded"></div><div class="h-1.5 w-28 bg-slate-200 rounded"></div><div class="h-1.5 w-full bg-slate-100 rounded"></div><div class="h-1.5 w-full bg-slate-100 rounded"></div><div class="h-1.5 w-5/6 bg-slate-100 rounded"></div><div class="mt-2 h-8 w-full bg-slate-50 border border-slate-100 rounded"></div><div class="h-1.5 w-full bg-slate-100 rounded"></div></div>`
           : `<div class="w-20 h-20 rounded-2xl ${t.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"} flex items-center justify-center text-2xl font-extrabold">${esc(t.name[0] ?? "T")}</div>`}
       </div>`;

  const toggle = `
    <button data-toggle="${t.id}" class="relative inline-flex w-11 h-6 items-center rounded-full transition-colors ${t.status === "published" ? "bg-emerald-500" : "bg-slate-300"}">
      <span class="inline-block w-5 h-5 bg-white rounded-full shadow transition-transform ${t.status === "published" ? "translate-x-[22px]" : "translate-x-0.5"}"></span>
    </button>
    <span class="text-xs font-bold ${t.status === "published" ? "text-emerald-600" : "text-slate-400"}">${t.status === "published" ? "Aktif" : t.status === "draft" ? "Draft" : "Nonaktif"}</span>`;

  return `
  <div class="rounded-2xl bg-white border border-slate-100 overflow-hidden flex flex-col" data-card="${t.id}">
    <div class="relative h-44 bg-slate-100">
      ${thumb}
      ${badge}
      <span class="absolute top-3 right-3 rounded-full bg-white/95 text-slate-700 text-[10px] font-bold px-2.5 py-1 shadow-sm ${t.category === "CV ATS" ? "" : ""}">${esc(t.category)}</span>
    </div>
    <div class="p-5 flex flex-col flex-1">
      <div class="flex items-center gap-2">
        <h3 class="font-extrabold text-slate-900">${esc(t.name)}</h3>
        <span class="rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold px-2 py-0.5">${esc(t.engine_version)} Engine</span>
      </div>
      <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">Dokumen didukung: ${esc(t.description || "—")}</p>

      <div class="mt-4 grid grid-cols-2 gap-2 text-[10px] font-bold">
        <div class="rounded-xl bg-slate-50 border border-slate-100 p-3">
          <p class="text-slate-400 tracking-wide">TOTAL PENGGUNAAN</p>
          <p class="text-slate-800 text-sm mt-0.5">${formatAngka(t.usage_count)}x dokumen</p>
        </div>
        <div class="rounded-xl bg-slate-50 border border-slate-100 p-3">
          <p class="text-slate-400 tracking-wide">RENDERER</p>
          <p class="text-slate-800 text-sm mt-0.5">${t.layout_key ? esc(t.layout_key) : "Kustom"}</p>
        </div>
        <div class="rounded-xl ${t.token ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"} border p-3 col-span-2">
          <p class="${t.token ? "text-emerald-700/70" : "text-amber-700/70"} tracking-wide">TOKEN / BIAYA GENERATE</p>
          ${t.token
            ? `<p class="text-slate-800 text-sm mt-0.5">${esc(t.token.name)} · ${formatRupiah(t.token.cost_per_generate)}/generate</p>
               <p class="text-[10px] font-medium ${t.token.is_active ? "text-emerald-700" : "text-rose-600"} mt-0.5">${t.token.is_active ? `${formatAngka(t.token.token_amount)} token tersedia` : "Token nonaktif — generate diblokir"}</p>`
            : `<p class="text-amber-800 text-sm mt-0.5">Belum dipasang</p>
               <p class="text-[10px] font-medium text-amber-700 mt-0.5">Generate tidak dibatasi token</p>`}
        </div>
      </div>

      <p class="mt-3 text-[11px] text-slate-400">Diperbarui ${esc(formatTanggal(t.updated_at))}</p>

      <div class="mt-auto pt-4 flex items-center justify-between gap-2 border-t border-slate-50 mt-4">
        <div class="flex items-center gap-2">${toggle}</div>
        <div class="flex items-center gap-1.5">
          <button data-edit="${t.id}" class="rounded-full bg-slate-900 text-white text-xs font-bold px-4 py-1.5 hover:bg-slate-800 transition-colors">Edit</button>
          <button data-delete="${t.id}" title="Hapus template" class="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"></path></svg>
          </button>
        </div>
      </div>
    </div>
  </div>`;
}

function findTemplate(id: number): Template | undefined {
  return state.list?.templates.find((t) => t.id === id);
}

function bindCards(): void {
  const host = el();

  host.querySelectorAll<HTMLButtonElement>("[data-toggle]").forEach((b) =>
    b.addEventListener("click", async () => {
      const t = findTemplate(Number(b.dataset.toggle));
      if (!t) return;
      const toPublished = t.status !== "published";
      const { confirmed } = await confirmDialog({
        title: toPublished ? "Publikasikan template?" : "Nonaktifkan template?",
        message: `<b>${esc(t.name)}</b> — ${toPublished ? "template akan tersedia di katalog halaman pengguna." : "template di-commit ke draft; dokumen lama pengguna tidak terhapus, dokumen baru tidak bisa memakai renderer ini."}`,
        confirmText: toPublished ? "Publikasikan" : "Jadikan Draft",
        danger: !toPublished,
      });
      if (confirmed) await save(t, { ...payloadOf(t), status: toPublished ? "published" : "draft" }, false);
    }),
  );

  host.querySelectorAll<HTMLButtonElement>("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => openForm(findTemplate(Number(b.dataset.edit)) ?? null)),
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
        await adminApi(`templates.php`, { method: "DELETE", query: { id: t.id } });
        showToast("Template dihapus.");
        void load();
      } catch (e) {
        showToast((e as Error).message, "error");
      }
    }),
  );
}

function payloadOf(t: Template): Record<string, unknown> {
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

// ── Form modal (Tambah/Edit) ─────────────────────────────────────────

function openForm(t: Template | null): void {
  void openFormAsync(t);
}

async function openFormAsync(t: Template | null): Promise<void> {
  const isEdit = t !== null;
  const cfgText = t ? JSON.stringify(t.config ?? {}, null, 2) : "{\n  \"layout\": \"standar\"\n}";
  const tokenOpts = await loadTokenOptions();

  const modal = openModal({
    title: isEdit ? `Edit Template — ${t!.name}` : "Tambah Template Baru",
    subtitle: "Validasi: nama ≤100, kategori valid, thumbnail https, config_json object valid.",
    wide: true,
    body: `
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Nama template *</label>
          <input id="tf-name" value="${esc(t?.name ?? "")}" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-slate-400" maxlength="100">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Kategori *</label>
          <select id="tf-category" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-slate-400">
            ${CATEGORIES.map((c) => `<option ${t?.category === c ? "selected" : ""}>${c}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
          <select id="tf-status" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-slate-400">
            <option value="draft" ${t?.status === "draft" ? "selected" : ""}>Draft</option>
            <option value="published" ${t?.status === "published" ? "selected" : ""}>Published</option>
            <option value="archived" ${t?.status === "archived" ? "selected" : ""}>Archived</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Versi engine</label>
          <input id="tf-engine" value="${esc(t?.engine_version ?? "v2.4")}" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-slate-400">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Renderer (mapping ke aplikasi user — F8)</label>
          <select id="tf-layout" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-slate-400">
            ${LAYOUT_KEYS.map((l) => `<option value="${l.value}" ${(t?.layout_key ?? "") === l.value ? "selected" : ""}>${l.label}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Thumbnail (URL https)</label>
          <input id="tf-thumb" value="${esc(t?.thumbnail_url ?? "")}" placeholder="https://…" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-slate-400">
        </div>
        <div class="md:col-span-2">
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Token untuk generate dokumen *</label>
          <select id="tf-token" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-slate-400">
            <option value="">— Tanpa token (generate tidak dibatasi) —</option>
            ${tokenOpts
              .map(
                (tk) =>
                  `<option value="${tk.id}" ${t?.token_package_id === tk.id ? "selected" : ""}>${esc(tk.name)} · ${formatAngka(tk.token_amount)} token · Rp ${formatAngka(tk.cost_per_generate)}/generate${tk.is_active ? "" : " (nonaktif)"}</option>`,
              )
              .join("")}
          </select>
          <p class="text-[11px] text-slate-400 mt-1">
            Biaya &amp; kuota generate mengikuti token ini. Atur daftar token di menu
            <b class="text-slate-500">Transaksi &amp; Komersial → Manajemen Token</b>.
            ${tokenOpts.length === 0 ? `<span class="text-amber-600">Belum ada token — buat dulu di Manajemen Token.</span>` : ""}
          </p>
        </div>
        <div class="md:col-span-2">
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Deskripsi "Dokumen didukung"</label>
          <input id="tf-desc" value="${esc(t?.description ?? "")}" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-slate-400" maxlength="255">
        </div>
        <div class="md:col-span-2">
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">config_json (JSON object)</label>
          <textarea id="tf-config" rows="5" spellcheck="false" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-slate-400">${esc(cfgText)}</textarea>
          <p id="tf-error" class="hidden text-xs font-medium text-rose-600 mt-1"></p>
        </div>
      </div>`,
    footer: `
      <button id="tf-cancel" class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-white">Batal</button>
      <button id="tf-save" class="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold">${isEdit ? "Simpan Perubahan" : "Buat Template"}</button>`,
  });

  (modal.querySelector("#tf-cancel") as HTMLButtonElement).addEventListener("click", closeModal);
  (modal.querySelector("#tf-save") as HTMLButtonElement).addEventListener("click", (e) => {
    e.preventDefault();
    const btn = modal.querySelector("#tf-save") as HTMLButtonElement;
    const err = modal.querySelector("#tf-error") as HTMLElement;

    const payload = {
      name: (modal.querySelector("#tf-name") as HTMLInputElement).value.trim(),
      category: (modal.querySelector("#tf-category") as HTMLSelectElement).value,
      status: (modal.querySelector("#tf-status") as HTMLSelectElement).value,
      engine_version: (modal.querySelector("#tf-engine") as HTMLInputElement).value.trim() || "v2.4",
      layout_key: (modal.querySelector("#tf-layout") as HTMLSelectElement).value,
      thumbnail_url: (modal.querySelector("#tf-thumb") as HTMLInputElement).value.trim(),
      description: (modal.querySelector("#tf-desc") as HTMLInputElement).value.trim(),
      token_package_id: (modal.querySelector("#tf-token") as HTMLSelectElement).value || null,
    };
    const cfgRaw = (modal.querySelector("#tf-config") as HTMLTextAreaElement).value.trim();
    let config: Record<string, unknown> = {};
    if (cfgRaw !== "" && cfgRaw !== "{}") {
      try {
        config = JSON.parse(cfgRaw) as Record<string, unknown>;
        if (Array.isArray(config) || typeof config !== "object") throw new TypeError("bukan object");
      } catch {
        err.textContent = "config_json harus JSON object yang valid.";
        err.classList.remove("hidden");
        return;
      }
    }

    setButtonLoading(btn, true);
    void save(t, { ...payload, config_json: JSON.stringify(config) }, isEdit)
      .catch((e: Error) => {
        err.textContent = e.message;
        err.classList.remove("hidden");
      })
      .finally(() => setButtonLoading(btn, false));
  });
}

async function save(t: Template | null, payload: Record<string, unknown>, isEdit: boolean): Promise<void> {
  try {
    if (isEdit && t) {
      await adminApi("templates.php", { method: "PUT", body: { id: t.id, ...payload } });
      showToast("Template diperbarui.");
    } else {
      await adminApi("templates.php", { method: "POST", body: payload });
      showToast("Template dibuat.");
    }
    closeModal();
    void load();
  } catch (e) {
    throw e;
  }
}
