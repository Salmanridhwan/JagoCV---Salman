// Logika halaman pricing/topup (fokus desain — checkout menyusul):
//  - Kontainer nominal "Rp" gelap sebagai fokus utama antarmuka top-up.
//  - Input memakai keyboard fisik (antarmuka web desktop): tanpa keypad
//    di layar, tanpa tombol kalkulator.
//  - Angka diketik muncul tepat setelah "Rp", diformat pemisah ribuan
//    titik sesuai standar Rupiah Indonesia (id-ID).
//  - Kartu nominal cepat = shortcut yang mengisi input utama; input tetap
//    dapat diedit kapan saja.
//  - Tombol lanjut pembayaran masih stub (desain dulu, checkout nanti).

const MAX_DIGITS = 9; // batas wajar — cukup untuk nominal top up
const MIN_TOPUP = 2_000; // nominal cepat terkecil

const QUICK_AMOUNTS: Array<{ value: number; badge?: string }> = [
  { value: 2_000 },
  { value: 4_000 },
  { value: 6_000 },
  { value: 8_000 },
  { value: 10_000, badge: "Populer" },
  { value: 12_000 },
];

interface Elements {
  box: HTMLElement | null;
  input: HTMLInputElement | null;
  currency: HTMLElement | null;
  caret: HTMLElement | null;
  amountText: HTMLElement | null;
  confirm: HTMLElement | null;
  status: HTMLElement | null;
  grid: HTMLElement | null;
  continueBtn: HTMLButtonElement | null;
}

const els: Elements = {
  box: null,
  input: null,
  currency: null,
  caret: null,
  amountText: null,
  confirm: null,
  status: null,
  grid: null,
  continueBtn: null,
};

// ── Util format ──────────────────────────────────────────────────────

/** Hanya digit (maks 9). "Rp12.500" → "12500". */
function onlyDigits(raw: string): string {
  return raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, MAX_DIGITS);
}

/** 12500 → "12.500" (id-ID: pemisah ribuan titik). */
function formatRibuan(value: number): string {
  return value.toLocaleString("id-ID");
}

function validAmount(n: number): boolean {
  return n >= MIN_TOPUP;
}

// ── Render ───────────────────────────────────────────────────────────

function render(): void {
  const digits = els.input?.value ?? "";
  const n = digits ? parseInt(digits, 10) : 0;
  const empty = digits.length === 0;

  // Angka diketik muncul langsung setelah "Rp".
  if (els.amountText) els.amountText.textContent = digits ? formatRibuan(n) : "";

  // Saat kosong, "Rp" + kursor tampak di tengah kontainer (layout flex
  // dengan justify-center). is-idle menyesuaikan jarak antar elemen.
  els.currency?.classList.toggle("is-idle", empty);
  els.caret?.classList.toggle("is-idle", empty);

  // Area sekunder — konfirmasi nilai yang dimasukkan (minimalis).
  if (els.confirm) {
    els.confirm.textContent = digits
      ? `Rp ${formatRibuan(n)} akan ditambahkan ke saldo`
      : "Belum ada nominal dimasukkan";
  }
  if (els.status) {
    const valid = validAmount(n);
    els.status.textContent = empty ? "Menunggu" : valid ? "Siap" : "Minimal Rp2.000";
    els.status.classList.toggle("is-valid", valid);
  }

  // Tombol lanjut (stub): aktif hanya bila nominal valid.
  if (els.continueBtn) els.continueBtn.disabled = !validAmount(n);

  renderQuickCards(n);
}

function renderQuickCards(current: number): void {
  if (!els.grid) return;
  els.grid.querySelectorAll<HTMLButtonElement>("button[data-amount]").forEach((card) => {
    const amount = Number(card.dataset.amount);
    const selected = amount === current && current > 0;
    card.classList.toggle("is-selected", selected);
    card.querySelector("[data-price]")?.classList.toggle("is-selected", selected);
    card.querySelector("[data-badge]")?.classList.toggle("is-selected", selected);
  });
}

// ── Input keyboard fisik ─────────────────────────────────────────────
// Input transparan (opacity-0) menutupi seluruh kontainer gelap sehingga
// klik & ketikan keyboard fisik langsung ditangkap; angka lalu dirender
// besar di dalam kontainer.

function handleTyping(raw: string): void {
  if (!els.input) return;
  els.input.value = onlyDigits(raw);
  render();
}

// ── Kartu nominal cepat ──────────────────────────────────────────────

function buildQuickCards(): void {
  if (!els.grid) return;
  els.grid.innerHTML = QUICK_AMOUNTS.map(
    (q) => `
      <button
        type="button"
        data-amount="${q.value}"
        class="topup-quick-card relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 px-4 py-5 text-center transition-all hover:border-blue-500/60 hover:shadow-md"
      >
        ${
          q.badge
            ? `<span data-badge class="topup-quick-badge absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wide shadow-sm">${q.badge}</span>`
            : ""
        }
        <span class="block text-xl font-extrabold text-slate-800 dark:text-slate-100">${formatRibuan(q.value)}</span>
        <span data-price class="block mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">Rp${formatRibuan(q.value)}</span>
      </button>
    `,
  ).join("");

  // Klik kartu = shortcut mengisi input utama (input tetap bisa diedit).
  // Fokus kembali ke input agar ketikan keyboard berikutnya langsung diterima.
  els.grid.querySelectorAll<HTMLButtonElement>("button[data-amount]").forEach((card) => {
    card.addEventListener("click", () => {
      if (!els.input) return;
      els.input.value = String(Number(card.dataset.amount));
      render();
      els.input.focus();
    });
  });
}

// ── Fokus & kursor ───────────────────────────────────────────────────

function setFocused(on: boolean): void {
  els.box?.classList.toggle("is-focused", on);
  // Kursor berkedip terus, tapi kecepatan kedip berbeda saat fokus/blur.
  els.caret?.classList.toggle("is-paused", !on);
  els.currency?.classList.toggle("is-dimmed", !on);
}

// ── Binding & init ───────────────────────────────────────────────────

export function bindPricingEvents(): void {
  els.box = document.getElementById("topup-amount-box");
  els.input = document.getElementById("topup-amount-input") as HTMLInputElement | null;
  els.currency = document.getElementById("topup-currency");
  els.caret = document.getElementById("topup-caret");
  els.amountText = document.getElementById("topup-amount-text");
  els.confirm = document.getElementById("topup-confirm");
  els.status = document.getElementById("topup-status");
  els.grid = document.getElementById("topup-quick-grid");
  els.continueBtn = document.getElementById("btn-topup-continue") as HTMLButtonElement | null;

  if (!els.box || !els.input || !els.grid) return;

  buildQuickCards();
  render();

  // Klik di mana pun pada kontainer gelap → fokus input.
  els.box.addEventListener("click", () => els.input?.focus());
  els.input.addEventListener("focus", () => setFocused(true));
  els.input.addEventListener("blur", () => setFocused(false));

  // Keyboard fisik: angka diketik langsung tampil setelah "Rp".
  els.input.addEventListener("input", () => handleTyping(els.input!.value));

  // Paste angka (mis. "25.000") juga diformat dengan benar.
  els.input.addEventListener("paste", (e) => {
    const text = e.clipboardData?.getData("text") ?? "";
    if (text) {
      e.preventDefault();
      handleTyping(text);
    }
  });

  // Stub checkout — akan dihubungkan ke /backend/checkout.php setelah
  // desain disetujui.
  els.continueBtn?.addEventListener("click", () => {
    /* TODO(checkout): POST nominal ke backend lalu redirect payment gateway. */
  });
}
