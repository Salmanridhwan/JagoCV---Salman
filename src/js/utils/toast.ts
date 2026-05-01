// Toast notification utility

export function showToast(msg: string): void {
  const toast = document.createElement("div");
  toast.className =
    "fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-[slideInRight_0.3s_ease_forwards]";
  toast.innerHTML = `
    <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
    <span class="text-sm font-medium">${msg}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.replace(
      "animate-[slideInRight_0.3s_ease_forwards]",
      "animate-[zoomOut_0.3s_ease_forwards]",
    );
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/** Attach the toast function to the global window so inline HTML onclick handlers work. */
export function registerGlobalToast(): void {
  (window as any).showToast = showToast;
}
