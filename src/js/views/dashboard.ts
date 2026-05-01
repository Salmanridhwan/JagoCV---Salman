// Dashboard view: populate user data, render recent-doc cards, grid/list toggle

import type { UserDashboardData } from "../types";

// ─── Populate profile data ────────────────────────────────────────────────────

function populateProfileData(data: UserDashboardData): void {
  const elName = document.getElementById("nav-user-name");
  const elRole = document.getElementById("nav-user-role");
  const elImg = document.getElementById("nav-profile-img") as HTMLImageElement;
  const pfName = document.getElementById("profile-page-name");
  const pfRole = document.getElementById("profile-page-role");
  const pfImg = document.getElementById("profile-page-img") as HTMLImageElement;
  const viewsEl = document.getElementById("lbl-portfolio-views");

  if (elName) elName.textContent = data.name;
  if (elRole) elRole.textContent = data.role;
  if (elImg) elImg.src = data.profileImageUrl;
  if (pfName) pfName.textContent = data.name;
  if (pfRole) pfRole.textContent = data.role;
  if (pfImg) pfImg.src = data.profileImageUrl;
  if (viewsEl) viewsEl.textContent = data.portfolioViews.toString();
}

// ─── Render docs ─────────────────────────────────────────────────────────────

function buildDocCard(
  doc: UserDashboardData["recentDocs"][number],
): HTMLElement {
  let typeLabel = "Dokumen";
  if (doc.type === "ATS CV") typeLabel = "ATS CV";
  if (doc.type === "Visual Resume") typeLabel = "Resume";
  if (doc.type === "Web Portfolio") typeLabel = "Web Portfolio";

  const div = document.createElement("div");
  div.className =
    "group relative bg-white dark:bg-[#0B1221]/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden aspect-[3/4] flex flex-col";
  div.innerHTML = `
    <div class="flex-1 bg-slate-50 dark:bg-[#070B19] p-4 relative overflow-hidden group-hover:bg-slate-100 dark:group-hover:bg-slate-800/30 transition-colors" onclick="window.showToast('Membuka ${doc.title}')">
      <div class="w-full h-full bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 rounded px-3 py-4 flex flex-col gap-2 opacity-80 pointer-events-none">
        ${doc.type === "Web Portfolio" ? '<div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 mb-2"></div>' : ""}
        <div class="w-1/2 h-2 ${doc.type === "Web Portfolio" ? "bg-slate-200 dark:bg-slate-700" : "bg-slate-300 dark:bg-slate-600"} rounded-full ${doc.type !== "Web Portfolio" ? "mx-auto" : ""}"></div>
        ${doc.type !== "Web Portfolio" ? '<div class="w-1/3 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-2"></div>' : ""}
        <div class="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
        <div class="w-[90%] h-1 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
        <div class="w-[80%] h-1 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
        ${
          doc.type !== "Web Portfolio"
            ? `<div class="mt-4 w-1/3 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
               <div class="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1"></div>
               <div class="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full"></div>`
            : ""
        }
      </div>
    </div>
    <button class="absolute top-2 right-2 p-1.5 rounded-md bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:text-blue-600 backdrop-blur-sm z-10"
            onclick="event.stopPropagation(); window.showToast('Menampilkan opsi menu...')">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path>
      </svg>
    </button>
    <div class="p-3 bg-white dark:bg-[#0B1221] border-t border-slate-100 dark:border-slate-800/80 shrink-0">
      <h3 class="text-sm font-bold text-slate-800 dark:text-white truncate">${doc.title}</h3>
      <p class="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
        <span>${typeLabel}</span>
        <span>${doc.date}</span>
      </p>
    </div>
  `;
  return div;
}

function buildStatusBadge(status: string): string {
  if (status === "Selesai")
    return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
  if (status === "Diterbitkan")
    return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
  if (status === "Draf")
    return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
  return "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300";
}

function buildDocRow(
  doc: UserDashboardData["recentDocs"][number],
): HTMLElement {
  const badgeColor = buildStatusBadge(doc.status);
  const tr = document.createElement("tr");
  tr.className =
    "hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer";
  tr.innerHTML = `
    <td class="py-4 px-8" onclick="window.showToast('Membuka ${doc.title}')">
      <p class="font-bold text-slate-900 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">${doc.title}</p>
      <p class="text-xs text-slate-500 mt-1 font-medium">${doc.id}</p>
    </td>
    <td class="py-4 px-8" onclick="window.showToast('Membuka ${doc.title}')">
      <span class="text-sm text-slate-600 dark:text-slate-400 font-medium">${doc.type}</span>
    </td>
    <td class="py-4 px-8" onclick="window.showToast('Membuka ${doc.title}')">
      <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}">${doc.status}</span>
    </td>
    <td class="py-4 px-8 text-sm text-slate-600 dark:text-slate-400 font-medium" onclick="window.showToast('Membuka ${doc.title}')">${doc.date}</td>
    <td class="py-4 px-8 text-right">
      <button class="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm"
              onclick="event.stopPropagation(); window.showToast('Mengedit ${doc.title}')">Edit</button>
    </td>
  `;
  return tr;
}

// ─── Render function ──────────────────────────────────────────────────────────

function renderDocs(
  data: UserDashboardData,
  filter: string,
  grid: HTMLElement,
  listBody: HTMLElement,
): void {
  // Blank card
  grid.innerHTML = `
    <div class="group relative bg-[#F8FAFC]/80 dark:bg-[#0a0f1c]/50 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl overflow-hidden aspect-[3/4] flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
         onclick="window.showToast('Membuat dokumen kosong baru...')">
      <div class="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
      </div>
      <span class="text-sm font-bold text-slate-700 dark:text-slate-300">Buat Kosong</span>
    </div>
  `;
  listBody.innerHTML = "";

  const filtered =
    filter === "Semua"
      ? data.recentDocs
      : data.recentDocs.filter((d) => {
          if (filter === "CV ATS") return d.type === "ATS CV";
          if (filter === "Resume" || filter === "Visual Resume")
            return d.type === "Visual Resume";
          if (filter === "Web Portfolio") return d.type === "Web Portfolio";
          if (filter === "Cover Letter") return d.type === "Cover Letter";
          return false;
        });

  filtered.forEach((doc) => {
    grid.appendChild(buildDocCard(doc));
    listBody.appendChild(buildDocRow(doc));
  });
}

// ─── Filter buttons ───────────────────────────────────────────────────────────

const ACTIVE_FILTER_CLS =
  "px-4 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium whitespace-nowrap transition-colors";
const INACTIVE_FILTER_CLS =
  "px-4 py-1.5 rounded-full bg-white/60 dark:bg-[#0B1221]/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm font-medium whitespace-nowrap transition-colors";

function bindFilterButtons(
  data: UserDashboardData,
  grid: HTMLElement,
  listBody: HTMLElement,
): void {
  const filterButtons = document.querySelectorAll<HTMLButtonElement>(
    ".hide-scrollbar button",
  );
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      filterButtons.forEach((b) => {
        b.className = b === e.target ? ACTIVE_FILTER_CLS : INACTIVE_FILTER_CLS;
      });
      renderDocs(
        data,
        (e.target as HTMLElement).textContent?.trim() ?? "Semua",
        grid,
        listBody,
      );
    });
  });
}

// ─── Grid / List view toggle ──────────────────────────────────────────────────

function bindGridListToggle(): void {
  const btnGrid = document.getElementById("btn-view-grid");
  const btnList = document.getElementById("btn-view-list");
  const gridContainer = document.getElementById("recent-docs-grid");
  const listContainer = document.getElementById("recent-docs-list-container");

  if (!btnGrid || !btnList || !gridContainer || !listContainer) return;

  btnGrid.addEventListener("click", () => {
    gridContainer.classList.remove("hidden");
    listContainer.classList.add("hidden");
    btnGrid.className =
      "p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm transition-colors";
    btnList.className =
      "p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors";
  });

  btnList.addEventListener("click", () => {
    listContainer.classList.remove("hidden");
    gridContainer.classList.add("hidden");
    btnList.className =
      "p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm transition-colors";
    btnGrid.className =
      "p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors";
  });
}

// ─── Public entry ─────────────────────────────────────────────────────────────

export function populateDashboard(data: UserDashboardData): void {
  populateProfileData(data);

  const grid = document.getElementById("recent-docs-grid");
  const listBody = document.getElementById("recent-docs-list");

  if (grid && listBody) {
    renderDocs(data, "Semua", grid, listBody);
    bindFilterButtons(data, grid, listBody);
  }

  bindGridListToggle();
}
