// Portfolio Builder Logic

export function registerPortfolioBuilderGlobals(): void {
  (window as any).goToPortfolioStep = goToPortfolioStep;
  (window as any).togglePortfolioMobileViewport = togglePortfolioMobileViewport;
}

function goToPortfolioStep(stepIndex: number): void {
  document.querySelectorAll(".portfolio-step").forEach((el) => {
    el.classList.add("hidden");
    el.classList.remove("block", "animate-[slideInRight_0.4s_ease_forwards]");
  });

  const targetStep = document.getElementById("portfolio-step-" + stepIndex);
  if (targetStep) {
    targetStep.classList.remove("hidden");
    targetStep.classList.add(
      "block",
      "animate-[slideInRight_0.4s_ease_forwards]",
    );
  }

  const totalSteps = 7;
  const progressPercent = ((stepIndex - 1) / (totalSteps - 1)) * 100;
  const progressBar = document.getElementById("portfolio-progress-bar");
  if (progressBar) progressBar.style.width = progressPercent + "%";

  for (let i = 1; i <= totalSteps; i++) {
    const indicator = document.getElementById("portfolio-indicator-step-" + i);
    if (!indicator) continue;
    const circle = indicator.querySelector("div");
    const text = indicator.querySelector("span");

    if (!circle || !text) continue;

    if (i < stepIndex) {
      circle.className =
        "w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all duration-500 scale-100";
      circle.innerHTML =
        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
      text.className =
        "text-[11px] font-bold text-cyan-500 dark:text-cyan-400 mt-1 transition-colors uppercase tracking-wider hidden sm:block";
    } else if (i === stepIndex) {
      circle.className =
        "w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-500 scale-110";
      circle.innerHTML = String(i);
      text.className =
        "text-[11px] font-bold text-cyan-500 dark:text-cyan-400 mt-1 transition-colors uppercase tracking-wider block";
    } else {
      circle.className =
        "w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm transition-all duration-500 scale-100";
      circle.innerHTML = String(i);
      text.className =
        "text-[11px] font-bold text-slate-400 mt-1 transition-colors uppercase tracking-wider hidden sm:block";
    }
  }

  const viewEl = document.getElementById("view-build-portfolio");
  if (viewEl)
    window.scrollTo({ top: viewEl.offsetTop - 60, behavior: "smooth" });
}

function togglePortfolioMobileViewport(isMobile: boolean): void {
  const container = document.getElementById("portfolio-preview-container");
  const desktopBtn = document.getElementById("btn-viewport-desktop");
  const mobileBtn = document.getElementById("btn-viewport-mobile");

  if (!container || !desktopBtn || !mobileBtn) return;

  if (isMobile) {
    container.classList.remove("w-full");
    container.classList.add("w-[375px]", "mx-auto");
    mobileBtn.className =
      "p-1.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white transition-colors shadow-sm";
    desktopBtn.className =
      "p-1.5 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors";
  } else {
    container.classList.add("w-full");
    container.classList.remove("w-[375px]", "mx-auto");
    desktopBtn.className =
      "p-1.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white transition-colors shadow-sm";
    mobileBtn.className =
      "p-1.5 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors";
  }
}

export function bindPortfolioBuilderEvents(): void {
  const tabPortfolioManual = document.getElementById("tab-portfolio-manual");
  const tabPortfolioAi = document.getElementById("tab-portfolio-ai");
  const containerPortfolioManual = document.getElementById(
    "container-portfolio-manual",
  );
  const containerPortfolioAi = document.getElementById(
    "container-portfolio-ai",
  );
  const portfolioWizardProgress = document.getElementById(
    "portfolio-wizard-progress",
  );

  if (
    tabPortfolioManual &&
    tabPortfolioAi &&
    containerPortfolioManual &&
    containerPortfolioAi
  ) {
    tabPortfolioManual.addEventListener("click", () => {
      tabPortfolioManual.className =
        "flex-1 py-3 rounded-xl bg-cyan-600 text-white text-sm font-semibold transition-all";
      tabPortfolioAi.className =
        "flex-1 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/5 dark:hover:text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 group";

      containerPortfolioManual.classList.remove("hidden");
      containerPortfolioManual.classList.add(
        "block",
        "animate-[fadeIn_0.3s_ease_forwards]",
      );
      if (portfolioWizardProgress)
        portfolioWizardProgress.classList.remove("hidden");
      containerPortfolioAi.classList.add("hidden");
      containerPortfolioAi.classList.remove(
        "block",
        "animate-[fadeIn_0.3s_ease_forwards]",
      );
    });

    tabPortfolioAi.addEventListener("click", () => {
      tabPortfolioAi.className =
        "flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25";
      tabPortfolioManual.className =
        "flex-1 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/5 dark:hover:text-white text-sm font-semibold transition-all";

      containerPortfolioAi.classList.remove("hidden");
      containerPortfolioAi.classList.add(
        "block",
        "animate-[fadeIn_0.3s_ease_forwards]",
      );
      if (portfolioWizardProgress)
        portfolioWizardProgress.classList.add("hidden");
      containerPortfolioManual.classList.add("hidden");
      containerPortfolioManual.classList.remove(
        "block",
        "animate-[fadeIn_0.3s_ease_forwards]",
      );
    });
  }
}
