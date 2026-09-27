// ─────────────────────────────────────────────────────────────────────
// Persistensi posisi navigasi.
//
// Masalah: setiap refresh, aplikasi selalu kembali ke dashboard meski
// user sedang berada di halaman lain (builder CV, pricing, profil, dst).
//
// Solusi:
//  - View terakhir disimpan di localStorage (jagocv_last_view) setiap
//    kali showView() dipanggil, lalu dipulihkan saat halaman dibuka.
//  - Step wizard CV disimpan di sessionStorage (jagocv_cv_step) agar
//    refresh di tengah pengisian form tetap berada di step yang sama.
// ─────────────────────────────────────────────────────────────────────

import { showView } from "../views/router";

const LAST_VIEW_KEY = "jagocv_last_view";
const CV_STEP_KEY = "jagocv_cv_step";

/** Simpan view terakhir yang dikunjungi user. */
export function rememberLastView(viewId: string): void {
  try {
    localStorage.setItem(LAST_VIEW_KEY, viewId);
  } catch {
    /* storage penuh / diblokir — abaikan */
  }
}

/** Ambil view terakhir yang tersimpan (id elemen view), atau null. */
export function getRememberedView(): string | null {
  try {
    return localStorage.getItem(LAST_VIEW_KEY);
  } catch {
    return null;
  }
}

/**
 * Pulihkan halaman terakhir setelah refresh (hanya bila user login).
 * Dipanggil dari main.ts setelah sesi dipulihkan.
 */
export function restoreLastView(): void {
  const id = getRememberedView();
  if (!id) return;
  const view = document.getElementById(id);
  // Hanya view di dalam app-wrapper yang boleh dipulihkan.
  if (view && view.closest("#app-wrapper")) {
    showView(view);
  }
}

// ── Step wizard CV ───────────────────────────────────────────────────

export function rememberCvStep(step: number): void {
  try {
    sessionStorage.setItem(CV_STEP_KEY, String(step));
  } catch {
    /* abaikan */
  }
}

export function getRememberedCvStep(): number | null {
  try {
    const raw = sessionStorage.getItem(CV_STEP_KEY);
    const step = raw ? Number(raw) : NaN;
    return Number.isInteger(step) && step >= 1 && step <= 5 ? step : null;
  } catch {
    return null;
  }
}
