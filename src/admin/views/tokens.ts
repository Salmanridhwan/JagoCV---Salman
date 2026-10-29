/**
 * Menu "TRANSAKSI & KOMERSIAL → Manajemen Token".
 *
 * UI mengikuti desain patokan Figma node 193:2 ("manajemen token"):
 *   breadcrumb + judul + deskripsi, chip "Total Paket: N" di kanan,
 *   satu kartu "Daftar Harga & Konversi Token" berisi tombol hitam
 *   "Tambah Token Baru" dan tabel 4 kolom.
 *
 * Perbedaan yang diminta produk:
 *   - AKSI memakai ikon TONG SAMPAH (hapus) menggantikan ikon titik tiga.
 *   - Kolom HARGA / GENERATE ditambahkan agar nominal biaya sekali
 *     generate (mis. Rp 2.000) bisa diatur di sini lalu dipasang ke
 *     template pada Manajemen Template.
 *
 * Sumber data: /backend/admin/tokens.php (tabel `token_packages`).
 */
import { adminApi } from "../api";
import { esc, showToast, openModal, closeModal, confirmDialog, setButtonLoading } from "../ui";
import { formatAngka, formatRupiah } from "../format";

interface TokenRow {
  id: number;
  name: string;
  token_amount: number;
  cost_per_generate: number;
  is_active: boolean;
  sort_order: number;
  used_by_templates: number;
  created_at: string;
  updated_at: string;
}

interface TokenList {
  summary: { total: number; aktif: number; nonaktif: number };
  tokens: TokenRow[];
}

const el = (): HTMLElement => document.getElementById("view-tokens") as HTMLElement;

const state = {
  q: "",
  status: "all" as "all" | "aktif" | "nonaktif",
  list: null as TokenList | null,
};

export function mountTokensView(): void {
  void load();
}

async function load(): Promise<void> {
  const host = el();
  try {
    state.list = await adminApi<TokenList>("tokens.php", {
      query: { q: state.q, status: state.status === "all" ? "" : state.status },
    });
    render(host);
  } catch (e) {
    host.innerHTML = `<div class="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">${esc(
      (e as Error).message,
    )}</div>`;
  }
}

// ── Ikon tier (mengikuti warna kartu pada desain) ────────────────────
function tierStyle(index: number): { bg: string; fg: string } {
  const palette = [
    { bg: "#86f2e4", fg: "#006a61" }, // mint
    { bg: "#e0f2fe", fg: "#075985" }, // biru muda
    { bg: "#fef3c7", fg: "#92400e" }, // amber
    { bg: "#0b1c30", fg: "#ffffff" }, // navy
  ];
  return palette[index % palette.length];
}

function tierIcon(index: number): string {
  const { bg, fg } = tierStyle(index);
  return `<span class="inline-flex items-center justify-center rounded-full shrink-0" style="width:32px;height:32px;background:${bg};color:${fg}">
    <svg class="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6l7-4z"></path>
    </svg>
  </span>`;
}

// ── Halaman ──────────────────────────────────────────────────────────

function render(host: HTMLElement): void {
  const s = state.list!;

  host.innerHTML = `
    <!-- Breadcrumb & Top Bar -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div class="flex flex-col gap-1">
        <nav class="flex items-center gap-2">
          <span class="text-[11px] font-bold tracking-[0.55px] uppercase text-[#45464d]">TRANSAKSI &amp; KOMERSIAL</span>
          <svg class="w-[4.3px] h-[7px] text-[#76777d]" viewBox="0 0 5 8" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M1 1l3 3-3 3"></path></svg>
          <span class="text-[11px] font-bold tracking-[0.55px] uppercase text-[#0b1c30]">MANAJEMEN TOKEN</span>
        </nav>
        <h1 class="text-[24px] font-semibold text-[#0b1c30] tracking-[-0.6px] leading-8">Manajemen Token</h1>
        <p class="text-[14px] text-[#45464d] leading-5 max-w-[672px]">
          Kelola daftar harga, alokasi konversi token, dan status ketersediaan paket token untuk pembuatan
          dokumen pengguna.
        </p>
      </div>

      <div class="flex items-center shrink-0">
        <div class="inline-flex items-center gap-2 rounded-full bg-[#e0f2fe] px-3 py-1.5 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <span class="w-[7.33px] h-2 rounded-full bg-[#006a61]"></span>
          <span class="text-[11px] font-bold tracking-[0.44px] text-[#075985]">Total Paket: ${formatAngka(s.summary.total)}</span>
        </div>
      </div>
    </div>

    <!-- Kartu utama: Daftar Harga & Konversi Token -->
    <div class="mt-6 rounded-[12px] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)] flex flex-col gap-4">
      <div class="flex items-start justify-between gap-4 border-b border-[#e5e7eb] pb-4 flex-wrap">
        <div class="flex flex-col gap-0.5">
          <div class="flex items-center gap-2">
            <svg class="w-[16.5px] h-[14.7px] text-[#0b1c30]" fill="none" stroke="currentColor" viewBox="0 0 24 22" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 6h13M8 11h13M8 16h13M3 6h.01M3 11h.01M3 16h.01"></path>
            </svg>
            <h2 class="text-[20px] font-bold text-[#0b1c30] tracking-[-0.2px] leading-7">Daftar Harga &amp; Konversi Token</h2>
          </div>
          <p class="text-[14px] text-[#45464d] leading-5">Konfigurasi nominal top-up dan perolehan token aktif di sistem checkout.</p>
        </div>

        <button id="tk-new"
                class="inline-flex items-center gap-2 rounded-full bg-black hover:bg-slate-800 px-5 py-2.5 shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition-colors">
          <svg class="w-[10.5px] h-[10.5px] text-white" fill="none" stroke="currentColor" viewBox="0 0 12 12" stroke-width="2" stroke-linecap="round"><path d="M6 1v10M1 6h10"></path></svg>
          <span class="text-[12px] font-semibold tracking-[0.24px] text-white">Tambah Token Baru</span>
        </button>
      </div>

      <!-- Filter ringkas -->
      <div class="flex flex-wrap items-center gap-2">
        ${chip("all", `Semua (${s.summary.total})`)}
        ${chip("aktif", `Aktif (${s.summary.aktif})`)}
        ${chip("nonaktif", `Nonaktif (${s.summary.nonaktif})`)}
        <div class="relative ml-auto w-full sm:w-56">
          <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"></path></svg>
          <input id="tk-search" type="text" placeholder="Cari nama token…" value="${esc(state.q)}"
                 class="w-full rounded-full bg-slate-100/80 border border-transparent focus:border-slate-300 focus:bg-white pl-9 pr-4 py-2 text-sm outline-none">
        </div>
      </div>

      <!-- Tabel -->
      <div class="rounded-[8px] border border-[#e5e7eb] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[860px] border-collapse">
            <thead>
              <tr class="bg-[#eff4ff] border-b border-[#e5e7eb]">
                <th class="text-left text-[11px] font-bold uppercase tracking-[0.55px] text-[#76777d] px-4 py-[19px]">Nama / Tier Paket</th>
                <th class="text-left text-[11px] font-bold uppercase tracking-[0.55px] text-[#76777d] px-4 py-3">Jumlah Token</th>
                <th class="text-left text-[11px] font-bold uppercase tracking-[0.55px] text-[#76777d] px-4 py-3">Harga / Generate</th>
                <th class="text-center text-[11px] font-bold uppercase tracking-[0.55px] text-[#76777d] px-4 py-[19px]">Status</th>
                <th class="text-center text-[11px] font-bold uppercase tracking-[0.55px] text-[#76777d] px-4 py-[19px]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${s.tokens.length === 0 ? emptyState() : s.tokens.map(rowHtml).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <p class="text-[11px] text-slate-400 leading-relaxed">
        Harga / Generate adalah nominal yang dibebankan setiap 1× generate dokumen memakai token ini.
        Token dipasang ke template pada halaman <b class="text-slate-500">Manajemen Template</b> (tambah / edit template).
      </p>
    </div>`;

  // — Binding —
  host.querySelectorAll<HTMLButtonElement>("[data-chip]").forEach((b) =>
    b.addEventListener("click", () => {
      state.status = b.dataset.chip as typeof state.status;
      void load();
    }),
  );

  const search = host.querySelector("#tk-search") as HTMLInputElement;
  let t: number | undefined;
  search.addEventListener("input", () => {
    window.clearTimeout(t);
    t = window.setTimeout(() => {
      state.q = search.value.trim();
      void load();
    }, 350);
  });

  (host.querySelector("#tk-new") as HTMLButtonElement).addEventListener("click", () => openForm(null));
  host.querySelector("#tk-empty-new")?.addEventListener("click", () => openForm(null));

  bindRows();
}

function chip(id: string, label: string): string {
  const on = state.status === id;
  return `<button data-chip="${esc(id)}" class="px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-colors ${
    on ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
  }">${esc(label)}</button>`;
}

function emptyState(): string {
  const filtered = state.q !== "" || state.status !== "all";
  return `<tr><td colspan="5" class="text-center py-14">
    <div class="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6l7-4z"></path></svg>
    </div>
    <p class="font-bold text-slate-600">${filtered ? "Tidak ada token yang cocok" : "Belum ada paket token"}</p>
    <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto">
      ${filtered ? "Coba ubah kata kunci atau filter status." : "Tambahkan paket token pertama untuk mengatur biaya generate dokumen."}
    </p>
    ${filtered ? "" : `<button id="tk-empty-new" class="mt-4 rounded-full bg-slate-900 text-white text-xs font-bold px-4 py-2 hover:bg-slate-800">+ Tambah Token Baru</button>`}
  </td></tr>`;
}

function rowHtml(t: TokenRow, i: number): string {
  return `
    <tr class="border-b border-[#e5e7eb] last:border-0 hover:bg-slate-50/60 transition-colors">
      <td class="px-4 py-[13px]">
        <div class="flex items-center gap-3">
          ${tierIcon(i)}
          <div class="leading-tight min-w-0">
            <p class="text-[14px] font-semibold text-[#0b1c30] truncate">${esc(t.name)}</p>
            <p class="text-[10px] text-slate-400 mt-0.5">Dipakai ${formatAngka(t.used_by_templates)} template</p>
          </div>
        </div>
      </td>
      <td class="px-4 py-[13px] whitespace-nowrap">
        <p class="text-[14px] font-semibold text-[#006a61] tracking-[0.28px]">${formatAngka(t.token_amount)} Token</p>
      </td>
      <td class="px-4 py-[13px] whitespace-nowrap">
        <p class="text-[14px] font-semibold text-[#0b1c30]">${t.cost_per_generate > 0 ? `${formatRupiah(t.cost_per_generate)}` : "Gratis"}</p>
        <p class="text-[10px] text-slate-400 mt-0.5">per 1× generate</p>
      </td>
      <td class="px-4 py-[13px]">
        <div class="flex items-center justify-center gap-2.5">
          <button data-toggle="${t.id}" title="${t.is_active ? "Nonaktifkan token" : "Aktifkan token"}"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${t.is_active ? "bg-black" : "bg-slate-300"}">
            <span class="inline-block h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-transform ${t.is_active ? "translate-x-[22px]" : "translate-x-0.5"}"></span>
          </button>
        </div>
      </td>
      <td class="px-4 py-[13px]">
        <div class="flex items-center justify-center gap-1">
          <button data-edit="${t.id}" title="Edit token"
                  class="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors">
            <svg class="w-[13.5px] h-[13.5px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <button data-delete="${t.id}" title="Hapus token"
                  class="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
            <svg class="w-[13.5px] h-[13.5px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6"></path></svg>
          </button>
        </div>
      </td>
    </tr>`;
}

function findToken(id: number): TokenRow | undefined {
  return state.list?.tokens.find((t) => t.id === id);
}

function bindRows(): void {
  const host = el();

  host.querySelectorAll<HTMLButtonElement>("[data-toggle]").forEach((b) =>
    b.addEventListener("click", async () => {
      const t = findToken(Number(b.dataset.toggle));
      if (!t) return;
      const next = !t.is_active;
      try {
        await adminApi("tokens.php", {
          method: "PUT",
          body: {
            id: t.id,
            name: t.name,
            token_amount: t.token_amount,
            cost_per_generate: t.cost_per_generate,
            is_active: next,
          },
        });
        showToast(next ? "Token diaktifkan." : "Token dinonaktifkan.");
        void load();
      } catch (e) {
        showToast((e as Error).message, "error");
      }
    }),
  );

  host.querySelectorAll<HTMLButtonElement>("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => openForm(findToken(Number(b.dataset.edit)) ?? null)),
  );

  host.querySelectorAll<HTMLButtonElement>("[data-delete]").forEach((b) =>
    b.addEventListener("click", async () => {
      const t = findToken(Number(b.dataset.delete));
      if (!t) return;

      if (t.used_by_templates > 0) {
        showToast(
          `Token ini masih dipakai ${formatAngka(t.used_by_templates)} template. Lepas dulu dari template tersebut.`,
          "error",
        );
        return;
      }

      const { confirmed } = await confirmDialog({
        title: "Hapus token?",
        message: `<b>${esc(t.name)}</b> akan dihapus permanen. Token yang sudah terpasang pada template tidak bisa dihapus — nonaktifkan saja bila hanya ingin menyembunyikannya.`,
        confirmText: "Hapus Token",
        danger: true,
        confirmType: "HAPUS",
      });
      if (!confirmed) return;

      try {
        await adminApi("tokens.php", { method: "DELETE", query: { id: t.id } });
        showToast("Token dihapus.");
        void load();
      } catch (e) {
        showToast((e as Error).message, "error");
      }
    }),
  );
}

// ── Form modal (Tambah / Edit) ───────────────────────────────────────

function openForm(t: TokenRow | null): void {
  const isEdit = t !== null;

  const modal = openModal({
    title: isEdit ? `Edit Token — ${t!.name}` : "Tambah Token Baru",
    subtitle: "Nama ≤60 karakter, jumlah token & harga per generate berupa angka Rupiah.",
    body: `
      <div class="grid gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Nama / Tier paket *</label>
          <input id="tkf-name" value="${esc(t?.name ?? "")}" maxlength="60" placeholder="cth. Token Starter"
                 class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-slate-400">
        </div>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Jumlah token *</label>
            <input id="tkf-amount" type="number" min="0" step="1" value="${t ? t.token_amount : ""}" placeholder="1000"
                   class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-slate-400">
            <p class="text-[11px] text-slate-400 mt-1">Total token yang didapat pada paket ini.</p>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Harga sekali generate (Rp) *</label>
            <input id="tkf-cost" type="number" min="0" step="100" value="${t ? t.cost_per_generate : ""}" placeholder="2000"
                   class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-slate-400">
            <p class="text-[11px] text-slate-400 mt-1">Nominal per 1× generate dokumen memakai token ini.</p>
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
          <select id="tkf-active" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-slate-400">
            <option value="1" ${!t || t.is_active ? "selected" : ""}>Aktif — tersedia di checkout &amp; template</option>
            <option value="0" ${t && !t.is_active ? "selected" : ""}>Nonaktif — disembunyikan dari pengguna</option>
          </select>
        </div>
        <p id="tkf-error" class="hidden text-xs font-medium text-rose-600"></p>
      </div>`,
    footer: `
      <button id="tkf-cancel" class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-white">Batal</button>
      <button id="tkf-save" class="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold">${isEdit ? "Simpan Perubahan" : "Buat Token"}</button>`,
  });

  (modal.querySelector("#tkf-cancel") as HTMLButtonElement).addEventListener("click", closeModal);

  (modal.querySelector("#tkf-save") as HTMLButtonElement).addEventListener("click", () => {
    const btn = modal.querySelector("#tkf-save") as HTMLButtonElement;
    const err = modal.querySelector("#tkf-error") as HTMLElement;

    const name = (modal.querySelector("#tkf-name") as HTMLInputElement).value.trim();
    const amountRaw = (modal.querySelector("#tkf-amount") as HTMLInputElement).value.trim();
    const costRaw = (modal.querySelector("#tkf-cost") as HTMLInputElement).value.trim();

    const fail = (msg: string): void => {
      err.textContent = msg;
      err.classList.remove("hidden");
    };

    if (name === "") return fail("Nama token wajib diisi.");
    if (amountRaw === "" || Number.isNaN(Number(amountRaw)) || Number(amountRaw) < 0) {
      return fail("Jumlah token harus berupa angka ≥ 0.");
    }
    if (costRaw === "" || Number.isNaN(Number(costRaw)) || Number(costRaw) < 0) {
      return fail("Harga sekali generate harus berupa angka ≥ 0.");
    }

    const payload = {
      name,
      token_amount: Number(amountRaw),
      cost_per_generate: Number(costRaw),
      is_active: (modal.querySelector("#tkf-active") as HTMLSelectElement).value === "1",
    };

    setButtonLoading(btn, true);
    void (async () => {
      try {
        if (isEdit && t) {
          await adminApi("tokens.php", { method: "PUT", body: { id: t.id, ...payload } });
          showToast("Token diperbarui.");
        } else {
          await adminApi("tokens.php", { method: "POST", body: payload });
          showToast("Token dibuat.");
        }
        closeModal();
        void load();
      } catch (e) {
        fail((e as Error).message);
      } finally {
        setButtonLoading(btn, false);
      }
    })();
  });
}
