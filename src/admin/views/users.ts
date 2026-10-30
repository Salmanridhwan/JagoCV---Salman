/**
 * Menu 3 — Manajemen Pengguna & Dokumen.
 *
 * Struktur halaman (tanpa modal untuk detail user):
 *   list   → 4 kartu metrik + satu tabel terpadu + Export CSV
 *   detail → profil user + tab "Dokumen" / "Transaksi" (riwayat per user)
 *
 * Kolom tabel: PENGGUNA · STATUS AKUN · SALDO POIN AI · TOTAL DOKUMEN · AKSI
 * AKSI hanya 2 tombol: toggle status akun + Detail User.
 *
 * Sinkronisasi state: setiap perubahan status akun memperbarui baris tabel,
 * counter kartu "AKUN DITANGGUHKAN", dan chip filter — tanpa reload halaman.
 * Angka kartu diambil ulang dari server (`only=summary`) agar selalu akurat
 * terhadap seluruh database, bukan hanya baris di halaman aktif.
 */
import { adminApi, adminDownload } from "../api";
import { formatAngka, formatTanggal, formatWaktu, initials, usrId } from "../format";
import {
  esc,
  initialAvatar,
  showToast,
  confirmDialog,
  skeletonRows,
  setButtonLoading,
} from "../ui";

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
  last_activity: string;
  docs_count: number;
  has_topup: boolean;
}

interface Summary {
  total: number;
  active: number;
  active_pct: number;
  suspended: number;
  docs_total: number;
}

interface UsersPage {
  summary: Summary;
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
  created_at: string;
}

interface TrxRow {
  id: number;
  type: string;
  points: number;
  description: string | null;
  amount: number | null;
  status: string;
  created_at: string;
}

interface UserDetail {
  user: UserRow & { role: string | null; is_admin: boolean; docs_count: number };
  documents: DocRow[];
  doc_types: Record<string, number>;
  transactions: TrxRow[];
}

const el = (): HTMLElement => document.getElementById("view-users") as HTMLElement;

const state = {
  page: "list" as "list" | "detail",
  detailId: 0,
  q: "",
  status: "" as "" | "active" | "inactive",
  pageNo: 1,
  data: null as UsersPage | null,
  selected: new Set<number>(),
  busy: false,
  detail: null as UserDetail | null,
  detailTab: "dokumen" as "dokumen" | "transaksi",
};

let mounted = false;

export function mountUsersView(): void {
  bindAvatarFallback(el());

  // Listener pencarian global hanya dipasang sekali (view di-mount berulang
  // setiap menu dibuka).
  if (!mounted) {
    mounted = true;
    window.addEventListener("admin-search", ((e: CustomEvent) => {
      const q = String(e.detail || "").trim();
      if (q === state.q) return;
      state.q = q;
      state.pageNo = 1;
      if (state.page === "list") void loadUsers();
    }) as EventListener);
  }

  if (state.page === "detail" && state.detailId > 0) {
    void loadDetail(state.detailId);
    return;
  }
  state.page = "list";
  void loadUsers();
}

// ── Data ─────────────────────────────────────────────────────────────

async function loadUsers(): Promise<void> {
  const host = el();
  if (!state.data) {
    host.innerHTML = `<div class="animate-pulse">
      <div class="h-8 w-72 max-w-full rounded-lg bg-slate-200 mb-6"></div>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        ${Array.from({ length: 4 }).map(() => `<div class="h-32 rounded-2xl bg-slate-200/70"></div>`).join("")}
      </div>
      <div class="mt-6 rounded-2xl bg-white border border-slate-100 p-6">${skeletonRows(5)}</div>
    </div>`;
  }

  try {
    state.data = await adminApi<UsersPage>("users.php", {
      query: {
        q: state.q,
        status: state.status || undefined,
        page: state.pageNo,
        per_page: 8,
      },
    });
    // Baris yang tidak lagi ada di halaman ini otomatis keluar dari pilihan.
    const visible = new Set(state.data.users.map((u) => u.id));
    state.selected.forEach((id) => {
      if (!visible.has(id)) state.selected.delete(id);
    });
    renderList();
  } catch (e) {
    host.innerHTML = `<div class="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">${esc(
      (e as Error).message,
    )}</div>`;
  }
}

/** Segarkan hanya angka kartu metrik (tanpa menyentuh tabel). */
async function refreshSummary(): Promise<void> {
  try {
    const data = await adminApi<{ summary: Summary }>("users.php", {
      query: { only: "summary" },
    });
    if (state.data) state.data.summary = data.summary;
    paintSummary(data.summary);
  } catch {
    /* ringkasan gagal dimuat — kartu tetap menampilkan angka sebelumnya */
  }
}

async function loadDetail(id: number): Promise<void> {
  const host = el();
  if (!state.detail || state.detail.user.id !== id) {
    host.innerHTML = `<div class="rounded-2xl bg-white border border-slate-100 p-6">${skeletonRows(6)}</div>`;
  }
  try {
    state.detail = await adminApi<UserDetail>("users.php", { query: { id } });
    renderDetail();
  } catch (e) {
    host.innerHTML = `<div class="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">${esc(
      (e as Error).message,
    )}</div>
      <button data-back class="mt-3 rounded-full bg-slate-900 text-white text-sm font-semibold px-5 py-2.5">Kembali</button>`;
    host.querySelector("[data-back]")?.addEventListener("click", gotoList);
  }
}

function gotoList(): void {
  state.page = "list";
  state.detailId = 0;
  state.detail = null;
  window.scrollTo({ top: 0, behavior: "auto" });
  void loadUsers();
}

function gotoDetail(id: number): void {
  state.page = "detail";
  state.detailId = id;
  state.detail = null;
  window.scrollTo({ top: 0, behavior: "auto" });
  void loadDetail(id);
}

// ── Halaman: daftar ──────────────────────────────────────────────────

function renderList(): void {
  const host = el();
  const d = state.data;
  if (!d) return;

  host.innerHTML = `
    <div class="mb-6 flex flex-col gap-3 sm:mb-7">
      <div class="flex flex-wrap items-center gap-3">
        <span class="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-[11px] font-bold">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span> LIVE WORKSPACE MODE
        </span>
        <span class="text-xs text-slate-400">Data tersinkron otomatis</span>
      </div>
      <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">Manajemen Pengguna &amp; Dokumen</h1>
      <p class="text-sm text-slate-500 max-w-xl">Kelola akun pengguna terdaftar, pantau saldo poin AI, dan audit riwayat dokumen yang pernah dibuat.</p>
    </div>

    <div id="u-summary" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      ${summaryCards(d.summary)}
    </div>

    <!-- Toolbar: cari + filter status + export -->
    <div class="mt-5 rounded-2xl bg-white border border-slate-100 p-3.5 sm:p-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div class="relative flex-1 min-w-0">
          <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round"><path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"></path></svg>
          <input id="u-search" type="text" placeholder="Cari nama, email, atau User ID…" value="${esc(state.q)}"
                 class="w-full rounded-full bg-slate-100 border border-transparent pl-10 pr-4 py-2 text-sm outline-none focus:border-slate-300 focus:bg-white transition-colors">
        </div>
        <div class="flex gap-2 overflow-x-auto table-scroll -mx-1 px-1 pb-1 lg:overflow-visible lg:pb-0 shrink-0">
          ${statusChip("", "Semua Akun")}
          ${statusChip("active", "Aktif")}
          ${statusChip("inactive", "Ditangguhkan")}
        </div>
        <button id="u-export" class="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 text-white text-xs font-bold px-4 py-2.5 hover:bg-slate-800 transition-colors shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"></path></svg>
          <span id="u-export-label">Export CSV</span>
        </button>
      </div>
    </div>

    <div class="mt-4 rounded-2xl bg-white border border-slate-100">
      <div class="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 pt-5 pb-4">
        <div class="flex items-center gap-3 min-w-0">
          <h3 class="font-extrabold text-slate-900">Daftar Pengguna Aktif &amp; Terdaftar</h3>
          <span class="rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold px-2.5 py-1 shrink-0">${formatAngka(d.total)} baris</span>
        </div>
        <p class="text-[11px] text-slate-400 flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <span class="min-w-0">Kredensial tidak pernah diekspor</span>
        </p>
      </div>

      <!-- Tabel (md+) -->
      <div class="hidden md:block overflow-x-auto px-2 pb-2">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-[11px] tracking-wide text-slate-400 border-b border-slate-100">
              <th class="pl-4 font-bold py-3 text-left w-10">
                <input id="u-check-all" type="checkbox" class="u-check rounded cursor-pointer" aria-label="Pilih semua baris di halaman ini">
              </th>
              <th class="text-left font-bold py-3 px-2 w-[34%]">PENGGUNA</th>
              <th class="text-left font-bold py-3 px-2 w-[15%] whitespace-nowrap">STATUS AKUN</th>
              <th class="text-left font-bold py-3 px-2 w-[15%] whitespace-nowrap">SALDO POIN AI</th>
              <th class="text-left font-bold py-3 px-2 w-[14%] whitespace-nowrap">TOTAL DOKUMEN</th>
              <th class="text-right font-bold py-3 px-2 pr-4 w-[22%]">AKSI</th>
            </tr>
          </thead>
          <tbody id="u-tbody">${rowsHtml(d.users)}</tbody>
        </table>
      </div>

      <!-- Kartu (mobile) -->
      <div id="u-cards" class="md:hidden px-3 pb-3 space-y-2.5">${cardsHtml(d.users)}</div>

      <div class="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-4 border-t border-slate-50">
        <p id="u-count" class="text-xs text-slate-400">${countLabel(d)}</p>
        <div id="u-pager" class="flex items-center gap-1">${pager(d.page, d.total_pages)}</div>
      </div>
    </div>`;

  bindList();
  syncSelectionUI();
  // Avatar yang gagal dimuat (mis. URL Google kedaluwarsa) diganti inisial.
  el().querySelectorAll<HTMLImageElement>("img[data-avatar]").forEach((img) => {
    if (img.complete && img.naturalWidth === 0) img.dispatchEvent(new Event("error"));
  });
}

function summaryCards(s: Summary): string {
  const card = (id: string, label: string, value: number, caption: string, skin: string, icon: string): string => `
    <div class="rounded-2xl ${skin} p-5 min-w-0">
      <p class="text-[11px] font-bold tracking-wide flex items-center gap-1.5">
        ${icon}
        <span class="truncate">${esc(label)}</span>
      </p>
      <p id="${id}" class="mt-2 text-3xl sm:text-4xl font-extrabold tabular-nums">${formatAngka(value)}</p>
      <p class="mt-2 text-[11px] leading-snug">${caption}</p>
    </div>`;

  return [
    card(
      "u-c-total",
      "TOTAL PENGGUNA",
      s.total,
      "Terdaftar di master database",
      "bg-[#d3f3e5] text-emerald-950",
      `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>`,
    ),
    card(
      "u-c-active",
      "PENGGUNA AKTIF",
      s.active,
      `${(s.active_pct ?? 0).toLocaleString("id-ID")}% rasio retensi sistem`,
      "bg-slate-900 text-white",
      `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>`,
    ),
    card(
      "u-c-docs",
      "DOKUMEN DIGENERATE",
      s.docs_total,
      "CV, Resume &amp; Portfolio Web",
      "bg-white border border-slate-200 text-slate-900",
      `<span class="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0"></span>`,
    ),
    card(
      "u-c-suspended",
      "AKUN DITANGGUHKAN",
      s.suspended,
      "Status nonaktif / banned",
      "bg-[#fbd9dd] text-rose-950",
      `<svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path></svg>`,
    ),
  ].join("");
}

/** Perbarui angka kartu di tempat (tanpa render ulang seluruh halaman). */
function paintSummary(s: Summary): void {
  const set = (id: string, val: number): void => {
    const node = document.getElementById(id);
    if (node) node.textContent = formatAngka(val);
  };
  set("u-c-total", s.total);
  set("u-c-active", s.active);
  set("u-c-docs", s.docs_total);
  set("u-c-suspended", s.suspended);

  // Caption rasio retensi ikut menyesuaikan.
  const activeCard = document.getElementById("u-c-active")?.parentElement;
  const caption = activeCard?.querySelector("p:last-child");
  if (caption) {
    caption.textContent = `${(s.active_pct ?? 0).toLocaleString("id-ID")}% rasio retensi sistem`;
  }
}

function statusChip(id: "" | "active" | "inactive", label: string): string {
  const on = state.status === id;
  return `<button data-status="${id}" class="px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
    on ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
  }">${esc(label)}</button>`;
}

/** Avatar dengan fallback inisial bila URL gambar gagal dimuat. */
function avatarHtml(u: UserRow, cls: string, fallbackColor = "bg-emerald-100 text-emerald-700"): string {
  const name = `${u.first_name} ${u.last_name}`.trim() || u.email;
  if (!u.avatar_url) return initialAvatar(name, `${fallbackColor} ${cls}`);
  // Fallback ditangani listener `error` (lihat bindAvatarFallback) supaya tidak
  // perlu escaping kutip bertingkat di atribut onerror.
  return `<img src="${esc(u.avatar_url)}" data-avatar class="${cls} rounded-full object-cover shrink-0"
            data-fallback-class="${esc(`${cls} rounded-full ${fallbackColor} flex items-center justify-center font-bold shrink-0`)}"
            data-fallback-text="${esc(initials(name))}" alt="">`;
}

/**
 * Ganti avatar yang gagal dimuat dengan lingkaran inisial. Listener dipasang
 * sekali per host dan memakai fase capture karena event `error` pada <img>
 * tidak bubble.
 */
let avatarBound = false;
function bindAvatarFallback(host: HTMLElement): void {
  if (avatarBound) return;
  avatarBound = true;
  host.addEventListener(
    "error",
    (e) => {
      const img = e.target as HTMLImageElement;
      if (!img || !img.dataset || !img.dataset.avatar) return;
      const div = document.createElement("div");
      div.className = img.dataset.fallbackClass || "rounded-full bg-slate-200";
      div.textContent = img.dataset.fallbackText || "?";
      img.replaceWith(div);
    },
    true,
  );
}

function statusBadge(s: UserRow["status"]): string {
  if (s === "active") {
    return `<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif</span>`;
  }
  if (s === "suspended") {
    return `<span class="inline-flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-700 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Ditangguhkan</span>`;
  }
  return `<span class="inline-flex items-center gap-1.5 rounded-full bg-slate-200 text-slate-700 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Banned</span>`;
}

/** Dua tombol aksi: toggle status (ikon daya) + detail user (ikon mata). */
function actionsHtml(u: UserRow): string {
  const isActive = u.status === "active";
  return `
    <div class="flex items-center justify-end gap-1.5">
      <button data-toggle="${u.id}" title="${isActive ? "Nonaktifkan akun" : "Aktifkan kembali akun"}"
              aria-label="${isActive ? "Nonaktifkan akun" : "Aktifkan kembali akun"}"
              class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors whitespace-nowrap ${
                isActive
                  ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                  : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              }">
        ${
          isActive
            ? `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 11-12.73 0"></path><path d="M12 2v10"></path></svg> Nonaktifkan`
            : `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 11-12.73 0"></path><path d="M12 2v10"></path></svg> Aktifkan`
        }
      </button>
      <button data-detail="${u.id}" title="Detail user" aria-label="Detail user ${esc(u.first_name)}"
              class="inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-white px-3 py-1.5 text-[11px] font-bold hover:bg-slate-800 transition-colors whitespace-nowrap">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        Detail
      </button>
    </div>`;
}

function rowsHtml(users: UserRow[]): string {
  if (users.length === 0) {
    return `<tr><td colspan="6" class="text-center text-slate-400 py-12">Tidak ada pengguna yang cocok dengan filter.</td></tr>`;
  }
  return users
    .map(
      (u) => `
    <tr class="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors" data-row="${u.id}">
      <td class="pl-4 py-3">
        <input type="checkbox" class="u-check rounded cursor-pointer" value="${u.id}" data-check="${u.id}" aria-label="Pilih ${esc(u.first_name)}">
      </td>
      <td class="py-3 px-2 min-w-0">
        <div class="flex items-center gap-3 min-w-0">
          ${avatarHtml(u, "w-9 h-9 text-xs")}
          <div class="leading-tight min-w-0">
            <p class="font-bold text-slate-800 flex items-center gap-2 flex-wrap">
              <span class="truncate max-w-[16rem]">${esc(`${u.first_name} ${u.last_name}`.trim() || u.email)}</span>
              <span class="rounded bg-slate-100 text-slate-400 text-[10px] font-bold px-1.5 py-0.5 shrink-0">${esc(usrId(u.id))}</span>
            </p>
            <p class="text-[11px] text-slate-400 truncate max-w-[18rem]">${esc(u.email)}</p>
          </div>
        </div>
      </td>
      <td class="py-3 px-2" data-cell="status">${statusBadge(u.status)}</td>
      <td class="py-3 px-2 font-bold text-slate-700 whitespace-nowrap">
        <span class="inline-flex items-center gap-1.5"><span class="w-4 h-4 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[9px] font-extrabold">●</span>${formatAngka(u.points)} Poin</span>
      </td>
      <td class="py-3 px-2 text-slate-500 whitespace-nowrap">${formatAngka(u.docs_count)} Dokumen</td>
      <td class="py-3 px-2 pr-4" data-cell="actions">${actionsHtml(u)}</td>
    </tr>`,
    )
    .join("");
}

function cardsHtml(users: UserRow[]): string {
  if (users.length === 0) {
    return `<div class="rounded-2xl border-2 border-dashed border-slate-200 py-10 px-4 text-center text-sm text-slate-400">Tidak ada pengguna yang cocok dengan filter.</div>`;
  }
  return users
    .map(
      (u) => `
    <article class="rounded-2xl border border-slate-100 bg-white p-3.5" data-card="${u.id}">
      <div class="flex items-start gap-3 min-w-0">
        <input type="checkbox" class="u-check rounded cursor-pointer mt-1 shrink-0" value="${u.id}" data-check="${u.id}" aria-label="Pilih ${esc(u.first_name)}">
        ${avatarHtml(u, "w-10 h-10 text-sm")}
        <div class="min-w-0 flex-1">
          <p class="font-bold text-slate-800 text-sm leading-tight truncate">${esc(`${u.first_name} ${u.last_name}`.trim() || u.email)}</p>
          <p class="text-[11px] text-slate-400 truncate mt-0.5">${esc(u.email)}</p>
          <p class="text-[10px] font-bold text-slate-300 mt-0.5">${esc(usrId(u.id))}</p>
        </div>
        <div data-cell="status" class="shrink-0">${statusBadge(u.status)}</div>
      </div>

      <div class="mt-3 grid grid-cols-2 gap-2">
        <div class="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 min-w-0">
          <p class="text-[10px] font-bold text-slate-400 tracking-wide">SALDO POIN AI</p>
          <p class="text-sm font-bold text-slate-800 mt-0.5">${formatAngka(u.points)} Poin</p>
        </div>
        <div class="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 min-w-0">
          <p class="text-[10px] font-bold text-slate-400 tracking-wide">TOTAL DOKUMEN</p>
          <p class="text-sm font-bold text-slate-800 mt-0.5">${formatAngka(u.docs_count)} Dokumen</p>
        </div>
      </div>

      <div class="mt-2.5 flex items-center justify-between gap-2">
        <p class="text-[10px] text-slate-400 truncate">Aktif ${esc(formatWaktu(u.last_activity))}</p>
        <div data-cell="actions">${actionsHtml(u)}</div>
      </div>
    </article>`,
    )
    .join("");
}

function countLabel(d: UsersPage): string {
  const from = (d.page - 1) * d.per_page + 1;
  const to = Math.min(d.total, d.page * d.per_page);
  if (d.total === 0) return "Tidak ada baris";
  return `Menampilkan ${from}–${to} dari ${formatAngka(d.total)} pengguna`;
}

// ── Halaman: detail ──────────────────────────────────────────────────

function renderDetail(): void {
  const host = el();
  const d = state.detail;
  if (!d) return;
  const u = d.user;
  const name = `${u.first_name} ${u.last_name}`.trim() || u.email;
  const isActive = u.status === "active";

  const docTypes = Object.entries(d.doc_types);
  const typeOrder = ["ATS CV", "Visual Resume", "Web Portfolio", "Cover Letter"];
  const orderedTypes = [
    ...typeOrder.filter((t) => d.doc_types[t] !== undefined).map((t) => [t, d.doc_types[t]] as [string, number]),
    ...docTypes.filter(([t]) => !typeOrder.includes(t)),
  ];

  host.innerHTML = `
    <div class="mb-5 flex flex-col gap-3 sm:mb-6">
      <button data-back class="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors self-start">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
        Kembali ke Manajemen Pengguna
      </button>

      <div class="rounded-2xl bg-white border border-slate-100 p-4 sm:p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex items-start gap-4 min-w-0">
            ${u.avatar_url
              ? `<img src="${esc(u.avatar_url)}" class="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover shrink-0" alt="">`
              : initialAvatar(name, "bg-slate-900 text-white w-14 h-14 sm:w-16 sm:h-16 text-lg")}
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight break-words">${esc(name)}</h1>
                ${statusBadge(u.status)}
              </div>
              <p class="text-sm text-slate-500 mt-1 break-all">${esc(u.email)}</p>
              <div class="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                <span class="rounded bg-slate-100 text-slate-500 px-2 py-0.5">${esc(usrId(u.id))}</span>
                <span class="rounded bg-sky-100 text-sky-700 px-2 py-0.5 uppercase">${esc(u.auth_provider)}</span>
                <span class="rounded bg-violet-100 text-violet-700 px-2 py-0.5 uppercase">${esc(u.plan)}</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2 sm:flex-row sm:items-center shrink-0">
            <button data-toggle="${u.id}" class="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${
              isActive
                ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            }">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 11-12.73 0"></path><path d="M12 2v10"></path></svg>
              ${isActive ? "Nonaktifkan Akun" : "Aktifkan Akun"}
            </button>
          </div>
        </div>

        <dl class="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          ${tile("SALDO POIN AI", `${formatAngka(u.points)} Poin`)}
          ${tile("TOTAL DOKUMEN", `${formatAngka(u.docs_count)} Dokumen`)}
          ${tile("TERDAFTAR", formatTanggal(u.created_at))}
          ${tile("TERAKHIR AKTIVITAS", formatWaktu(u.last_activity))}
        </dl>
      </div>
    </div>

    <!-- Rekap dokumen per jenis -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
      ${orderedTypes.length === 0
        ? `<div class="col-span-2 lg:col-span-4 rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">Pengguna ini belum pernah membuat dokumen.</div>`
        : orderedTypes
            .map(
              ([type, count]) => `
          <div class="rounded-2xl bg-white border border-slate-100 px-4 py-3 min-w-0">
            <p class="text-[10px] font-bold text-slate-400 tracking-wide truncate">${esc(type)}</p>
            <p class="text-xl font-extrabold text-slate-900 mt-0.5">${formatAngka(count)}</p>
          </div>`,
            )
            .join("")}
    </div>

    <!-- Tab riwayat -->
    <div class="rounded-2xl bg-white border border-slate-100">
      <div class="flex gap-2 px-3 sm:px-5 pt-4 pb-3 border-b border-slate-50 overflow-x-auto table-scroll">
        ${tabBtn("dokumen", `Riwayat Dokumen (${formatAngka(d.documents.length)})`)}
        ${tabBtn("transaksi", `Transaksi Poin (${formatAngka(d.transactions.length)})`)}
      </div>
      <div id="ud-body" class="p-3 sm:p-5">${state.detailTab === "dokumen" ? docHistoryHtml(d.documents) : trxHistoryHtml(d.transactions)}</div>
    </div>`;

  host.querySelector("[data-back]")?.addEventListener("click", gotoList);
  host.querySelectorAll<HTMLButtonElement>("[data-dtab]").forEach((b) =>
    b.addEventListener("click", () => {
      state.detailTab = b.dataset.dtab as typeof state.detailTab;
      renderDetail();
    }),
  );
  host.querySelectorAll<HTMLButtonElement>("[data-toggle]").forEach((b) =>
    b.addEventListener("click", () => void toggleStatus(Number(b.dataset.toggle))),
  );
}

function tile(label: string, value: string): string {
  return `<div class="min-w-0 rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5">
      <dt class="text-[10px] font-bold tracking-wide text-slate-400 truncate">${esc(label)}</dt>
      <dd class="text-sm font-bold text-slate-800 mt-0.5 break-words">${esc(value)}</dd>
    </div>`;
}

function tabBtn(id: "dokumen" | "transaksi", label: string): string {
  const on = state.detailTab === id;
  return `<button data-dtab="${id}" class="px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
    on ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
  }">${esc(label)}</button>`;
}

function docStatusBadge(s: string): string {
  if (s === "Selesai") {
    return `<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap">Selesai</span>`;
  }
  if (s === "Draf") {
    return `<span class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-700 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap">Draf</span>`;
  }
  return `<span class="inline-flex items-center gap-1.5 rounded-full bg-sky-100 text-sky-700 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap">Diterbitkan</span>`;
}

function docHistoryHtml(docs: DocRow[]): string {
  if (docs.length === 0) {
    return `<div class="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center">
        <p class="text-sm font-semibold text-slate-500">Belum ada dokumen.</p>
        <p class="text-xs text-slate-400 mt-1">Dokumen muncul setelah pengguna menyimpan CV, Resume, atau Portfolio.</p>
      </div>`;
  }
  return `
    <!-- Tabel (sm+) -->
    <div class="hidden sm:block overflow-x-auto -mx-1 px-1">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-[11px] tracking-wide text-slate-400 border-b border-slate-100">
            <th class="text-left font-bold py-2.5 px-2">KODE</th>
            <th class="text-left font-bold py-2.5 px-2">JUDUL</th>
            <th class="text-left font-bold py-2.5 px-2">JENIS</th>
            <th class="text-left font-bold py-2.5 px-2">STATUS</th>
            <th class="text-left font-bold py-2.5 px-2 whitespace-nowrap">DIBUAT</th>
          </tr>
        </thead>
        <tbody>
          ${docs
            .map(
              (doc) => `
            <tr class="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
              <td class="py-2.5 px-2 font-mono text-xs font-bold text-slate-600 whitespace-nowrap">${esc(doc.doc_code)}</td>
              <td class="py-2.5 px-2 font-semibold text-slate-800 max-w-[18rem] truncate" title="${esc(doc.title)}">${esc(doc.title)}</td>
              <td class="py-2.5 px-2 text-slate-500 whitespace-nowrap">${esc(doc.type)}</td>
              <td class="py-2.5 px-2">${docStatusBadge(doc.status)}</td>
              <td class="py-2.5 px-2 text-slate-400 whitespace-nowrap text-xs">${esc(formatWaktu(doc.created_at))}</td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <!-- Kartu (mobile) -->
    <div class="sm:hidden space-y-2.5">
      ${docs
        .map(
          (doc) => `
        <div class="rounded-xl border border-slate-100 p-3">
          <div class="flex items-start justify-between gap-2">
            <p class="font-bold text-slate-800 text-sm min-w-0 break-words">${esc(doc.title)}</p>
            ${docStatusBadge(doc.status)}
          </div>
          <p class="font-mono text-[11px] font-bold text-slate-400 mt-1">${esc(doc.doc_code)}</p>
          <div class="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-slate-400">
            <span class="truncate">${esc(doc.type)}</span>
            <span class="shrink-0">${esc(formatWaktu(doc.created_at))}</span>
          </div>
        </div>`,
        )
        .join("")}
    </div>`;
}

function trxHistoryHtml(trx: TrxRow[]): string {
  if (trx.length === 0) {
    return `<div class="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center">
        <p class="text-sm font-semibold text-slate-500">Belum ada transaksi poin.</p>
      </div>`;
  }
  return `
    <div class="space-y-2.5">
      ${trx
        .map(
          (t) => `
        <div class="rounded-xl border border-slate-100 p-3 flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="font-semibold text-slate-800 text-sm truncate">${esc(t.description || t.type)}</p>
            <p class="text-[11px] text-slate-400 mt-0.5">${esc(formatWaktu(t.created_at))} · ${esc(t.status)}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="font-bold text-sm ${t.points >= 0 ? "text-emerald-600" : "text-rose-600"}">${t.points >= 0 ? "+" : ""}${formatAngka(t.points)}</p>
            ${t.amount ? `<p class="text-[11px] text-slate-400">Rp${formatAngka(t.amount)}</p>` : ""}
          </div>
        </div>`,
        )
        .join("")}
    </div>`;
}

// ── Seleksi baris (checkbox) ─────────────────────────────────────────

/** Sinkronkan tampilan checkbox + label tombol export dengan `state.selected`. */
function syncSelectionUI(): void {
  const host = el();
  host.querySelectorAll<HTMLInputElement>("[data-check]").forEach((cb) => {
    cb.checked = state.selected.has(Number(cb.dataset.check));
  });

  const all = host.querySelector<HTMLInputElement>("#u-check-all");
  if (all) {
    const total = state.data?.users.length ?? 0;
    const picked = state.data?.users.filter((u) => state.selected.has(u.id)).length ?? 0;
    all.checked = total > 0 && picked === total;
    all.indeterminate = picked > 0 && picked < total;
    all.disabled = total === 0;
  }

  const label = host.querySelector("#u-export-label");
  if (label) {
    const n = state.selected.size;
    label.textContent = n > 0 ? `Export CSV (${n})` : "Export CSV";
  }
}

function bindList(): void {
  const host = el();

  host.querySelectorAll<HTMLButtonElement>("[data-status]").forEach((b) =>
    b.addEventListener("click", () => {
      state.status = (b.dataset.status ?? "") as typeof state.status;
      state.pageNo = 1;
      state.selected.clear();
      void loadUsers();
    }),
  );

  const search = host.querySelector("#u-search") as HTMLInputElement | null;
  search?.addEventListener(
    "input",
    debounce(() => {
      state.q = search.value.trim();
      state.pageNo = 1;
      state.selected.clear();
      void loadUsers();
    }, 350),
  );

  // Checkbox per baris: satu listener di container (delegasi) agar tetap
  // bekerja setelah tabel di-render ulang.
  host.querySelector("#u-tbody")?.addEventListener("change", (e) => {
    const cb = e.target as HTMLInputElement;
    if (!cb.dataset.check) return;
    const id = Number(cb.dataset.check);
    if (cb.checked) state.selected.add(id);
    else state.selected.delete(id);
    syncSelectionUI();
  });
  host.querySelector("#u-cards")?.addEventListener("change", (e) => {
    const cb = e.target as HTMLInputElement;
    if (!cb.dataset.check) return;
    const id = Number(cb.dataset.check);
    if (cb.checked) state.selected.add(id);
    else state.selected.delete(id);
    syncSelectionUI();
  });

  const all = host.querySelector<HTMLInputElement>("#u-check-all");
  all?.addEventListener("change", () => {
    const users = state.data?.users ?? [];
    if (all.checked) users.forEach((u) => state.selected.add(u.id));
    else users.forEach((u) => state.selected.delete(u.id));
    syncSelectionUI();
  });

  host.querySelector("#u-export")?.addEventListener("click", (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    const ids = [...state.selected];
    setButtonLoading(btn, true);
    void adminDownload(
      "users.php",
      {
        export: "csv",
        q: state.q,
        status: state.status || undefined,
        ids: ids.length > 0 ? ids.join(",") : undefined,
      },
      ids.length > 0 ? `jagocv-users-${ids.length}-terpilih.csv` : "jagocv-users.csv",
    )
      .then(() =>
        showToast(
          ids.length > 0
            ? `Ekspor ${ids.length} pengguna terpilih diunduh — dicatat di audit log.`
            : "Ekspor CSV pengguna diunduh — dicatat di audit log.",
        ),
      )
      .catch((err: Error) => showToast(err.message, "error"))
      .finally(() => setButtonLoading(btn, false));
  });

  host.querySelectorAll<HTMLButtonElement>("#u-pager [data-page]").forEach((b) =>
    b.addEventListener("click", () => {
      state.pageNo = Number(b.dataset.page);
      state.selected.clear();
      void loadUsers();
    }),
  );

  // Delegasi untuk tombol aksi (tabel & kartu mobile).
  host.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-detail], [data-toggle]");
    if (!target) return;
    if (target.dataset.detail) gotoDetail(Number(target.dataset.detail));
    else if (target.dataset.toggle) void toggleStatus(Number(target.dataset.toggle));
  });
}

// ── Aksi: ubah status akun ───────────────────────────────────────────

/**
 * Nonaktifkan / aktifkan akun. Setelah sukses, baris tabel diperbarui di
 * tempat (badge + tombol), lalu counter "AKUN DITANGGUHKAN" diambil ulang
 * dari server — tanpa reload halaman dan tanpa kehilangan posisi scroll.
 */
async function toggleStatus(id: number): Promise<void> {
  const row = state.data?.users.find((u) => u.id === id) ?? (state.detail?.user.id === id ? state.detail.user : undefined);
  if (!row) return;
  const toInactive = row.status === "active";
  const name = `${row.first_name} ${row.last_name}`.trim() || row.email;

  const { confirmed, reason } = await confirmDialog({
    title: toInactive ? "Nonaktifkan akun?" : "Aktifkan kembali akun?",
    message: `<b>${esc(name)}</b> (${esc(row.email)}) — ${
      toInactive
        ? "akun akan diblokir dari login &amp; generate dokumen."
        : "akun dapat login dan membuat dokumen kembali."
    }`,
    confirmText: toInactive ? "Nonaktifkan" : "Aktifkan",
    danger: toInactive,
    requireReason: true,
  });
  if (!confirmed) return;

  const newStatus: UserRow["status"] = toInactive ? "suspended" : "active";

  try {
    await adminApi("users.php", {
      method: "POST",
      body: { action: "set_status", user_id: id, status: newStatus, reason },
    });

    // 1) Perbarui state lokal agar UI konsisten seketika.
    if (state.data) {
      const target = state.data.users.find((u) => u.id === id);
      if (target) target.status = newStatus;
      // Sesuaikan counter secara optimistis; angka final menyusul dari server.
      if (toInactive) {
        state.data.summary.suspended += 1;
        state.data.summary.active = Math.max(0, state.data.summary.active - 1);
      } else {
        state.data.summary.suspended = Math.max(0, state.data.summary.suspended - 1);
        state.data.summary.active += 1;
      }
      state.data.summary.active_pct =
        state.data.summary.total > 0
          ? Math.round((state.data.summary.active / state.data.summary.total) * 1000) / 10
          : 0;
      paintSummary(state.data.summary);
    }

    // 2) Perbarui baris di tempat (badge status + tombol aksi).
    if (state.page === "list") repaintRow(id, newStatus);
    else if (state.detail?.user.id === id) {
      state.detail.user.status = newStatus;
      renderDetail();
    }

    // 3) Angka kartu & tabel disegarkan dari server (sumber kebenaran).
    await refreshSummary();
    if (state.page === "list" && state.status !== "") {
      // Filter "Aktif"/"Ditangguhkan" aktif → daftar berubah, muat ulang.
      await loadUsers();
    }

    showToast(
      toInactive ? "Akun dinonaktifkan, tercatat di audit log." : "Akun diaktifkan kembali, tercatat di audit log.",
    );
  } catch (e) {
    showToast((e as Error).message, "error");
  }
}

/** Ganti badge status + tombol aksi pada satu baris/kartu tanpa render ulang. */
function repaintRow(id: number, status: UserRow["status"]): void {
  const host = el();
  const row = state.data?.users.find((u) => u.id === id);
  if (!row) return;
  row.status = status;

  const nodes = host.querySelectorAll<HTMLElement>(`[data-row="${id}"], [data-card="${id}"]`);
  nodes.forEach((node) => {
    const statusCell = node.querySelector<HTMLElement>('[data-cell="status"]');
    if (statusCell) statusCell.innerHTML = statusBadge(status);
    const actionCell = node.querySelector<HTMLElement>('[data-cell="actions"]');
    if (actionCell) actionCell.innerHTML = actionsHtml(row);
  });
}

// ── Util ─────────────────────────────────────────────────────────────

function pager(page: number, total: number): string {
  if (total <= 1) return "";
  const from = Math.max(1, page - 2);
  const to = Math.min(total, from + 4);
  const nums: number[] = [];
  for (let i = from; i <= to; i++) nums.push(i);

  return `
    <button data-page="${Math.max(1, page - 1)}" ${page === 1 ? "disabled" : ""} class="w-8 h-8 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center">&lt;</button>
    ${nums
      .map(
        (n) =>
          `<button data-page="${n}" class="w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${
            n === page ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
          }">${n}</button>`,
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
