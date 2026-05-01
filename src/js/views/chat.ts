// AI Chat Widget Logic

export function bindChatWidget(): void {
  const chatWidgets = document.querySelectorAll(".ai-chat-widget");

  chatWidgets.forEach((widget) => {
    const isExpanded = widget.classList.contains("w-[380px]");
    if (!isExpanded) return;

    const input = widget.querySelector("input") as HTMLInputElement;
    const sendBtn = widget.querySelector(".js-send-btn") as HTMLButtonElement;
    const messagesContainer = widget.querySelector(
      ".js-chat-messages",
    ) as HTMLDivElement;
    const quickActions = widget.querySelectorAll(".js-quick-action");
    const isResume = widget.innerHTML.includes("Resume");
    const isPortfolio = widget.innerHTML.includes("Portfolio");

    let themeColorClass = "bg-blue-600";
    let bubbleClass =
      "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800";

    if (isResume) {
      themeColorClass = "bg-indigo-600";
      bubbleClass =
        "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800";
    } else if (isPortfolio) {
      themeColorClass = "bg-cyan-600";
      bubbleClass =
        "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-100 dark:border-cyan-800";
    }

    const addUserMessage = (text: string) => {
      const msgDiv = document.createElement("div");
      msgDiv.className =
        "flex items-start gap-4 flex-row-reverse mt-4 animate-[fadeIn_0.3s_ease_forwards]";
      msgDiv.innerHTML = `
         <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
           <img src="https://picsum.photos/seed/budi/100/100" class="w-full h-full object-cover">
         </div>
         <div class="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl rounded-tr-none text-sm text-slate-800 dark:text-slate-200 shadow-sm leading-relaxed max-w-[85%]">
           ${text}
         </div>
      `;
      messagesContainer.appendChild(msgDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    const addAiResponse = () => {
      const typingDiv = document.createElement("div");
      typingDiv.className =
        "flex items-start gap-4 mt-4 animate-[fadeIn_0.3s_ease_forwards]";
      typingDiv.innerHTML = `
         <div class="w-8 h-8 rounded-full ${themeColorClass} flex items-center justify-center shrink-0">
           <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
         </div>
         <div class="${bubbleClass} p-4 rounded-2xl rounded-tl-none text-sm flex items-center gap-1 shadow-sm">
           <div class="w-2 h-2 rounded-full bg-current opacity-40 animate-bounce"></div>
           <div class="w-2 h-2 rounded-full bg-current opacity-40 animate-bounce" style="animation-delay: 0.15s"></div>
           <div class="w-2 h-2 rounded-full bg-current opacity-40 animate-bounce" style="animation-delay: 0.3s"></div>
         </div>
      `;
      messagesContainer.appendChild(typingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      setTimeout(() => {
        typingDiv.remove();

        const responseDiv = document.createElement("div");
        responseDiv.className =
          "flex items-start gap-4 mt-4 animate-[fadeIn_0.3s_ease_forwards]";
        responseDiv.innerHTML = `
           <div class="w-8 h-8 rounded-full ${themeColorClass} flex items-center justify-center shrink-0">
             <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
           </div>
           <div class="${bubbleClass} p-4 rounded-2xl rounded-tl-none text-sm text-emerald-600 dark:text-emerald-400 font-semibold shadow-sm leading-relaxed max-w-[85%] flex items-center gap-2">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             Selesai! Saya telah memperbarui dokumen Anda sesuai permintaan.
           </div>
        `;
        messagesContainer.appendChild(responseDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 1500);
    };

    const handleSend = () => {
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;

      addUserMessage(text);
      input.value = "";

      const attachmentsDiv = widget.querySelector(
        ".js-chat-attachments",
      ) as HTMLDivElement;
      if (attachmentsDiv) {
        attachmentsDiv.innerHTML = "";
        attachmentsDiv.classList.add("hidden");
      }

      addAiResponse();
    };

    if (sendBtn) sendBtn.addEventListener("click", handleSend);
    if (input) {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSend();
        }
      });
    }

    quickActions.forEach((btn) => {
      btn.addEventListener("click", () => {
        addUserMessage(btn.textContent || "");
        addAiResponse();
      });
    });

    // Capture Mode Logic
    const captureBtn = widget.querySelector(
      ".js-capture-btn",
    ) as HTMLButtonElement;
    const attachmentsDiv = widget.querySelector(
      ".js-chat-attachments",
    ) as HTMLDivElement;

    if (captureBtn && attachmentsDiv) {
      let isAnnotating = false;
      let boxSize = 150; // Initial size
      let mouseX = 0;
      let mouseY = 0;

      const themeColor = isPortfolio ? "cyan" : isResume ? "indigo" : "blue";

      let annotateHighlighter = document.getElementById("annotate-highlighter");
      if (!annotateHighlighter) {
        annotateHighlighter = document.createElement("div");
        annotateHighlighter.id = "annotate-highlighter";
        document.body.appendChild(annotateHighlighter);
      }

      const docContainer = widget.parentElement?.querySelector(
        '[id$="-document-container"]',
      ) as HTMLElement;

      const stopAnnotating = () => {
        isAnnotating = false;
        captureBtn.classList.remove(
          `bg-${themeColor}-600`,
          "text-white",
          "ring-2",
          `ring-${themeColor}-500`,
        );
        captureBtn.classList.add(
          "bg-white",
          "dark:bg-slate-800",
          "text-slate-700",
          "dark:text-slate-300",
        );
        document.body.classList.remove("cursor-none");

        if (annotateHighlighter) {
          annotateHighlighter.classList.add("hidden");
        }

        document.removeEventListener("mousemove", handleMouseMove, true);
        document.removeEventListener("wheel", handleWheel, { capture: true });
        document.removeEventListener("click", handleCaptureClick, true);

        if (docContainer) {
          docContainer.classList.remove("pointer-events-none");
          docContainer.style.userSelect = "";
        }
      };

      const updateBoxPosition = () => {
        if (!annotateHighlighter || !isAnnotating) return;

        annotateHighlighter.style.width = `${boxSize}px`;
        annotateHighlighter.style.height = `${boxSize}px`;
        annotateHighlighter.style.left = `${mouseX - boxSize / 2}px`;
        annotateHighlighter.style.top = `${mouseY - boxSize / 2}px`;
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isAnnotating) return;
        mouseX = e.clientX;
        mouseY = e.clientY;
        updateBoxPosition();
      };

      const handleWheel = (e: WheelEvent) => {
        if (!isAnnotating) return;
        e.preventDefault(); // Prevent page scrolling

        const delta = e.deltaY > 0 ? -15 : 15;
        boxSize = Math.max(40, Math.min(600, boxSize + delta));
        updateBoxPosition();
      };

      const handleCaptureClick = (e: MouseEvent) => {
        if (!isAnnotating) return;
        // Prevent capture if clicking on the chat UI explicitly
        if (widget.contains(e.target as Node)) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        // Create attachment pill
        const attachment = document.createElement("div");
        attachment.className = `inline-flex items-center gap-1.5 px-3 py-1 bg-${themeColor}-900/50 border border-${themeColor}-500/30 text-${themeColor}-300 text-xs font-medium rounded-lg animate-[fadeIn_0.2s_ease_forwards]`;
        attachment.innerHTML = `
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10V5a2 2 0 012-2h5m4 0h5a2 2 0 012 2v5m0 4v5a2 2 0 01-2 2h-5m-4 0H5a2 2 0 01-2-2v-5M8 8h8v8H8z"></path></svg>
          Area Terpilih [${boxSize}x${boxSize}]
          <button type="button" class="hover:text-white ml-2 shrink-0 hover:bg-${themeColor}-800 rounded-full p-0.5 transition-colors"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        `;

        attachment.querySelector("button")?.addEventListener("click", (ev) => {
          ev.preventDefault();
          attachment.remove();
          if (attachmentsDiv.children.length === 0) {
            attachmentsDiv.classList.add("hidden");
          }
        });

        attachmentsDiv.classList.remove("hidden");
        attachmentsDiv.appendChild(attachment);

        if (input) {
          input.focus();
          input.placeholder = "Apa yang harus saya ubah di area ini?";
        }
        stopAnnotating();
      };

      captureBtn.addEventListener("click", () => {
        isAnnotating = !isAnnotating;
        if (isAnnotating) {
          captureBtn.classList.add(
            `bg-${themeColor}-600`,
            "text-white",
            "ring-2",
            `ring-${themeColor}-500`,
          );
          captureBtn.classList.remove(
            "bg-white",
            "dark:bg-slate-800",
            "text-slate-700",
            "dark:text-slate-300",
          );
          document.body.classList.add("cursor-none"); // Hide the standard cursor

          // Set initial style for highlighter box
          if (annotateHighlighter) {
            annotateHighlighter.className = `fixed border-[3px] border-${themeColor}-500 bg-${themeColor}-500/10 z-[100] transition-none pointer-events-none shadow-[0_0_15px_rgba(var(--tw-colors-${themeColor}-500),0.4)] backdrop-blur-[2px] rounded-lg`;
            // Center on window roughly before first mouse move
            mouseX = window.innerWidth / 2;
            mouseY = window.innerHeight / 2;
            updateBoxPosition();
            annotateHighlighter.classList.remove("hidden");
          }

          document.addEventListener("mousemove", handleMouseMove, true);
          document.addEventListener("wheel", handleWheel, {
            capture: true,
            passive: false,
          });
          document.addEventListener("click", handleCaptureClick, true);

          if (docContainer) {
            docContainer.style.userSelect = "none";
            docContainer.classList.add("pointer-events-none");
          }
        } else {
          stopAnnotating();
        }
      });
    }
  });
}
