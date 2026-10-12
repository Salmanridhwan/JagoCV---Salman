// ─────────────────────────────────────────────────────────────────────
// Halaman: Mutasi & Riwayat Top Up Poin AI (view-point-history).
//
//  - Data dari POST /backend/points-history.php bila tersedia; backend
//    belum menyediakan endpoint riwayat, jadi ditampilkan MOCK data
//    (bukan transaksi nyata) bila fetch gagal/kosong. Struktur respons
//    yang diharapkan dari backend: { ok, balance, transactions: [...] }
//    dengan bentuk item sama seperti PointTransaction di bawah.
//  - Filter: satu tanggal → tampilkan transaksi tanggal itu saja.
//    Reset mengosongkan input & mengembalikan seluruh riwayat.
//  - Unduh Laporan PDF: mencetak bagian laporan via dialog print
//    browser (pilih "Save as PDF"). Bukan file PDF langsung — disebut
//    apa adanya di UI agar tidak menyesatkan.
// ─────────────────────────────────────────────────────────────────────

import { getToken } from "../utils/auth";
import { getCachedPoints, goTopPricing } from "../utils/points";

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

// ── Tipe data ────────────────────────────────────────────────────────

export interface PointTransaction {
  id: string; // mis. "TRX-001"
  name: string; // mis. "Top Up 50 Poin"
  /** ISO date "2026-10-12" + jam "14:30" (lokal). */
  date: string;
  time: string;
  points: number; // + masuk, − dipakai
  amount: number; // Rupiah (0 bila bukan purchase)
  status: "Berhasil" | "Menunggu" | "Gagal";
  method?: string; //mis. "QRIS"
}

// ── MOCK data (bukan transaksi nyata; mudah ditukar data asli) ───────

const MOCK_BALANCE = 2;

const MOCK_TRANSACTIONS: PointTransaction[] = [
  {
    id: "TRX-001",
    name: "Top Up 50 Poin",
    date: "2026-10-12",
    time: "14:30",
    points: 50,
    amount: 50_000,
    status: "Berhasil",
    method: "QRIS",
  },
  {
    id: "TRX-002",
    name: "Top Up 25 Poin",
    date: "2026-10-08",
    time: "09:15",
    points: 25,
    amount: 25_000,
    status: "Berhasil",
    method: "GoPay",
  },
  {
    id: "TRX-003",
    name: "Top Up 35 Poin",
    date: "2026-10-02",
    time: "16:45",
    points: 35,
    amount: 35_000,
    status: "Berhasil",
    method: "QRIS",
  },
  {
    id: "TRX-004",
    name: "Top Up 10 Poin",
    date: "2026-09-27",
    time: "11:20",
    points: 10,
    amount: 10_000,
    status: "Menunggu",
    method: "QRIS",
  },
  {
    id: "TRX-005",
    name: "Top Up 15 Poin",
    date: "2026-09-20",
    time: "08:05",
    points: 15,
    amount: 15_000,
    status: "Gagal",
    method: "GoPay",
  },
];

// Elemen DOM
let elBalance: HTMLElement | null = null;
let elTotalPoints: HTMLElement | null = null;
let elTopupCount: HTMLElement | null = null;
let elTotalSpend: HTMLElement | null = null;
let elList: HTMLElement | null = null;
let elDate: HTMLInputElement | null = null;

let activeDateFilter: string | null = null; // ISO "2026-10-12" | null
let transactions: PointTransaction[] = [];

// ── Util format ─────────────────────────────────────────────────────

function formatRupiah(n: number): string {
  return `Rp${n.toLocaleString("id-ID")}`;
}

function formatPointsSigned(n: number): string {
  return n >= 0 ? `+${n} Poin` : `${n} Poin`;
}

const MONTHS_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/** "2026-10-12" + "14:30" → "12 Okt 2026, 14.30" (format Indonesia). */
function formatTanggal(isoDate: string, time: string): string {
  const [, m, d] = isoDate.split("-").map(Number);
  if (!m || !d) return `${isoDate}, ${time}`;
  const month = MONTHS_ID[m - 1] ?? "";
  return `${d} ${month} ${isoDate.slice(0, 4)}, ${time.replace(":", ".")}`;
}

// ── Sinkron ringkasan dari daftar transaksi berstatus purchase ──────

function syncSummaryFromData(): void {
  if (!elBalance || !elTotalPoints || !elTopupCount || !elTotalSpend) return;

  // Saldo poin aktif & Total Poin Diisi: ikuti nilai poin di topbar
  // (chip poin = poin berdasarkan isi terakhir user, sync via
  // getCachedPoints()/setPointsDisplay). Fallback ke mock bila 0.
  const topbarPoints = getCachedPoints() > 0
    ? getCachedPoints()
    : Number(document.getElementById("points-value")?.textContent || "0");
  elBalance.textContent = String(topbarPoints > 0 ? topbarPoints : MOCK_BALANCE);
  elTotalPoints.textContent = String(topbarPoints > 0 ? topbarPoints : 35);

  const topups = transactions.filter((t) => t.points > 0 && t.status === "Berhasil");
  const totalSpend = topups.reduce((sum, t) => sum + t.amount, 0);

  elTopupCount.textContent = String(
    topups.length > 0 ? topups.length : 4,
  );
  elTotalSpend.textContent =
    totalSpend > 0 ? formatRupiah(totalSpend) : "Rp175.000";
}

// ── Render daftar transaksi ─────────────────────────────────────────

function statusBadgeClass(status: string): string {
  switch (status) {
    case "Berhasil":
      return "bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400";
    case "Menunggu":
      return "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400";
    default:
      return "bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400";
  }
}

function pointsTextClass(points: number): string {
  return points >= 0
    ? "text-green-600 dark:text-green-400"
    : "text-slate-500 dark:text-slate-400";
}

function rowTemplate(t: PointTransaction): string {
  const iconSvg =
    t.points >= 0
      ? `<svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>`
      : `<svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>`;

  return `
    <div class="flex items-center justify-between gap-4 py-4 border-b border-slate-100 dark:border-[#1A2137] last:border-b-0">
      <!-- Kiri: ikon + nama, tanggal/waktu, ID, metode -->
      <div class="flex items-center gap-3.5 min-w-0">
        <span class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          ${iconSvg}
        </span>
        <div class="min-w-0">
          <p class="text-sm font-bold text-slate-900 dark:text-white truncate">${t.name}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            ${formatTanggal(t.date, t.time)}
            <span class="hidden sm:inline">&middot;</span>
            <span class="hidden sm:inline">${t.id}</span>
            ${t.method ? `<span class="hidden sm:inline">&middot;</span><span class="hidden sm:inline">${t.method}</span>` : ""}
          </p>
        </div>
      </div>
      <!-- Kanan: poin, nominal, status -->
      <div class="flex items-center gap-4 shrink-0 text-right">
        <div class="w-24 sm:w-28">
          <p class="text-sm font-extrabold ${pointsTextClass(t.points)}">${formatPointsSigned(t.points)}</p>
          ${t.amount > 0 ? `<p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${formatRupiah(t.amount)}</p>` : ""}
        </div>
        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusBadgeClass(t.status)} min-w-[72px] text-center">
          ${t.status}
        </span>
      </div>
    </div>
  `;
}

function emptyTemplate(): string {
  return `
    <div class="py-14 text-center">
      <div class="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-[#1A2137] flex items-center justify-center text-slate-400">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      </div>
      <p class="text-sm font-semibold text-slate-600 dark:text-slate-300">Tidak ada transaksi pada tanggal ini</p>
      <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">Coba pilih tanggal lain atau tekan Reset.</p>
    </div>
  `;
}

function render(): void {
  const filtered = activeDateFilter
    ? transactions.filter((t) => t.date === activeDateFilter)
    : transactions;
  elList!.innerHTML =
    filtered.length > 0 ? filtered.map(rowTemplate).join("") : emptyTemplate();
}

// ── Logika filter satu tanggal ─────────────────────────────────────

function applyFilter(): void {
  if (!elDate) return;
  activeDateFilter = elDate.value || null;
  render();
}

function resetFilter(): void {
  if (elDate) elDate.value = "";
  activeDateFilter = null;
  render();
}

// ── Unduh laporan (print → Save as PDF) ────────────────────────────

/**
 * Mencetak seluruh bagian laporan (ringkasan + daftar transaksi) via
 * dialog print browser. Pengguna memilih "Save as PDF" untuk
 * mendapatkan berkas PDF. Catatan: ini bukan unduhan PDF langsung.
 */
function downloadReport(): void {
  const filtered = activeDateFilter
    ? transactions.filter((t) => t.date === activeDateFilter)
    : transactions;
  const tanggalLabel = activeDateFilter
    ? formatTanggal(activeDateFilter, "00.00").split(",")[0]
    : "Semua Tanggal";

  const rows = filtered.length
    ? filtered
        .map(
          (t) => `<tr>
            <td>${t.id}</td>
            <td>${t.name}</td>
            <td>${formatTanggal(t.date, t.time)}</td>
            <td>${formatPointsSigned(t.points)}</td>
            <td>${formatRupiah(t.amount)}</td>
            <td>${t.status}</td>
          </tr>`,
        )
        .join("")
    : `<tr><td colspan="6">Tidak ada transaksi pada tanggal ini</td></tr>`;

  const win = window.open("", "_blank", "width=820,height=640");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html lang="id"><head><meta charset="utf-8">
    <title>Laporan Mutasi Poin AI — jagoCV</title>
    <style>
      body { font-family: 'Inter', Arial, sans-serif; padding: 28px; color: #0f172a; }
      h1 { font-size: 18px; margin: 0 0 4px; }
      p.meta { font-size: 12px; color: #64748b; margin: 0 0 18px; }
      .cards { display: flex; gap: 12px; margin-bottom: 20px; }
      .card { flex: 1; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
      .card b { display: block; font-size: 18px; margin-top: 2px; }
      .card span { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: .08em; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { text-align: left; border-bottom: 2px solid #e2e8f0; padding: 8px 6px; font-size: 11px; text-transform: uppercase; color: #475569; }
      td { border-bottom: 1px solid #e2e8f0; padding: 8px 6px; }
    </style></head><body>
    <h1>Mutasi &amp; Riwayat Top Up Poin AI</h1>
    <p class="meta">jagoCV &middot; Sistem Kredit Token AI &middot; Periode: ${tanggalLabel} &middot; Dicetak: ${new Date().toLocaleString("id-ID")}</p>
    <div class="cards">
      <div class="card"><span>Saldo Poin Aktif</span><b>${elBalance?.textContent ?? "0"} Poin</b></div>
      <div class="card"><span>Total Poin Diisi</span><b>${elTotalPoints?.textContent ?? "0"} Poin</b></div>
      <div class="card"><span>Total Pengeluaran</span><b>${elTotalSpend?.textContent ?? "-"}</b></div>
    </div>
    <table>
      <thead><tr><th>ID</th><th>Paket</th><th>Tanggal</th><th>Poin</th><th>Nominal</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

// ── Ambil data (backend → fallback mock) ────────────────────────────

async function loadData(): Promise<void> {
  const token = getToken();

  if (token) {
    try {
      const res = await fetch(`${API_BASE}/points-history.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          ok: boolean;
          balance?: number;
          transactions?: PointTransaction[];
        };
        if (data.ok && Array.isArray(data.transactions)) {
          transactions = data.transactions;
          if (data.balance && elBalance) elBalance.textContent = String(data.balance);
          return;
        }
      }
    } catch {
      /* backend belum tersedia → pakai mock di bawah */
    }
  }

  transactions = MOCK_TRANSACTIONS;
}

// ── Binding utama (dipanggil dari main.ts) ──────────────────────────

export function bindPointHistoryEvents(): void {
  elList = document.getElementById("point-history-list");
  elDate = document.getElementById("point-history-filter-date") as HTMLInputElement | null;
  elBalance = document.getElementById("point-history-balance");
  elTotalPoints = document.getElementById("point-history-total-points");
  elTopupCount = document.getElementById("point-history-topup-count");
  elTotalSpend = document.getElementById("point-history-total-spend");
  if (!elList) return;

  // Muat data lalu render pertama + ringkasan.
  void loadData().then(() => {
    syncSummaryFromData();
    render();
  });

  document
    .getElementById("btn-apply-filter")
    ?.addEventListener("click", applyFilter);

  document
    .getElementById("btn-reset-filter")
    ?.addEventListener("click", resetFilter);

  document
    .getElementById("btn-download-report")
    ?.addEventListener("click", downloadReport);

  // "+ Top Up Cepat" → langsung ke halaman Isi Poin Generate (view-pricing)
  // via goTopPricing() — util yang sama dipakai chip poin topbar & modal top up.
  document
    .getElementById("btn-point-history-topup")
    ?.addEventListener("click", () => goTopPricing());
}
