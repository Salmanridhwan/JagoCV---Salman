/**
 * Base URL backend (diekspos untuk halaman login yang belum punya token).
 */
export function adminBaseFetch(): string {
  return API_BASE;
}

/**
 * Klien API admin (src/admin/* terfinit terpisah dari app user — Bagian 1.1).
 * Token sesi admin disimpan di key TERPISAH: jagocv_admin_token / jagocv_admin_user
 * (Bagian 1.3) agar tidak tercampur sesi app user.
 */

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

const TOKEN_KEY = "jagocv_admin_token";
const USER_KEY = "jagocv_admin_user";

export interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  role_label: string;
}

// ── Sesi admin ───────────────────────────────────────────────────────

export function saveAdminSession(token: string, admin: AdminUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(admin));
}

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredAdmin(): AdminUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function logoutAdminLocal(): void {
  clearAdminSession();
  window.location.href = "/admin-login.html";
}

// ── Permintaan API admin ─────────────────────────────────────────────

export interface AdminApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

/**
 * Fetch endpoint /backend/admin/*. 401 → sesi habis: hapus & redirect login.
 * Bila server tidak terjangkau, tetap melempar Error agar toast gagal tampil.
 */
export async function adminApi<T = Record<string, unknown>>(
  path: string,
  options: AdminApiOptions = {},
): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(options.query ?? {})) {
    if (v !== undefined && v !== "" && v !== null) qs.set(k, String(v));
  }
  const search = qs.toString();
  const url = `${API_BASE}/admin/${path}${search ? `?${search}` : ""}`;

  const token = getAdminToken();
  if (!token) logoutAdminLocal();

  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new Error(
      "Tidak dapat menghubungi /backend/admin (Apache). Pastikan Apache & MySQL menyala.",
    );
  }

  if (res.status === 401) {
    clearAdminSession();
    window.location.href = "/admin-login.html";
    throw new Error("Sesi admin berakhir.");
  }

  const data = (await res.json().catch(() => null)) as
    | (T & { ok?: boolean; message?: string })
    | null;

  if (!data || data.ok === false) {
    throw new Error(data?.message || "Terjadi kesalahan pada server.");
  }
  return data;
}

/** Download blob (ekspor CSV) dengan header auth — dipakai tombol Export CSV. */
export async function adminDownload(path: string, query: Record<string, string | number | undefined>, filename: string): Promise<void> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "" && v !== null) qs.set(k, String(v));
  }
  const res = await fetch(
    `${API_BASE}/admin/${path}${qs.toString() ? `?${qs.toString()}` : ""}`,
    { headers: { Authorization: `Bearer ${getAdminToken()}` } },
  );
  if (!res.ok) throw new Error("Gagal mengunduh berkas.");
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export { API_BASE };
