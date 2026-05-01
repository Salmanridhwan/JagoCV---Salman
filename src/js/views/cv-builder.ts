// CV Builder Logic

// Make goToCvStep available globally for inline onclick handlers
export function registerCvBuilderGlobals(): void {
  (window as any).goToCvStep = goToCvStep;
}

function goToCvStep(stepIndex: number): void {
  // Hide all steps
  document.querySelectorAll(".cv-step").forEach((el) => {
    el.classList.add("hidden");
    el.classList.remove("block", "animate-[slideInRight_0.4s_ease_forwards]");
  });

  // Show current step
  const targetStep = document.getElementById("cv-step-" + stepIndex);
  if (targetStep) {
    targetStep.classList.remove("hidden");
    targetStep.classList.add(
      "block",
      "animate-[slideInRight_0.4s_ease_forwards]",
    );

    // Ensure manual container is visible
    const containerManual = document.getElementById("container-cv-manual");
    const containerAi = document.getElementById("container-cv-ai");
    const tabManual = document.getElementById("tab-cv-manual");
    const tabAi = document.getElementById("tab-cv-ai");
    const progressAnimation = document.getElementById("cv-wizard-progress");

    if (containerManual && containerManual.classList.contains("hidden")) {
      containerManual.classList.remove("hidden");
      containerManual.classList.add("block");
      if (containerAi) containerAi.classList.add("hidden");
      if (progressAnimation) progressAnimation.classList.remove("hidden");
      
      // Update tabs
      if (tabManual && tabAi) {
        tabManual.className = "flex-1 py-3 rounded-xl bg-[#1E5EFF] text-white text-sm font-semibold transition-all";
        tabAi.className = "flex-1 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/5 dark:hover:text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 group";
      }
    }
  }

  // Update progress bar width
  const totalSteps = 5;
  const progressPercent = ((stepIndex - 1) / (totalSteps - 1)) * 100;
  const progressBar = document.getElementById("cv-progress-bar");
  if (progressBar) progressBar.style.width = progressPercent + "%";

  // Update indicators
  for (let i = 1; i <= totalSteps; i++) {
    const indicator = document.getElementById("indicator-step-" + i);
    if (!indicator) continue;
    const circle = indicator.querySelector("div");
    const text = indicator.querySelector("span");

    if (!circle || !text) continue;

    if (i < stepIndex) {
      // Completed
      circle.className =
        "w-10 h-10 rounded-full bg-[#1E5EFF] text-white flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(37,99,235,0.3)] transition-all duration-500 scale-100";
      circle.innerHTML =
        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
      text.className =
        "text-[11px] font-bold text-[#1E5EFF] dark:text-blue-400 mt-1 transition-colors uppercase tracking-wider hidden sm:block";
    } else if (i === stepIndex) {
      // Current
      circle.className =
        "w-10 h-10 rounded-full bg-[#1E5EFF] text-white flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all duration-500 scale-110";
      circle.innerHTML = String(i);
      text.className =
        "text-[11px] font-bold text-[#1E5EFF] dark:text-blue-400 mt-1 transition-colors uppercase tracking-wider block";
    } else {
      // Upcoming
      circle.className =
        "w-10 h-10 rounded-full bg-slate-100 dark:bg-[#070B19] border-2 border-slate-200 dark:border-[#2A3143] text-slate-400 flex items-center justify-center font-bold text-sm transition-all duration-500 scale-100";
      circle.innerHTML = String(i);
      text.className =
        "text-[11px] font-bold text-slate-400 mt-1 transition-colors uppercase tracking-wider hidden sm:block";
    }
  }

  // Scroll to top of builder
  const viewEl = document.getElementById("view-create-cv");
  if (viewEl)
    window.scrollTo({ top: viewEl.offsetTop - 60, behavior: "smooth" });
}

export function bindCvBuilderEvents(): void {
  // Input mode toggle (Manual vs AI)
  const tabCvManual = document.getElementById("tab-cv-manual");
  const tabCvAi = document.getElementById("tab-cv-ai");
  const containerCvManual = document.getElementById("container-cv-manual");
  const containerCvAi = document.getElementById("container-cv-ai");
  const cvWizardProgress = document.getElementById("cv-wizard-progress");
  const cvLayoutSelector = document.getElementById("cv-layout-selector");

  if (tabCvManual && tabCvAi && containerCvManual && containerCvAi) {
    tabCvManual.addEventListener("click", () => {
      tabCvManual.className =
        "flex-1 py-3 rounded-xl bg-[#1E5EFF] text-white text-sm font-semibold transition-all";
      tabCvAi.className =
        "flex-1 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/5 dark:hover:text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 group";

      containerCvManual.classList.remove("hidden");
      containerCvManual.classList.add(
        "block",
        "animate-[fadeIn_0.3s_ease_forwards]",
      );
      if (cvWizardProgress) cvWizardProgress.classList.remove("hidden");
      if (cvLayoutSelector) cvLayoutSelector.classList.remove("hidden");
      containerCvAi.classList.add("hidden");
      containerCvAi.classList.remove(
        "block",
        "animate-[fadeIn_0.3s_ease_forwards]",
      );
    });

    tabCvAi.addEventListener("click", () => {
      tabCvAi.className =
        "flex-1 py-3 rounded-xl bg-gradient-to-r from-[#1E5EFF] to-indigo-600 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25";
      tabCvManual.className =
        "flex-1 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/5 dark:hover:text-white text-sm font-semibold transition-all";

      containerCvAi.classList.remove("hidden");
      containerCvAi.classList.add(
        "block",
        "animate-[fadeIn_0.3s_ease_forwards]",
      );
      if (cvWizardProgress) cvWizardProgress.classList.add("hidden");
      if (cvLayoutSelector) cvLayoutSelector.classList.add("hidden");
      containerCvManual.classList.add("hidden");
      containerCvManual.classList.remove(
        "block",
        "animate-[fadeIn_0.3s_ease_forwards]",
      );
    });
  }

  // Layout Card Selector (below Form Manual tab)
  const layoutCards = document.querySelectorAll(".cv-layout-card");
  layoutCards.forEach((card) => {
    card.addEventListener("click", () => {
      layoutCards.forEach((c) => {
        c.className = c.className
          .replace("border-blue-500", "border-slate-200 dark:border-[#2A3143]")
          .replace("bg-blue-50 dark:bg-[#1E5EFF]/10", "bg-transparent");
        c.classList.remove("selected");
        c.classList.add(
          "hover:border-slate-400",
          "dark:hover:border-slate-500",
        );
        const badge = c.querySelector(".layout-check-badge");
        if (badge) badge.classList.add("hidden");
        const subtitle = c.querySelector("p:last-child") as HTMLElement;
        if (subtitle)
          subtitle.className = "text-[9px] text-slate-500 mt-0.5 font-medium";
      });

      card.classList.remove(
        "border-slate-200",
        "dark:border-[#2A3143]",
        "bg-transparent",
        "hover:border-slate-400",
        "dark:hover:border-slate-500",
      );
      card.classList.add(
        "selected",
        "border-blue-500",
        "bg-blue-50",
        "dark:bg-[#1E5EFF]/10",
      );
      const badge = card.querySelector(".layout-check-badge");
      if (badge) {
        badge.classList.remove("hidden");
        badge.classList.add("flex");
      }
      const subtitle = card.querySelector("p:last-child") as HTMLElement;
      if (subtitle) {
        subtitle.className =
          "text-[9px] text-blue-600 dark:text-blue-400 mt-0.5 font-medium";
      }
    });
  });

  // AI Sub-tab Logic
  const subTabAiChat = document.getElementById("sub-tab-ai-chat");
  const subTabAiMagic = document.getElementById("sub-tab-ai-magic");
  const sectionAiChat = document.getElementById("section-ai-chat");
  const sectionAiMagic = document.getElementById("section-ai-magic");

  if (subTabAiChat && subTabAiMagic && sectionAiChat && sectionAiMagic) {
    const activeSubTabClass = "px-6 py-2.5 rounded-xl text-xs font-bold transition-all bg-[#1E5EFF] text-white shadow-md shadow-blue-500/20";
    const inactiveSubTabClass = "px-6 py-2.5 rounded-xl text-xs font-bold transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white";

    subTabAiChat.addEventListener("click", () => {
      subTabAiChat.className = activeSubTabClass;
      subTabAiMagic.className = inactiveSubTabClass;
      sectionAiChat.classList.remove("hidden");
      sectionAiMagic.classList.add("hidden");
    });

    subTabAiMagic.addEventListener("click", () => {
      subTabAiMagic.className = activeSubTabClass;
      subTabAiChat.className = inactiveSubTabClass;
      sectionAiMagic.classList.remove("hidden");
      sectionAiChat.classList.add("hidden");
    });
  }

  // AI Chat Logic (Restored)
  const aiChatInput = document.getElementById("ai-chat-input") as HTMLTextAreaElement;
  const btnAiSend = document.getElementById("btn-ai-send");
  const aiChatHistory = document.getElementById("ai-chat-history");

  const appendMessage = (content: string, isAi: boolean) => {
    if (!aiChatHistory) return;
    const msgDiv = document.createElement("div");
    msgDiv.className = isAi
      ? "flex gap-4 group animate-[slideInRight_0.3s_ease_forwards]"
      : "flex gap-4 group flex-row-reverse animate-[slideInLeft_0.3s_ease_forwards]";

    msgDiv.innerHTML = `
      <div class="w-8 h-8 rounded-xl ${
        isAi
          ? "bg-blue-100 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30"
          : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
      } flex items-center justify-center shrink-0 border shadow-sm">
        <span class="text-xs">${isAi ? "🤖" : "👤"}</span>
      </div>
      <div class="flex flex-col gap-2 max-w-[85%] ${isAi ? "" : "items-end"}">
        <div class="${
          isAi
            ? "bg-white dark:bg-[#1A2133] rounded-tl-none text-slate-700 dark:text-slate-300"
            : "bg-blue-600 text-white rounded-tr-none"
        } border border-transparent dark:border-slate-700/50 rounded-2xl p-4 text-sm shadow-sm">
          ${content}
        </div>
        <span class="text-[9px] text-slate-400 font-medium px-1">Baru saja</span>
      </div>
    `;
    aiChatHistory.appendChild(msgDiv);
    aiChatHistory.scrollTop = aiChatHistory.scrollHeight;
  };

  if (btnAiSend && aiChatInput) {
    const handleSend = () => {
      const text = aiChatInput.value.trim();
      if (!text) return;

      appendMessage(text, false);
      aiChatInput.value = "";

      // Mock AI response
      setTimeout(() => {
        appendMessage(
          "Tentu! Saya akan memproses informasi tersebut. Apakah ada detail lain seperti sertifikat atau kursus yang ingin Anda tambahkan?",
          true,
        );
      }, 1000);
    };

    btnAiSend.addEventListener("click", handleSend);
    aiChatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
  }

  // AI Design Identity Logic (Magic Story)
  const aiDesignPrompt = document.getElementById("ai-design-prompt") as HTMLTextAreaElement;
  const btnSaveAiDesign = document.getElementById("btn-save-ai-design");

  if (btnSaveAiDesign && aiDesignPrompt) {
    btnSaveAiDesign.addEventListener("click", () => {
      const prompt = aiDesignPrompt.value.trim();
      if (!prompt) {
        if ((window as any).showToast) (window as any).showToast("Silakan ketik prompt Anda terlebih dahulu");
        return;
      }

      // Simulate saving/processing
      btnSaveAiDesign.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Memproses...
      `;

      setTimeout(() => {
        btnSaveAiDesign.innerHTML = `
          Simpan
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
          </svg>
        `;
        (window as any).goToCvStep(5);
        if ((window as any).showToast) (window as any).showToast("Identitas Desain AI Berhasil Disimpan! ✨");
      }, 2000);
    });
  }

  // Handle chips/suggestions
  const aiChips = document.querySelectorAll(".chip-ai, .ai-prompt-box button:not(#btn-save-ai-design)");
  aiChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const text = chip.textContent?.trim().replace("🌟 ", "");
      if (text === "Buatkan contoh prompt") {
        aiDesignPrompt.value = "Saya seorang Senior UX Designer dengan pengalaman 8 tahun. Saya ingin CV yang minimalis namun berkarakter, menonjolkan portofolio saya di industri e-commerce.";
      } else if (text) {
        aiDesignPrompt.value += (aiDesignPrompt.value ? " " : "") + text;
      }
      aiDesignPrompt.focus();
    });
  });

  // Template Choice Logic
  const btnTemplateManual = document.getElementById("ai-template-manual");
  const btnTemplateAuto = document.getElementById("ai-template-auto");

  if (btnTemplateManual && btnTemplateAuto) {
    btnTemplateManual.addEventListener("click", () => {
      btnTemplateManual.className =
        "px-3 py-1.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm transition-all";
      btnTemplateAuto.className =
        "px-3 py-1.5 rounded-md text-[10px] font-bold text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all flex items-center gap-1";
      if ((window as any).showToast) {
        (window as any).showToast("Mode: Pilih Template Manual diaktifkan");
      }
    });

    btnTemplateAuto.addEventListener("click", () => {
      btnTemplateAuto.className =
        "px-3 py-1.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm transition-all flex items-center gap-1";
      btnTemplateManual.className =
        "px-3 py-1.5 rounded-md text-[10px] font-bold text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all";
      if ((window as any).showToast) {
        (window as any).showToast(
          "Mode: Template Terserah AI (Otomatis) diaktifkan ✨",
        );
      }
    });
  }

  // Manual Generate Button
  const btnManualGenerate = document.getElementById("btn-manual-generate");
  if (btnManualGenerate) {
    btnManualGenerate.addEventListener("click", () => {
      if ((window as any).showToast) {
        (window as any).showToast("Mempersiapkan CV ATS Anda... ✨");
      }
    });
  }

  // Theme Selector Logic for CV
  const cvLayoutCards = document.querySelectorAll(".cv-layout-card");
  cvLayoutCards.forEach((card) => {
    card.addEventListener("click", () => {
      // Remove selected class and reset borders for all cards
      cvLayoutCards.forEach((c) => {
        c.classList.remove(
          "selected",
          "border-blue-500",
          "bg-blue-50",
          "dark:bg-[#1E5EFF]/10",
        );
        c.classList.add(
          "border-slate-200",
          "dark:border-[#2A3143]",
          "bg-transparent",
        );
        const badge = c.querySelector(".layout-check-badge");
        if (badge) badge.classList.add("hidden");
        if (badge) badge.classList.remove("flex");
      });

      // Add selected class and styling to clicked card
      card.classList.add(
        "selected",
        "border-blue-500",
        "bg-blue-50",
        "dark:bg-[#1E5EFF]/10",
      );
      card.classList.remove(
        "border-slate-200",
        "dark:border-[#2A3143]",
        "bg-transparent",
      );
      const badge = card.querySelector(".layout-check-badge");
      if (badge) badge.classList.remove("hidden");
      if (badge) badge.classList.add("flex");

      // Check the radio input
      const radio = card.querySelector('input[type="radio"]') as HTMLInputElement;
      if (radio) radio.checked = true;

      if ((window as any).showToast) {
        const layoutName = card.querySelector("p")?.textContent?.trim();
        (window as any).showToast(`Tema ${layoutName} dipilih ✨`);
      }
    });
  });
}

