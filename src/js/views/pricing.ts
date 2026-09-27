// Logika halaman pricing/topup:
//  - Memuat 3 paket (Basic / Pro / Premium) dari GET /backend/packages.php
//  - Kartu dirender dinamis: icon, nama paket, deskripsi, harga besar
//    ("Rp XXK / Xx generate"), daftar fitur, tombol pilih paket
//  - Checkout → POST /backend/checkout.php → redirect ke halaman simulasi
//    payment gateway (payment-gateway.html) → confirm.php → poin masuk.

import { getToken } from "../utils/auth";
import { cachePoints, setPointsDisplay } from "../utils/points";
import { showToast } from "../utils/toast";

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

interface TopUpPackage {
  code: string;
  name: string;
  price: number;
  points: number;
  features: string[];
}

const PACKAGE_META: Record<
  string,
  {
    desc: string;
    icon: string;
    accent: { border: string; iconBox: string; button: string };
    badge?: string;
  }
> = {
  basic: {
    desc: "Cocok untuk mencoba satu kali generate dokumen.",
    icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>`,
    accent: {
      border: "border-slate-200 dark:border-slate-800 hover:border-blue-500/40",
      iconBox: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
      button: "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90",
    },
  },
  pro: {
    desc: "Paling populer untuk pencari kerja aktif.",
    icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>`,
    accent: {
      border: "border-blue-500/50 ring-2 ring-blue-500/20 hover:border-blue-500",
      iconBox: "bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30",
      button: "bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90",
    },
    badge: "Paling Laris",
  },
  premium: {
    desc: "Untuk kebutuhan generate dokumen skala besar.",
    icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>`,
    accent: {
      border: "border-amber-500/50 hover:border-amber-500",
      iconBox: "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30",
      button: "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90",
    },
  },
};

function formatRupiah(value: number): string {
  return "Rp " + value.toLocaleString("id-ID");
}

/** "Rp 19K / 1x generate" sesuai format dokumen paket. */
function priceLabel(pkg: TopUpPackage): string {
  return `Rp ${Math.round(pkg.price / 1000)}K / ${pkg.points}x generate`;
}

function renderPackageCard(pkg: TopUpPackage): string {
  const meta = PACKAGE_META[pkg.code] ?? PACKAGE_META.basic;
  const features = pkg.features
    .map(
      (f) => `
        <li class="flex items-start gap-3">
          <svg class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span class="text-sm text-slate-700 dark:text-slate-300">${f}</span>
        </li>`,
    )
    .join("");

  return `
    <div class="relative bg-white dark:bg-slate-900/60 rounded-[2.5rem] p-8 border ${meta.accent.border} transition-all flex flex-col h-full transform hover:-translate-y-1">
      ${meta.badge ? `<span class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wide shadow-lg shadow-blue-500/30">${meta.badge}</span>` : ""}
      <div class="mb-6">
        <div class="w-12 h-12 rounded-2xl ${meta.accent.iconBox} flex items-center justify-center mb-6">${meta.icon}</div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">${pkg.name}</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400">${meta.desc}</p>
      </div>
      <div class="mb-8">
        <span class="text-4xl font-extrabold text-slate-900 dark:text-white">${formatRupiah(pkg.price)}</span>
        <span class="block mt-1 text-sm font-semibold text-blue-500 dark:text-blue-400">${pkg.points}x generate</span>
      </div>
      <ul class="space-y-4 mb-8 flex-1">${features}</ul>
      <button
        data-topup="${pkg.code}"
        class="w-full px-5 py-3 rounded-xl font-bold transition-all shadow-lg ${meta.accent.button}"
      >
        Pilih ${pkg.name}
      </button>
    </div>
  `;
}

async function loadPackages(): Promise<void> {
  const container = document.getElementById("pricing-cards");
  if (!container) return;

  let packages: TopUpPackage[] = [];
  try {
    const res = await fetch(`${API_BASE}/packages.php`);
    const data = (await res.json()) as { ok: boolean; packages?: TopUpPackage[] };
    packages = data.packages ?? [];
  } catch {
    packages = [];
  }

  if (!packages.length) {
    container.innerHTML = `
      <p class="col-span-full text-center text-sm text-slate-500 dark:text-slate-400">
        Gagal memuat paket. Pastikan server backend menyala lalu muat ulang halaman.
      </p>`;
    return;
  }

  container.innerHTML = packages.map(renderPackageCard).join("");

  container.querySelectorAll<HTMLButtonElement>("button[data-topup]").forEach((btn) => {
    btn.addEventListener("click", () => startCheckout(btn.dataset.topup as string));
  });
}

async function startCheckout(packageCode: string): Promise<void> {
  const token = getToken();
  if (!token) {
    showToast("Silakan login terlebih dahulu untuk melakukan top up.");
    return;
  }

  const btn = document.querySelector<HTMLButtonElement>(`button[data-topup="${packageCode}"]`);
  const original = btn?.innerHTML ?? "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML =
      '<svg class="w-5 h-5 animate-spin inline" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg> Memproses...';
  }

  try {
    const res = await fetch(`${API_BASE}/checkout.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ package_code: packageCode, payment_method: "qris" }),
    });
    const data = (await res.json()) as {
      ok: boolean;
      message?: string;
      payment_url?: string;
    };

    if (data.ok && data.payment_url) {
      // Arahkan ke halaman simulasi payment gateway.
      // payment_url dari backend bisa absolut ataupun path "/src/html/...";
      // saat app diakses lewat Apache (htdocs/jagoAI/JagoCV---Salman),
      // path perlu diawali folder project agar tidak 404.
      //
      // Pakai location.replace() (bukan href) + penanda st=1 supaya:
      //  - halaman transaksi TIDAK masuk riwayat browser → tombol Back
      //    tidak akan pernah membukanya lagi setelah pembayaran;
      //  - halaman gateway bisa memverifikasi bahwa pembukaannya memang
      //    redirect checkout yang sah, bukan link manual/back.
      window.location.replace(appendQueryParam(toAbsoluteAppUrl(data.payment_url), "st", "1"));
      return;
    }
    showToast(data.message ?? "Gagal membuat transaksi. Coba lagi.");
  } catch {
    showToast(
      "Tidak dapat menghubungi /backend/checkout.php. Buka /backend/ping.php di browser untuk diagnosa.",
    );
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = original;
    }
  }
}

/** Sinkron saldo poin setelah kembali dari payment gateway. */
async function syncPointsAfterPayment(): Promise<void> {
  const token = getToken();
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/points.php`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = (await res.json()) as { ok: boolean; points?: number };
    if (data.ok) {
      setPointsDisplay(data.points ?? 0);
      cachePoints(data.points ?? 0);
    }
  } catch {
    /* biarkan nilai lama */
  }
}

/** Ubah path app ("/", "/src/html/x.html") menjadi URL absolut yang benar. */
function toAbsoluteAppUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const { origin, pathname } = window.location;
  const idx = pathname.toLowerCase().indexOf("/jagocv---salman");
  const base = idx >= 0 ? pathname.slice(0, idx) + "/jagoCV---Salman" : "";
  return `${origin}${base}${url}`;
}

/** Tambah parameter query ke URL (aman untuk URL yang sudah punya query). */
function appendQueryParam(url: string, key: string, value: string): string {
  return url + (url.includes("?") ? "&" : "?") + `${key}=${encodeURIComponent(value)}`;
}

export function bindPricingEvents(): void {
  void loadPackages();
  void syncPointsAfterPayment();
}
