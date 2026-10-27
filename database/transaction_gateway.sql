-- =====================================================================
-- jagoCV — Tabel transaksi pembayaran masuk (per JagoCV ADMIN — Menu 6).
-- Jalankan di phpMyAdmin (tab SQL) pada database "jagocv".
--
-- Catatan penting (F7 — Payment Simulasi):
--   Saat ini backend admin /gateway tidak terpasang (Midtrans/Xendit
--   masih kosong). Endpoint admin/transactions.php SELALU melabeli status
--   yang tidak ada receipt nyata sebagai "pending" agar tidak mengklaim
--   "Berhasil" secara palsu. UI nanti menandai halaman ini "Mode Simulasi".
--   Setelah gateway riil terpasang, tabel ini diisi oleh webhook payment.
-- =====================================================================

CREATE TABLE IF NOT EXISTS `transaction_logs` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT UNSIGNED NOT NULL,
  `trx_code`    VARCHAR(20) NOT NULL COMMENT 'Kode yang tampil di UI, cth: TRX-98214',
  `gateway_ref` VARCHAR(64) DEFAULT NULL COMMENT 'Referensi gateway eksternal (MID/VA/QR) bila ada',
  `amount`      INT UNSIGNED NOT NULL COMMENT 'Nominal Rupiah',
  `method`      ENUM('QRIS','BCA VA','Mandiri VA','BNI VA','GoPay E-Wallet','OVO E-Wallet','DANA E-Wallet','ShopeePay','Credit Card','Transfer') NOT NULL,
  `status`      ENUM('pending','expired','success','failed') NOT NULL DEFAULT 'pending',
  `expires_at`  DATETIME DEFAULT NULL COMMENT 'Hanya diisi bila ada batas pembayaran',
  `metadata`    JSON DEFAULT NULL COMMENT 'Ekes rahasia: seluruh snapshot webhook, raw payment event, sign letak',
  `notes`       VARCHAR(100) DEFAULT NULL COMMENT 'Internal note opsional (tidak ditampilkan UI)',
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_transaction_logs_trx_code` (`trx_code`),
  KEY `idx_transaction_logs_user` (`user_id`),
  KEY `idx_transaction_logs_created` (`created_at`),
  KEY `idx_transaction_logs_status` (`status`),
  CONSTRAINT `fk_transaction_logs_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Seed data: contoh transaksi (HANYA untuk tampil demo saat gateway kosong — F7).
-- Tidak ada klaim bahwa ini adalah transaksi nyata; status palsu mencerminkan logika
-- "tidak terisi receipt nyata → pending". Nilai Rp 79.000 total sengaja dimunculkan
-- otomatis oleh aggregate endpoint bila tabel kosong, bukan dari seed ini.
-- Semua nominal seed ini SENGaja disebut "pending simulation" di label UI.
-- Hapus seed ini setelah gateway wire-up nyata.
INSERT INTO `transaction_logs` (`user_id`, `trx_code`, `gateway_ref`, `amount`, `method`, `status`, `expires_at`, `metadata`, `notes`, `created_at`)
VALUES
-- Status "pending" karena gateway belum terpasang (F7) — bukan klaim sukses nyata.
(7, 'TRX-98212', 'MDT-QR-190481', 120000, 'QRIS', 'pending', DATE_ADD(NOW(), INTERVAL 60 MINUTE), NULL, 'Pemantauan pending — simulas', DATE('2026-10-26 13:12:00')),

-- Sisa baris sengaja tidak diisi (UI memuat tabel kosong "Belum ada transaksi" bila belum ada riwayat).
-- Seed tambahan setelah gateway nyata terinstal.
ON DUPLICATE KEY UPDATE `updated_at` = VALUES(`updated_at`);

-- Kenyamanan developer: kursor cepat saat filter status + urutan waktu.
-- (Index sudah didefinisikan bersama-sama di atas.)
