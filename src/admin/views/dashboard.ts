/**
 * Menu 1 — Dashboard & Analytics.
 * Semua angka dari /backend/admin/analytics.php (DB), bukan mockup PNG.
 *
 * Arsitektur render (penting untuk UX):
 *  1. buildLayout()  → kerangka halaman dirender SEKALI (header, kartu, chart,
 *     distribusi, tabel). Tidak pernah dibongkar lagi.
 *  2. applyOverview() → hanya isi kartu + chart + distribusi yang diganti
 *     (cross-fade), sehingga ganti periode TIDAK memicu reload / lompat scroll.
 *  3. applyActivities() → hanya <tbody> + pager yang diganti, sehingga
 *     pagination tidak menyentuh bagian halaman lain (posisi layar tetap).
 *
 * Fetch parsial memakai ?only=overview | activities agar payload kecil:
 * ganti periode tidak perlu menarik baris tabel, ganti halaman tidak perlu
 * menghitung ulang seluruh agregat.
 */
import { adminApi } from "../api";
import { formatAngka, formatRupiah, formatPersen, formatWaktu } from "../format";
import { esc, initialAvatar, skeletonRows, showToast } from "../ui";
import { showAdminView } from "../shell";

interface ChartPoint {
  label: string;
  users: number;
  docs: number;
}

interface ActivityRow {
  id: string;
  user_id: number;
  name: string;
  email: string;
  avatar: string | null;
  initials: string;
  activity: string;
  detail: string;
  status: string;
  status_ok: boolean;
  created_at: string;
}

interface ActivitiesBlock {
  rows: ActivityRow[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

interface Analytics {
  period: "7d" | "30d";
  cards: {
    users_total: number;
    users_active: number;
    users_suspended: number;
    users_new: number;
    users_growth: number;
    docs_total: number;
    docs_new: number;
    docs_growth: number;
    revenue_month: number;
  };
  chart: ChartPoint[];
  template_usage: {
    total: number;
    items: { layout: string; label: string; total: number; pct: number }[];
  };
  transactions: {
    success: number;
    pending: number;
    failed: number;
    amount_success: number;
    by_method: { method: string; count: number; amount: number }[];
  };
  activities: ActivitiesBlock;
  generated_at: string;
}

type OverviewPayload = Omit<Analytics, "activities">;
type ActivitiesPayload = Pick<Analytics, "activities">;

const PER_PAGE = 5;
const FADE_MS = 170;

const el = (): HTMLElement => document.getElementById("view-dash") as HTMLElement;

const state = {
  period: "30d" as "7d" | "30d",
  page: 1,
  data: null as Analytics | null,
  q: "",
  status: "all",
  built: false,
  busyOverview: false,
  busyTable: false,
};

let pollTimer: number | undefined;
let overviewToken = 0;
let tableToken = 0;
let searchBound = false;
let resizeObserver: ResizeObserver | null = null;
let resizeBound = false;
let lastChartWidth = 0;
/** Waktu interaksi terakhir pada tabel (pagination/filter) — polling menahan diri sesaat. */
let lastTableInteraction = 0;

export function mountDashboardView(): void {
  if (!searchBound) {
    searchBound = true;
    window.addEventListener("admin-search", ((e: CustomEvent) => {
      if (el().classList.contains("hidden")) return;
      state.q = String(e.detail || "").toLowerCase();
      renderActivityRows();
    }) as EventListener);
  }

  // Grafik digambar pada lebar kontainer sebenarnya. ResizeObserver menangkap
  // perubahan lebar apa pun (viewport, drawer sidebar, dsb.) tanpa memantau
  // window.resize — dan hanya menggambar ulang bila lebarnya berubah nyata.
  observeChart();

  ensurePolling();

  // Kunjungan pertama: skeleton + fetch penuh. Kunjungan berikutnya: refresh
  // diam-diam (tanpa membongkar layout, tanpa lompat scroll).
  if (!state.built || !state.data) {
    void loadInitial();
  } else {
    void fetchOverview({ silent: true });
    void fetchActivities(state.page, { silent: true });
  }
}

/** Pasang ResizeObserver pada #dash-chart yang sedang terpasang di DOM. */
function observeChart(): void {
  const redrawIfWidthChanged = (): void => {
    const target = document.getElementById("dash-chart");
    if (!target || !state.data) return;
    const w = Math.round(target.clientWidth);
    if (w <= 0 || Math.abs(w - lastChartWidth) < 12) return;
    lastChartWidth = w;
    target.innerHTML = renderChart(state.data.chart, w);
  };

  if (typeof ResizeObserver !== "undefined") {
    if (!resizeObserver) resizeObserver = new ResizeObserver(debounce(redrawIfWidthChanged, 160));
    const box = document.getElementById("dash-chart");
    if (box) {
      resizeObserver.disconnect();
      resizeObserver.observe(box);
    }
  }

  // Cadangan: sebagian browser/lingkungan embed tidak memicu ResizeObserver
  // untuk perubahan viewport. Listener ini idempoten (dibandingkan lebar).
  if (!resizeBound) {
    resizeBound = true;
    const schedule = debounce(redrawIfWidthChanged, 160);
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    // Kembali dari tab lain / rotasi: lebar bisa berubah tanpa event resize.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") schedule();
    });
  }
}

/** Polling 30 detik sesuai badge "LIVE WORKSPACE MODE" — hanya saat view aktif & tab terlihat. */
function ensurePolling(): void {
  if (pollTimer !== undefined) return;
  pollTimer = window.setInterval(() => {
    if (el().classList.contains("hidden") || document.visibilityState !== "visible") return;
    if (state.busyOverview || state.busyTable) return;
    // Beri jeda setelah admin menekan pagination/mengetik filter agar refresh
    // otomatis tidak menimpa halaman yang baru dipilih.
    if (Date.now() - lastTableInteraction < 5_000) return;
    void fetchOverview({ silent: true });
    void fetchActivities(state.page, { silent: true });
  }, 30_000);
}

// ── Fetch ────────────────────────────────────────────────────────────

async function loadInitial(): Promise<void> {
  const host = el();
  host.innerHTML = `<div class="animate-pulse"><div class="h-8 w-72 max-w-full rounded-lg bg-slate-200 mb-6"></div>${skeletonRows(6)}</div>`;

  const token = ++overviewToken;
  try {
    const data = await adminApi<Analytics>("analytics.php", {
      query: { period: state.period, page: state.page, per_page: PER_PAGE },
    });
    if (token !== overviewToken) return;
    state.data = data;
    state.page = data.activities.page;
    buildLayout();
    observeChart();
    applyOverview(data);
    applyActivities(data.activities, false);
  } catch (e) {
    if (token !== overviewToken) return;
    host.innerHTML = `<div class="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">${esc(
      (e as Error).message,
    )}</div>`;
  }
}

async function fetchOverview(opts: { silent?: boolean } = {}): Promise<void> {
  if (state.busyOverview) return;
  state.busyOverview = true;

  const token = ++overviewToken;
  const toggle = document.getElementById("dash-period-toggle");
  if (!opts.silent) toggle?.classList.add("is-busy");

  try {
    const data = await adminApi<OverviewPayload>("analytics.php", {
      query: { period: state.period, page: state.page, per_page: PER_PAGE, only: "overview" },
    });
    if (token !== overviewToken) return;
    state.data = { ...(state.data as Analytics), ...data };
    applyOverview(data);
  } catch (e) {
    if (!opts.silent) showToast((e as Error).message, "error");
  } finally {
    toggle?.classList.remove("is-busy");
    if (token === overviewToken) state.busyOverview = false;
  }
}

async function fetchActivities(page: number, opts: { silent?: boolean } = {}): Promise<void> {
  if (state.busyTable) return;
  state.busyTable = true;

  const token = ++tableToken;
  const pager = document.getElementById("dash-act-pager");
  // Pager dikunci selama request agar klik ganda tidak menumpuk halaman.
  pager?.classList.add("pointer-events-none", "opacity-60");

  try {
    const data = await adminApi<ActivitiesPayload>("analytics.php", {
      query: { period: state.period, page, per_page: PER_PAGE, only: "activities" },
    });
    if (token !== tableToken) return;
    state.page = data.activities.page;
    if (state.data) state.data.activities = data.activities;
    applyActivities(data.activities, true);
  } catch (e) {
    if (!opts.silent) showToast((e as Error).message, "error");
  } finally {
    if (token === tableToken) state.busyTable = false;
    pager?.classList.remove("pointer-events-none", "opacity-60");
  }
}

// ── Layout statis (dirender sekali) ──────────────────────────────────

function buildLayout(): void {
  const host = el();
  host.innerHTML = `
    <!-- ── Header halaman (D3) ─────────────────────────────────── -->
    <div class="mb-6 sm:mb-7">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span class="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-[11px] font-bold">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> LIVE WORKSPACE MODE
        </span>
        <span id="dash-updated" class="text-xs text-slate-400">Pembaruan otomatis tiap 30 detik</span>
      </div>
      <div class="flex flex-col gap-4 mt-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div class="min-w-0">
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">Selamat Datang, Admin JagoCV!</h1>
          <p class="text-sm text-slate-500 mt-1 max-w-xl">Pantau kesehatan sistem, performa template, metrik konversi, dan pertumbuhan pengguna secara langsung.</p>
        </div>
        <button id="dash-download" class="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-5 py-2.5 transition-colors shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"></path></svg>
          Unduh Ringkasan Mingguan
        </button>
      </div>
    </div>

    <!-- ── 3 kartu statistik (D4) ───────────────────────────────── -->
    <div id="dash-cards" class="dash-swap grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"></div>

    <!-- ── Grafik + distribusi ─────────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mt-5 sm:mt-6">
      <div class="lg:col-span-2 min-w-0 rounded-2xl bg-white border border-slate-100 p-4 sm:p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div class="min-w-0">
            <h2 class="text-base sm:text-lg font-extrabold text-slate-900">Statistik Pertumbuhan Pengguna &amp; Dokumen</h2>
            <p class="text-xs text-slate-400 mt-0.5">Angka riil dari database, menyesuaikan rentang waktu</p>
          </div>
          <div class="flex rounded-full bg-slate-100 p-1 text-xs font-bold shrink-0 self-start" id="dash-period-toggle">
            <button data-period="7d" class="px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">7 Hari</button>
            <button data-period="30d" class="px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">30 Hari Terakhir</button>
          </div>
        </div>
        <div id="dash-chart" class="dash-swap mt-4 sm:mt-5 -ml-1 min-w-0"></div>
        <div class="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-xs font-semibold text-slate-500">
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Pengguna baru</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-slate-900"></span> Dokumen dibuat</span>
        </div>
      </div>

      <div class="min-w-0 rounded-2xl bg-white border border-slate-100 p-4 sm:p-6">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 class="text-base sm:text-lg font-extrabold text-slate-900">Distribusi Template</h2>
            <p class="text-xs text-slate-400 mt-0.5">Proporsi pemakaian desain CV</p>
          </div>
          <button data-goto="view-templates" class="rounded-full bg-sky-100 text-sky-800 text-xs font-bold px-3.5 py-2 hover:bg-sky-200 transition-colors shrink-0 whitespace-nowrap">Lihat Template</button>
        </div>
        <div id="dash-dist" class="dash-swap mt-4 sm:mt-5 min-w-0"></div>
      </div>
    </div>

    <!-- ── Tabel aktivitas (D7/D8) ─────────────────────────────── -->
    <div id="dash-activities" class="mt-5 sm:mt-6 rounded-2xl bg-white border border-slate-100 p-4 sm:p-6">
      <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between">
        <div class="min-w-0">
          <h2 class="text-base sm:text-lg font-extrabold text-slate-900">Aktivitas Platform &amp; Transaksi Terkini</h2>
          <p class="text-xs text-slate-400 mt-0.5">Generate dokumen dan pembelian poin pengguna (sumber: point_transactions &amp; documents)</p>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center shrink-0">
          <input id="dash-act-search" type="text" placeholder="Filter pengguna / modul…"
                 class="rounded-full bg-slate-100 border border-transparent px-4 py-2 text-sm outline-none focus:border-slate-300 focus:bg-white transition-colors w-full sm:w-56">
          <select id="dash-act-status" class="rounded-full bg-slate-100 border border-transparent px-4 py-2 text-sm font-semibold text-slate-600 outline-none cursor-pointer w-full sm:w-auto">
            <option value="all">Semua Status</option>
            <option value="sukses">Sukses</option>
            <option value="gagal">Gagal/Pending</option>
          </select>
        </div>
      </div>

      <!-- Mobile: daftar bertumpuk (tidak perlu digeser). Tablet ke atas: tabel
           penuh; wrapper scroll horizontal menjaga layar sempit tetap rapi. -->
      <div id="dash-act-list" class="dash-swap md:hidden mt-4 space-y-2"></div>

      <div class="table-scroll overflow-x-auto mt-4 hidden md:block">
        <table class="w-full min-w-[680px] text-sm">
          <thead>
            <tr class="text-[11px] tracking-wide text-slate-400 border-b border-slate-100">
              <th class="text-left font-bold py-3 px-2">PENGGUNA</th>
              <th class="text-left font-bold py-3 px-2">AKTIVITAS</th>
              <th class="text-left font-bold py-3 px-2 hidden lg:table-cell">DETAIL MODUL</th>
              <th class="text-left font-bold py-3 px-2 whitespace-nowrap">WAKTU</th>
              <th class="text-right font-bold py-3 px-2">STATUS</th>
            </tr>
          </thead>
          <tbody id="dash-act-tbody" class="dash-swap"></tbody>
        </table>
      </div>

      <div class="flex flex-col gap-3 mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p id="dash-act-meta" class="text-xs text-slate-400 order-2 sm:order-1"></p>
        <div class="flex items-center gap-1 order-1 sm:order-2 overflow-x-auto table-scroll" id="dash-act-pager"></div>
      </div>
    </div>`;

  state.built = true;
  bindStatic(host);
}

function bindStatic(host: HTMLElement): void {
  // Navigasi antar-menu (delegasi — aman meski isi kartu diganti).
  host.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-goto]");
    if (target?.dataset.goto) showAdminView(target.dataset.goto);
  });

  host.querySelector<HTMLButtonElement>("#dash-download")?.addEventListener("click", (e) => {
    if (state.data) downloadSummary(e, state.data);
  });

  // Toggle periode — asinkron, tanpa reload & tanpa menggeser scroll.
  const toggle = host.querySelector<HTMLElement>("#dash-period-toggle");
  toggle?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-period]");
    if (!btn) return;
    const next = btn.dataset.period as "7d" | "30d";
    if (next === state.period) return;
    state.period = next;
    updatePeriodToggle(toggle, next);
    void fetchOverview();
  });
  if (toggle) updatePeriodToggle(toggle, state.period);

  // Pagination tabel — asinkron, posisi layar dipertahankan.
  const pager = host.querySelector<HTMLElement>("#dash-act-pager");
  pager?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-page]");
    if (!btn || btn.disabled) return;
    const page = Number(btn.dataset.page);
    if (!Number.isFinite(page) || page === state.page) return;
    lastTableInteraction = Date.now();
    void fetchActivities(page);
  });

  const search = host.querySelector<HTMLInputElement>("#dash-act-search");
  search?.addEventListener(
    "input",
    debounce(() => {
      state.q = search.value.toLowerCase().trim();
      lastTableInteraction = Date.now();
      renderActivityRows();
    }, 250),
  );

  const status = host.querySelector<HTMLSelectElement>("#dash-act-status");
  status?.addEventListener("change", () => {
    state.status = status.value;
    lastTableInteraction = Date.now();
    renderActivityRows();
  });
}

function updatePeriodToggle(host: HTMLElement, period: "7d" | "30d"): void {
  host.querySelectorAll<HTMLButtonElement>("[data-period]").forEach((b) => {
    const on = b.dataset.period === period;
    b.classList.toggle("bg-slate-900", on);
    b.classList.toggle("text-white", on);
    b.classList.toggle("text-slate-500", !on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

// ── Penerapan data (cross-fade, tanpa membongkar layout) ─────────────

function applyOverview(d: OverviewPayload): void {
  swapHtml(document.getElementById("dash-cards"), cardsHtml(d.cards));
  const box = document.getElementById("dash-chart");
  lastChartWidth = chartWidth();
  swapHtml(box, renderChart(d.chart, lastChartWidth));
  swapHtml(document.getElementById("dash-dist"), renderDistribution(d.template_usage));

  const stamp = document.getElementById("dash-updated");
  if (stamp) {
    const t = new Date(d.generated_at || Date.now());
    const jam = Number.isNaN(t.getTime())
      ? ""
      : ` · diperbarui ${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
    stamp.textContent = `Pembaruan otomatis tiap 30 detik${jam}`;
  }
}

function applyActivities(a: ActivitiesBlock, fade: boolean): void {
  if (state.data) state.data.activities = a;
  swapHtml(document.getElementById("dash-act-tbody"), activityRowsHtml(a), fade);
  swapHtml(document.getElementById("dash-act-list"), activityCardsHtml(a), fade);
  swapHtml(document.getElementById("dash-act-pager"), renderPager(a.page, a.total_pages), fade);

  const meta = document.getElementById("dash-act-meta");
  if (meta) {
    const shown = visibleRows(a.rows).length;
    meta.textContent = `Menampilkan ${shown} dari ${formatAngka(a.total)} riwayat (halaman ${a.page} dari ${a.total_pages})`;
  }
}

/** Filter klien pada halaman yang sedang tampil (tanpa request ulang). */
function visibleRows(rows: ActivityRow[]): ActivityRow[] {
  const q = state.q;
  return rows.filter(
    (r) =>
      (q === "" ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.activity.toLowerCase().includes(q) ||
        r.detail.toLowerCase().includes(q)) &&
      (state.status === "all" || (state.status === "sukses" ? r.status_ok : !r.status_ok)),
  );
}

function renderActivityRows(): void {
  const a = state.data?.activities;
  const tbody = document.getElementById("dash-act-tbody");
  const list = document.getElementById("dash-act-list");
  if (!a) return;
  if (tbody) swapHtml(tbody, activityRowsHtml(a), false);
  if (list) swapHtml(list, activityCardsHtml(a), false);

  const meta = document.getElementById("dash-act-meta");
  if (meta) {
    meta.textContent = `Menampilkan ${visibleRows(a.rows).length} dari ${formatAngka(a.total)} riwayat (halaman ${a.page} dari ${a.total_pages})`;
  }
}

// ── Kartu statistik ──────────────────────────────────────────────────

function cardsHtml(c: Analytics["cards"]): string {
  return `
    <div class="min-w-0 rounded-2xl bg-[#d3f3e5] p-5 sm:p-6">
      <div class="flex items-start justify-between gap-3">
        <p class="text-[11px] font-bold tracking-wide text-emerald-900/80 leading-snug">TOTAL PENGGUNA AKTIF</p>
        <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/60 flex items-center justify-center text-emerald-700 shrink-0">
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 7-7M14 8h6v6"></path></svg>
        </div>
      </div>
      <p class="mt-3 text-3xl sm:text-4xl font-extrabold text-emerald-950 tabular-nums break-words">${formatAngka(c.users_active)} <span class="text-base sm:text-lg font-bold text-emerald-800/70">User</span></p>
      <p class="mt-3 sm:mt-4 text-xs text-emerald-900/70">${formatAngka(c.users_new)} user baru (7p/30h) · ${formatPersen(c.users_growth)} vs periode sebelumnya</p>
    </div>

    <div class="min-w-0 rounded-2xl bg-[#fbd9dd] p-5 sm:p-6">
      <div class="flex items-start justify-between gap-3">
        <p class="text-[11px] font-bold tracking-wide text-rose-900/80 leading-snug">TOTAL DOKUMEN DIGENERATE</p>
        <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/70 flex items-center justify-center text-rose-600 shrink-0">
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
        </div>
      </div>
      <p class="mt-3 text-3xl sm:text-4xl font-extrabold text-rose-950 tabular-nums break-words">${formatAngka(c.docs_total)} <span class="text-base sm:text-lg font-bold text-rose-900/70">Berkas</span></p>
      <p class="mt-3 sm:mt-4 text-xs text-rose-900/70">${formatAngka(c.docs_new)} dokumen (7p/30h) · ${formatPersen(c.docs_growth)} vs periode sebelumnya</p>
    </div>

    <div class="min-w-0 rounded-2xl bg-slate-900 text-white p-5 sm:p-6 sm:col-span-2 lg:col-span-1">
      <div class="flex items-start justify-between gap-3">
        <p class="text-[11px] font-bold tracking-wide text-white/70 leading-snug">PENDAPATAN TOKEN BULAN INI</p>
        <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="13" rx="2"></rect><path d="M2 10h20M6 15h4"></path></svg>
        </div>
      </div>
      <p class="mt-3 text-2xl sm:text-3xl font-extrabold tabular-nums break-words">${formatRupiah(c.revenue_month)}</p>
      <button data-goto="view-transactions" class="mt-3 sm:mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 transition-colors">
        Buka Laporan Finansial
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
      </button>
      <p class="mt-3 text-[10px] text-white/50">Pembayaran masih mode simulasi (payment gateway riil belum terpasang).</p>
    </div>`;
}

// ── Tabel aktivitas (paged server-side) ──────────────────────────────

function activityRowsHtml(a: ActivitiesBlock): string {
  const rows = visibleRows(a.rows);
  if (rows.length === 0) {
    return `<tr><td colspan="5" class="text-center text-slate-400 py-10">Tidak ada aktivitas yang cocok dengan filter.</td></tr>`;
  }
  return rows
    .map(
      (r) => `
      <tr class="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
        <td class="py-3 px-2">
          <div class="flex items-center gap-3 min-w-0">
            ${r.avatar ? `<img src="${esc(r.avatar)}" class="w-9 h-9 rounded-full object-cover shrink-0" alt="">` : initialAvatar(r.name)}
            <div class="leading-tight min-w-0">
              <p class="font-bold text-slate-800 truncate">${esc(r.name)}</p>
              <p class="text-[11px] text-slate-400 truncate">${esc(r.email)}</p>
            </div>
          </div>
        </td>
        <td class="py-3 px-2"><span class="inline-flex items-center gap-2 font-semibold text-slate-700"><span class="w-1.5 h-1.5 rounded-full ${r.status_ok ? "bg-emerald-500" : "bg-rose-400"} shrink-0"></span>${esc(r.activity)}</span></td>
        <td class="py-3 px-2 text-slate-500 hidden md:table-cell">${esc(r.detail)}</td>
        <td class="py-3 px-2 whitespace-nowrap text-slate-500">${esc(formatWaktu(r.created_at))}</td>
        <td class="py-3 px-2 text-right">
          <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${r.status_ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}">
            <span class="w-1.5 h-1.5 rounded-full ${r.status_ok ? "bg-emerald-500" : "bg-rose-500"}"></span>${esc(r.status)}
          </span>
        </td>
      </tr>`,
    )
    .join("");
}

/** Kartu ringkas per aktivitas — dipakai di mobile agar tidak perlu scroll horizontal. */
function activityCardsHtml(a: ActivitiesBlock): string {
  const rows = visibleRows(a.rows);
  if (rows.length === 0) {
    return `<p class="text-center text-slate-400 py-8 text-sm">Tidak ada aktivitas yang cocok dengan filter.</p>`;
  }
  return rows
    .map(
      (r) => `
      <div class="rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3">
        <div class="flex items-start gap-3 min-w-0">
          ${r.avatar ? `<img src="${esc(r.avatar)}" class="w-9 h-9 rounded-full object-cover shrink-0" alt="">` : initialAvatar(r.name)}
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="font-bold text-slate-800 text-sm truncate">${esc(r.name)}</p>
                <p class="text-[11px] text-slate-400 truncate">${esc(r.email)}</p>
              </div>
              <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold shrink-0 ${r.status_ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}">
                <span class="w-1.5 h-1.5 rounded-full ${r.status_ok ? "bg-emerald-500" : "bg-rose-500"}"></span>${esc(r.status)}
              </span>
            </div>
            <p class="mt-2 text-xs font-semibold text-slate-700 break-words">${esc(r.activity)}</p>
            <p class="text-[11px] text-slate-400 mt-0.5 break-words">${esc(r.detail)}</p>
            <p class="text-[11px] text-slate-400 mt-1">${esc(formatWaktu(r.created_at))}</p>
          </div>
        </div>
      </div>`,
    )
    .join("");
}

function renderPager(page: number, total: number): string {
  const win: number[] = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(total, from + 4);
  for (let i = from; i <= to; i++) win.push(i);

  const base = "w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-colors";
  return `
    <button data-page="${Math.max(1, page - 1)}" ${page === 1 ? "disabled" : ""} class="${base} border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">&lt;</button>
    ${page > 3 ? `<span class="px-1 text-slate-400">…</span>` : ""}
    ${win
      .map(
        (n) =>
          `<button data-page="${n}" aria-current="${n === page ? "page" : "false"}" class="${base} ${n === page ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}">${n}</button>`,
      )
      .join("")}
    ${total > to ? `<span class="px-1 text-slate-400">…</span><button data-page="${total}" class="${base} border border-slate-200 text-slate-600 hover:bg-slate-50">${total}</button>` : ""}
    <button data-page="${Math.min(total, page + 1)}" ${page === total ? "disabled" : ""} class="${base} bg-slate-900 text-white disabled:opacity-40 disabled:cursor-not-allowed">&gt;</button>`;
}

// ── Grafik garis SVG (dua seri: pengguna baru & dokumen) ─────────────

function chartWidth(): number {
  const box = document.getElementById("dash-chart");
  const w = box?.clientWidth ?? 0;
  return w > 0 ? w : 640;
}

/**
 * Chart digambar pada skala 1:1 dengan lebar kontainer (viewBox = lebar px),
 * sehingga teks tetap tajam & terbaca di mobile (tidak ikut mengecil).
 */
function renderChart(chart: ChartPoint[], width: number): string {
  if (chart.length === 0) {
    return `<p class="text-sm text-slate-400 py-10 text-center">Belum ada data pada rentang waktu ini.</p>`;
  }
  const W = Math.max(280, Math.round(width));
  const H = W < 480 ? 200 : 240;
  const padL = W < 480 ? 34 : 44;
  const padR = 14;
  const padT = 22;
  const padB = 34;

  const max = Math.max(1, ...chart.map((p) => Math.max(p.users, p.docs)));
  const stepX = (): number =>
    chart.length === 1 ? (W - padL - padR) / 2 : (W - padL - padR) / (chart.length - 1);

  const point = (v: number, i: number): [number, number] => [
    padL + i * stepX(),
    H - padB - (v / max) * (H - padT - padB),
  ];

  const line = (key: "users" | "docs"): string =>
    chart
      .map((p, i) => {
        const [x, y] = point(p[key], i);
        return `${x},${y}`;
      })
      .join(" ");

  const dots = (key: "users" | "docs", color: string): string =>
    chart
      .map((p, i) => {
        const [x, y] = point(p[key], i);
        return `<circle cx="${x}" cy="${y}" r="4.5" fill="white" stroke="${color}" stroke-width="3"></circle>`;
      })
      .join("");

  const fmt = (v: number): string =>
    v >= 1000 ? `${(v / 1000).toFixed(1).replace(".0", "")}k` : String(v);

  // Label sumbu X: pada layar sempit dengan banyak titik, label ganjil
  // disembunyikan lewat CSS (.dash-x-odd) agar tidak bertumpuk. Label pertama
  // & terakhir di-anchor ke dalam agar tidak terpotong tepi SVG.
  const dense = chart.length > 5 && W < 560;
  const last = chart.length - 1;
  const xLabels = chart
    .map((p, i) => {
      const x = padL + i * stepX();
      const odd = dense && i % 2 === 1 && i !== last;
      const anchor = i === 0 ? "start" : i === last ? "end" : "middle";
      return `<text x="${x}" y="${H - 11}" text-anchor="${anchor}" class="fill-slate-400 dash-x-label${odd ? " dash-x-odd" : ""}" font-size="11" font-weight="600">${esc(p.label)}</text>`;
    })
    .join("");

  const yTicks = [0, 0.5, 1]
    .map((f) => {
      const y = H - padB - f * (H - padT - padB);
      return `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#f1f5f9" stroke-width="1"></line>
              <text x="${padL - 8}" y="${y + 4}" text-anchor="end" class="fill-slate-400" font-size="10">${fmt(max * f)}</text>`;
    })
    .join("");

  const areaPoints = `${padL},${H - padB} ${line("docs")} ${padL + (chart.length - 1) * stepX()},${H - padB}`;

  // viewBox memakai lebar kontainer sebenarnya (1:1) agar teks tetap tajam.
  // Tanpa atribut width/height: ukuran mengikuti CSS (w-full h-auto) sehingga
  // rasio tetap terjaga walau lebar berubah sebelum JS menggambar ulang.
  return `
  <svg viewBox="0 0 ${W} ${H}" class="block w-full h-auto dash-chart-reveal" role="img"
       aria-label="Grafik pertumbuhan pengguna dan dokumen">
    <defs>
      <linearGradient id="dashAreaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0f172a" stop-opacity="0.10"></stop>
        <stop offset="100%" stop-color="#0f172a" stop-opacity="0"></stop>
      </linearGradient>
    </defs>
    ${yTicks}
    <polygon points="${areaPoints}" fill="url(#dashAreaGrad)"></polygon>
    <polyline points="${line("docs")}" fill="none" stroke="#0f172a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
    <polyline points="${line("users")}" fill="none" stroke="#059669" stroke-width="2.5" stroke-dasharray="1 7" stroke-linecap="round"></polyline>
    ${dots("docs", "#0f172a")}
    ${dots("users", "#059669")}
    ${xLabels}
  </svg>`;
}

// ── Distribusi template (bar tumpuk) ─────────────────────────────────

const DIST_COLORS = ["bg-blue-900", "bg-emerald-500", "bg-rose-400", "bg-amber-300", "bg-teal-400", "bg-violet-400"];

function renderDistribution(u: Analytics["template_usage"]): string {
  if (u.total === 0) {
    return `<p class="text-sm text-slate-400 py-8 text-center">Belum ada dokumen dengan layout tercatat.</p>
            <p class="text-[11px] text-slate-400 text-center">Layout tercatat setelah pengguna menyimpan CV (FAKTA F8).</p>`;
  }
  const bar = u.items
    .map(
      (it, i) =>
        `<div class="${DIST_COLORS[i % DIST_COLORS.length]} h-2.5 rounded-full" style="width:${it.pct}%"></div>`,
    )
    .join("");

  const rows = u.items
    .map(
      (it, i) => `
      <div class="flex items-start justify-between gap-2 py-2.5 border-b border-slate-50 last:border-0">
        <div class="flex items-start gap-2.5 min-w-0">
          <span class="w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${DIST_COLORS[i % DIST_COLORS.length]}"></span>
          <div class="min-w-0">
            <p class="text-sm font-bold text-slate-800 break-words">${esc(it.label)}</p>
            <p class="text-[11px] text-slate-400 break-words">${formatAngka(it.total)} dokumen · layout <span class="font-mono">${esc(it.layout)}</span></p>
          </div>
        </div>
        <span class="text-sm font-extrabold text-slate-800 shrink-0">${it.pct.toLocaleString("id-ID")}%</span>
      </div>`,
    )
    .join("");

  return `<div class="flex gap-1 overflow-hidden rounded-full">${bar}</div><div class="mt-3">${rows}</div>`;
}

// ── Unduh Ringkasan Mingguan (CSV dari data terpanggil terakhir) ─────

function downloadSummary(e: Event, d: Analytics): void {
  const btn = e.currentTarget as HTMLButtonElement;
  btn.disabled = true;

  const rows: string[][] = [];
  rows.push(["jagoCV — Ringkasan Mingguan Admin", "", ""]);
  rows.push(["Dibuat", new Date().toLocaleString("id-ID"), ""]);
  rows.push([]);
  rows.push(["Metrik", "Nilai"]);
  rows.push(["Total Pengguna (non-admin)", String(d.cards.users_total)]);
  rows.push(["Pengguna Aktif", String(d.cards.users_active)]);
  rows.push(["Akun Ditangguhkan", String(d.cards.users_suspended)]);
  rows.push(["Total Dokumen", String(d.cards.docs_total)]);
  rows.push(["Pendapatan Token Bulan Ini", `Rp${d.cards.revenue_month}`]);
  rows.push([]);
  rows.push(["Rentang", "Pengguna Baru", "Dokumen Baru"]);
  for (const p of d.chart) rows.push([p.label, String(p.users), String(p.docs)]);

  const csv = rows
    .map((r) => r.map((c) => `"${(c ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `jagocv-ringkasan-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);

  btn.disabled = false;
  showToast("Ringkasan mingguan diunduh.");
}

// ── Util ─────────────────────────────────────────────────────────────

const pendingSwap = new WeakMap<HTMLElement, number>();

/**
 * Ganti isi elemen dengan cross-fade singkat. Elemen & layout tidak dibongkar,
 * jadi tinggi halaman relatif stabil → posisi scroll tidak melompat.
 */
function swapHtml(target: HTMLElement | null, html: string, fade = true): void {
  if (!target) return;
  const prev = pendingSwap.get(target);
  if (prev !== undefined) window.clearTimeout(prev);

  if (!fade || prefersReducedMotion()) {
    target.classList.remove("is-fading");
    target.innerHTML = html;
    return;
  }

  target.classList.add("is-fading");
  const t = window.setTimeout(() => {
    target.innerHTML = html;
    void target.offsetHeight; // paksa reflow agar transisi opacity berjalan
    target.classList.remove("is-fading");
    pendingSwap.delete(target);
  }, FADE_MS);
  pendingSwap.set(target, t);
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function debounce(fn: () => void, ms: number): () => void {
  let t: number | undefined;
  return () => {
    window.clearTimeout(t);
    t = window.setTimeout(fn, ms);
  };
}
