-- =====================================================================
-- jagoCV — Fitur TOKEN (Manajemen Token + integrasi ke Manajemen Template)
-- Jalankan di phpMyAdmin (tab SQL) pada database "jagocv", atau:
--   /Applications/XAMPP/xamppfiles/bin/mysql -u root jagocv < database/token_feature.sql
--
-- Konsep:
--   * token_packages = daftar paket/tier token yang dijual & dipakai sistem.
--       - token_amount      : jumlah token yang didapat pada paket ini
--       - cost_per_generate : nominal (Rupiah) yang dihitung untuk SATU kali
--                             generate dokumen memakai token ini.
--                             Contoh: 2000  ->  "sekali generate CV = Rp 2.000"
--   * templates.token_package_id = token yang dipasang admin pada sebuah
--     template. Saat user generate dokumen dengan template itu, biaya
--     generate mengikuti token yang terpasang.
--
-- Idempotent (aman dijalankan ulang).
-- =====================================================================

USE `jagocv`;

-- ---------------------------------------------------------------------
-- 1. Tabel token_packages
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `token_packages` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`              VARCHAR(60)  NOT NULL COMMENT 'Nama / tier paket, cth: Token Starter',
  `token_amount`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Jumlah token pada paket',
  `cost_per_generate` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Nominal Rupiah per 1x generate',
  `is_active`         TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '1 = aktif dipakai, 0 = nonaktif',
  `sort_order`        INT          NOT NULL DEFAULT 0 COMMENT 'Urutan tampil di tabel',
  `created_by`        BIGINT UNSIGNED DEFAULT NULL,
  `created_at`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token_packages_name` (`name`),
  KEY `idx_token_packages_active` (`is_active`, `sort_order`),
  CONSTRAINT `fk_token_packages_creator`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. Kolom token_package_id pada templates (penghubung ke token)
--    CATATAN: ALTER TABLE ... ADD COLUMN tidak punya IF NOT EXISTS di
--    semua versi MariaDB. Bila kolom sudah ada, lewati baris ALTER ini
--    (phpMyAdmin akan memberi tahu "Duplicate column name").
-- ---------------------------------------------------------------------
ALTER TABLE `templates`
  ADD COLUMN `token_package_id` BIGINT UNSIGNED DEFAULT NULL
    COMMENT 'Token yang dipakai saat generate dengan template ini' AFTER `layout_key`,
  ADD KEY `idx_templates_token` (`token_package_id`),
  ADD CONSTRAINT `fk_templates_token`
    FOREIGN KEY (`token_package_id`) REFERENCES `token_packages` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------
-- 3. Seed 4 tier token (mengikuti desain patokan "Manajemen Token")
-- ---------------------------------------------------------------------
INSERT INTO `token_packages` (`name`, `token_amount`, `cost_per_generate`, `is_active`, `sort_order`)
VALUES
  ('Token Starter',    1000, 2000, 1, 1),
  ('Token Standar',   25000, 1500, 1, 2),
  ('Token Pro',       75000, 1000, 1, 3),
  ('Token Enterprise',160000,  750, 1, 4)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
