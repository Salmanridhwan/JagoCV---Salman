import { initTheme, bindThemeToggles } from "./utils/theme";
import { registerGlobalToast } from "./utils/toast";
import { mockDashboardData } from "./data";

import { bindRouterEvents } from "./views/router";
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
});
