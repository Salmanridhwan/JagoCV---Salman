-- =====================================================================
-- jagoCV — Migrasi fitur payment gateway (sistem poin)
-- Untuk database `jagocv` yang SUDAH diimpor sebelumnya.
-- Cara pakai: buka phpMyAdmin → pilih database `jagocv` → tab SQL →
-- tempel seluruh isi file ini → "Import"/"Go".
-- Idempotent: aman dijalankan lebih dari sekali.
-- =====================================================================

USE `jagocv`;

-- 1. Kolom baru di tabel users ────────────────────────────────────────
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `points` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `portfolio_views`;
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `is_new_user` TINYINT(1) NOT NULL DEFAULT 1 AFTER `points`;

-- 2. Tabel paket topup ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `topup_packages` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`       VARCHAR(20)  NOT NULL COMMENT 'basic | pro | premium',
  `name`       VARCHAR(50)  NOT NULL,
  `price`      INT UNSIGNED NOT NULL COMMENT 'Harga dalam Rupiah',
  `points`     INT UNSIGNED NOT NULL COMMENT 'Jumlah poin yang diterima',
  `features`   TEXT         DEFAULT NULL COMMENT 'Daftar fitur, dipisah baris baru',
  `is_active`  TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_topup_packages_code` (`code`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Isi 3 paket utama (sesuai dokumen paket berlangganan) bila kosong.
INSERT INTO `topup_packages` (`code`, `name`, `price`, `points`, `features`)
SELECT * FROM (
  SELECT 'basic' AS code, 'Basic' AS name, 19000 AS price, 1 AS points,
         '1x generate dokumen (CV / Resume / Portfolio)\nPilihan template dasar\nExport PDF standar' AS features
  UNION ALL
  SELECT 'pro', 'Pro', 49000, 3,
         '3x generate dokumen (CV / Resume / Portfolio)\nSemua template premium\nExport PDF kualitas tinggi\nPrioritas antrian AI'
  UNION ALL
  SELECT 'premium', 'Premium', 99000, 10,
         '10x generate dokumen (CV / Resume / Portfolio)\nSemua template premium\nExport PDF kualitas tinggi\nPrioritas antrian AI tertinggi\nDukungan khusus 24/7'
) AS pkg
WHERE NOT EXISTS (SELECT 1 FROM `topup_packages`);

-- 3. Tabel riwayat transaksi poin ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS `point_transactions` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT UNSIGNED NOT NULL,
  `type`        ENUM('purchase','signup_bonus','usage') NOT NULL,
  `points`      INT NOT NULL COMMENT 'Positif = tambah poin, negatif = pakai poin',
  `description` VARCHAR(255) NOT NULL DEFAULT '',
  `package_code` VARCHAR(20) DEFAULT NULL,
  `payment_method` VARCHAR(30) DEFAULT NULL,
  `payment_ref` VARCHAR(64) DEFAULT NULL,
  `amount`      INT UNSIGNED DEFAULT NULL COMMENT 'Nominal Rupiah (untuk purchase)',
  `status`      ENUM('success','pending','failed') NOT NULL DEFAULT 'success',
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_point_transactions_user` (`user_id`),
  CONSTRAINT `fk_point_transactions_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Beri 2 poin gratis ke user lama yang belum pernah mendapat bonus,
-- agar perilaku sama dengan pengguna baru.
INSERT INTO `point_transactions` (`user_id`, `type`, `points`, `description`)
SELECT u.id, 'signup_bonus', 2, 'Bonus pengguna baru: 2 poin gratis'
FROM `users` u
WHERE u.is_new_user = 1
  AND NOT EXISTS (
    SELECT 1 FROM `point_transactions` t
    WHERE t.user_id = u.id AND t.type = 'signup_bonus'
  );

UPDATE `users` SET `points` = 2 WHERE `is_new_user` = 1 AND `points` = 0;
