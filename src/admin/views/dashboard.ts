/**
 * Menu 1 — Dashboard & Analytics (UI terkunci ke desain patokan).
 * Semua angka dari /backend/admin/analytics.php (DB), bukan mockup PNG.
 */
import { adminApi } from "../api";
import { formatAngka, formatRupiah, formatPersen, formatWaktu } from "../format";
import { esc, initialAvatar, skeletonRows, showToast, setButtonLoading } from "../ui";
import { showAdminView } from "../shell";

interface ChartPoint {
  label: string;
  users: number;
  docs: number;
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
  activities: {
    rows: {
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
    }[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
  generated_at: string;
}

const el = (): HTMLElement => document.getElementById("view-dash") as HTMLElement;

const state = {
  period: "30d" as "7d" | "30d",
  page: 1,
  data: null as Analytics | null,
  q: "",
  status: "all",
};

let pollTimer: number | undefined;
let loadToken = 0;

export function mountDashboardView(): void {
  window.addEventListener("admin-search", ((e: CustomEvent) => {
    if (el().classList.contains("hidden")) return;
    state.q = String(e.detail || "").toLowerCase();
    renderActivities();
  }) as EventListener);

  void load();
  ensurePolling();
}

/** Polling 30 detik sesuai badge "LIVE WORKSPACE MODE" — hanya saat view aktif & tab terlihat. */
function ensurePolling(): void {
  if (pollTimer !== undefined) return;
  pollTimer = window.setInterval(() => {
    if (!el().classList.contains("hidden") && document.visibilityState === "visible") {
      void load(true);
    }
  }, 30_000);
}

async function load(silent = false): Promise<void> {
  const host = el();
  if (!silent) {
    host.innerHTML = `<div class="animate-pulse"><div class="h-8 w-96 rounded-lg bg-slate-200 mb-6"></div>${skeletonRows(6)}</div>`;
  }

  const token = ++loadToken;
  try {
    const data = await adminApi<Analytics>("analytics.php", {
      query: { period: state.period, page: state.page, per_page: 5 },
    });
    if (token !== loadToken) return; // respons lama usang
    state.data = data;
    state.page = data.activities.page;
    render(host, data);
  } catch (e) {
    if (token !== loadToken) return;
    if (!silent && host.innerHTML === "" || !silent) {
      if (!silent) {
        host.innerHTML = `<div class="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">${esc((e as Error).message)}</div>`;
      } else {
        showToast((e as Error).message, "error");
      }
    }
  }
}

function render(host: HTMLElement, d: Analytics): void {
  const c = d.cards;
  host.innerHTML = `
    <!-- ── Header halaman (D3) ─────────────────────────────────── -->
    <div class="mb-7">
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-[11px] font-bold">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span> LIVE WORKSPACE MODE
        </span>
        <span class="text-xs text-slate-400">Pembaruan otomatis tiap 30 detik</span>
      </div>
      <div class="flex flex-wrap items-end justify-between gap-4 mt-3">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Selamat Datang, Admin JagoCV!</h1>
          <p class="text-sm text-slate-500 mt-1 max-w-xl">Pantau kesehatan sistem, performa template, metrik konversi, dan pertumbuhan pengguna secara langsung.</p>
        </div>
        <button id="dash-download" class="inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-5 py-2.5 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"></path></svg>
          Unduh Ringkasan Mingguan
        </button>
      </div>
    </div>

    <!-- ── 3 kartu statistik (D4) ───────────────────────────────── -->
    <div class="grid md:grid-cols-3 gap-5">
      <div class="rounded-2xl bg-[#d3f3e5] p-6 relative overflow-hidden">
        <div class="absolute top-5 right-5 w-12 h-12 rounded-full bg-white/60 flex items-center justify-center text-emerald-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 7-7M14 8h6v6"></path></svg>
        </div>
        <p class="text-[11px] font-bold tracking-wide text-emerald-900/80">TOTAL PENGGUNA AKTIF</p>
        <p class="mt-3 text-4xl font-extrabold text-emerald-950">${formatAngka(c.users_active)} <span class="text-lg font-bold text-emerald-800/70">User</span></p>
        <p class="mt-4 text-xs text-emerald-900/70">${formatAngka(c.users_new)} user baru (7p/30h) · ${formatPersen(c.users_growth)} vs periode sebelumnya</p>
      </div>

      <div class="rounded-2xl bg-[#fbd9dd] p-6 relative overflow-hidden">
        <div class="absolute top-5 right-5 w-12 h-12 rounded-full bg-white/70 flex items-center justify-center text-rose-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
        </div>
        <p class="text-[11px] font-bold tracking-wide text-rose-900/80">TOTAL DOKUMEN DIGENERATE</p>
        <p class="mt-3 text-4xl font-extrabold text-rose-950">${formatAngka(c.docs_total)} <span class="text-lg font-bold text-rose-900/70">Berkas</span></p>
        <p class="mt-4 text-xs text-rose-900/70">${formatAngka(c.docs_new)} dokumen (7p/30h) · ${formatPersen(c.docs_growth)} vs periode sebelumnya</p>
      </div>

      <div class="rounded-2xl bg-slate-900 text-white p-6 relative">
        <div class="absolute top-5 right-5 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="13" rx="2"></rect><path d="M2 10h20M6 15h4"></path></svg>
        </div>
        <p class="text-[11px] font-bold tracking-wide text-white/70">PENDAPATAN TOKEN BULAN INI</p>
        <p class="mt-3 text-3xl font-extrabold">${formatRupiah(c.revenue_month)}</p>
        <button data-goto="view-transactions" class="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 transition-colors">
          Buka Laporan Finansial
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
        </button>
        <p class="mt-3 text-[10px] text-white/50">Pembayaran masih mode simulasi (payment gateway riil belum terpasang).</p>
      </div>
    </div>

    <!-- ── Grafik + distribusi ─────────────────────────────────── -->
    <div class="grid lg:grid-cols-3 gap-5 mt-6">
      <div class="lg:col-span-2 rounded-2xl bg-white border border-slate-100 p-6">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-extrabold text-slate-900">Statistik Pertumbuhan Pengguna &amp; Dokumen</h2>
            <p class="text-xs text-slate-400 mt-0.5">Angka riil dari database, menyesuaikan rentang waktu</p>
          </div>
          <div class="flex rounded-full bg-slate-100 p-1 text-xs font-bold" id="dash-period-toggle">
            <button data-period="7d" class="px-3 py-1.5 rounded-full transition-colors">7 Hari</button>
            <button data-period="30d" class="px-3 py-1.5 rounded-full transition-colors">30 Hari Terakhir</button>
          </div>
        </div>
        <div class="mt-5">${renderChart(d.chart)}</div>
        <div class="flex items-center gap-5 mt-2 text-xs font-semibold text-slate-500">
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Pengguna baru</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-slate-900"></span> Dokumen dibuat</span>
        </div>
      </div>

      <div class="rounded-2xl bg-white border border-slate-100 p-6">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-extrabold text-slate-900">Distribusi Template</h2>
            <p class="text-xs text-slate-400 mt-0.5">Proporsi pemakaian desain CV</p>
          </div>
          <button data-goto="view-templates" class="rounded-full bg-sky-100 text-sky-800 text-xs font-bold px-4 py-2 hover:bg-sky-200 transition-colors">Lihat Template</button>
        </div>
        <div class="mt-5">${renderDistribution(d.template_usage)}</div>
      </div>
    </div>

    <!-- ── Tabel aktivitas (D7/D8) ─────────────────────────────── -->
    <div id="dash-activities" class="mt-6"></div>`;

  // — Binding interaksi —
  host.querySelectorAll<HTMLButtonElement>("[data-goto]").forEach((b) =>
    b.addEventListener("click", () => showAdminView(b.dataset.goto || "")),
  );

  const tg = host.querySelector("#dash-period-toggle") as HTMLElement;
  updatePeriodToggle(tg, state.period);
  tg.querySelectorAll<HTMLButtonElement>("[data-period]").forEach((b) =>
    b.addEventListener("click", () => {
      state.period = b.dataset.period as "7d" | "30d";
      void load();
    }),
  );

  // Grafik lama harus digambar ulang pada toggle — load() sudah merender ulang semua.
  (host.querySelector("#dash-download") as HTMLButtonElement).addEventListener("click", (e) =>
    void downloadSummary(e, d),
  );

  renderActivities();
}

function updatePeriodToggle(host: HTMLElement, period: "7d" | "30d"): void {
  host.querySelectorAll<HTMLButtonElement>("[data-period]").forEach((b) => {
    const on = b.dataset.period === period;
    b.classList.toggle("bg-slate-900", on);
    b.classList.toggle("text-white", on);
    b.classList.toggle("text-slate-500", !on);
  });
}

// ── Grafik garis SVG (dua seri: pengguna baru & dokumen) ─────────────

function renderChart(chart: ChartPoint[]): string {
  if (chart.length === 0) {
    return `<p class="text-sm text-slate-400 py-10 text-center">Belum ada data pada rentang waktu ini.</p>`;
  }
  const W = 640;
  const H = 240;
  const padL = 44;
  const padR = 20;
  const padT = 24;
  const padB = 40;
  const max = Math.max(1, ...chart.map((p) => Math.max(p.users, p.docs)));
  const stepX = (n: number): number =>
    chart.length === 1 ? (W - padL - padR) / 2 : (W - padL - padR) / (chart.length - 1);

  const point = (v: number, i: number): [number, number] => [
    padL + i * stepX(i),
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
        return `<circle cx="${x}" cy="${y}" r="5" fill="white" stroke="${color}" stroke-width="3"></circle>`;
      })
      .join("");

  const fmt = (v: number): string =>
    v >= 1000 ? `${(v / 1000).toFixed(1).replace(".0", "")}k` : String(v);

  const xLabels = chart
    .map((p, i) => {
      const x = padL + i * stepX(i);
      return `<text x="${x}" y="${H - 12}" text-anchor="middle" class="fill-slate-400" font-size="11" font-weight="600">${esc(p.label)}</text>`;
    })
    .join("");

  const yTicks = [0, 0.5, 1]
    .map((f) => {
      const y = H - padB - f * (H - padT - padB);
      return `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#f1f5f9" stroke-width="1"></line>
              <text x="${padL - 10}" y="${y + 4}" text-anchor="end" class="fill-slate-300" font-size="10">${fmt(max * f)}</text>`;
    })
    .join("");

  return `
  <svg viewBox="0 0 ${W} ${H}" class="w-full" role="img" aria-label="Grafik pertumbuhan pengguna dan dokumen">
    ${yTicks}
    <polyline points="${line("docs")}" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"></polyline>
    <polyline points="${line("users")}" fill="none" stroke="#059669" stroke-width="3" stroke-dasharray="1 7" stroke-linecap="round"></polyline>
    ${dots("docs", "#0f172a")}
    ${dots("users", "#059669")}
    ${xLabels}
  </svg>`;
}

// ── Distribusi template (bar tumpuk) ─────────────────────────────────

const DIST_COLORS = ["bg-blue-900", "bg-emerald-500", "bg-rose-400", "bg-amber-300", "bg-teal-400", "bg-violet-400"];
const DOT_COLORS = ["bg-blue-900", "bg-emerald-500", "bg-rose-400", "bg-amber-300", "bg-teal-400", "bg-violet-400"];

function renderDistribution(u: Analytics["template_usage"]): string {
  if (u.total === 0) {
    return `<p class="text-sm text-slate-400 py-8 text-center">Belum ada dokumen dengan layout tercatat.</p>
            <p class="text-[11px] text-slate-400 -mt-6 text-center">Layout tercatat setelah pengguna menyimpan CV (FAKTA F8).</p>`;
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
        <div class="flex items-start gap-2.5">
          <span class="w-2.5 h-2.5 rounded-full mt-1 ${DOT_COLORS[i % DOT_COLORS.length]}"></span>
          <div>
            <p class="text-sm font-bold text-slate-800">${esc(it.label)}</p>
            <p class="text-[11px] text-slate-400">${formatAngka(it.total)} dokumen · layout <span class="font-mono">${esc(it.layout)}</span></p>
          </div>
        </div>
        <span class="text-sm font-extrabold text-slate-800">${it.pct.toLocaleString("id-ID")}%</span>
      </div>`,
    )
    .join("");

  return `<div class="flex gap-1">${bar}</div><div class="mt-3">${rows}</div>`;
}

// ── Tabel aktivitas (paged server-side) ──────────────────────────────

function renderActivities(): void {
  const host = document.getElementById("dash-activities");
  const d = state.data;
  if (!host || !d) return;

  const a = d.activities;
  const rows = a.rows.filter(
    (r) =>
      (state.q === "" ||
        r.name.toLowerCase().includes(state.q) ||
        r.email.toLowerCase().includes(state.q) ||
        r.activity.toLowerCase().includes(state.q) ||
        r.detail.toLowerCase().includes(state.q)) &&
      (state.status === "all" || (state.status === "sukses" ? r.status_ok : !r.status_ok)),
  );

  host.innerHTML = `
    <div class="rounded-2xl bg-white border border-slate-100 p-6">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-lg font-extrabold text-slate-900">Aktivitas Platform &amp; Transaksi Terkini</h2>
          <p class="text-xs text-slate-400 mt-0.5">Generate dokumen dan pembelian poin pengguna (sumber: point_transactions &amp; documents)</p>
        </div>
        <div class="flex items-center gap-2">
          <input id="dash-act-search" type="text" placeholder="Filter pengguna / modul…" value="${esc(state.q)}"
                 class="rounded-full bg-slate-100 border border-transparent px-4 py-2 text-sm outline-none focus:border-slate-300 w-56">
          <select id="dash-act-status" class="rounded-full bg-slate-100 border border-transparent px-4 py-2 text-sm font-semibold text-slate-600 outline-none cursor-pointer">
            <option value="all">Semua Status</option>
            <option value="sukses" ${state.status === "sukses" ? "selected" : ""}>Sukses</option>
            <option value="gagal" ${state.status === "gagal" ? "selected" : ""}>Gagal/Pending</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto mt-4">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-[11px] tracking-wide text-slate-400 border-b border-slate-100">
              <th class="text-left font-bold py-3 px-2">PENGUNA</th>
              <th class="text-left font-bold py-3 px-2">AKTIVITAS</th>
              <th class="text-left font-bold py-3 px-2 hidden md:table-cell">DETAIL MODUL</th>
              <th class="text-left font-bold py-3 px-2 whitespace-nowrap">WAKTU</th>
              <th class="text-right font-bold py-3 px-2">STATUS</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length === 0
              ? `<tr><td colspan="5" class="text-center text-slate-400 py-10">Tidak ada aktivitas yang cocok dengan filter.</td></tr>`
              : rows
                  .map(
                    (r) => `
              <tr class="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                <td class="py-3 px-2">
                  <div class="flex items-center gap-3">
                    ${r.avatar ? `<img src="${esc(r.avatar)}" class="w-9 h-9 rounded-full object-cover shrink-0" alt="">` : initialAvatar(r.name)}
                    <div class="leading-tight">
                      <p class="font-bold text-slate-800">${esc(r.name)}</p>
                      <p class="text-[11px] text-slate-400">${esc(r.email)}</p>
                    </div>
                  </div>
                </td>
                <td class="py-3 px-2"><span class="inline-flex items-center gap-2 font-semibold text-slate-700"><span class="w-1.5 h-1.5 rounded-full ${r.status_ok ? "bg-emerald-500" : "bg-rose-400"}"></span>${esc(r.activity)}</span></td>
                <td class="py-3 px-2 text-slate-500 hidden md:table-cell">${esc(r.detail)}</td>
                <td class="py-3 px-2 whitespace-nowrap text-slate-500">${esc(formatWaktu(r.created_at))}</td>
                <td class="py-3 px-2 text-right">
                  <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${r.status_ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}">
                    <span class="w-1.5 h-1.5 rounded-full ${r.status_ok ? "bg-emerald-500" : "bg-rose-500"}"></span>${esc(r.status)}
                  </span>
                </td>
              </tr>`,
                  )
                  .join("")}
          </tbody>
        </table>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 mt-4">
        <p class="text-xs text-slate-400">Menampilkan ${rows.length} dari ${formatAngka(a.total)} riwayat (halaman ${a.page} dari ${a.total_pages})</p>
        <div class="flex items-center gap-1" id="dash-act-pager">
          ${renderPager(a.page, a.total_pages)}
        </div>
      </div>
    </div>`;

  // — Binding tabel —
  const search = host.querySelector("#dash-act-search") as HTMLInputElement;
  search.addEventListener("input", debounce(() => {
    state.q = search.value.toLowerCase();
    renderActivities();
  }, 250));

  (host.querySelector("#dash-act-status") as HTMLSelectElement).addEventListener("change", (e) => {
    state.status = (e.target as HTMLSelectElement).value;
    renderActivities();
  });

  host.querySelectorAll<HTMLButtonElement>("#dash-act-pager [data-page]").forEach((b) =>
    b.addEventListener("click", () => {
      state.page = Number(b.dataset.page);
      void load();
    }),
  );
}

function renderPager(page: number, total: number): string {
  const win: number[] = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(total, from + 4);
  for (let i = from; i <= to; i++) win.push(i);

  return `
    <button data-page="${Math.max(1, page - 1)}" ${page === 1 ? "disabled" : ""} class="w-8 h-8 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center">&lt;</button>
    ${page > 3 ? `<span class="px-1 text-slate-400">…</span>` : ""}
    ${win
      .map(
        (n) =>
          `<button data-page="${n}" class="w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${n === page ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}">${n}</button>`,
      )
      .join("")}
    ${total > to ? `<span class="px-1 text-slate-400">…</span><button data-page="${total}" class="w-8 h-8 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center">${total}</button>` : ""}
    <button data-page="${Math.min(total, page + 1)}" ${page === total ? "disabled" : ""} class="w-8 h-8 rounded-full bg-slate-900 text-white disabled:opacity-40 flex items-center justify-center">&gt;</button>`;
}

// ── Unduh Ringkasan Mingguan (CSV dari data terpanggil terakhir) ─────

function downloadSummary(e: Event, d: Analytics): void {
  const btn = e.currentTarget as HTMLButtonElement;
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
  void btn;
  setButtonLoading(btn, false);
  showToast("Ringkasan mingguan diunduh.");
}

function debounce(fn: () => void, ms: number): () => void {
  let t: number | undefined;
  return () => {
    window.clearTimeout(t);
    t = window.setTimeout(fn, ms);
  };
}
