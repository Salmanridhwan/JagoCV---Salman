/**
 * Menu 3 (User) + Menu 4 (tab Dokumen) — UI terkunci ke desain patokan
 * "Manajemen User & Dokumen.png".
 */
import { adminApi, adminDownload } from "../api";
import { formatAngka, formatTanggal, formatWaktu, usrId } from "../format";
import { esc, initialAvatar, showToast, openModal, closeModal, confirmDialog, skeletonRows } from "../ui";

interface UserRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  auth_provider: "local" | "google";
  plan: string;
  points: number;
  status: "active" | "suspended" | "banned";
  created_at: string;
  docs_count: number;
  has_topup: boolean;
}

interface UsersPage {
  summary: { total: number; active: number; active_pct: number; suspended: number; docs_total: number };
  users: UserRow[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

interface DocRow {
  id: number;
  doc_code: string;
  title: string;
  type: string;
  status: string;
  user_id: number;
  owner: string;
  email: string;
  user_status: string;
  layout: string | null;
  created_at: string;
}

const el = (): HTMLElement => document.getElementById("view-users") as HTMLElement;

const state = {
  tab: "pengguna" as "pengguna" | "dokumen",
  q: "",
  chip: "all" as "all" | "active" | "inactive" | "topup",
  page: 1,
  data: null as UsersPage | null,
  docs: {
    q: "",
    type: "all",
    status: "all",
    page: 1,
    data: null as
      | (DocumentsPage & { documents: DocRow[] })
      | null,
  },
};

interface DocumentsPage {
  documents: DocRow[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export function mountUsersView(): void {
  window.addEventListener("admin-search", ((e: CustomEvent) => {
    state.q = String(e.detail || "").trim();
    state.page = 1;
    if (state.tab === "pengguna") void loadUsers();
    else void loadDocs();
  }) as EventListener);

  // Muat data untuk kedua tab, render pengguna dulu.
  void Promise.all([loadUsers(), loadDocs()]).catch(() => undefined);
}

// ── KERANGKA HALAMAN ─────────────────────────────────────────────────

function frame(): string {
  const s = state.data?.summary;
  return `
    <!-- Header -->
    <div class="mb-7">
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-[11px] font-bold">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span> LIVE WORKSPACE MODE
        </span>
        <span class="text-xs text-slate-400">Pembaruan otomatis tiap 30 detik</span>
      </div>
      <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">Manajemen Pengguna &amp; Dokumen</h1>
      <p class="text-sm text-slate-500 mt-1 max-w-xl">Kelola data pengguna terdaftar, audit riwayat pembuatan CV/Resume/Portfolio, serta monitoring aktivitas akun secara terpusat.</p>
    </div>

    <!-- 4 kartu ringkas (D4) -->
    <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div class="rounded-2xl bg-[#d3f3e5] p-5">
        <p class="text-[11px] font-bold tracking-wide text-emerald-900/80">TOTAL PENGGUNA</p>
        <p class="mt-2 text-4xl font-extrabold text-emerald-950">${formatAngka(s?.total ?? 0)}</p>
        <p class="mt-2 text-[11px] text-emerald-900/70">Terdaftar di master database</p>
      </div>
      <div class="rounded-2xl bg-slate-900 text-white p-5">
        <p class="text-[11px] font-bold tracking-wide text-white/70">PENGGUNA AKTIF</p>
        <p class="mt-2 text-4xl font-extrabold">${formatAngka(s?.active ?? 0)}</p>
        <p class="mt-2 text-[11px] text-white/60">${(s?.active_pct ?? 0).toLocaleString("id-ID")}% rasio retensi sistem</p>
      </div>
      <div class="rounded-2xl bg-white border border-slate-200 p-5">
        <p class="text-[11px] font-bold tracking-wide text-slate-500">DOKUMEN DIGENERATE</p>
        <p class="mt-2 text-4xl font-extrabold text-slate-900">${formatAngka(s?.docs_total ?? 0)}</p>
        <p class="mt-2 text-[11px] text-slate-400">CV, Resume &amp; Portfolio Web</p>
      </div>
      <div class="rounded-2xl bg-[#fbd9dd] p-5">
        <p class="text-[11px] font-bold tracking-wide text-rose-900/80 flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path></svg>
          AKUN DITANGGUHKAN
        </p>
        <p class="mt-2 text-4xl font-extrabold text-rose-950">${formatAngka(s?.suspended ?? 0)}</p>
        <p class="mt-2 text-[11px] text-rose-900/70">Pelanggaran syarat &amp; ketentuan</p>
      </div>
    </div>

    <!-- Tab + area konten -->
    <div class="flex gap-2 mt-8">
      <button data-tab="pengguna" class="px-5 py-2.5 rounded-full text-sm font-bold transition-colors">Pengguna</button>
      <button data-tab="dokumen" class="px-5 py-2.5 rounded-full text-sm font-bold transition-colors">Dokumen</button>
    </div>
    <div id="u-panel" class="mt-4"></div>`;
}

async function loadUsers(): Promise<void> {
  const host = el();
  if (!state.data) host.innerHTML = frame() + "";
  const panel = host.querySelector("#u-panel");
  if (panel && state.tab === "pengguna") {
    panel.innerHTML = `<div class="rounded-2xl bg-white border border-slate-100 p-6">${skeletonRows(4)}</div>`;
  }

  try {
    state.data = await adminApi<UsersPage>("users.php", {
      query: {
        q: state.q,
        status: state.chip === "active" || state.chip === "inactive" ? state.chip : undefined,
        has_topup: state.chip === "topup" ? 1 : undefined,
        page: state.page,
        per_page: 8,
      },
    });
    render();
  } catch (e) {
    if (panel) {
      panel.innerHTML = `<div class="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">${esc((e as Error).message)}</div>`;
    }
  }
}

async function loadDocs(): Promise<void> {
  const panel = el().querySelector("#u-panel");
  if (panel && state.tab === "dokumen") {
    panel.innerHTML = `<div class="rounded-2xl bg-white border border-slate-100 p-6">${skeletonRows(4)}</div>`;
  }
  try {
    state.docs.data = await adminApi<DocumentsPage>("documents.php", {
      query: {
        q: state.docs.q,
        type: state.docs.type === "all" ? undefined : state.docs.type,
        status: state.docs.status === "all" ? undefined : state.docs.status,
        page: state.docs.page,
        per_page: 8,
      },
    });
    render();
  } catch (e) {
    if (panel) {
      panel.innerHTML = `<div class="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">${esc((e as Error).message)}</div>`;
    }
  }
}

function render(): void {
  const host = el();
  if (host.innerHTML.indexOf("u-panel") < 0) host.innerHTML = frame();

  // Status tab
  host.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((b) => {
    const on = b.dataset.tab === state.tab;
    b.classList.toggle("bg-slate-900", on);
    b.classList.toggle("text-white", on);
    b.classList.toggle("text-slate-500", !on);
  });

  const panel = host.querySelector("#u-panel") as HTMLElement;
  panel.innerHTML = state.tab === "pengguna" ? userPanel() : docPanel();
  bind();
}

// ── TAB PENGGUNA ─────────────────────────────────────────────────────

function userPanel(): string {
  const d = state.data!;
  const rows = d.users;

  const chipBtn = (id: string, label: string): string => {
    const on = state.chip === id;
    return `<button data-chip="${id}" class="px-4 py-2 rounded-full text-xs font-bold transition-colors ${on ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}">${esc(label)}</button>`;
  };

  const statusBadge = (s: UserRow["status"]): string =>
    s === "active"
      ? `<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-[11px] font-bold"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif</span>`
      : s === "suspended"
        ? `<span class="inline-flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-700 px-3 py-1 text-[11px] font-bold"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Dinonaktifkan</span>`
        : `<span class="inline-flex items-center gap-1.5 rounded-full bg-slate-200 text-slate-700 px-3 py-1 text-[11px] font-bold"><span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Banned</span>`;

  return `
  <div class="rounded-2xl bg-white border border-slate-100 p-5 flex flex-wrap items-center gap-3">
    <input id="u-search" type="text" placeholder="Cari nama atau User ID…" value="${esc(state.q)}"
           class="rounded-full bg-slate-100 border border-transparent px-4 py-2 text-sm outline-none focus:border-slate-300 min-w-[220px] flex-1">
    ${chipBtn("all", "Semua Status")}
    ${chipBtn("active", "Aktif")}
    ${chipBtn("inactive", "Nonaktif")}
    ${chipBtn("topup", "Memiliki Transaksi Top Up")}
    <button id="u-export" class="ml-auto inline-flex items-center gap-2 rounded-full bg-slate-900 text-white text-xs font-bold px-4 py-2 hover:bg-slate-800">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"></path></svg>
      Export CSV
    </button>
  </div>

  <div class="mt-4 rounded-2xl bg-white border border-slate-100">
    <div class="flex flex-wrap items-center justify-between gap-2 px-5 pt-5 pb-4">
      <div class="flex items-center gap-3">
        <h3 class="font-extrabold text-slate-900">Daftar Pengguna Aktif &amp; Terdaftar</h3>
        <span class="rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold px-2.5 py-1">${formatAngka(d.total)} baris</span>
      </div>
      <p class="text-[11px] text-slate-400 flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        Kredensial tidak pernah diekspor (F5: public_user tanpa password_hash)
      </p>
    </div>

    <div class="overflow-x-auto px-2 pb-2">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-[11px] tracking-wide text-slate-400 border-b border-slate-100">
            <th class="pl-4 font-bold py-3 text-left w-8"><input type="checkbox" disabled class="rounded"></th>
            <th class="text-left font-bold py-3 px-2">PENGUNA</th>
            <th class="text-left font-bold py-3 px-2">STATUS AKUN</th>
            <th class="text-left font-bold py-3 px-2 whitespace-nowrap">SALDO POIN AI</th>
            <th class="text-left font-bold py-3 px-2 whitespace-nowrap hidden md:table-cell">TOTAL DOKUMEN</th>
            <th class="text-right font-bold py-3 px-2 pr-4">AKSI</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length === 0
            ? `<tr><td colspan="6" class="text-center text-slate-400 py-12">Tidak ada pengguna yang cocok dengan filter.</td></tr>`
            : rows
                .map(
                  (u) => `
            <tr class="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors" data-row="${u.id}">
              <td class="pl-4 py-3"><input type="checkbox" class="rounded" value="${u.id}"></td>
              <td class="py-3 px-2">
                <div class="flex items-center gap-3">
                  ${u.avatar_url ? `<img src="${esc(u.avatar_url)}" class="w-9 h-9 rounded-full object-cover shrink-0" alt="">` : initialAvatar(`${u.first_name} ${u.last_name}`)}
                  <div class="leading-tight">
                    <p class="font-bold text-slate-800 flex items-center gap-2">${esc(`${u.first_name} ${u.last_name}`.trim())}
                      <span class="rounded bg-slate-100 text-slate-400 text-[10px] font-bold px-1.5 py-0.5">${esc(usrId(u.id))}</span>
                    </p>
                    <p class="text-[11px] text-slate-400">${esc(u.email)}</p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-2">${statusBadge(u.status)}</td>
              <td class="py-3 px-2 font-bold text-slate-700 whitespace-nowrap">
                <span class="inline-flex items-center gap-1.5"><span class="w-4 h-4 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[9px] font-extrabold">●</span>${formatAngka(u.points)} Poin</span>
              </td>
              <td class="py-3 px-2 text-slate-500 hidden md:table-cell whitespace-nowrap">${u.docs_count} Dokumen</td>
              <td class="py-3 px-2 pr-4">
                <div class="flex items-center justify-end gap-1">
                  <button data-docs="${u.id}" title="Lihat dokumen pengguna" class="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"></path></svg>
                  </button>
                  <button data-edit="${u.id}" title="Kelola akun" class="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7m-9-8l10 10m-6-16h6v6"></path></svg>
                  </button>
                  <button data-toggle-status="${u.id}" title="${u.status === "active" ? "Nonaktifkan akun" : "Aktifkan kembali akun"}" class="p-2 rounded-full text-slate-500 hover:text-amber-600 hover:bg-amber-50">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M5.5 18.5l13-13"></path></svg>
                  </button>
                </div>
              </td>
            </tr>`,
                )
                .join("")}
        </tbody>
      </table>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <p class="text-xs text-slate-400">Menampilkan ${rows.length} dari ${formatAngka(d.total)} pengguna</p>
      <div id="u-pager" class="flex items-center gap-1">${pager(d.page, d.total_pages, "u")}</div>
    </div>
  </div>`;
}

// ── TAB DOKUMEN ──────────────────────────────────────────────────────

function docPanel(): string {
  const d = state.docs.data;
  const docs = (d?.documents as DocRow[]) ?? [];

  const chipBtn = (group: string, id: string, label: string, current: string): string => {
    const on = current === id;
    return `<button data-${group}="${esc(id)}" class="px-4 py-2 rounded-full text-xs font-bold transition-colors ${on ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}">${esc(label)}</button>`;
  };

  const statusBadge = (s: string): string =>
    s === "Selesai"
      ? `<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-[11px] font-bold"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Selesai</span>`
      : s === "Draf"
        ? `<span class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-[11px] font-bold"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Draf</span>`
        : `<span class="inline-flex items-center gap-1.5 rounded-full bg-sky-100 text-sky-700 px-3 py-1 text-[11px] font-bold"><span class="w-1.5 h-1.5 rounded-full bg-sky-500"></span> Diterbitkan</span>`;

  return `
  <div class="rounded-2xl bg-white border border-slate-100 p-5 flex flex-wrap items-center gap-3">
    <input id="d-search" type="text" placeholder="Cari DOC / judul / email pemilik…" value="${esc(state.docs.q)}"
           class="rounded-full bg-slate-100 border border-transparent px-4 py-2 text-sm outline-none focus:border-slate-300 min-w-[220px] flex-1">
    ${["all", "ATS CV", "Visual Resume", "Web Portfolio", "Cover Letter"]
      .map((t) => chipBtn("dtype", t, t === "all" ? "Semua Jenis" : t, state.docs.type))
      .join("")}
    ${["all", "Draf", "Selesai", "Diterbitkan"]
      .map((s) => chipBtn("dstatus", s, s === "all" ? "Semua Status" : s, state.docs.status))
      .join("")}
  </div>

  <div class="mt-4 rounded-2xl bg-white border border-slate-100">
    <div class="px-5 pt-5 pb-4 flex items-center gap-3">
      <h3 class="font-extrabold text-slate-900">Riwayat Dokumen Pengguna</h3>
      <span class="rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold px-2.5 py-1">${formatAngka(d?.total ?? 0)} baris</span>
    </div>
    <div class="overflow-x-auto px-2 pb-2">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-[11px] tracking-wide text-slate-400 border-b border-slate-100">
            <th class="pl-4 text-left font-bold py-3">KODE</th>
            <th class="text-left font-bold py-3 px-2">JUDUL</th>
            <th class="text-left font-bold py-3 px-2">JENIS</th>
            <th class="text-left font-bold py-3 px-2 hidden md:table-cell">PEMILIK</th>
            <th class="text-left font-bold py-3 px-2">STATUS</th>
            <th class="text-left font-bold py-3 px-2 hidden lg:table-cell">LAYOUT</th>
            <th class="text-right font-bold py-3 px-2 pr-4">AKSI</th>
          </tr>
        </thead>
        <tbody>
          ${docs.length === 0
            ? `<tr><td colspan="7" class="text-center text-slate-400 py-12">Belum ada dokumen yang cocok (dokumen tampil setelah pengguna menyimpan CV — FAKTA F12).</td></tr>`
            : docs
                .map(
                  (doc) => `
            <tr class="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
              <td class="pl-4 py-3 font-mono text-xs font-bold text-slate-600">${esc(doc.doc_code)}</td>
              <td class="py-3 px-2 font-bold text-slate-800 max-w-[220px] truncate" title="${esc(doc.title)}">${esc(doc.title)}</td>
              <td class="py-3 px-2 text-slate-500">${esc(doc.type)}</td>
              <td class="py-3 px-2 hidden md:table-cell">
                <p class="text-slate-700 font-semibold leading-tight">${esc(doc.owner)}</p>
                <p class="text-[11px] text-slate-400">${esc(doc.email)}</p>
              </td>
              <td class="py-3 px-2">${statusBadge(doc.status)}</td>
              <td class="py-3 px-2 hidden lg:table-cell">${doc.layout ? `<span class="rounded bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1">${esc(doc.layout)}</span>` : `<span class="text-slate-300 text-xs">—</span>`}</td>
              <td class="py-3 px-2 pr-4 text-right">
                <button data-docdetail="${doc.id}" class="rounded-full bg-slate-900 text-white text-[11px] font-bold px-3.5 py-1.5 hover:bg-slate-800 transition-colors">Lihat Detail</button>
              </td>
            </tr>`,
                )
                .join("")}
        </tbody>
      </table>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <p class="text-xs text-slate-400">Menampilkan ${docs.length} dari ${formatAngka(d?.total ?? 0)} dokumen</p>
      <div id="d-pager" class="flex items-center gap-1">${pager(d?.page ?? 1, d?.total_pages ?? 1, "d")}</div>
    </div>
  </div>`;
}

// ── Binding & aksi ───────────────────────────────────────────────────

function bind(): void {
  const host = el();

  host.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((b) =>
    b.addEventListener("click", () => {
      state.tab = b.dataset.tab as typeof state.tab;
      render();
    }),
  );

  host.querySelectorAll<HTMLButtonElement>('[data-chip]').forEach((b) =>
    b.addEventListener("click", () => {
      state.chip = b.dataset.chip as typeof state.chip;
      state.page = 1;
      void loadUsers();
    }),
  );

  const uSearch = host.querySelector("#u-search") as HTMLInputElement | null;
  uSearch?.addEventListener("input", debounce(() => {
    state.q = uSearch.value.trim();
    state.page = 1;
    void loadUsers();
  }, 350));

  (host.querySelector("#u-export") as HTMLButtonElement | null)?.addEventListener("click", () => {
    void adminDownload(
      "users.php",
      {
        export: "csv",
        q: state.q,
        status: state.chip === "active" || state.chip === "inactive" ? state.chip : undefined,
        has_topup: state.chip === "topup" ? 1 : undefined,
      },
      "jagocv-users.csv",
    )
      .then(() => showToast("Ekspor CSV pengguna diunduh — dicatat di audit log."))
      .catch((e: Error) => showToast(e.message, "error"));
  });

  host.querySelectorAll<HTMLButtonElement>("#u-pager [data-page]").forEach((b) =>
    b.addEventListener("click", () => {
      state.page = Number(b.dataset.page);
      void loadUsers();
    }),
  );

  const dSearch = host.querySelector("#d-search") as HTMLInputElement | null;
  dSearch?.addEventListener("input", debounce(() => {
    state.docs.q = dSearch.value.trim();
    state.docs.page = 1;
    void loadDocs();
  }, 350));

  host.querySelectorAll<HTMLButtonElement>("[data-dtype]").forEach((b) =>
    b.addEventListener("click", () => {
      state.docs.type = b.dataset.dtype as string;
      state.docs.page = 1;
      void loadDocs();
    }),
  );
  host.querySelectorAll<HTMLButtonElement>("[data-dstatus]").forEach((b) =>
    b.addEventListener("click", () => {
      state.docs.status = b.dataset.dstatus as string;
      state.docs.page = 1;
      void loadDocs();
    }),
  );
  host.querySelectorAll<HTMLButtonElement>("#d-pager [data-page]").forEach((b) =>
    b.addEventListener("click", () => {
      state.docs.page = Number(b.dataset.page);
      void loadDocs();
    }),
  );

  host.querySelectorAll<HTMLButtonElement>("[data-docs]").forEach((b) =>
    b.addEventListener("click", () => {
      const userId = Number(b.dataset.docs);
      state.tab = "dokumen";
      state.docs = { ...state.docs, q: String(userId), page: 1 };
      render();
      const input = host.querySelector("#d-search") as HTMLInputElement | null;
      if (input) input.value = String(userId);
    }),
  );

  host.querySelectorAll<HTMLButtonElement>("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => void openUserDetail(Number(b.dataset.edit))),
  );

  host.querySelectorAll<HTMLButtonElement>("[data-toggle-status]").forEach((b) =>
    b.addEventListener("click", () => void toggleStatus(Number(b.dataset.toggleStatus))),
  );

  host.querySelectorAll<HTMLButtonElement>("[data-docdetail]").forEach((b) =>
    b.addEventListener("click", () => void openDocDetail(Number(b.dataset.docdetail))),
  );
}

// ── Detail user (profil + dokumen + transaksi + ubah status) ─────────

async function openUserDetail(id: number): Promise<void> {
  let data: { user: UserRow & { docs_count?: number }; documents: { doc_code: string; title: string; type: string; status: string; created_at: string }[]; transactions: { type: string; points: number; amount: number | null; status: string; created_at: string }[] };
  try {
    data = await adminApi("users.php", { query: { id } });
  } catch (e) {
    showToast((e as Error).message, "error");
    return;
  }
  const u = data.user;

  const modal = openModal({
    title: `${u.first_name} ${u.last_name}`.trim() || u.email,
    subtitle: `${usrId(u.id)} · ${u.email}`,
    wide: true,
    body: `
      <div class="grid sm:grid-cols-4 gap-3 text-center text-xs mb-5">
        <div class="rounded-xl bg-slate-50 border border-slate-100 p-3"><p class="text-slate-400 font-bold text-[10px]">STATUS</p><p class="font-bold text-slate-800 mt-1">${esc(u.status)}</p></div>
        <div class="rounded-xl bg-slate-50 border border-slate-100 p-3"><p class="text-slate-400 font-bold text-[10px]">POIN</p><p class="font-bold text-slate-800 mt-1">${formatAngka(u.points)}</p></div>
        <div class="rounded-xl bg-slate-50 border border-slate-100 p-3"><p class="text-slate-400 font-bold text-[10px]">PROVIDER</p><p class="font-bold text-slate-800 mt-1">${esc(u.auth_provider)}</p></div>
        <div class="rounded-xl bg-slate-50 border border-slate-100 p-3"><p class="text-slate-400 font-bold text-[10px]">TERDAFTAR</p><p class="font-bold text-slate-800 mt-1">${esc(formatTanggal(u.created_at))}</p></div>
      </div>

      <div class="rounded-xl bg-slate-50 border border-slate-100 p-4 mb-5">
        <p class="text-xs font-bold text-slate-600 mb-3">Ubah status akun (alasan wajib — masuk audit log)</p>
        <div class="flex flex-wrap gap-2">
          <select id="ud-status" class="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
            <option value="active" ${u.status === "active" ? "selected" : ""}>active (aktif)</option>
            <option value="suspended" ${u.status === "suspended" ? "selected" : ""}>suspended (dinonaktifkan)</option>
            <option value="banned" ${u.status === "banned" ? "selected" : ""}>banned</option>
          </select>
          <input id="ud-reason" placeholder="Alasan…" class="flex-1 min-w-[180px] rounded-xl border border-slate-200 px-3 py-2 text-sm">
          <button id="ud-save-status" class="rounded-xl bg-slate-900 text-white text-xs font-bold px-4 py-2 hover:bg-slate-800">Simpan</button>
        </div>
        <p id="ud-err" class="hidden text-xs font-medium text-rose-600 mt-2"></p>
      </div>

      <p class="text-xs font-bold text-slate-600 mb-2">Dokumen (${data.documents.length})</p>
      <div class="rounded-xl border border-slate-100 overflow-hidden mb-5 max-h-40 overflow-y-auto">
        <table class="w-full text-xs">
          ${data.documents.length === 0
            ? `<tr><td class="text-slate-400 py-3 px-3">Belum ada dokumen.</td></tr>`
            : data.documents
                .map(
                  (doc) =>
                    `<tr class="border-b border-slate-50 last:border-0"><td class="py-2 px-3 font-mono text-slate-500">${esc(doc.doc_code)}</td><td class="py-2 px-2 font-semibold text-slate-700">${esc(doc.title)}</td><td class="py-2 px-2 text-slate-400">${esc(doc.type)}</td><td class="py-2 px-2 text-slate-400">${esc(doc.status)}</td></tr>`,
                )
                .join("")}
        </table>
      </div>

      <p class="text-xs font-bold text-slate-600 mb-2">Transaksi poin (terbaru)</p>
      <div class="rounded-xl border border-slate-100 overflow-hidden max-h-40 overflow-y-auto">
        <table class="w-full text-xs">
          ${data.transactions.length === 0
            ? `<tr><td class="text-slate-400 py-3 px-3">Belum ada transaksi.</td></tr>`
            : data.transactions
                .map(
                  (trx) =>
                    `<tr class="border-b border-slate-50 last:border-0"><td class="py-2 px-3 text-slate-500">${esc(trx.type)}</td><td class="py-2 px-2 font-bold ${trx.points >= 0 ? "text-emerald-600" : "text-rose-600"}">${trx.points >= 0 ? "+" : ""}${trx.points}</td><td class="py-2 px-2 text-slate-400">${esc(trx.amount ? `Rp${formatAngka(trx.amount)}` : "")}</td><td class="py-2 px-2 text-slate-400">${esc(trx.status)}</td><td class="py-2 px-2 text-slate-400 whitespace-nowrap">${esc(formatWaktu(trx.created_at))}</td></tr>`,
                )
                .join("")}
        </table>
      </div>`,
  });

  (modal.querySelector("#ud-save-status") as HTMLButtonElement).addEventListener("click", async () => {
    const btn = modal.querySelector("#ud-save-status") as HTMLButtonElement;
    const status = (modal.querySelector("#ud-status") as HTMLSelectElement).value;
    const reason = (modal.querySelector("#ud-reason") as HTMLInputElement).value.trim();
    const err = modal.querySelector("#ud-err") as HTMLElement;
    err.classList.add("hidden");
    if (!reason) {
      err.textContent = "Alasan wajib diisi.";
      err.classList.remove("hidden");
      return;
    }
    try {
      await adminApi("users.php", {
        method: "POST",
        body: { action: "set_status", user_id: id, status, reason },
      });
      showToast(`Status akun diubah ke ${status}, tercatat di audit log.`);
      closeModal();
      void loadUsers();
    } catch (e) {
      err.textContent = (e as Error).message;
      err.classList.remove("hidden");
    }
    void btn;
  });
}

/** Nonaktifkan / aktifkan kembali akun (dialog konfirmasi + alasan wajib). */
async function toggleStatus(id: number): Promise<void> {
  const row = state.data?.users.find((u) => u.id === id);
  if (!row) return;
  const toInactive = row.status === "active";

  const { confirmed, reason } = await confirmDialog({
    title: toInactive ? "Nonaktifkan akun?" : "Aktifkan kembali akun?",
    message: `<b>${esc(row.first_name)} ${esc(row.last_name)}</b> (${esc(row.email)}) — ${toInactive ? "account akan diblokir dari login & generate." : "account dapat login kembali."}`,
    confirmText: toInactive ? "Nonaktifkan" : "Aktifkan",
    danger: toInactive,
    requireReason: true,
  });
  if (!confirmed) return;

  try {
    await adminApi("users.php", {
      method: "POST",
      body: {
        action: "set_status",
        user_id: id,
        status: toInactive ? "suspended" : "active",
        reason,
      },
    });
    showToast(`Status akun diubah, tercatat di audit log.`);
    void loadUsers();
  } catch (e) {
    showToast((e as Error).message, "error");
  }
}

// ── Detail dokumen (payload read-only) ───────────────────────────────

async function openDocDetail(id: number): Promise<void> {
  let data: { document: DocRow & { owner_status: string; owner_email: string }; payload: Record<string, unknown> | null; layout: string | null; draft: { payload: unknown; updated_at: string } | null };
  try {
    data = await adminApi("documents.php", { query: { id } });
  } catch (e) {
    showToast((e as Error).message, "error");
    return;
  }
  const doc = data.document;

  openModal({
    title: `${doc.doc_code} — ${doc.title}`,
    subtitle: `${doc.owner} (${doc.owner_email}) · ${doc.type} · ${doc.status} · dibuat ${formatWaktu(doc.created_at)}`,
    wide: true,
    body: `
      <div class="grid sm:grid-cols-3 gap-3 text-center text-xs mb-5">
        <div class="rounded-xl bg-slate-50 border border-slate-100 p-3"><p class="text-slate-400 font-bold text-[10px]">JENIS</p><p class="font-bold text-slate-800 mt-1">${esc(doc.type)}</p></div>
        <div class="rounded-xl bg-slate-50 border border-slate-100 p-3"><p class="text-slate-400 font-bold text-[10px]">LAYOUT</p><p class="font-bold text-slate-800 mt-1">${esc(data.layout ?? "—")}</p></div>
        <div class="rounded-xl bg-slate-50 border border-slate-100 p-3"><p class="text-slate-400 font-bold text-[10px]">DRAFT AKTIF</p><p class="font-bold text-slate-800 mt-1">${data.draft ? "Ada" : "Tidak ada"}</p></div>
      </div>
      <p class="text-xs font-bold text-slate-600 mb-2">Payload form CV (read-only)</p>
      <pre class="rounded-xl bg-slate-900 text-emerald-200 text-[11px] leading-relaxed p-4 overflow-auto max-h-72 font-mono">${esc(JSON.stringify(data.payload ?? {}, null, 2))}</pre>
      ${data.draft ? `<p class="text-xs text-slate-400 mt-2">Draft terakhir diperbarui ${esc(formatWaktu(data.draft.updated_at))}.</p>` : ""}`,
  });
}

// ── Util ─────────────────────────────────────────────────────────────

function pager(page: number, total: number, prefix: string): string {
  const from = Math.max(1, page - 2);
  const to = Math.min(total, from + 4);
  const nums: number[] = [];
  for (let i = from; i <= to; i++) nums.push(i);

  return `
    <button data-page="${Math.max(1, page - 1)}" ${page === 1 ? "disabled" : ""} class="w-8 h-8 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center">&lt;</button>
    ${nums
      .map(
        (n) =>
          `<button data-page="${n}" class="w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${n === page ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}">${n}</button>`,
      )
      .join("")}
    <button data-page="${Math.min(total, page + 1)}" ${page >= total ? "disabled" : ""} class="w-8 h-8 rounded-full bg-slate-900 text-white disabled:opacity-40 flex items-center justify-center">&gt;</button>`;
}

function debounce(fn: () => void, ms: number): () => void {
  let t: number | undefined;
  return () => {
    window.clearTimeout(t);
    t = window.setTimeout(fn, ms);
  };
}
