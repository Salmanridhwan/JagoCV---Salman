import { initTheme, bindThemeToggles } from "./utils/theme";
import { registerGlobalToast } from "./utils/toast";
import { checkSession, getStoredUser, type AuthUser } from "./utils/auth";
import { mockDashboardData } from "./data";

import { bindRouterEvents, launchDashboardApp } from "./views/router";
import { bindAuthEvents } from "./views/auth";
import { populateDashboard } from "./views/dashboard";
import {
  bindCvBuilderEvents,
  registerCvBuilderGlobals,
} from "./views/cv-builder";
import { bindCvResultActions } from "./utils/cvData";
import {
  bindResumeBuilderEvents,
  registerResumeBuilderGlobals,
} from "./views/resume-builder";
import {
  bindPortfolioBuilderEvents,
  registerPortfolioBuilderGlobals,
} from "./views/portfolio-builder";
import { bindGalleryEvents } from "./views/gallery";
import { bindChatWidget } from "./views/chat";
import { bindModalEvents, registerModalGlobals } from "./views/modal";
import { bindPricingEvents } from "./views/pricing";
import {
  bindPointsChip,
  cachePoints,
  initPointsUi,
  setPointsDisplay,
  showNewUserAlertIfNeeded,
} from "./utils/points";
import { restoreLastView } from "./utils/navigation";

import { injectHtmlTemplates } from "./views/templateInjector";

document.addEventListener("DOMContentLoaded", () => {
  // 1. Inject HTML Templates first so the DOM is ready for bindings
  injectHtmlTemplates();

  // Initialize utilities
  initTheme();
  bindThemeToggles();
  registerGlobalToast();
  registerCvBuilderGlobals();
  registerResumeBuilderGlobals();
  registerPortfolioBuilderGlobals();
  registerModalGlobals();

  // Initialize router
  bindRouterEvents();

  // Populate dashboard
  populateDashboard(mockDashboardData);

  // Bind specific view logic
  bindCvBuilderEvents();
  bindResumeBuilderEvents();
  bindPortfolioBuilderEvents();
  bindGalleryEvents();
  bindChatWidget();
  bindModalEvents();

  // Payment gateway: halaman pricing/topup & chip poin di topbar
  bindPricingEvents();
  bindPointsChip();

  // Bind auth forms & buttons (login, register, Google Sign-In)
  bindAuthEvents();

  // Tombol "Salin Teks" & "Unduh PDF" pada halaman hasil CV.
  bindCvResultActions();

  // Restore session: bila user sudah pernah login, langsung tampilkan
  // datanya di dashboard. (Sesi divalidasi ulang ke server oleh checkSession.)
  restoreSession();
});

/**
 * Pulihkan sesi tersimpan dan sinkronkan data user ke UI.
 * Bila user masih login (token valid di localStorage), dashboard langsung
 * ditampilkan ulang saat halaman di-refresh — tidak dikembalikan ke login.
 */
function restoreSession(): void {
  const stored = getStoredUser() as AuthUser | null;

  // Tampilkan dashboard SEGERA dari sesi tersimpan agar refresh tidak
  // membuat user "terlempar" ke halaman login (sesi tetap dipakai).
  if (stored) {
    applyStoredUser(stored);
    setPointsDisplay(stored.points ?? 0);
    cachePoints(stored.points ?? 0);
    showNewUserAlertIfNeeded(Boolean(stored.is_new_user));
    launchDashboardApp();
    // Kembali ke halaman terakhir yang dikunjungi (bukan selalu dashboard).
    restoreLastView();
  }

  // Validasi ulang token ke server di latar belakang; perbarui data user
  // (poin, profil) bila masih valid, atau hapus sesi bila kedaluwarsa.
  checkSession().then((user) => {
    const active = user ?? stored;
    if (active) {
      applyStoredUser(active);
      // Sinkronkan chip poin & alert pengguna baru di bawah topbar.
      setPointsDisplay(active.points ?? 0);
      cachePoints(active.points ?? 0);
      // Tampilkan alert "pengguna baru" segera dari data yang tersimpan,
      // tanpa menunggu respons server (penting saat backend belum dijangkau).
      showNewUserAlertIfNeeded(Boolean(active.is_new_user));
      void initPointsUi();
    }
  });
}

/** Isi data user ke elemen navbar/profil tanpa memaksa pindah view. */
function applyStoredUser(user: AuthUser): void {
  const fullName = `${user.first_name} ${user.last_name}`.trim() || user.email;
  const elName = document.getElementById("nav-user-name");
  const elRole = document.getElementById("nav-user-role");
  const elImg = document.getElementById("nav-profile-img") as HTMLImageElement | null;
  const pfName = document.getElementById("profile-page-name");
  const pfRole = document.getElementById("profile-page-role");
  const pfImg = document.getElementById("profile-page-img") as HTMLImageElement | null;

  if (elName) elName.textContent = fullName;
  if (elRole) elRole.textContent = user.role ?? "Member jagoCV";
  if (elImg && user.avatar_url) elImg.src = user.avatar_url;
  if (pfName) pfName.textContent = fullName;
  if (pfRole) pfRole.textContent = user.role ?? "Member jagoCV";
  if (pfImg && user.avatar_url) pfImg.src = user.avatar_url;
}
