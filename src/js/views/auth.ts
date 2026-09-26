// View binding untuk halaman login & register.
// Menghubungkan form HTML (src/html/login.html, register.html) ke API auth,
// termasuk tombol "Lanjutkan dengan Google" via Google Identity Services.

import { showToast } from "../utils/toast";
import {
  cachePoints,
  initPointsUi,
  setPointsDisplay,
  showNewUserAlertIfNeeded,
} from "../utils/points";
import { launchDashboardApp } from "./router";
import {
  apiGoogleLogin,
  apiLogin,
  apiRegister,
  initGoogleSignIn,
  promptGoogleSignIn,
  saveSession,
  type AuthUser,
} from "../utils/auth";

// ── Util kecil ───────────────────────────────────────────────────────

function setButtonLoading(btn: HTMLButtonElement, loading: boolean): void {
  if (loading) {
    btn.dataset.originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add("opacity-70", "cursor-wait");
    btn.innerHTML =
      '<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg> Memproses...';
  } else {
    btn.disabled = false;
    btn.classList.remove("opacity-70", "cursor-wait");
    if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
  }
}

function showFormError(el: HTMLElement | null, message: string): void {
  if (!el) {
    showToast(message);
    return;
  }
  el.textContent = message;
  el.classList.remove("hidden");
}

function hideFormError(el: HTMLElement | null): void {
  if (!el) return;
  el.textContent = "";
  el.classList.add("hidden");
}

function inputValue(id: string): string {
  const el = document.getElementById(id) as HTMLInputElement | null;
  return el?.value.trim() ?? "";
}

/** Setelah login/register sukses: tampilkan nama user di UI lalu masuk dashboard. */
function enterApp(user: AuthUser): void {
  applyUserToDashboard(user);

  // Payment gateway: tampilkan saldo poin (pengguna baru dapat 2 poin gratis)
  // dan alert "PENGGUNA BARU" di bawah topbar bila masih ditandai baru.
  setPointsDisplay(user.points ?? 0);
  cachePoints(user.points ?? 0);
  showNewUserAlertIfNeeded(Boolean(user.is_new_user));
  void initPointsUi();

  showToast(`Halo, ${user.first_name}! Anda berhasil masuk ke jagoCV.`);
  launchDashboardApp();
}

/** Isi nama, role, dan foto profil user ke navbar/dashboard. */
function applyUserToDashboard(user: AuthUser): void {
  const fullName =
    `${user.first_name} ${user.last_name}`.trim() || user.email;

  const elName = document.getElementById("nav-user-name");
  const elRole = document.getElementById("nav-user-role");
  const elImg = document.getElementById("nav-profile-img") as HTMLImageElement | null;
  const pfName = document.getElementById("profile-page-name");
  const pfRole = document.getElementById("profile-page-role");
  const pfImg = document.getElementById("profile-page-img") as HTMLImageElement | null;

  if (elName) elName.textContent = fullName;
  if (elRole) elRole.textContent = user.role ?? "Member jagoCV";
  if (elImg && user.avatar_url) elImg.src = user.avatar_url;
  if (pfName) pfName.textContent = fullName;
  if (pfRole) pfRole.textContent = user.role ?? "Member jagoCV";
  if (pfImg && user.avatar_url) pfImg.src = user.avatar_url;
}

// ── Bind event form & tombol ─────────────────────────────────────────

export function bindAuthEvents(): void {
  const errLogin = document.getElementById("login-error");
  const errRegister = document.getElementById("register-error");

  // ── LOGIN (email/password) ─────────────────
  const formLogin = document.getElementById("form-login");
  const btnLogin = document.getElementById("btn-login-submit") as HTMLButtonElement | null;

  formLogin?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideFormError(errLogin);

    const email = inputValue("login-email");
    const password = inputValue("login-password");

    if (!email || !password) {
      showFormError(errLogin, "Email dan password wajib diisi.");
      return;
    }

    if (btnLogin) setButtonLoading(btnLogin, true);
    const res = await apiLogin(email, password);
    if (btnLogin) setButtonLoading(btnLogin, false);

    if (res.ok && res.token && res.user) {
      saveSession(res.token, res.user);
      enterApp(res.user);
    } else {
      showFormError(errLogin, res.message ?? "Login gagal. Coba lagi.");
    }
  });

  // ── REGISTER (email/password) ──────────────
  const formRegister = document.getElementById("form-register");
  const btnRegister = document.getElementById("btn-register-submit") as HTMLButtonElement | null;

  formRegister?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideFormError(errRegister);

    const first = inputValue("register-first-name");
    const last = inputValue("register-last-name");
    const email = inputValue("register-email");
    const password = inputValue("register-password");

    if (!first) {
      showFormError(errRegister, "Nama depan wajib diisi.");
      return;
    }
    if (!email) {
      showFormError(errRegister, "Email wajib diisi.");
      return;
    }
    if (password.length < 8) {
      showFormError(errRegister, "Password minimal 8 karakter.");
      return;
    }

    if (btnRegister) setButtonLoading(btnRegister, true);
    const res = await apiRegister({
      first_name: first,
      last_name: last,
      email,
      password,
    });
    if (btnRegister) setButtonLoading(btnRegister, false);

    if (res.ok && res.token && res.user) {
      saveSession(res.token, res.user);
      enterApp(res.user);
    } else {
      showFormError(errRegister, res.message ?? "Registrasi gagal. Coba lagi.");
    }
  });

  // ── GOOGLE SIGN-IN (login & register) ──────
  const btnLoginGoogle = document.getElementById("btn-login-google") as HTMLButtonElement | null;
  const btnRegisterGoogle = document.getElementById("btn-register-google") as HTMLButtonElement | null;

  const ready = initGoogleSignIn(async (credential) => {
    // Dipanggil setelah user memilih akun Google di popup.
    if (btnLoginGoogle) setButtonLoading(btnLoginGoogle, true);
    if (btnRegisterGoogle) setButtonLoading(btnRegisterGoogle, true);

    const res = await apiGoogleLogin(credential);

    if (btnLoginGoogle) setButtonLoading(btnLoginGoogle, false);
    if (btnRegisterGoogle) setButtonLoading(btnRegisterGoogle, false);

    if (res.ok && res.token && res.user) {
      saveSession(res.token, res.user);
      enterApp(res.user);
    } else {
      showFormError(errLogin, res.message ?? "Login Google gagal.");
      showFormError(errRegister, res.message ?? "Login Google gagal.");
    }
  });

  const handleGoogleClick = (): void => {
    if (!ready || !promptGoogleSignIn()) {
      showToast(
        "Google Sign-In belum dikonfigurasi. Isi VITE_GOOGLE_CLIENT_ID di file .env (lihat AUTH-SETUP.md).",
      );
    }
  };

  btnLoginGoogle?.addEventListener("click", handleGoogleClick);
  btnRegisterGoogle?.addEventListener("click", handleGoogleClick);
}
