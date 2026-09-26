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
  "http://localhost/jagoCV---Salman/backend";

const NEWUSER_ALERT_KEY = "jagocv_newuser_alert_shown";
const POINTS_CACHE_KEY = "jagocv_points_cache";

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
 * Tampilkan alert di bawah topbar.
 * Pengguna baru: "tambahkan kenyamanan dengan berlangganan, top up sekarang!"
 * dengan penanda "PENGGUNA BARU". Cuma tampil sekali per browser per akun.
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
    <div class="flex items-start gap-3 px-4 py-3 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-600/10 to-cyan-500/10 backdrop-blur-md shadow-lg shadow-blue-500/10 animate-[slideDown_0.3s_ease_forwards]">
      <span class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wide">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        Pengguna Baru
      </span>
      <p class="text-sm text-slate-700 dark:text-slate-200 font-medium pt-0.5">
        tambahkan kenyamanan dengan berlangganan, top up sekarang!
        <span class="text-slate-500 dark:text-slate-400">Anda juga sudah mendapat <b class="text-blue-500">2 poin gratis</b> untuk generate.</span>
      </p>
      <div class="ml-auto flex items-center gap-2 shrink-0">
        <button id="topbar-alert-topup" class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-lg shadow-blue-500/30">
          Top Up
        </button>
        <button id="topbar-alert-close" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-colors" aria-label="Tutup alert">
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
 * Bila poin habis → tampilkan modal pengarah ke halaman topup.
 * Mengembalikan true bila poin berhasil dipakai (generate boleh lanjut).
 */
export async function spendPointForGenerate(): Promise<boolean> {
  const token = getToken();
  if (!token) {
    showToast("Silakan login terlebih dahulu.");
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

    if (res.status === 402 || (data && !data.ok && res.status === 402)) {
      // Poin habis → modal pengarah ke topup.
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
        Untuk terus men-generate CV, Resume, atau Portfolio, pilih salah satu
        <b>paket top up poin</b> di halaman Top Up.
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
