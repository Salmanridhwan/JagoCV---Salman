/**
 * Halaman login admin (admin-login.html) — Bagian 1.3:
 * email + password tanpa Google; token disimpan jagocv_admin_token.
 */
import "../index.css";

import { adminBaseFetch, saveAdminSession, getAdminToken, type AdminUser } from "./api";

// Bila sudah login, langsung ke dashboard admin.
if (getAdminToken()) {
  window.location.href = "/admin.html";
}

const form = document.getElementById("admin-login-form") as HTMLFormElement | null;
const errBox = document.getElementById("admin-login-error") as HTMLParagraphElement | null;
const submit = document.getElementById("admin-login-submit") as HTMLButtonElement | null;

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!errBox || !submit) return;

  const email = (document.getElementById("admin-email") as HTMLInputElement).value.trim();
  const password = (document.getElementById("admin-password") as HTMLInputElement).value;

  errBox.classList.add("hidden");
  submit.disabled = true;
  submit.textContent = "Memproses…";

  try {
    const res = await fetch(`${adminBaseFetch()}/admin/login.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json().catch(() => null)) as
      | { ok: boolean; message?: string; token?: string; admin?: AdminUser }
      | null;

    if (!data?.ok || !data.token || !data.admin) {
      errBox.textContent = data?.message ?? "Login gagal. Periksa kembali email & password Anda.";
      errBox.classList.remove("hidden");
      return;
    }

    saveAdminSession(data.token, data.admin);
    window.location.href = "/admin.html";
  } catch {
    errBox.textContent =
      "Tidak dapat menghubungi backend (Apache). Pastikan Apache menyala dan project berada di htdocs.";
    errBox.classList.remove("hidden");
  } finally {
    submit.disabled = false;
    submit.textContent = "Masuk";
  }
});
