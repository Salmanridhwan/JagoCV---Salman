// Resume Builder Logic

export function registerResumeBuilderGlobals(): void {
  (window as any).goToResumeStep = goToResumeStep;
}

function goToResumeStep(stepIndex: number): void {
  document.querySelectorAll(".resume-step").forEach((el) => {
    el.classList.add("hidden");
    el.classList.remove("block", "animate-[slideInRight_0.4s_ease_forwards]");
  });

  const targetStep = document.getElementById("resume-step-" + stepIndex);
  if (targetStep) {
    targetStep.classList.remove("hidden");
    targetStep.classList.add(
      "block",
      "animate-[slideInRight_0.4s_ease_forwards]",
    );

    // Ensure manual container is visible
    const containerManual = document.getElementById("container-resume-manual");
    const containerAi = document.getElementById("container-resume-ai");
    const wizardProgress = document.getElementById("resume-wizard-progress");
    const tabManual = document.getElementById("tab-resume-manual");
    const tabAi = document.getElementById("tab-resume-ai");

    if (containerManual && containerManual.classList.contains("hidden")) {
      containerManual.classList.remove("hidden");
      containerManual.classList.add("block");
      if (containerAi) containerAi.classList.add("hidden");
      if (wizardProgress) wizardProgress.classList.remove("hidden");
      
      // Update tabs if they exist
      if (tabManual && tabAi) {
        tabManual.className = "flex-1 py-2.5 rounded-xl bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)] text-white text-sm font-semibold transition-all";
        tabAi.className = "flex-1 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/5 dark:hover:text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 group";
      }
    }
  }

  const totalSteps = 5;
  const progressPercent = ((stepIndex - 1) / (totalSteps - 1)) * 100;
  const progressBar = document.getElementById("resume-progress-bar");
  if (progressBar) progressBar.style.width = progressPercent + "%";

  for (let i = 1; i <= totalSteps; i++) {
    const indicator = document.getElementById("resume-indicator-step-" + i);
    if (!indicator) continue;
    const circle = indicator.querySelector("div");
    const text = indicator.querySelector("span");

    if (!circle || !text) continue;

    if (i < stepIndex) {
      circle.className =
        "w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(99,102,241,0.3)] transition-all duration-500 scale-100";
      circle.innerHTML =
        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
      text.className =
        "text-[11px] font-bold text-indigo-500 dark:text-indigo-400 mt-1 transition-colors uppercase tracking-wider hidden sm:block";
    } else if (i === stepIndex) {
      circle.className =
        "w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-500 scale-110";
      circle.innerHTML = String(i);
      text.className =
        "text-[11px] font-bold text-indigo-500 dark:text-indigo-400 mt-1 transition-colors uppercase tracking-wider block";
    } else {
      circle.className =
        "w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm transition-all duration-500 scale-100";
      circle.innerHTML = String(i);
      text.className =
        "text-[11px] font-bold text-slate-400 mt-1 transition-colors uppercase tracking-wider hidden sm:block";
    }
  }

  const viewEl = document.getElementById("view-design-resume");
  if (viewEl)
    window.scrollTo({ top: viewEl.offsetTop - 60, behavior: "smooth" });
}

export function bindResumeBuilderEvents(): void {
  const tabResumeManual = document.getElementById("tab-resume-manual");
  const tabResumeAi = document.getElementById("tab-resume-ai");
  const containerResumeManual = document.getElementById(
    "container-resume-manual",
  );
  const containerResumeAi = document.getElementById("container-resume-ai");
  const resumeWizardProgress = document.getElementById(
    "resume-wizard-progress",
  );

  if (
    tabResumeManual &&
    tabResumeAi &&
    containerResumeManual &&
    containerResumeAi
  ) {
    tabResumeManual.addEventListener("click", () => {
      tabResumeManual.className =
        "flex-1 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold transition-all";
      tabResumeAi.className =
        "flex-1 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/5 dark:hover:text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 group";

      containerResumeManual.classList.remove("hidden");
      containerResumeManual.classList.add(
        "block",
        "animate-[fadeIn_0.3s_ease_forwards]",
      );
      if (resumeWizardProgress) resumeWizardProgress.classList.remove("hidden");
      containerResumeAi.classList.add("hidden");
      containerResumeAi.classList.remove(
        "block",
        "animate-[fadeIn_0.3s_ease_forwards]",
      );
    });

    tabResumeAi.addEventListener("click", () => {
      tabResumeAi.className =
        "flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25";
      tabResumeManual.className =
        "flex-1 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/5 dark:hover:text-white text-sm font-semibold transition-all";

      containerResumeAi.classList.remove("hidden");
      containerResumeAi.classList.add(
        "block",
        "animate-[fadeIn_0.3s_ease_forwards]",
      );
      if (resumeWizardProgress) resumeWizardProgress.classList.add("hidden");
      containerResumeManual.classList.add("hidden");
      containerResumeManual.classList.remove(
        "block",
        "animate-[fadeIn_0.3s_ease_forwards]",
      );
    });
  }

  const resumeOptions = document.querySelectorAll("#resume-theme-selector label");
  resumeOptions.forEach((opt) => {
    opt.addEventListener("click", () => {
      // Reset all
      resumeOptions.forEach((o) => {
        o.className = "relative flex items-center justify-between p-4 border rounded-2xl border-slate-300 dark:border-slate-700 hover:border-slate-500 bg-slate-50 dark:bg-[#0B1221]/50 cursor-pointer transition-all";
        const dotContainer = o.querySelector(".w-5.h-5.rounded-full.border-2");
        if (dotContainer) {
          dotContainer.className = "w-5 h-5 rounded-full border-2 border-slate-400 dark:border-slate-600 shrink-0";
          dotContainer.innerHTML = "";
        }
      });
      
      // Set active
      opt.className = "relative flex items-center justify-between p-4 border rounded-2xl border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 cursor-pointer overflow-hidden transition-all filter hover:brightness-110 shadow-[0_0_15px_rgba(99,102,241,0.15)]";
      const dotContainer = opt.querySelector(".w-5.h-5.rounded-full.border-2");
      if (dotContainer) {
        dotContainer.className = "w-5 h-5 rounded-full border-2 border-indigo-500 flex items-center justify-center shrink-0";
        dotContainer.innerHTML = '<div class="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>';
      }
    });
  });

  // Manual Generate Button (Resume)
  const btnManualGenerateResume = document.getElementById("btn-manual-generate-resume");
  if (btnManualGenerateResume) {
    btnManualGenerateResume.addEventListener("click", () => {
      if ((window as any).showToast) {
        (window as any).showToast("Mempersiapkan Resume Visual Anda... ✨");
      }
    });
  }
}
