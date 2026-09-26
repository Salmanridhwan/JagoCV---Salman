// Router: view switching helpers

import { clearSession } from "../utils/auth";
import { spendPointForGenerate } from "../utils/points";

const ALL_VIEW_IDS = [
  "view-dashboard",
  "view-create-cv",
  "view-design-resume",
  "view-build-portfolio",
  "view-cv-result",
  "view-resume-result",
  "view-portfolio-result",
  "view-profile",
  "view-pricing",
  "view-preview-gallery",
] as const;

export function hideAllViews(): void {
  ALL_VIEW_IDS.forEach((id) => {
    const view = document.getElementById(id);
    if (view) {
      view.classList.add("hidden");
      view.classList.remove("block");
    }
  });
}

export function showView(view: HTMLElement | null): void {
  if (view) {
    view.classList.remove("hidden");
    view.classList.add("block");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// ─── Application shell transitions ───────────────────────────────────────────

export function launchDashboardApp(): void {
  const viewLanding = document.getElementById("view-landing");
  const viewLogin = document.getElementById("view-login");
  const appWrapper = document.getElementById("app-wrapper");
  const viewDashboard = document.getElementById("view-dashboard");

  if (viewLanding) {
    viewLanding.classList.add("hidden");
    viewLanding.classList.remove("block", "flex-col");
  }
  if (viewLogin) {
    viewLogin.classList.add("hidden");
    viewLogin.classList.remove("flex");
  }
  if (appWrapper) {
    appWrapper.classList.remove("hidden");
    appWrapper.classList.add("flex");
  }
  showView(viewDashboard);
}

export function launchLoginApp(): void {
  const viewLanding = document.getElementById("view-landing");
  const viewLogin = document.getElementById("view-login");
  const viewRegister = document.getElementById("view-register");
  const appWrapper = document.getElementById("app-wrapper");

  if (viewLanding) {
    viewLanding.classList.add("hidden");
    viewLanding.classList.remove("block", "flex-col");
  }
  if (viewLogin) {
    viewLogin.classList.remove("hidden");
    viewLogin.classList.add("flex");
  }
  if (viewRegister) {
    viewRegister.classList.add("hidden");
    viewRegister.classList.remove("flex");
  }
  if (appWrapper) {
    appWrapper.classList.add("hidden");
    appWrapper.classList.remove("flex");
  }
  window.scrollTo(0, 0);
}

export function launchRegisterApp(): void {
  const viewLanding = document.getElementById("view-landing");
  const viewLogin = document.getElementById("view-login");
  const viewRegister = document.getElementById("view-register");
  const appWrapper = document.getElementById("app-wrapper");

  if (viewLanding) {
    viewLanding.classList.add("hidden");
    viewLanding.classList.remove("block", "flex-col");
  }
  if (viewLogin) {
    viewLogin.classList.add("hidden");
    viewLogin.classList.remove("flex");
  }
  if (viewRegister) {
    viewRegister.classList.remove("hidden");
    viewRegister.classList.add("flex");
  }
  if (appWrapper) {
    appWrapper.classList.add("hidden");
    appWrapper.classList.remove("flex");
  }
  window.scrollTo(0, 0);
}

// ─── Bind all navigation buttons ─────────────────────────────────────────────

export function bindRouterEvents(): void {
  const btnNavRegister = document.getElementById("btn-nav-register");
  const btnNavLogin = document.getElementById("btn-nav-login");
  const btnLaunchApp = document.getElementById("btn-launch-app");
  const btnCtaLaunch = document.getElementById("btn-cta-launch");
  const linkToRegister = document.getElementById("link-to-register");
  const linkToLogin = document.getElementById("link-to-login");

  // Profile / pricing
  const btnNavProfile = document.getElementById("btn-nav-profile");
  const btnBackFromProfile = document.getElementById("btn-back-from-profile");
  const btnUpgradePlan = document.getElementById("btn-upgrade-plan");
  const btnBackFromPricing = document.getElementById("btn-back-from-pricing");
  const btnLogout = document.getElementById("btn-logout");

  // Document creation
  const btnCreateCv = document.getElementById("btn-create-cv");
  const btnDesignResume = document.getElementById("btn-design-resume");
  const btnBuildPortfolio = document.getElementById("btn-build-portfolio");

  // Back buttons
  const btnBackDashboard = document.getElementById("btn-back-dashboard");
  const btnBackDashboardResume = document.getElementById(
    "btn-back-dashboard-resume",
  );
  const btnBackDashboardPortfolio = document.getElementById(
    "btn-back-dashboard-portfolio",
  );
  const btnBackToEditCv = document.getElementById("btn-back-to-edit-cv");
  const btnBackToEditResume = document.getElementById(
    "btn-back-to-edit-resume",
  );
  const btnBackToEditPortfolio = document.getElementById(
    "btn-back-to-edit-portfolio",
  );

  // Views
  const viewDashboard = document.getElementById("view-dashboard");
  const viewCreateCv = document.getElementById("view-create-cv");
  const viewDesignResume = document.getElementById("view-design-resume");
  const viewBuildPortfolio = document.getElementById("view-build-portfolio");
  const viewCvResult = document.getElementById("view-cv-result");
  const viewResumeResult = document.getElementById("view-resume-result");
  const viewPortfolioResult = document.getElementById("view-portfolio-result");
  const viewProfile = document.getElementById("view-profile");
  const viewPricing = document.getElementById("view-pricing");
  const viewLanding = document.getElementById("view-landing");
  const appWrapper = document.getElementById("app-wrapper");

  // ── Auth ─────────────────────────────
  if (btnNavRegister)
    btnNavRegister.addEventListener("click", launchRegisterApp);
  if (btnNavLogin) btnNavLogin.addEventListener("click", launchLoginApp);
  if (btnLaunchApp) btnLaunchApp.addEventListener("click", launchLoginApp);
  if (btnCtaLaunch) btnCtaLaunch.addEventListener("click", launchLoginApp);
  // Catatan: submit login/register & tombol Google ditangani di views/auth.ts
  // agar melewati autentikasi backend sebelum masuk dashboard.

  if (linkToRegister) {
    linkToRegister.addEventListener("click", (e) => {
      e.preventDefault();
      launchRegisterApp();
    });
  }
  if (linkToLogin) {
    linkToLogin.addEventListener("click", (e) => {
      e.preventDefault();
      launchLoginApp();
    });
  }

  // Landing "login" class buttons
  document.querySelectorAll(".btn-landing-login").forEach((btn) => {
    btn.addEventListener("click", launchLoginApp);
  });

  // ── Profile / Pricing ─────────────────
  if (btnNavProfile) {
    btnNavProfile.addEventListener("click", () => {
      hideAllViews();
      showView(viewProfile);
    });
  }
  if (btnUpgradePlan) {
    btnUpgradePlan.addEventListener("click", () => {
      hideAllViews();
      showView(viewPricing);
    });
  }
  if (btnBackFromPricing) {
    btnBackFromPricing.addEventListener("click", () => {
      hideAllViews();
      showView(viewProfile);
    });
  }
  if (btnBackFromProfile) {
    btnBackFromProfile.addEventListener("click", () => {
      hideAllViews();
      showView(viewDashboard);
    });
  }

  // ── Logout ───────────────────────────
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      clearSession();
      if (appWrapper) {
        appWrapper.classList.add("hidden");
        appWrapper.classList.remove("flex");
      }
      if (viewLanding) {
        viewLanding.classList.add("block", "flex-col");
        viewLanding.classList.remove("hidden", "flex");
      }
      hideAllViews();
      showView(viewDashboard);
    });
  }

  // ── Document creation ─────────────────
  if (btnCreateCv) {
    btnCreateCv.addEventListener("click", () => {
      hideAllViews();
      showView(viewCreateCv);
    });
  }
  if (btnDesignResume) {
    btnDesignResume.addEventListener("click", () => {
      hideAllViews();
      showView(viewDesignResume);
    });
  }
  if (btnBuildPortfolio) {
    btnBuildPortfolio.addEventListener("click", () => {
      hideAllViews();
      showView(viewBuildPortfolio);
    });
  }

  // ── Back navigation ───────────────────
  if (btnBackDashboard) {
    btnBackDashboard.addEventListener("click", (e) => {
      e.preventDefault();
      hideAllViews();
      showView(viewDashboard);
    });
  }
  if (btnBackDashboardResume) {
    btnBackDashboardResume.addEventListener("click", () => {
      hideAllViews();
      showView(viewDashboard);
    });
  }
  if (btnBackDashboardPortfolio) {
    btnBackDashboardPortfolio.addEventListener("click", () => {
      hideAllViews();
      showView(viewDashboard);
    });
  }
  if (btnBackToEditCv) {
    btnBackToEditCv.addEventListener("click", () => {
      hideAllViews();
      showView(viewCreateCv);
    });
  }
  if (btnBackToEditResume) {
    btnBackToEditResume.addEventListener("click", () => {
      hideAllViews();
      showView(viewDesignResume);
    });
  }
  if (btnBackToEditPortfolio) {
    btnBackToEditPortfolio.addEventListener("click", () => {
      hideAllViews();
      showView(viewBuildPortfolio);
    });
  }

  // ── Generate / AI buttons ─────────────
  const btnGenerateCv = document.getElementById("btn-generate-cv");
  const btnGenerateResume = document.getElementById("btn-generate-resume");
  const btnGeneratePortfolio = document.getElementById(
    "btn-generate-portfolio",
  );

  if (btnGenerateCv) {
    btnGenerateCv.addEventListener("click", async () => {
      // Payment gate: pakai 1 poin; bila habis, modal top up ditampilkan.
      const allowed = await spendPointForGenerate();
      if (!allowed) return;
      const original = btnGenerateCv.innerHTML;
      btnGenerateCv.innerHTML = `<svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Membuat...`;
      setTimeout(() => {
        hideAllViews();
        showView(viewCvResult);
        btnGenerateCv.innerHTML = original;
      }, 1000);
    });
  }
  if (btnGenerateResume) {
    btnGenerateResume.addEventListener("click", async () => {
      // Payment gate: pakai 1 poin; bila habis, modal top up ditampilkan.
      const allowed = await spendPointForGenerate();
      if (!allowed) return;
      const original = btnGenerateResume.innerHTML;
      btnGenerateResume.innerHTML = `<svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Menyusun Desain...`;
      setTimeout(() => {
        hideAllViews();
        showView(viewResumeResult);
        btnGenerateResume.innerHTML = original;
      }, 1200);
    });
  }
  if (btnGeneratePortfolio) {
    btnGeneratePortfolio.addEventListener("click", async () => {
      // Payment gate: pakai 1 poin; bila habis, modal top up ditampilkan.
      const allowed = await spendPointForGenerate();
      if (!allowed) return;
      const original = btnGeneratePortfolio.innerHTML;
      btnGeneratePortfolio.innerHTML = `<svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Mempublikasikan...`;
      setTimeout(() => {
        hideAllViews();
        showView(viewPortfolioResult);
        btnGeneratePortfolio.innerHTML = original;
      }, 1500);
    });
  }
}
