/**
 * Menu "TRANSAKSI & KOMERSIAL → Monitoring Transaksi".
 *
 * UI dikunci ke desain patokan "Monitoring Transaksi - JagoCV Admin.png":
 * header + chip status webhook + judul, 3 kartu KPI (mint / pink / navy),
 * baris filter (status, periode, metode, jenis, pencarian), tabel 7 kolom
 * (tanpa kolom checkbox — sesuai patokan), dan footer paginasi.
 *
 * Sumber data: /backend/admin/transactions.php (tabel `point_transactions`).
 * Semua angka & baris berasal dari DB — tidak ada mockup yang dipaksakan.
 *
 * F7 (gateway pembayaran belum terpasang): endpoint TIDAK menyediakan aksi
 * "tandai sukses". Admin hanya bisa mem-void transaksi pending; klaim
 * pembayaran berhasil hanya boleh datang dari webhook gateway nyata.
 */
import { adminApi, adminDownload } from "../api";
import { formatAngka, formatRupiah, formatTanggal, formatWaktu } from "../format";
import { esc, initialAvatar, showToast, openModal, closeModal, confirmDialog, skeletonRows } from "../ui";

const el = (): HTMLElement => document.getElementById("view-transactions") as HTMLElement;

type UiStatus = "success" | "pending" | "expired" | "failed";

interface TrxRow {
  id: number;
  trx_code: string;
  payment_ref: string | null;
  type: string;
  type_label: string;
  package_code: string | null;
  package_name: string | null;
  points: number;
  amount: number | null;
  method: string;
  method_icon: "qr" | "bank";
  status: UiStatus;
  status_label: string;
  expires_at: string | null;
  created_at: string;
  user: { id: number; first_name: string; last_name: string; email: string; avatar_url: string | null };
}

interface TransactionsPage {
  summary: {
    successful_revenue: number;
    total_success: number;
    total_pending: number;
    total_expired: number;
    total_failed: number;
    total_problem: number;
  };
  filters: {
    methods: { code: string; label: string; total: number }[];
    types: { code: string; label: string; total: number }[];
  };
  transactions: TrxRow[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

interface TrxDetail {
  transaction: {
    id: number;
    trx_code: string;
    payment_ref: string | null;
    type: string;
    type_label: string;
    package_code: string | null;
    package_name: string | null;
    description: string;
    points: number;
    amount: number | null;
    method: string;
    method_code: string | null;
    method_icon: "qr" | "bank";
    status: UiStatus;
    status_label: string;
    stored_status: string;
    expires_at: string | null;
    created_at: string;
    can_void: boolean;
  };
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
    points: number;
    plan: string;
    status: string;
  };
  history: {
    id: number;
    trx_code: string;
    type: string;
    type_label: string;
    points: number;
    amount: number | null;
    method: string;
    status: string;
    created_at: string;
  }[];
}

const PER_PAGE = 5;

const state = {
  q: "",
  status: "all" as "all" | UiStatus,
  method: "all",
  type: "all",
  period: "all" as "all" | "today" | "7d" | "30d" | "month",
  page: 1,
  data: null as TransactionsPage | null,
  loading: false,
};

// Polling 30 detik — konsisten dengan view admin lain (hanya saat view aktif).
let pollTimer: number | undefined;
let loadToken = 0;
let outsideClickBound = false;
let searchListenerBound = false;

export function mountTransactionsView(): void {
  // Dipanggil ulang setiap menu diklik; listener dipasang sekali saja agar
  // tidak menumpuk (tiap penumpukan = satu pemuatan data tambahan).
  if (!searchListenerBound) {
    searchListenerBound = true;
    // Pencarian global dari topbar hanya berlaku saat halaman ini tampil.
    window.addEventListener("admin-search", ((e: CustomEvent) => {
      if (el().classList.contains("hidden")) return;
      state.q = String(e.detail || "").trim();
      state.page = 1;
      void loadTransactions();
    }) as EventListener);
  }

  ensurePolling();
  void loadTransactions();
}

function ensurePolling(): void {
  if (pollTimer !== undefined) return;
  pollTimer = window.setInterval(() => {
    if (!el().classList.contains("hidden") && document.visibilityState === "visible") {
      void loadTransactions(true);
    }
  }, 30_000);
}

// ── Pengambilan data ─────────────────────────────────────────────────

async function loadTransactions(silent = false): Promise<void> {
  const host = el();
  if (!state.data) host.innerHTML = frame();
  if (!silent) paintTableSkeleton();

  const token = ++loadToken;
  state.loading = true;
  try {
    const data = await adminApi<TransactionsPage>("transactions.php", {
      query: {
        q: state.q,
        status: state.status === "all" ? undefined : state.status,
        method: state.method === "all" ? undefined : state.method,
        type: state.type === "all" ? undefined : state.type,
        period: state.period === "all" ? undefined : state.period,
        page: state.page,
        per_page: PER_PAGE,
      },
    });
    if (token !== loadToken) return; // respons usang
    state.data = data;
    state.page = data.page;
    render();
  } catch (e) {
    if (token !== loadToken) return;
    if (silent) {
      showToast((e as Error).message, "error");
    } else {
      host.querySelector("#trx-panel")!.innerHTML =
        `<div class="mx-5 mt-5 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">${esc((e as Error).message)}</div>`;
    }
  } finally {
    state.loading = false;
  }
}

function paintTableSkeleton(): void {
  const panel = el().querySelector("#trx-panel");
  if (panel) panel.innerHTML = `<div class="p-6">${skeletonRows(PER_PAGE)}</div>`;
}

// ── Kerangka halaman ─────────────────────────────────────────────────

function frame(): string {
  const s = state.data?.summary;
  return `
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3 flex-wrap">
        <span class="inline-flex items-center gap-2 rounded-full bg-sky-100 text-sky-800 px-3 py-1 text-[11px] font-bold">
          <span class="w-2 h-2 rounded-full bg-sky-500"></span>
          MODE SIMULASI PEMBAYARAN
        </span>
        <span class="text-xs text-slate-400">
          Sumber: checkout.php &amp; confirm.php <span class="text-slate-300">•</span> Sinkronisasi otomatis tiap 30 detik
        </span>
      </div>

      <div class="flex flex-wrap items-start justify-between gap-4 mt-3">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Monitoring Transaksi &amp; Pembayaran Masuk</h1>
          <p class="text-sm text-slate-500 mt-1 max-w-2xl">
            Pantau arus pembayaran paket poin secara real-time: pisahkan pendapatan yang sudah terkonfirmasi dari
            transaksi yang masih menunggu, dan tangani pembayaran kedaluwarsa dari satu tempat.
          </p>
        </div>
        <button id="trx-export"
                class="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white text-xs font-bold px-4 py-2.5 hover:bg-slate-800 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"></path></svg>
          Ekspor Laporan Transaksi
        </button>
      </div>
    </div>

    <!-- 3 kartu ringkas -->
    <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div class="rounded-2xl bg-[#99f6e4] p-5">
        <div class="flex items-start justify-between gap-3">
          <p class="text-[11px] font-bold tracking-wide text-emerald-900/80">TOTAL PEMBAYARAN BERHASIL</p>
          <span class="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-emerald-700 shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5M18 12a2 2 0 000 4h4v-4h-4z"></path></svg>
          </span>
        </div>
        <p class="mt-3 text-3xl font-extrabold text-emerald-950 tracking-tight">${formatRupiah(s?.successful_revenue ?? 0)}</p>
        <p class="mt-1 text-[11px] text-emerald-900/70">Dari ${formatAngka(s?.total_success ?? 0)} transaksi sukses</p>
      </div>

      <div class="rounded-2xl bg-[#fbd9dd] p-5">
        <div class="flex items-start justify-between gap-3">
          <p class="text-[11px] font-bold tracking-wide text-rose-900/80">TRANSAKSI BERMASALAH</p>
          <span class="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-rose-700 shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path></svg>
          </span>
        </div>
        <p class="mt-3 text-3xl font-extrabold text-rose-950 tracking-tight">${formatAngka(s?.total_problem ?? 0)} Transaksi</p>
        <p class="mt-1 text-[11px] text-rose-900/70">
          ${formatAngka(s?.total_pending ?? 0)} menunggu &amp; ${formatAngka((s?.total_expired ?? 0) + (s?.total_failed ?? 0))} kedaluwarsa/gagal
        </p>
      </div>

      <div class="rounded-2xl bg-[#0b1329] text-white p-5">
        <div class="flex items-start justify-between gap-3">
          <p class="text-[11px] font-bold tracking-wide text-white/70">TRANSAKSI BERHASIL</p>
          <span class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sky-200 shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><path d="M2 10h20"></path></svg>
          </span>
        </div>
        <p class="mt-3 text-3xl font-extrabold tracking-tight">${formatAngka(s?.total_success ?? 0)} Transaksi</p>
        <p class="mt-1 text-[11px] text-white/60">Jumlah Transaksi Terkonfirmasi</p>
      </div>
    </div>

    <!-- Filter + area tabel -->
    <div class="mt-6 rounded-2xl bg-white border border-slate-100 overflow-hidden">
      <div class="px-5 py-4 flex flex-wrap items-center gap-2 border-b border-slate-50">
        ${dropdown("status", statusLabel(), [
          { value: "all", label: "Semua Status" },
          { value: "success", label: "Berhasil" },
          { value: "pending", label: "Menunggu Pembayaran" },
          { value: "expired", label: "Kedaluwarsa" },
          { value: "failed", label: "Gagal" },
        ], "filter")}
        ${dropdown("period", periodLabel(), [
          { value: "all", label: "Semua Periode" },
          { value: "today", label: "Hari ini" },
          { value: "7d", label: "7 hari terakhir" },
          { value: "30d", label: "30 hari terakhir" },
          { value: "month", label: "Bulan ini" },
        ], "calendar")}
        ${dropdown("method", methodLabel(), [
          { value: "all", label: "Semua Metode" },
          ...(state.data?.filters.methods ?? []).map((m) => ({ value: m.code, label: `${m.label} (${m.total})` })),
        ], "card")}
        ${dropdown("type", typeLabel(), [
          { value: "all", label: "Semua Jenis" },
          ...(state.data?.filters.types ?? []).map((t) => ({ value: t.code, label: `${t.label} (${t.total})` })),
        ], "tag")}
        <div class="relative ml-auto flex-1 sm:flex-none sm:w-[15rem] min-w-[9rem] max-w-[16rem]">
          <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"></path></svg>
          <input id="trx-search" type="text" placeholder="ID TRX / Pengguna..." value="${esc(state.q)}"
                 class="w-full rounded-full bg-slate-100/80 border border-transparent focus:border-slate-300 focus:bg-white pl-9 pr-4 py-2 text-sm outline-none">
        </div>
      </div>

      <div id="trx-panel"></div>
    </div>`;
}

// ── Panel tabel (di-render ulang tiap muat data) ─────────────────────

function render(): void {
  const host = el();
  host.innerHTML = frame();
  paintPanel();
  bind();
}

function paintPanel(): void {
  const d = state.data;
  const rows = d?.transactions ?? [];
  const panel = el().querySelector("#trx-panel") as HTMLElement;
  if (!panel) return;

  const from = d && d.total > 0 ? (d.page - 1) * d.per_page + 1 : 0;
  const to = d ? Math.min(d.page * d.per_page, d.total) : 0;

  panel.innerHTML = `
    <div class="overflow-x-auto px-2 pb-2">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-[10px] tracking-[0.08em] text-slate-400 border-b border-slate-100 uppercase">
            <th class="pl-4 text-left font-bold py-3.5 pr-2">ID Transaksi &amp; Ref</th>
            <th class="text-left font-bold py-3.5 px-2">Pengguna</th>
            <th class="text-left font-bold py-3.5 px-2 whitespace-nowrap">Jumlah Nominal</th>
            <th class="text-left font-bold py-3.5 px-2">Metode</th>
            <th class="text-left font-bold py-3.5 px-2 whitespace-nowrap">Waktu Pembayaran</th>
            <th class="text-left font-bold py-3.5 px-2">Status</th>
            <th class="text-right font-bold py-3.5 px-2 pr-4">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length === 0
            ? emptyState()
            : rows.map(rowHtml).join("")}
        </tbody>
      </table>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-slate-50">
      <p class="text-[11px] text-slate-400">
        Menampilkan <span class="font-semibold text-slate-600">${formatAngka(from)}</span>
        - <span class="font-semibold text-slate-600">${formatAngka(to)}</span>
        dari <span class="font-semibold text-slate-800">${formatAngka(d?.total ?? 0)}</span> total rekaman transaksi
      </p>
      <div id="trx-pager" class="flex items-center gap-1.5">${pager(d?.page ?? 1, d?.total_pages ?? 1)}</div>
    </div>`;
}

/** Empty state: bedakan "belum ada data sama sekali" dari "filter tidak ketemu". */
function emptyState(): string {
  const filtered =
    state.q !== "" || state.status !== "all" || state.method !== "all" || state.type !== "all" || state.period !== "all";

  return `<tr><td colspan="7" class="text-center py-14">
    <div class="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2zM9 7h6m-6 4h6M9 15h3"></path></svg>
    </div>
    <p class="font-bold text-slate-600">${filtered ? "Tidak ada transaksi yang cocok dengan filter" : "Belum ada rekaman transaksi"}</p>
    <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto">
      ${filtered
        ? "Coba longgarkan status, periode, metode pembayaran, atau kata kunci pencarian."
        : "Transaksi muncul di sini setelah pengguna memulai pembayaran dari halaman Pricing (checkout.php)."}
    </p>
  </td></tr>`;
}

function rowHtml(tr: TrxRow): string {
  const name = `${tr.user.first_name} ${tr.user.last_name}`.trim();
  const isPurchase = tr.type === "purchase";
  const canVoid = isPurchase && (tr.status === "pending" || tr.status === "expired");

  return `
    <tr class="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
      <td class="pl-4 py-4 pr-2 align-top">
        <p class="font-bold text-slate-900">${esc(tr.trx_code)}</p>
        <p class="text-[10px] text-slate-400 font-medium">${
          tr.payment_ref
            ? esc(tr.payment_ref)
            : `<span class="text-slate-400">${esc(tr.type_label)}</span>`
        }</p>
      </td>
      <td class="py-4 px-2 align-top">
        <div class="flex items-center gap-2.5">
          ${userAvatar(tr.user, name)}
          <div class="leading-tight">
            <p class="font-semibold text-slate-800">${esc(name || "Tanpa nama")}</p>
            <p class="text-[10px] text-slate-400">${esc(tr.user.email)}</p>
          </div>
        </div>
      </td>
      <td class="py-4 px-2 align-top whitespace-nowrap">
        ${tr.amount === null
          ? `<span class="text-slate-300 font-semibold">—</span>`
          : `<p class="font-bold text-slate-900">${formatRupiah(tr.amount)}</p>`}
        <p class="text-[10px] text-slate-400">${tr.points >= 0 ? "+" : ""}${formatAngka(tr.points)} poin${tr.package_name ? ` · ${esc(tr.package_name)}` : ""}</p>
      </td>
      <td class="py-4 px-2 align-top">${methodChip(tr)}</td>
      <td class="py-4 px-2 align-top whitespace-nowrap">
        <p class="font-medium text-slate-600">${esc(formatWaktu(tr.created_at))}</p>
        ${timeHint(tr)}
      </td>
      <td class="py-4 px-2 align-top">${statusBadge(tr.status, tr.status_label)}</td>
      <td class="py-4 px-2 pr-4 align-top">
        <div class="flex items-center justify-end gap-1.5">
          ${canVoid
            ? `<button data-void="${tr.id}" title="Void transaksi — batalkan pembayaran pending (alasan wajib)"
                       class="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M5.5 18.5l13-13"></path></svg>
               </button>`
            : ""}
          <button data-detail="${tr.id}"
                  class="rounded-full bg-sky-50 text-sky-700 text-[11px] font-bold px-3.5 py-1.5 hover:bg-sky-100 transition-colors">Detail</button>
        </div>
      </td>
    </tr>`;
}

/** Baris kedua kolom waktu: batas bayar (pending) / waktu kedaluwarsa. */
function timeHint(tr: TrxRow): string {
  if (tr.status === "pending" && tr.expires_at) {
    return `<p class="text-[10px] font-semibold text-amber-600">Batas: ${esc(formatWaktu(tr.expires_at))}</p>`;
  }
  if (tr.status === "expired" && tr.expires_at) {
    return `<p class="text-[10px] font-semibold text-rose-600">Kedaluwarsa: ${esc(formatWaktu(tr.expires_at))}</p>`;
  }
  if (tr.status === "pending") {
    return `<p class="text-[10px] text-slate-400">Menunggu konfirmasi webhook</p>`;
  }
  return `<p class="text-[10px] text-slate-400">${esc(formatTanggal(tr.created_at))}</p>`;
}

/**
 * Avatar pengguna. Foto Google (`lh3.googleusercontent.com`) kerap gagal dimuat
 * di lingkungan dev — tanpa penanganan browser menampilkan ikon gambar rusak.
 * Karena itu avatar selalu dirender bersama elemen fallback inisial; handler
 * error-nya dipasang di bind() (bukan atribut onerror inline, agar tidak
 * bertabrakan dengan tanda kutip HTML).
 */
function userAvatar(user: TrxRow["user"], name: string, size = "w-9 h-9 text-xs"): string {
  const ini = initialsOf(name || user.email);
  const base = `${size} rounded-full shrink-0 justify-center items-center font-bold`;

  if (!user.avatar_url) {
    return `<span class="${base} flex bg-slate-200 text-slate-600">${esc(ini)}</span>`;
  }

  // Fallback dirender tersembunyi tepat sebelum <img> agar bisa ditukar saat gagal.
  return `<span data-avatar-fallback class="${base} hidden bg-slate-200 text-slate-600">${esc(ini)}</span>
          <img data-avatar src="${esc(user.avatar_url)}" alt="" class="${size} rounded-full object-cover shrink-0">`;
}

/** Inisial singkat untuk fallback avatar: "Aurel Riyanto" → "AR". */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Tukar <img> gagal-muat dengan fallback inisial di sebelahnya. */
function bindAvatarFallbacks(scope: ParentNode): void {
  scope.querySelectorAll<HTMLImageElement>("img[data-avatar]").forEach((img) => {
    const swap = (): void => {
      const fb = img.previousElementSibling as HTMLElement | null;
      if (!fb?.hasAttribute("data-avatar-fallback")) return;
      fb.classList.remove("hidden");
      fb.classList.add("flex");
      img.remove();
    };
    // Gambar yang sudah gagal sebelum listener terpasang (dari cache) tetap ditangani.
    if (img.complete && img.naturalWidth === 0) swap();
    else img.addEventListener("error", swap, { once: true });
  });
}

function methodChip(tr: TrxRow): string {
  // Transaksi tanpa metode (bonus pendaftaran / pemakaian poin) diberi chip
  // netral berisi jenis transaksinya supaya kolom tetap informatif.
  if (!tr.method || tr.method === "—") {
    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">${esc(tr.type_label)}</span>`;
  }
  const cls = tr.method_icon === "qr" ? "bg-teal-50 text-teal-700" : "bg-sky-50 text-sky-700";
  const glyph = tr.method_icon === "qr"
    ? `<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"></path>`
    : `<rect x="3" y="8" width="18" height="12" rx="2"></rect><path d="M7 8V6a2 2 0 012-2h6a2 2 0 012 2v2M7 13h10M7 16h4"></path>`;
  return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${cls}">
    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${glyph}</svg>
    ${esc(tr.method)}</span>`;
}

function statusBadge(status: UiStatus, label: string): string {
  // Kelas ditulis lengkap (bukan dirakit dinamis) supaya pemindai Tailwind
  // dapat menemukannya di source.
  const map: Record<UiStatus, { pill: string; dot: string }> = {
    success: { pill: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
    pending: { pill: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
    expired: { pill: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
    failed: { pill: "bg-slate-200 text-slate-600", dot: "bg-slate-500" },
  };
  const s = map[status] ?? map.failed;
  return `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${s.pill}">
    <span class="w-1.5 h-1.5 rounded-full ${s.dot}"></span>${esc(label)}</span>`;
}

// ── Filter: pill status + dropdown ───────────────────────────────────

function statusPill(value: "all" | UiStatus, label: string): string {
  const on = state.status === value;
  return `<button data-status="${value}"
                  class="px-3.5 py-2 rounded-full text-[11px] font-bold transition-colors ${
                    on ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }">${esc(label)}</button>`;
}

interface Option { value: string; label: string }

type FilterGroup = "status" | "period" | "method" | "type";

/** Nilai filter yang sedang aktif per grup. */
function currentValue(group: FilterGroup): string {
  return group === "status" ? state.status : group === "period" ? state.period : group === "method" ? state.method : state.type;
}

/** Pill dropdown dengan menu; label aktif dihitung ulang di frame(). */
function dropdown(group: FilterGroup, label: string, options: Option[], iconName: string): string {
  const icons: Record<string, string> = {
    filter: `<path d="M3 5h18l-7 8v6l-4-2v-4L3 5z"></path>`,
    calendar: `<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M8 3v4M16 3v4M3 11h18"></path>`,
    card: `<rect x="3" y="6" width="18" height="12" rx="2"></rect><path d="M3 11h18"></path>`,
    tag: `<path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0l-7.2-7.2a2 2 0 01-.6-1.4V4a1 1 0 011-1h8a2 2 0 011.4.6l7.4 7.4a2 2 0 010 2.4z"></path><path d="M7.5 7.5h.01"></path>`,
  };
  const active = currentValue(group);
  // Pill pertama (status) tampil sebagai pill gelap terpilih, mengikuti patokan.
  const isPrimary = group === "status";
  const on = active !== "all";
  const pillCls = isPrimary && !on
    ? "bg-slate-900 text-white hover:bg-slate-800"
    : on
      ? "bg-slate-900 text-white hover:bg-slate-800"
      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50";

  return `
    <div class="relative" data-dropdown="${group}">
      <button data-dd-toggle="${group}"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-bold transition-colors ${pillCls}">
        <svg class="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[iconName] ?? ""}</svg>
        <span data-dd-label="${group}">${esc(label)}</span>
        <svg class="w-[9px] h-[9px] opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"></path></svg>
      </button>
      <div data-dd-menu="${group}" class="hidden absolute left-0 top-full mt-1.5 z-30 min-w-[190px] bg-white border border-slate-100 rounded-xl shadow-xl py-1.5">
        ${options
          .map((o) => {
            const sel = active === o.value;
            return `<button data-dd-pick="${group}/${esc(o.value)}"
                            class="w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${
                              sel ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                            }">${esc(o.label)}</button>`;
          })
          .join("")}
      </div>
    </div>`;
}

function statusLabel(): string {
  return {
    all: "Semua Status",
    success: "Berhasil",
    pending: "Menunggu Pembayaran",
    expired: "Kedaluwarsa",
    failed: "Gagal",
  }[state.status];
}

function periodLabel(): string {
  return {
    all: "Semua Periode",
    today: "Hari ini",
    "7d": "7 hari terakhir",
    "30d": "30 hari terakhir",
    month: "Bulan ini",
  }[state.period];
}

function methodLabel(): string {
  if (state.method === "all" || !state.data) return "Metode Pembayaran";
  return state.data.filters.methods.find((m) => m.code === state.method)?.label ?? "Metode Pembayaran";
}

function typeLabel(): string {
  if (state.type === "all" || !state.data) return "Jenis Transaksi";
  return state.data.filters.types.find((t) => t.code === state.type)?.label ?? "Jenis Transaksi";
}

// ── Paginasi ─────────────────────────────────────────────────────────

/** Nomor halaman bergaya patokan: 1 2 3 … 641 (selalu tampilkan halaman terakhir). */
function pager(page: number, totalPages: number): string {
  const nums: (number | "gap")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) nums.push(i);
  } else {
    nums.push(1);
    const from = Math.max(2, page - 1);
    const to = Math.min(totalPages - 1, page + 1);
    if (from > 2) nums.push("gap");
    for (let i = from; i <= to; i++) nums.push(i);
    if (to < totalPages - 1) nums.push("gap");
    nums.push(totalPages);
  }

  const btn = (n: number): string =>
    `<button data-page="${n}" class="w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${
      n === page ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
    }">${n}</button>`;

  return `
    <button data-page="${Math.max(1, page - 1)}" ${page <= 1 ? "disabled" : ""}
            class="w-8 h-8 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center">&lt;</button>
    ${nums.map((n) => (n === "gap" ? `<span class="px-1.5 text-slate-300 text-xs">...</span>` : btn(n))).join("")}
    <button data-page="${Math.min(totalPages, page + 1)}" ${page >= totalPages ? "disabled" : ""}
            class="w-8 h-8 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center">&gt;</button>`;
}

// ── Binding ──────────────────────────────────────────────────────────

function bind(): void {
  const host = el();
  bindAvatarFallbacks(host);

  // Pill status
  host.querySelectorAll<HTMLButtonElement>("[data-status]").forEach((b) =>
    b.addEventListener("click", () => {
      state.status = b.dataset.status as typeof state.status;
      state.page = 1;
      void loadTransactions();
    }),
  );

  // Dropdown (periode / metode / jenis)
  host.querySelectorAll<HTMLButtonElement>("[data-dd-toggle]").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      const group = b.dataset.ddToggle;
      host.querySelectorAll<HTMLElement>("[data-dd-menu]").forEach((m) => {
        if (m.dataset.ddMenu !== group) m.classList.add("hidden");
      });
      host.querySelector(`[data-dd-menu="${group}"]`)?.classList.toggle("hidden");
    }),
  );
  host.querySelectorAll<HTMLButtonElement>("[data-dd-pick]").forEach((b) =>
    b.addEventListener("click", () => {
      const [group, value] = (b.dataset.ddPick || "/").split("/");
      if (group === "period") state.period = value as typeof state.period;
      else if (group === "method") state.method = value;
      else if (group === "type") state.type = value;
      state.page = 1;
      closeDropdowns();
      void loadTransactions();
    }),
  );
  bindOutsideClick();

  // Pencarian lokal halaman
  const search = host.querySelector("#trx-search") as HTMLInputElement | null;
  search?.addEventListener("input", debounce(() => {
    state.q = search.value.trim();
    state.page = 1;
    void loadTransactions();
  }, 350));

  // Paginasi
  host.querySelectorAll<HTMLButtonElement>("#trx-pager [data-page]").forEach((b) =>
    b.addEventListener("click", () => {
      state.page = Number(b.dataset.page);
      void loadTransactions();
    }),
  );

  // Detail
  host.querySelectorAll<HTMLButtonElement>("[data-detail]").forEach((b) =>
    b.addEventListener("click", () => void openDetail(Number(b.dataset.detail))),
  );

  // Void transaksi pending
  host.querySelectorAll<HTMLButtonElement>("[data-void]").forEach((b) =>
    b.addEventListener("click", () => void voidTransaction(Number(b.dataset.void))),
  );

  // Ekspor CSV (filter aktif ikut terbawa; dicatat di audit log)
  (host.querySelector("#trx-export") as HTMLButtonElement | null)?.addEventListener("click", () => {
    void adminDownload(
      "transactions.php",
      {
        export: "csv",
        q: state.q,
        status: state.status === "all" ? undefined : state.status,
        method: state.method === "all" ? undefined : state.method,
        type: state.type === "all" ? undefined : state.type,
        period: state.period === "all" ? undefined : state.period,
      },
      "jagocv-monitoring-transaksi.csv",
    )
      .then(() => showToast("CSV Monitoring Transaksi diunduh — dicatat di audit log."))
      .catch((e: Error) => showToast(e.message, "error"));
  });
}

function closeDropdowns(): void {
  el().querySelectorAll<HTMLElement>("[data-dd-menu]").forEach((m) => m.classList.add("hidden"));
}

function bindOutsideClick(): void {
  if (outsideClickBound) return;
  outsideClickBound = true;
  document.addEventListener("click", () => {
    if (!el().classList.contains("hidden")) closeDropdowns();
  });
}

// ── Aksi: detail transaksi ───────────────────────────────────────────

async function openDetail(id: number): Promise<void> {
  let data: TrxDetail;
  try {
    data = await adminApi<TrxDetail>("transactions.php", { query: { id } });
  } catch (e) {
    showToast((e as Error).message, "error");
    return;
  }
  const t = data.transaction;
  const u = data.user;
  const name = `${u.first_name} ${u.last_name}`.trim();

  const modal = openModal({
    title: `${t.trx_code} — ${t.method}`,
    subtitle: `${t.type_label}${t.package_name ? ` · Paket ${t.package_name}` : ""} · ${formatWaktu(t.created_at)}`,
    wide: true,
    body: `
      <div class="grid sm:grid-cols-4 gap-3 text-center text-xs mb-5">
        <div class="rounded-xl bg-slate-50 border border-slate-100 p-3">
          <p class="text-slate-400 font-bold text-[10px]">NOMINAL</p>
          <p class="font-bold text-slate-800 mt-1">${t.amount === null ? "—" : formatRupiah(t.amount)}</p>
        </div>
        <div class="rounded-xl bg-slate-50 border border-slate-100 p-3">
          <p class="text-slate-400 font-bold text-[10px]">POIN</p>
          <p class="font-bold text-slate-800 mt-1">${t.points >= 0 ? "+" : ""}${formatAngka(t.points)}</p>
        </div>
        <div class="rounded-xl bg-slate-50 border border-slate-100 p-3">
          <p class="text-slate-400 font-bold text-[10px]">STATUS</p>
          <p class="mt-1">${statusBadge(t.status, t.status_label)}</p>
        </div>
        <div class="rounded-xl bg-slate-50 border border-slate-100 p-3">
          <p class="text-slate-400 font-bold text-[10px]">BATAS BAYAR</p>
          <p class="font-bold text-slate-800 mt-1">${t.expires_at ? esc(formatWaktu(t.expires_at)) : "—"}</p>
        </div>
      </div>

      <div class="rounded-xl border border-slate-100 p-4 mb-5">
        <p class="text-xs font-bold text-slate-600 mb-3">Rincian transaksi</p>
        <dl class="grid sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
          <div class="flex justify-between gap-3"><dt class="text-slate-400">ID transaksi</dt><dd class="font-bold text-slate-700">${esc(t.trx_code)}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-slate-400">Referensi gateway</dt><dd class="font-mono text-slate-700">${esc(t.payment_ref ?? "—")}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-slate-400">Jenis</dt><dd class="font-semibold text-slate-700">${esc(t.type_label)}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-slate-400">Paket</dt><dd class="font-semibold text-slate-700">${esc(t.package_name ?? "—")}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-slate-400">Metode</dt><dd class="font-semibold text-slate-700">${esc(t.method)}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-slate-400">Status tersimpan (DB)</dt><dd class="font-mono text-slate-500">${esc(t.stored_status)}</dd></div>
          <div class="flex justify-between gap-3 sm:col-span-2"><dt class="text-slate-400">Keterangan</dt><dd class="font-medium text-slate-700 text-right">${esc(t.description || "—")}</dd></div>
        </dl>
        <p class="text-[10px] text-slate-400 mt-3">
          Kolom <span class="font-semibold">status</span> di database tetap <span class="font-mono">${esc(t.stored_status)}</span>;
          label "${esc(t.status_label)}" dihitung dari batas bayar (created_at + 1 jam) sesuai aturan checkout.php.
        </p>
      </div>

      <div class="rounded-xl border border-slate-100 p-4 mb-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            ${userAvatar(u, name, "w-10 h-10 text-xs")}
            <div class="leading-tight">
              <p class="font-bold text-slate-800">${esc(name || "Tanpa nama")}</p>
              <p class="text-[11px] text-slate-400">${esc(u.email)} · saldo ${formatAngka(u.points)} poin</p>
            </div>
          </div>
          <span class="rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1">${esc(u.plan)} · ${esc(u.status)}</span>
        </div>
      </div>

      <p class="text-xs font-bold text-slate-600 mb-2">Riwayat transaksi pengguna ini (terbaru)</p>
      <div class="rounded-xl border border-slate-100 overflow-hidden max-h-44 overflow-y-auto">
        <table class="w-full text-xs">
          <tbody>
            ${data.history.length === 0
              ? `<tr><td class="text-slate-400 py-3 px-3">Belum ada transaksi lain.</td></tr>`
              : data.history
                  .map(
                    (h) => `<tr class="border-b border-slate-50 last:border-0">
                      <td class="py-2 px-3 font-mono text-slate-500">${esc(h.trx_code)}</td>
                      <td class="py-2 px-2 text-slate-500">${esc(h.type_label)}</td>
                      <td class="py-2 px-2 font-bold ${h.points >= 0 ? "text-emerald-600" : "text-rose-600"}">${h.points >= 0 ? "+" : ""}${formatAngka(h.points)}</td>
                      <td class="py-2 px-2 text-slate-400">${h.amount === null ? "—" : formatRupiah(h.amount)}</td>
                      <td class="py-2 px-2 text-slate-400">${esc(h.method)}</td>
                      <td class="py-2 px-2 text-slate-400 whitespace-nowrap">${esc(formatWaktu(h.created_at))}</td>
                    </tr>`,
                  )
                  .join("")}
          </tbody>
        </table>
      </div>`,
  });

  bindAvatarFallbacks(modal);

  // Aksi void dari dalam modal (hanya bila transaksi masih pending).
  if (t.can_void) {
    const footer = modal.parentElement?.querySelector(".rounded-b-2xl");
    if (footer) {
      const btn = document.createElement("button");
      btn.className = "px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold";
      btn.textContent = "Void Transaksi";
      btn.addEventListener("click", async () => {
        closeModal();
        await voidTransaction(id);
      });
      footer.insertBefore(btn, footer.lastElementChild);
    }
  }
}

// ── Aksi: void transaksi pending ─────────────────────────────────────

async function voidTransaction(id: number): Promise<void> {
  const row = state.data?.transactions.find((t) => t.id === id);
  const { confirmed, reason } = await confirmDialog({
    title: "Void transaksi pembayaran?",
    danger: true,
    requireReason: true,
    confirmText: "Void Transaksi",
    message: row
      ? `Transaksi <b>${esc(row.trx_code)}</b> (${esc(row.payment_ref ?? row.type_label)}, ${row.amount === null ? "tanpa nominal" : formatRupiah(row.amount)}) akan ditandai <b>Gagal</b>. Poin pengguna tidak berubah dan aksi ini tercatat di audit log.`
      : "Transaksi ini akan ditandai Gagal. Poin pengguna tidak berubah dan aksi ini tercatat di audit log.",
  });
  if (!confirmed) return;

  try {
    const res = await adminApi<{ message: string }>("transactions.php", {
      method: "POST",
      body: { action: "void", id, reason },
    });
    showToast(res.message);
    void loadTransactions();
  } catch (e) {
    showToast((e as Error).message, "error");
  }
}

// ── Util ─────────────────────────────────────────────────────────────

function debounce(fn: () => void, ms: number): () => void {
  let t: number | undefined;
  return () => {
    window.clearTimeout(t);
    t = window.setTimeout(fn, ms);
  };
}