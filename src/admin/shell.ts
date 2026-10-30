/**
 * Shell admin (Bagian 1.2 + 1.7 ADMIN_IMPLEMENTATION.md): sidebar 3 grup,
 * topbar, kontainer view, kartu status gateway, router showAdminView.
 * Item Main Menu (Dashboard/Template/User & Dokumen) penuh; menu lain stub.
 */
import { getStoredAdmin, adminApi, logoutAdminLocal, type AdminUser } from "./api";
import { esc } from "./ui";

// ── Ikon garis (stroke, gaya desain patokan) ─────────────────────────

function icon(name: string, cls = "w-[18px] h-[18px]"): string {
  const paths: Record<string, string> = {
    grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
    file: "M9 12h6m-6 4h6M13 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V7l-6-4z",
    users: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
    receipt: "M6 2h12v20l-3-2-3 2-3-2-3 2V2zM9 7h6m-6 4h6m-6 4h3",
    coin: "M12 22a10 10 0 100-20 10 10 0 000 20zM8 12l3 3 5-6",
    cpu: "M9 9h6v6H9zM5 5h14v14H5zM9 1v3m6-3v3M9 20v3m6-3v3M1 9h3m-3 6h3m16-6h3m-3 6h3",
    chat: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
    clock: "M12 22a10 10 0 100-20 10 10 0 000 20zm0-16v6l4 2",
    chart: "M3 3v18h18M8 17V9m5 8V5m5 12v-6",
    sliders: "M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6M9 8h6M17 16h6",
    menu: "M4 6h16M4 12h16M4 18h16",
    search: "M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z",
    bell: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
    logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9",
    wifi: "M5 12.55a11 11 0 0114.08 0M8.53 16.11a6 6 0 016.95 0M12 20h.01",
    coin_dot: "M12 8v4l2 2",
    check: "M20 6L9 17l-5-5",
    close: "M6 18L18 6M6 6l12 12",
  };
  return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name] ?? paths.grid}"></path></svg>`;
}

// ── Struktur menu (peta persis Bagian 1.2 — sumber navigasi tunggal) ──

interface MenuItem {
  id: string;         // id elemen view
  label: string;
  icon: string;
  built: boolean;     // Main Menu = penuh; lainnya stub kosong
}

const MENU_SECTIONS: { label: string; items: MenuItem[] }[] = [
  {
    label: "MAIN MENU",
    items: [
      { id: "view-dash", label: "Dashboard & Analytics", icon: "grid", built: true },
      { id: "view-templates", label: "Manajemen Template", icon: "file", built: true },
      { id: "view-users", label: "User & Dokumen", icon: "users", built: true },
    ],
  },
  {
    label: "TRANSAKSI & KOMERSIAL",
    items: [
      { id: "view-transactions", label: "Monitoring Transaksi", icon: "receipt", built: true },
      { id: "view-tokens", label: "Manajemen Token", icon: "coin", built: true },
    ],
  },
  {
    label: "SISTEM & DUKUNGAN",
    items: [
      { id: "view-ai-config", label: "Konfigurasi API AI", icon: "cpu", built: false },
      { id: "view-feedback", label: "Feedback & Laporan", icon: "chat", built: false },
      { id: "view-audit", label: "Audit Log Aktivitas", icon: "clock", built: false },
      { id: "view-reports", label: "Laporan & Ekspor", icon: "chart", built: false },
      { id: "view-features", label: "Pengaturan Fitur", icon: "sliders", built: false },
    ],
  },
];

const LAST_VIEW_KEY = "jagocv_admin_last_view";

// ── Rendering shell ──────────────────────────────────────────────────

export interface AdminRouter {
  showAdminView(id: string): void;
  activeView(): string;
  onSearch(cb: (q: string) => void): void;
}

let activeId = "view-dash";
let searchCb: ((q: string) => void) | null = null;

export function renderShell(admin: AdminUser): AdminRouter {
  const root = document.getElementById("admin-root") as HTMLElement;

  root.innerHTML = `
    <!-- ── Sidebar ───────────────────────────────────────────────
         Mobile & tablet (< xl): drawer tersembunyi, dibuka lewat burger.
         Desktop (≥ xl): menetap. Pada layar medium sidebar otomatis
         tersembunyi agar area konten utama lebih luas. -->
    <div id="admin-sidebar-backdrop"
         class="hidden fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-[2px] opacity-0 transition-opacity duration-300 xl:hidden"></div>

    <aside id="admin-sidebar"
           class="fixed inset-y-0 left-0 z-40 w-[18rem] max-w-[85vw] bg-white border-r border-slate-100 flex flex-col
                  -translate-x-full transition-transform duration-300 ease-out
                  shadow-2xl xl:shadow-none xl:translate-x-0">
      <div class="flex items-center gap-3 px-6 py-6">
        <div class="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9m0-9L4 7.5"></path></svg>
        </div>
        <div class="leading-tight min-w-0">
          <div class="font-extrabold text-slate-900">JagoCV</div>
          <div class="text-[10px] tracking-[0.22em] text-slate-500 font-semibold">ADMIN CENTER</div>
        </div>
        <button id="admin-sidebar-close" class="ml-auto p-2 -mr-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 xl:hidden" aria-label="Tutup menu">
          ${icon("close", "w-5 h-5")}
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
        ${MENU_SECTIONS.map(
          (section) => `
          <p class="text-[10px] font-bold tracking-[0.14em] text-slate-400 px-3 pt-5 pb-2">${esc(section.label)}</p>
          <ul class="space-y-1">
            ${section.items
              .map(
                (item) => `
              <li>
                <button data-nav="${item.id}"
                        class="admin-nav w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-semibold transition-colors
                               text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                  ${icon(item.icon)}
                  <span class="truncate">${esc(item.label)}</span>
                  ${item.built ? "" : `<span class="ml-auto text-[10px] font-medium text-slate-300 shrink-0">Segera</span>`}
                </button>
              </li>`,
              )
              .join("")}
          </ul>`,
        )
        .join("")}
      </nav>

      <!-- Kartu status gateway (Bagian 1.2: payment masih simulasi F7 → tampilkan simpanan jujur) -->
      <div class="mx-4 mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 flex items-center gap-3">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
        <div class="flex-1 leading-tight min-w-0">
          <p class="text-xs font-bold text-slate-800">Gateway Terkoneksi</p>
          <p class="text-[10px] text-slate-500">Mode Simulasi — Midtrans / Xendit belum terpasang</p>
        </div>
        ${icon("wifi", "w-4 h-4 text-slate-400 shrink-0")}
      </div>
    </aside>

    <!-- ── Konten ──────────────────────────────────────────────── -->
    <div class="xl:pl-[18rem] min-h-screen flex flex-col">
      <!-- Topbar (rapih mengikuti desain patokan: search kiri lebar,
           cluster kanan rapat — ID/EN, bel, nama, lalu avatar paling ujung) -->
      <header class="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-100">
        <div class="h-[64px] sm:h-[76px] px-3 sm:px-5 md:px-8 flex items-center gap-2">
          <button id="admin-burger" class="xl:hidden p-2 rounded-lg hover:bg-slate-100 shrink-0" aria-label="Buka menu" aria-controls="admin-sidebar" aria-expanded="false">${icon("menu")}</button>

          <!-- Search: terletak di kiri, lebar mengikuti desain -->
          <div class="relative flex-1 min-w-0 max-w-[600px]">
            ${icon("search", "w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none")}
            <input id="admin-search" type="text"
                   placeholder="Cari data, user…"
                   class="w-full rounded-full bg-slate-100/80 border border-transparent focus:border-slate-300 focus:bg-white pl-10 pr-3 py-2.5 text-sm outline-none transition-colors">
          </div>

          <!-- Cluster kanan: rapat melekat ke ujung kanan (jarak antar-elemen kecil) -->
          <div class="ml-auto pl-2 sm:pl-4 md:pl-6 flex items-center shrink-0">
            <!-- Toggle bahasa (Bagian 1.2: fase 1 hanya ID aktif, EN disable) -->
            <div class="hidden lg:flex items-center rounded-full bg-slate-100 p-0.5">
              <span class="px-2.5 py-1 rounded-full bg-slate-900 text-white text-[10px] font-bold leading-none">ID</span>
              <span class="px-2.5 py-1 rounded-full text-slate-400 text-[10px] font-bold leading-none cursor-not-allowed" title="Bahasa Inggris — tahap berikutnya">EN</span>
            </div>

            <button id="admin-bell" title="Notifikasi — feedback berstatus Baru" class="relative ml-1.5 sm:ml-5 md:ml-9 p-2 rounded-full hover:bg-slate-100">
              ${icon("bell")}
              <span id="admin-bell-dot" class="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>

            <div class="relative flex items-center gap-2.5 ml-1.5 sm:ml-4 md:ml-5">
              <button id="admin-user-chip" class="flex items-center gap-2 sm:gap-3 rounded-full hover:bg-slate-50 py-1 pl-1 transition-colors">
                <div class="text-right leading-tight hidden sm:block max-w-[10rem]">
                  <p class="text-sm font-bold text-slate-900 truncate">${esc(admin.first_name)} ${esc(admin.last_name)}</p>
                  <p class="text-[11px] font-semibold text-slate-400 truncate">${esc(admin.role_label)}</p>
                </div>
                ${getStoredAdmin()?.avatar_url
                  ? `<img src="${esc(getStoredAdmin()!.avatar_url)}" class="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0" alt="">`
                  : `<span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                      <svg class="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M16 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    </span>`}
              </button>
              <div id="admin-user-menu" class="hidden absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 overflow-hidden">
                <button id="admin-logout" class="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors">
                  ${icon("logout", "w-4 h-4")} Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Kontainer view (pola hideAllViews/showView) -->
      <main class="flex-1 px-3 sm:px-5 md:px-8 py-5 sm:py-6 min-w-0">
        <div id="view-dash" class="admin-view"></div>
        <div id="view-templates" class="admin-view hidden"></div>
        <div id="view-users" class="admin-view hidden"></div>
        <div id="view-transactions" class="admin-view hidden"></div>
        <div id="view-tokens" class="admin-view hidden"></div>
        <div id="view-ai-config" class="admin-view hidden"></div>
        <div id="view-feedback" class="admin-view hidden"></div>
        <div id="view-audit" class="admin-view hidden"></div>
        <div id="view-reports" class="admin-view hidden"></div>
        <div id="view-features" class="admin-view hidden"></div>
      </main>
    </div>`;

  // ── Binding navigasi ───────────────────────────────────────────────
  root.querySelectorAll<HTMLButtonElement>(".admin-nav").forEach((btn) => {
    btn.addEventListener("click", () => {
      showAdminView(btn.dataset.nav || "");
      // Tutup drawer setelah memilih menu (mobile & tablet).
      closeSidebar();
    });
  });

  const sidebar = document.getElementById("admin-sidebar");
  const backdrop = document.getElementById("admin-sidebar-backdrop");
  const burger = document.getElementById("admin-burger");

  const openSidebar = (): void => {
    if (!sidebar) return;
    sidebar.classList.remove("-translate-x-full");
    sidebar.classList.add("shadow-2xl");
    backdrop?.classList.remove("hidden");
    // frame berikutnya → transisi opacity berjalan
    requestAnimationFrame(() => backdrop?.classList.add("opacity-100"));
    document.body.classList.add("overflow-hidden", "xl:overflow-auto");
    burger?.setAttribute("aria-expanded", "true");
  };

  const closeSidebar = (): void => {
    if (!sidebar) return;
    sidebar.classList.add("-translate-x-full");
    backdrop?.classList.remove("opacity-100");
    const hide = (): void => backdrop?.classList.add("hidden");
    if (prefersReducedMotion()) hide();
    else window.setTimeout(hide, 300);
    document.body.classList.remove("overflow-hidden", "xl:overflow-auto");
    burger?.setAttribute("aria-expanded", "false");
  };

  burger?.addEventListener("click", () => {
    if (sidebar?.classList.contains("-translate-x-full")) openSidebar();
    else closeSidebar();
  });
  document.getElementById("admin-sidebar-close")?.addEventListener("click", closeSidebar);
  backdrop?.addEventListener("click", closeSidebar);

  // Escape menutup drawer; saat layar melebar ke desktop drawer otomatis
  // dinormalkan supaya tidak menyisakan body terkunci.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar && !sidebar.classList.contains("-translate-x-full")) {
      closeSidebar();
    }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1280 && sidebar && !sidebar.classList.contains("-translate-x-full")) {
      closeSidebar();
    }
  });

  // Dropdown user + logout.
  const chip = document.getElementById("admin-user-chip");
  const menu = document.getElementById("admin-user-menu");
  chip?.addEventListener("click", (e) => {
    e.stopPropagation();
    menu?.classList.toggle("hidden");
  });
  document.addEventListener("click", () => menu?.classList.add("hidden"));
  document.getElementById("admin-logout")?.addEventListener("click", async () => {
    try {
      await adminApi("logout.php", { method: "POST" });
    } catch {
      /* stateless — lanjut hapus sesi lokal */
    }
    logoutAdminLocal();
  });

  // Pencarian global → dikirim ke halaman aktif (Fase 1: filter menu aktif).
  const searchInput = document.getElementById("admin-search") as HTMLInputElement | null;
  const fire = (): void => searchCb?.(searchInput?.value.trim() ?? "");
  searchInput?.addEventListener("input", debounce(fire, 350));

  // Dot bel: ditampilkan statis mengikuti desain patokan. Setelah Menu 8
  // (Feedback & Laporan) hidup, ganti jadi jumlah riil feedback Baru via fetch.
  void document.getElementById("admin-bell-dot");

  return {
    showAdminView,
    activeView: () => activeId,
    onSearch: (cb) => {
      searchCb = cb;
    },
  };
}

// ── Router admin (pola showView + histori localStorage) ──────────────

/**
 * Penjaga navigasi per-view (mis. halaman Edit Template dengan perubahan
 * belum disimpan). Guard dipanggil SEBELUM view berganti; mengembalikan
 * `true` berarti navigasi ditahan (view menampilkan konfirmasinya sendiri).
 */
let navGuard: ((nextId: string) => boolean) | null = null;
export function setAdminNavGuard(fn: ((nextId: string) => boolean) | null): void {
  navGuard = fn;
}

export function showAdminView(id: string): void {
  if (!MENU_SECTIONS.some((s) => s.items.some((i) => i.id === id))) return;
  if (id !== activeId && navGuard?.(id)) return;

  document.querySelectorAll<HTMLElement>(".admin-view").forEach((el) => {
    el.classList.toggle("hidden", el.id !== id);
  });

  // Pill aktif: gelap solid; lainnya netral.
  document.querySelectorAll<HTMLButtonElement>(".admin-nav").forEach((btn) => {
    const on = btn.dataset.nav === id;
    btn.classList.toggle("bg-slate-900", on);
    btn.classList.toggle("text-white", on);
    btn.classList.toggle("hover:bg-slate-800", on);
    btn.classList.toggle("text-slate-600", !on);
    btn.classList.toggle("hover:bg-slate-50", !on);
    btn.classList.toggle("hover:text-slate-900", !on);
  });

  activeId = id;
  try {
    localStorage.setItem(LAST_VIEW_KEY, id);
  } catch {
    /* storage penuh — abaikan */
  }

  // Muat konten view (lazy): mount fungsi yang terdaftar via onActivate.
  activateHandlers[id]?.();
}

// Hook mount per-view (diisi main-admin.ts) — dipanggil tiap view dibuka.
const activateHandlers: Record<string, () => void> = {};
export function onActivate(id: string, fn: () => void): void {
  activateHandlers[id] = fn;
}

/** Pulihkan view terakhir (jagocv_admin_last_view), default dashboard. */
export function restoreLastAdminView(): void {
  let id = "view-dash";
  try {
    id = localStorage.getItem(LAST_VIEW_KEY) ?? "view-dash";
  } catch {
    /* abaikan */
  }
  showAdminView(id);
}

// ── Util kecil ───────────────────────────────────────────────────────

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function debounce(fn: () => void, ms: number): () => void {
  let t: number | undefined;
  return () => {
    window.clearTimeout(t);
    t = window.setTimeout(fn, ms);
  };
}
