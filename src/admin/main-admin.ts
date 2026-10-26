/**
 * Bootstrap SPA admin (entry admin.html).
 * Alur (Bagian 1.3): token ada → validasi admin/me.php → render shell →
 * pulihkan view terakhir (jagocv_admin_last_view).
 */
import "../index.css";

import { requireAdminPage } from "./guard";
import { renderShell, restoreLastAdminView, onActivate } from "./shell";
import { mountDashboardView } from "./views/dashboard";
import { mountTemplatesView } from "./views/templates";
import { mountUsersView } from "./views/users";
import { mountStub } from "./views/stubs";

void (async () => {
  const admin = await requireAdminPage();
  if (!admin) return; // guard sudah redirect

  renderShell(admin);

  // Main Menu — halaman penuh (dikembangkan sekarang).
  onActivate("view-dash", () => mountDashboardView());
  onActivate("view-templates", () => mountTemplatesView());
  onActivate("view-users", () => mountUsersView());

  // Menu lain — stub kosong (dibangun pada tahap berikutnya sesuai md).
  onActivate("view-transactions", () => mountStub("view-transactions", "Monitoring Transaksi", "Pantau transaksi top-up (berhasil/pending/gagal) dan tangani kendala — void transaksi kedaluwarsa, koreksi poin."));
  onActivate("view-pricing-admin", () => mountStub("view-pricing-admin", "Manajemen Harga & Token", "Kelola paket top-up (basic/pro/premium): harga, poin, fitur, dan status aktif."));
  onActivate("view-ai-config", () => mountStub("view-ai-config", "Konfigurasi API AI", "Kelola kunci API generator (Gemini) di sisi server — key tidak pernah dikirim ke frontend."));
  onActivate("view-feedback", () => mountStub("view-feedback", "Feedback & Laporan", "Kelola laporan kendala pengguna (kategori bug/top-up/saran) dan status penanganannya."));
  onActivate("view-audit", () => mountStub("view-audit", "Audit Log Aktivitas", "Jejak seluruh aksi admin: siapa, kapan, apa yang berubah (before/after), dan alasannya."));
  onActivate("view-reports", () => mountStub("view-reports", "Laporan & Ekspor", "Ekspor CSV user/dokumen/template/transaksi per rentang waktu."));
  onActivate("view-features", () => mountStub("view-features", "Pengaturan Fitur", "Feature flags untuk mengaktif/menonaktifkan fitur aplikasi tanpa deploy (termasuk tempat Role & Permission — PERLU KEPUTUSAN)."));

  restoreLastAdminView();
})();
