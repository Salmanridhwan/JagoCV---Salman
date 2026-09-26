// ─────────────────────────────────────────────────────────────────────
// Sistem poin & payment gateway (sisi frontend).
//
// Alur:
//  - Pengguna baru otomatis mendapat 2 poin gratis (dari backend saat
//    registrasi) dan ditandai `is_new_user` → alert tampil di bawah topbar.
//  - Setiap generate (CV / Resume / Portfolio) memakai 1 poin via
//    POST /backend/consume.php.
//  - Bila poin habis, modal "top up sekarang" muncul dan mengarahkan ke
//    halaman pricing (topup) untuk memilih paket.
//  - Top up: pilih paket → checkout.php → halaman simulasi payment
//    gateway → confirm.php → poin bertambah.
// ─────────────────────────────────────────────────────────────────────

import { getToken, getStoredUser, saveSession, type AuthUser } from "./auth";
import { showToast } from "./toast";

const API_BASE =
  (import.meta.env?.VITE_API_BASE_URL as string | undefined) ??
  resolveBackendBase();

/**
 * Resolusi otomatis base URL backend PHP.
 * Berjalan baik di Vite dev (localhost:3000) maupun saat dibuka lewat
 * Apache/XAMPP (htdocs/jagoAI/JagoCV---Salman) — cukup arahkan ke folder
 * /backend relatif terhadap origin aktif.
 */
function resolveBackendBase(): string {
  if (typeof window === "undefined") return "";
  const { origin, pathname } = window.location;
  const idx = pathname.toLowerCase().indexOf("/jagocv---salman");
  if (idx >= 0) {
    return `${origin}${pathname.slice(0, idx)}/jagoCV---Salman/backend`;
  }
  return `${origin}/backend`;
}

const NEWUSER_ALERT_KEY = "jagocv_newuser_alert_shown";
const POINTS_CACHE_KEY = "jagocv_points_cache";

// Ikon petir untuk badge "Pengguna Baru" pada alert.
const ALERT_FALLBACK_ICON = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>`;

export interface PointsState {
  points: number;
  isNewUser: boolean;
}

// ── Pembaruan UI ─────────────────────────────────────────────────────

/** Perbarui angka poin di chip topbar. */
export function setPointsDisplay(points: number): void {
  const el = document.getElementById("points-value");
  if (el) el.textContent = String(Math.max(0, points));
}

/** Ambil poin terakhir yang diketahui (cache localStorage) untuk sinkron UI awal. */
export function getCachedPoints(): number {
  const cached = Number(localStorage.getItem(POINTS_CACHE_KEY) ?? "0");
  return Number.isFinite(cached) ? cached : 0;
}

export function cachePoints(points: number): void {
  localStorage.setItem(POINTS_CACHE_KEY, String(points));
}

/** Perbarui user di localStorage (poin/penanda baru) agar UI konsisten. */
function syncStoredUser(patch: Partial<AuthUser>): void {
  const user = getStoredUser();
  if (!user) return;
  const merged = { ...user, ...patch };
  const token = getToken();
  if (token) saveSession(token, merged as AuthUser);
}

// ── Alert di bawah topbar ────────────────────────────────────────────

/**
 * Tampilkan alert (banner promosi) di bawah topbar.
 * Desain sesuai ketentuan: gradient biru→cyan full width, teks putih,
 * icon di kiri, teks utama bold, CTA "Top Up Sekarang" dengan icon arrow.
 * Hanya tampil untuk pengguna baru & sekali per browser per akun.
 */
export function showNewUserAlertIfNeeded(isNewUser: boolean): void {
  const container = document.getElementById("topbar-alert");
  if (!container) return;

  const user = getStoredUser();
  const key = user ? `${NEWUSER_ALERT_KEY}_${user.id}` : NEWUSER_ALERT_KEY;

  if (!isNewUser || localStorage.getItem(key) === "1") {
    container.classList.add("hidden");
    return;
  }

  container.innerHTML = `
    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 sm:px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 animate-[slideDown_0.3s_ease_forwards]">
      <span class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wide">
        ${ALERT_FALLBACK_ICON}
        Pengguna Baru
      </span>
      <p class="text-sm leading-relaxed min-w-0 flex-1">
        <span class="font-bold">Tambahkan kenyamanan</span>
        <span class="text-white/85">dengan berlangganan, top up sekarang!</span>
        <span class="block sm:inline text-white/85">Kuota pengguna baru: <b class="text-white">2x generate gratis</b> (1 poin per generate).</span>
      </p>
      <div class="flex items-center gap-2 shrink-0 sm:ml-auto">
        <button id="topbar-alert-topup" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900/85 hover:bg-slate-900 text-white text-xs font-bold transition-colors shadow-md">
          Top Up Sekarang
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </button>
        <button id="topbar-alert-close" class="p-1.5 text-white/70 hover:text-white hover:bg-white/15 rounded-full transition-colors" aria-label="Tutup alert">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>
  `;
  container.classList.remove("hidden");

  document.getElementById("topbar-alert-topup")?.addEventListener("click", () => {
    container.classList.add("hidden");
    localStorage.setItem(key, "1");
    goTopPricing();
  });
  document.getElementById("topbar-alert-close")?.addEventListener("click", () => {
    container.classList.add("hidden");
    localStorage.setItem(key, "1");
  });
}

/** Arahkan ke halaman pricing/topup di dalam app wrapper. */
export function goTopPricing(): void {
  hideAllAppViews();
  const pricing = document.getElementById("view-pricing");
  if (pricing) {
    pricing.classList.remove("hidden");
    pricing.classList.add("block");
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function hideAllAppViews(): void {
  document
    .querySelectorAll("#app-wrapper main > div[id^='view-']")
    .forEach((el) => {
      el.classList.add("hidden");
      el.classList.remove("block");
    });
}

// ── Sinkronisasi dengan backend ──────────────────────────────────────

/**
 * Ambil poin terbaru dari backend (GET /backend/points.php),
 * perbarui chip topbar, dan tampilkan alert pengguna baru bila perlu.
 */
export async function initPointsUi(): Promise<void> {
  // Tampilkan dulu dari cache agar chip tidak "0" sesaat.
  const cached = getCachedPoints();
  if (cached > 0) setPointsDisplay(cached);

  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/points.php`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = (await res.json()) as { ok: boolean; points?: number; is_new_user?: boolean };
    if (!data.ok) return;

    const points = data.points ?? 0;
    const isNewUser = Boolean(data.is_new_user);

    setPointsDisplay(points);
    cachePoints(points);
    syncStoredUser({ points, is_new_user: isNewUser });
    showNewUserAlertIfNeeded(isNewUser);
  } catch {
    // Server tidak terjangkau: biarkan cache tampil.
  }
}

// ── Pemakaian poin saat generate ─────────────────────────────────────

/**
 * Coba pakai 1 poin untuk generate.
 * Cek dulu saldo lokal: bila sudah 0 → langsung tampilkan modal
 * "poin habis" (tanpa membebankan server). Bila masih ada, konfirmasi
 * ke backend via consume.php; bila backend menjawab 402 (poin habis),
 * modal yang sama ditampilkan.
 * Mengembalikan true bila poin berhasil dipakai (generate boleh lanjut).
 */
export async function spendPointForGenerate(): Promise<boolean> {
  const token = getToken();
  if (!token) {
    showToast("Silakan login terlebih dahulu.");
    return false;
  }

  // Pre-check saldo lokal: 0 poin → modal top up tanpa hit server.
  if (getCachedPoints() <= 0) {
    openTopUpModal();
    return false;
  }

  try {
    const res = await fetch(`${API_BASE}/consume.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    });
    const data = (await res.json().catch(() => null)) as
      | { ok: boolean; points?: number; message?: string }
      | null;

    if (res.status === 402) {
      // Backend memastikan poin benar-benar habis → modal pengarah ke topup.
      openTopUpModal();
      return false;
    }
    if (!data || !data.ok) {
      showToast(data?.message ?? "Gagal memakai poin. Coba lagi.");
      return false;
    }

    const points = data.points ?? 0;
    setPointsDisplay(points);
    cachePoints(points);
    showToast(`Berhasil! 1 poin dipakai. Sisa poin: ${points}.`);
    return true;
  } catch {
    showToast("Tidak dapat menghubungi server. Pastikan Apache & MySQL menyala.");
    return false;
  }
}

// ── Modal "poin habis" ───────────────────────────────────────────────

function openTopUpModal(): void {
  const modal = document.getElementById("generic-modal");
  const content = document.getElementById("generic-modal-content");
  const titleEl = document.getElementById("generic-modal-title");
  const bodyEl = document.getElementById("generic-modal-body");
  if (!modal || !content || !titleEl || !bodyEl) {
    showToast("Poin Anda habis. Silakan top up di halaman Pricing.");
    goTopPricing();
    return;
  }

  titleEl.textContent = "Poin Generate Habis";
  bodyEl.innerHTML = `
    <div class="text-center py-2">
      <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
      </div>
      <p class="text-slate-700 dark:text-slate-200 font-semibold mb-1">Poin Anda sudah habis!</p>
      <p class="text-sm text-slate-500 dark:text-slate-400 mb-5">
        Kuota generate gratis 2x sudah terpakai. Untuk terus men-generate CV,
        Resume, atau Portfolio, pilih <b>paket berlangganan poin</b> di halaman Top Up.
      </p>
      <div class="flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-6">
        <span class="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800"><b class="text-slate-700 dark:text-slate-200">Basic</b> · Rp 19K / 1x</span>
        <span class="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800"><b class="text-slate-700 dark:text-slate-200">Pro</b> · Rp 49K / 3x</span>
        <span class="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800"><b class="text-slate-700 dark:text-slate-200">Premium</b> · Rp 99K / 10x</span>
      </div>
      <button id="btn-modal-go-topup" class="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/30">
        Isi Poin Sekarang (Top Up)
      </button>
    </div>
  `;
  // Sembunyikan footer bawaan modal generik agar hanya CTA yang tampil.
  const footer = bodyEl.parentElement?.querySelector("div:last-child");
  if (footer instanceof HTMLElement && footer !== bodyEl) {
    footer.dataset.modalFooterHidden = "1";
    footer.classList.add("hidden");
  }

  modal.classList.remove("hidden");
  requestAnimationFrame(() => {
    content.classList.remove("scale-95", "opacity-0");
    content.classList.add("scale-100", "opacity-100");
  });

  document.getElementById("btn-modal-go-topup")?.addEventListener("click", () => {
    closeModal();
    goTopPricing();
  });
}

function closeModal(): void {
  const modal = document.getElementById("generic-modal");
  const content = document.getElementById("generic-modal-content");
  if (!modal || !content) return;
  modal.classList.add("hidden");
  content.classList.add("scale-95", "opacity-0");
  content.classList.remove("scale-100", "opacity-100");

  // Kembalikan footer bawaan modal generik.
  const bodyEl = document.getElementById("generic-modal-body");
  const footer = bodyEl?.parentElement?.querySelector("div:last-child");
  if (footer instanceof HTMLElement && footer.dataset.modalFooterHidden === "1") {
    footer.classList.remove("hidden");
    delete footer.dataset.modalFooterHidden;
  }
}

/** Klik chip poin di topbar → ke halaman topup. */
export function bindPointsChip(): void {
  document.getElementById("points-chip")?.addEventListener("click", () => {
    if (!getToken()) {
      showToast("Silakan login terlebih dahulu untuk melihat poin.");
      return;
    }
    goTopPricing();
  });
}
