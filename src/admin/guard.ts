/**
 * Guard frontend admin (frontend = UX; keamanan tetap di backend require_admin).
 * Bila tidak ada token → redirect /admin-login.html (Bagian 1.4).
 */
import { getAdminToken, adminApi, type AdminUser } from "./api";

export async function requireAdminPage(): Promise<AdminUser | null> {
  const token = getAdminToken();
  if (!token) {
    window.location.href = "/admin-login.html";
    return null;
  }

  try {
    const data = await adminApi<{ admin: AdminUser }>("me.php");
    return data.admin;
  } catch {
    // 401 sudah ditangani adminApi (redirect); error jaringan → redirect juga
    // supaya halaman admin tidak pernah tampil tanpa verifikasi.
    window.location.href = "/admin-login.html";
    return null;
  }
}
