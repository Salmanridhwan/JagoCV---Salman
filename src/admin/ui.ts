/**
 * Komponen reusable admin (konvensi Bagian 2): toast, modal generik,
 * dialog konfirmasi (destructive = double-confirm), skeleton, escape HTML.
 */
import { initials } from "./format";

// ── Util ─────────────────────────────────────────────────────────────

export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function initialAvatar(name: string, color = "bg-emerald-100 text-emerald-700"): string {
  return `<div class="w-9 h-9 rounded-full ${color} flex items-center justify-center text-xs font-bold shrink-0">${esc(initials(name))}</div>`;
}

/** Skeleton grid baris (loading state). */
export function skeletonRows(n = 4): string {
  return Array.from({ length: n })
    .map(
      () =>
        `<div class="h-12 rounded-xl bg-slate-200/70 animate-pulse mb-3"></div>`,
    )
    .join("");
}

// ── Toast ────────────────────────────────────────────────────────────

export function showToast(msg: string, type: "success" | "error" | "info" = "success"): void {
  const colors: Record<string, string> = {
    success: "bg-slate-900 text-white",
    error: "bg-rose-600 text-white",
    info: "bg-slate-800 text-white",
  };
  const toast = document.createElement("div");
  toast.className = `fixed bottom-5 right-5 z-[999] ${colors[type]} px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium max-w-sm`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ── Modal generik ────────────────────────────────────────────────────

interface ModalSpec {
  title: string;
  subtitle?: string;
  body: string;          // HTML body
  footer?: string;       // HTML tombol footer; default tombol Tutup
  wide?: boolean;
}

export function openModal(spec: ModalSpec): HTMLElement {
  const host = document.getElementById("admin-modal");
  if (!host) throw new Error("Modal host tidak ditemukan");

  host.innerHTML = `
    <div class="bg-white rounded-2xl w-full ${spec.wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] flex flex-col shadow-2xl">
      <div class="flex items-start justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h3 class="text-lg font-bold text-slate-900">${esc(spec.title)}</h3>
          ${spec.subtitle ? `<p class="text-xs text-slate-500 mt-0.5">${esc(spec.subtitle)}</p>` : ""}
        </div>
        <button data-modal-close class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="overflow-y-auto px-6 py-5 flex-1">${spec.body}</div>
      <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 rounded-b-2xl bg-slate-50/60">
        ${spec.footer ?? `<button data-modal-close class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-white">Tutup</button>`}
      </div>
    </div>`;
  host.classList.remove("hidden");

  host.querySelectorAll("[data-modal-close]").forEach((btn) =>
    btn.addEventListener("click", closeModal),
  );
  return host.querySelector("div > div") as HTMLElement;
}

export function closeModal(): void {
  const host = document.getElementById("admin-modal");
  if (host) {
    host.classList.add("hidden");
    host.innerHTML = "";
  }
}

// ── Dialog konfirmasi (double-confirm destruktif, Bagian 2) ──────────

export interface ConfirmSpec {
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  /** Ketik teks ini untuk membolehkan konfirmasi (type-to-confirm). */
  confirmType?: string;
  requireReason?: boolean;
}

/** Kembalikan {confirmed, reason} — UI wajib menunggu Promise ini. */
export function confirmDialog(spec: ConfirmSpec): Promise<{ confirmed: boolean; reason: string }> {
  return new Promise((resolve) => {
    const needText = spec.confirmType ?? "";
    const body = `
      <p class="text-sm text-slate-600 mb-4">${spec.message}</p>
      ${needText ? `
        <label class="block text-xs font-semibold text-slate-600 mb-1.5">Ketik <span class="font-mono">${esc(needText)}</span> untuk konfirmasi</label>
        <input id="confirm-type" class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-slate-400" autocomplete="off">`
      : ""}
      ${spec.requireReason ? `
        <label class="block text-xs font-semibold text-slate-600 mb-1.5">Alasan (wajib)</label>
        <input id="confirm-reason" class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:border-slate-400" placeholder="mis. pelanggaran syarat &amp; ketentuan" autocomplete="off">`
      : ""}
      <p id="confirm-error" class="hidden text-xs font-medium text-rose-600 mt-1"></p>`;

    const modal = openModal({
      title: spec.title,
      body,
      footer: `
        <button data-cancel class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-white">Batal</button>
        <button data-ok class="px-4 py-2 rounded-xl ${spec.danger ? "bg-rose-600 hover:bg-rose-500" : "bg-slate-900 hover:bg-slate-800"} text-white text-sm font-semibold">${esc(spec.confirmText ?? "Konfirmasi")}</button>`,
    });

    const done = (confirmed: boolean): void => {
      const reason = (modal.querySelector("#confirm-reason") as HTMLInputElement | null)?.value ?? "";
      closeModal();
      resolve({ confirmed, reason });
    };

    (modal.querySelector("[data-cancel]") as HTMLButtonElement).addEventListener("click", () => done(false));
    (modal.querySelector("[data-ok]") as HTMLButtonElement).addEventListener("click", () => {
      const err = modal.querySelector("#confirm-error") as HTMLElement;
      const typed = (modal.querySelector("#confirm-type") as HTMLInputElement | null)?.value ?? "";
      const reason = (modal.querySelector("#confirm-reason") as HTMLInputElement | null)?.value ?? "";
      if (needText && typed !== needText) {
        err.textContent = `Ketik "${needText}" dengan persis untuk konfirmasi.`;
        err.classList.remove("hidden");
        return;
      }
      if (spec.requireReason && !reason.trim()) {
        err.textContent = "Alasan wajib diisi.";
        err.classList.remove("hidden");
        return;
      }
      done(true);
    });
  });
}

/** Nonaktifkan tombol + tampilkan spinner kecil saat submit (pola setButtonLoading). */
export function setButtonLoading(btn: HTMLButtonElement, loading: boolean): void {
  if (loading) {
    btn.dataset.label = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<svg class="w-4 h-4 animate-spin mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>`;
    btn.classList.add("opacity-70");
  } else {
    btn.disabled = false;
    if (btn.dataset.label) btn.innerHTML = btn.dataset.label;
    btn.classList.remove("opacity-70");
  }
}
