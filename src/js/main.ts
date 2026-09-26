import { initTheme, bindThemeToggles } from "./utils/theme";
import { registerGlobalToast } from "./utils/toast";
import { checkSession, getStoredUser, type AuthUser } from "./utils/auth";
import { mockDashboardData } from "./data";

import { bindRouterEvents } from "./views/router";
import { bindAuthEvents } from "./views/auth";
import { populateDashboard } from "./views/dashboard";
import {
  bindCvBuilderEvents,
  registerCvBuilderGlobals,
} from "./views/cv-builder";
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
} from "./utils/points";

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

  // Restore session: bila user sudah pernah login, langsung tampilkan
  // datanya di dashboard. (Sesi divalidasi ulang ke server oleh checkSession.)
  restoreSession();
});

/** Pulihkan sesi tersimpan dan sinkronkan data user ke UI. */
function restoreSession(): void {
  const stored = getStoredUser() as AuthUser | null;
  checkSession().then((user) => {
    const active = user ?? stored;
    if (active) {
      applyStoredUser(active);
      // Sinkronkan chip poin & alert pengguna baru di bawah topbar.
      setPointsDisplay(active.points ?? 0);
      cachePoints(active.points ?? 0);
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
