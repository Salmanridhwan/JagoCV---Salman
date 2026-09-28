// Client autentikasi: berkomunikasi dengan backend PHP (folder /backend)
// yang terhubung ke MySQL via phpMyAdmin/XAMPP.
//
// Endpoint:
//   POST /backend/register.php  { first_name, last_name, email, password }
//   POST /backend/login.php     { email, password }
//   POST /backend/google.php    { credential }  (Google ID token)
//   GET  /backend/me.php        (Authorization: Bearer <token>)

// ── Konfigurasi ──────────────────────────────────────────────────────
// URL dasar backend PHP yang berjalan di Apache/XAMPP (bukan di Vite).
// Bisa dioverride lewat .env: VITE_API_BASE_URL. Bila tidak diisi,
// base diresolusi otomatis dari origin aktif sehingga bekerja baik di
// Vite dev server maupun lewat Apache (htdocs/jagoAI/JagoCV---Salman).
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

const TOKEN_KEY = "jagocv_token";
const USER_KEY = "jagocv_user";

// ── Tipe ─────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  role: string | null;
  plan: string;
  portfolio_views: number;
  points: number;
  is_new_user: boolean;
  auth_provider: "local" | "google";
}

interface AuthResponse {
  ok: boolean;
  message?: string;
  token?: string;
  user?: AuthUser;
}

// ── Penyimpanan sesi ─────────────────────────────────────────────────

export function saveSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Bersihkan cache poin & penanda alert (dipakai saat logout / ganti akun). */
export function clearPointsCache(): void {
  localStorage.removeItem("jagocv_points_cache");
  localStorage.removeItem("jagocv_newuser_alert_shown");
}

// ── Permintaan API ───────────────────────────────────────────────────

async function apiPost(path: string, body: unknown): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as AuthResponse | null;
    return data ?? { ok: false, message: "Respons server tidak valid." };
  } catch {
    return {
      ok: false,
      message:
        "Tidak dapat menghubungi /backend (Apache). Pastikan Apache menyala dan project berada di htdocs. Buka /backend/ping.php untuk diagnosa.",
    };
  }
}

export interface RegisterInput {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export function apiRegister(input: RegisterInput): Promise<AuthResponse> {
  return apiPost("register.php", input);
}

export function apiLogin(email: string, password: string): Promise<AuthResponse> {
  return apiPost("login.php", { email, password });
}

export function apiGoogleLogin(credential: string): Promise<AuthResponse> {
  return apiPost("google.php", { credential });
}

/** Cek sesi tersimpan ke server; hapus sesi bila token sudah tidak valid. */
export async function checkSession(): Promise<AuthUser | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/me.php`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      clearSession();
      return null;
    }
    const data = (await res.json()) as { ok: boolean; user?: AuthUser };
    if (data.ok && data.user) {
      saveSession(token, data.user);
      return data.user;
    }
    clearSession();
    return null;
  } catch {
    // Server tidak terjangkau: biarkan sesi lokal tetap dipakai (offline-friendly).
    return getStoredUser();
  }
}

// ── Google Identity Services ─────────────────────────────────────────

export interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleIdConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  use_fedcm_for_prompt?: boolean;
}

interface GoogleAccounts {
  id: {
    initialize(config: GoogleIdConfig): void;
    prompt(): void;
    renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
  };
}

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

/** Ambil Client ID dari .env (VITE_GOOGLE_CLIENT_ID). Kosong bila belum diisi. */
export function getGoogleClientId(): string {
  return (import.meta.env?.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? "";
}

/**
 * Pastikan script GSI (accounts.google.com/gsi/client) sudah termuat.
 * Script di index.html dideklarasikan `async defer`, sehingga saat module
 * app dijalankan `window.google` sering BELUM ada — kita tunggu sampai
 * siap (atau muat sendiri scriptnya bila ternyata tidak ada).
 */
function loadGoogleScript(): Promise<GoogleAccounts | null> {
  return new Promise((resolve) => {
    if (window.google?.accounts?.id) {
      resolve(window.google.accounts);
      return;
    }

    const onReady = (): void => {
      const started = Date.now();
      const poll = (): void => {
        if (window.google?.accounts?.id) {
          resolve(window.google.accounts);
        } else if (Date.now() - started > 5000) {
          resolve(null); // gagal termuat (mis. diblokir adblock)
        } else {
          setTimeout(poll, 50);
        }
      };
      poll();
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="accounts.google.com/gsi"]',
    );
    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      onReady(); // sekaligus berlaku bila script sudah termuat sebelum listener terpasang
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = onReady;
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    }
  });
}

/**
 * Inisialisasi Google Sign-In. async karena menunggu script GSI termuat.
 * Mengembalikan false bila Client ID belum dikonfigurasi / script gagal.
 */
export async function initGoogleSignIn(
  onCredential: (credential: string) => void,
): Promise<boolean> {
  const clientId = getGoogleClientId();
  if (!clientId) return false;

  const accounts = await loadGoogleScript();
  if (!accounts) return false;

  accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (response.credential) onCredential(response.credential);
    },
    cancel_on_tap_outside: true,
    use_fedcm_for_prompt: true,
  });
  return true;
}

/**
 * Render tombol "Sign in with Google" RESMI dari Google Identity Services.
 *
 * Dipakai sebagai LAPISAN TRANSPARAN di atas tombol custom aplikasi:
 * user melihat desain custom, tetapi klik diterima tombol resmi yang
 * membuka POPUP pemilih akun sungguhan — mekanisme yang andal dan tidak
 * mengalami cooldown One Tap (bebas dari error "unknown_reason").
 *
 * Catatan: script GSI harus sudah termuat (dijamin oleh initGoogleSignIn).
 * Visual tombol resmi tidak terlihat karena pemanggil membuat lapisan ini
 * transparan (opacity 0) — yang tampil ke user tetap desain custom app.
 */
export function renderGoogleButton(
  container: HTMLElement,
  onCredential: (credential: string) => void,
  options?: { width?: number },
): void {
  const gsi = window.google?.accounts?.id;
  if (!gsi) return;

  gsi.renderButton(container, {
    type: "standard",
    theme: "outline",
    size: "large", // tinggi 40px — tinggi iframe dilipatgandakan via CSS oleh pemanggil
    text: "continue_with",
    shape: "pill",
    logo_alignment: "left",
    width: options?.width ?? (container.clientWidth > 0 ? container.clientWidth : 320),
    locale: "id",
  });
}
