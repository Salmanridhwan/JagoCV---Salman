/**
 * Halaman stub kosong untuk menu non-Main-Menu (instruksi tahap ini:
 * "sidebar semua bisa masuk ke halaman, tapi kosongkan selain Main Menu").
 * Pola shell mengikuti desain patokan supaya konsisten.
 */
import { esc } from "../ui";

export function mountStub(containerId: string, title: string, description: string): void {
  const host = document.getElementById(containerId);
  if (!host) return;
  host.innerHTML = `
    <div class="mb-7">
      <p class="text-[11px] font-bold tracking-wide text-slate-400">JAGOADMIN <span class="text-slate-300">•</span> <span class="text-slate-500">MODUL BERIKUTNYA</span></p>
      <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">${esc(title)}</h1>
      <p class="text-sm text-slate-500 mt-1 max-w-2xl">${esc(description)}</p>
    </div>

    <div class="rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 py-20 px-8 text-center">
      <div class="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h6m-6 4h6M13 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V7l-6-4z"></path></svg>
      </div>
      <p class="font-bold text-slate-600">Halaman ini dikosongkan pada tahap Main Menu.</p>
      <p class="text-xs text-slate-400 mt-1">Spesifikasinya sudah disiapkan di <span class="font-semibold text-slate-500">ADMIN_IMPLEMENTATION.md</span> dan akan dibangun pada tahap berikutnya.</p>
    </div>`;
}
