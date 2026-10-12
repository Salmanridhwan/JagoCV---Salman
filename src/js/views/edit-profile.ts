// ─────────────────────────────────────────────────────────────────────
// Halaman: Edit Profil (view-edit-profile).
//
//  - Field mengikuti persis yang ditampilkan di halaman Profil Akun:
//    nama depan & belakang, email, profesi (role), lokasi, avatar.
//    Tidak ada field tambahan.
//  - "Lokasi" saat ini masih teks statis di halaman profil (bukan data
//    akun), jadi perubahan lokasi disimpan lokal di localStorage
//    (jagocv_profile_location) dan tetap tampil konsisten.
//  - Perubahan nama/email/role/avatar disimpan via POST
//    /backend/update-profile.php (backend memperbarui tabel users).
//    Bila backend tidak tersedia, perubahan tetap disimpan lokal di
//    localStorage (jagocv_profile_edits) agar UI konsisten.
//  - Setelah simpan: user di localStorage diperbarui (saveSession),
//    lalu topbar avatar/nama/role & seluruh elemen profil disinkronkan.
// ─────────────────────────────────────────────────────────────────────

import {
  getToken,
  getStoredUser,
  saveSession,
  type AuthUser,
} from "../utils/auth";
import { showToast } from "../utils/toast";

const API_BASE =
  (import.meta.env?.VITE_API_BASE_URL as string | undefined) ||
  resolveBackendBase();

function resolveBackendBase(): string {
  if (typeof window === "undefined") return "";
  const { origin, pathname } = window.location;
  const idx = pathname.toLowerCase().indexOf("/jagocv---salman");
  if (idx >= 0) {
    return `${origin}${pathname.slice(0, idx)}/jagoCV---Salman/backend`;
  }
  return `${origin}/backend`;
}

const LOCATION_KEY = "jagocv_profile_location";
const EDITS_KEY = "jagocv_profile_edits";

interface ProfileEdits {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
}

// ── Elemen DOM ──────────────────────────────────────────────────────

let elFirstName: HTMLInputElement | null = null;
let elLastName: HTMLInputElement | null = null;
let elEmail: HTMLInputElement | null = null;
let elRole: HTMLInputElement | null = null;
let elLocation: HTMLInputElement | null = null;
let elAvatar: HTMLImageElement | null = null;
let elAvatarUrlInput: HTMLInputElement | null = null;
let elEmailHint: HTMLElement | null = null;

// ── Util ────────────────────────────────────────────────────────────

function readLocalEdits(): ProfileEdits {
  try {
    return JSON.parse(localStorage.getItem(EDITS_KEY) ?? "{}") as ProfileEdits;
  } catch {
    return {};
  }
}

function writeLocalEdits(edits: ProfileEdits): void {
  try {
    localStorage.setItem(EDITS_KEY, JSON.stringify(edits));
  } catch {
    /* storage penuh — abaikan */
  }
}

function readLocation(): string {
  return localStorage.getItem(LOCATION_KEY) ?? "";
}

function writeLocation(loc: string): void {
  try {
    localStorage.setItem(LOCATION_KEY, loc);
  } catch {
    /* abaikan */
  }
}

/** Pemisah nama jagoCV (nama depan + belakang) bila user belum diisi. */
function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0] ?? "", last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Set lokasi default saat pertama kali dibuka (belum ada nilai). */
function ensureDefaultLocation(): void {
  if (!readLocation()) writeLocation("Jakarta, Indonesia");
}

// ── Muat data ke form ────────────────────────────────────────────────

function fillForm(user: AuthUser | null): void {
  if (!user) return;
  const edits = readLocalEdits();

  const first = edits.first_name ?? user.first_name;
  const last = edits.last_name ?? user.last_name;
  const email = edits.email ?? user.email;
  const role = edits.role ?? user.role ?? "";

  if (elFirstName) elFirstName.value = first;
  if (elLastName) elLastName.value = last;
  if (elEmail) elEmail.value = email;
  if (elRole) elRole.value = role;
  if (elLocation) elLocation.value = readLocation();
  if (elAvatar && user.avatar_url) elAvatar.src = user.avatar_url;
  if (elAvatarUrlInput) elAvatarUrlInput.value = user.avatar_url ?? "";
  if (elEmailHint) elEmailHint.textContent = email;
}

// ── Simpan ──────────────────────────────────────────────────────────

async function saveProfile(): Promise<void> {
  if (!elFirstName || !elLastName || !elEmail || !elRole || !elLocation) return;

  const first = elFirstName.value.trim();
  const last = elLastName.value.trim();
  const email = elEmail.value.trim();
  const role = elRole.value.trim();
  const location = elLocation.value.trim();
  const avatarUrl = elAvatarUrlInput?.value.trim() ?? "";

  if (!first) {
    showToast("Nama depan wajib diisi.");
    elFirstName.focus();
    return;
  }
  if (!isValidEmail(email)) {
    showToast("Format email tidak valid.");
    elEmail.focus();
    return;
  }

  const user = getStoredUser();
  const token = getToken();
  if (!user || !token) {
    showToast("Sesi kedaluwarsa. Silakan login ulang.");
    return;
  }

  // 1. Coba kirim ke backend (update tabel users).
  let serverOk = false;
  try {
    const res = await fetch(`${API_BASE}/update-profile.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        first_name: first,
        last_name: last,
        email,
        role: role || null,
        avatar_url: avatarUrl || null,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { ok?: boolean; user?: AuthUser };
      serverOk = Boolean(data.ok);
      if (serverOk && data.user) {
        Object.assign(user, data.user);
      }
    }
  } catch {
    /* backend tidak terjangkau → fallback lokal di bawah */
  }

  // 2. Simpan lokal agar UI konsisten meski backend belum jalan.
  Object.assign(user, {
    first_name: first,
    last_name: last,
    email,
    role: role || null,
    avatar_url: avatarUrl || null,
  });
  writeLocalEdits({ first_name: first, last_name: last, email, role });
  writeLocation(location);
  saveSession(token, user);
  syncToProfileUi(user, location);

  showToast(
    serverOk
      ? "Profil berhasil diperbarui."
      : "Profil tersimpan di perangkat ini. Backend belum terhubung.",
  );
}

/** Terapkan perubahan ke seluruh UI profil & topbar (tanpa pindah view). */
function syncToProfileUi(user: AuthUser, location: string): void {
  const fullName = `${user.first_name} ${user.last_name}`.trim() || user.email;

  // Topbar
  const elNavName = document.getElementById("nav-user-name");
  const elNavRole = document.getElementById("nav-user-role");
  const elNavImg = document.getElementById("nav-profile-img") as HTMLImageElement | null;
  if (elNavName) elNavName.textContent = fullName;
  if (elNavRole) elNavRole.textContent = user.role ?? "Member jagoCV";
  if (elNavImg && user.avatar_url) elNavImg.src = user.avatar_url;

  // Halaman profil
  const elPfName = document.getElementById("profile-page-name");
  const elPfRole = document.getElementById("profile-page-role");
  const elPfImg = document.getElementById("profile-page-img") as HTMLImageElement | null;
  const elPfEmail = document.getElementById("profile-page-email");
  if (elPfName) elPfName.textContent = fullName;
  if (elPfRole) elPfRole.textContent = user.role ?? "";
  if (elPfImg && user.avatar_url) elPfImg.src = user.avatar_url;
  if (elPfEmail) elPfEmail.textContent = user.email;

  // Lokasi (teks statis di profil: elemen pertama yang memuat "Jakarta, Indonesia")
  const locChip = document
    .getElementById("profile-page-email")
    ?.closest("div")?.parentElement;
  const spans = locChip?.querySelectorAll("span") ?? [];
  spans.forEach((s) => {
    if (s.textContent?.trim() === "Jakarta, Indonesia") s.textContent = location || "Jakarta, Indonesia";
  });
}

// ── Binding utama (dipanggil dari main.ts) ──────────────────────────

export function bindEditProfileEvents(): void {
  elFirstName = document.getElementById("edit-first-name") as HTMLInputElement | null;
  elLastName = document.getElementById("edit-last-name") as HTMLInputElement | null;
  elEmail = document.getElementById("edit-email") as HTMLInputElement | null;
  elRole = document.getElementById("edit-role") as HTMLInputElement | null;
  elLocation = document.getElementById("edit-location") as HTMLInputElement | null;
  elAvatar = document.getElementById("edit-avatar-preview") as HTMLImageElement | null;
  elAvatarUrlInput = document.getElementById("edit-avatar-url") as HTMLInputElement | null;
  elEmailHint = document.getElementById("edit-email-hint");

  if (!elFirstName || !elEmail) return;

  // Pratinjau avatar mengikuti URL yang diketik.
  elAvatarUrlInput?.addEventListener("change", () => {
    const url = elAvatarUrlInput!.value.trim();
    if (!elAvatar) return;
    if (url) elAvatar.src = url;
    else elAvatar.src = "";
  });

  document
    .getElementById("btn-save-edit-profile")
    ?.addEventListener("click", () => {
      void saveProfile();
    });

  // Batal = kembali ke Profil Akun melalui router (tombol back sama).
  document
    .getElementById("btn-cancel-edit-profile")
    ?.addEventListener("click", () => {
      document.getElementById("btn-back-from-edit-profile")?.click();
    });

  // Kosongkan form saat logout? Tidak perlu — selalu diisi ulang dari
  // user tersimpan tiap view dibuka (lihat fillForm di main.ts init).
}

/** Isi ulang form setiap kali view-edit-profile ditampilkan. */
export function prepareEditProfileForm(): void {
  ensureDefaultLocation();
  fillForm(getStoredUser());
}
