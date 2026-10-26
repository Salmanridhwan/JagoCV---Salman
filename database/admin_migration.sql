-- =====================================================================
-- jagoCV — Migrasi Halaman Admin (Bagian 4 Tahap 0 di ADMIN_IMPLEMENTATION.md)
-- Jalankan di phpMyAdmin (tab SQL) pada database "jagocv", atau:
--   /Applications/XAMPP/xamppfiles/bin/mysql -u root jagocv < database/admin_migration.sql
-- Idempotent (aman dijalankan ulang) — MySQL 8 / MariaDB 10.5+.
-- =====================================================================

USE `jagocv`;

-- ---------------------------------------------------------------------
-- 1. Kolom admin pada tabel users
--    CATATAN: `role` pada users = profesi pengguna (FAKTA F4), JANGAN
--    dipakai untuk hak akses. Flag admin = kolom baru `is_admin`.
--    Model role granular (admin_roles) = PERLU KEPUTUSAN — fase ini
--    memakai single-flag sesuai keputusan sementara.
-- ---------------------------------------------------------------------
-- ALTER TABLE ... ADD COLUMN tidak punya IF NOT EXISTS di semua versi;
-- jalankan bila kolom belum ada (phpMyAdmin akan memberi tahu bila duplikat).
ALTER TABLE `users`
  ADD COLUMN `is_admin` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_new_user`,
  ADD COLUMN `status` ENUM('active','suspended','banned') NOT NULL DEFAULT 'active' AFTER `is_admin`;

-- ---------------------------------------------------------------------
-- 2. Tabel templates (Menu 2 — Manajemen Template)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `templates` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`           VARCHAR(100)  NOT NULL,
  `category`       ENUM('CV ATS','Resume','Portfolio') NOT NULL,
  `description`    VARCHAR(255)  NOT NULL DEFAULT '',
  `thumbnail_url`  VARCHAR(512)  DEFAULT NULL,
  `config_json`    JSON          NOT NULL COMMENT 'Konfigurasi renderer; seed memakai {"layout": "standar|tech|entry"}',
  `layout_key`     VARCHAR(20)   DEFAULT NULL COMMENT 'Mapping ke renderer CV user yang sudah ada (F8); NULL = kustom',
  `engine_version` VARCHAR(10)   NOT NULL DEFAULT 'v2.4',
  `status`         ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  `created_by`     BIGINT UNSIGNED DEFAULT NULL,
  `created_at`     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_templates_name_cat` (`name`, `category`),
  KEY `idx_templates_status` (`status`),
  CONSTRAINT `fk_templates_creator`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. Tabel audit_logs (Menu 9 — jejak aksi admin)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id`     BIGINT UNSIGNED DEFAULT NULL COMMENT 'NULL = aksi anonim mis. login gagal',
  `action`       VARCHAR(50)   NOT NULL COMMENT 'LOGIN/LOGOUT/CREATE/UPDATE/DELETE/SET_STATUS',
  `target_table` VARCHAR(64)   DEFAULT NULL,
  `target_id`    VARCHAR(64)   DEFAULT NULL,
  `before_json`  JSON          DEFAULT NULL,
  `after_json`   JSON          DEFAULT NULL,
  `reason`       VARCHAR(255)  DEFAULT NULL,
  `ip`           VARCHAR(45)   DEFAULT NULL,
  `user_agent`   VARCHAR(255)  DEFAULT NULL,
  `created_at`   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_admin` (`admin_id`),
  KEY `idx_audit_created` (`created_at`),
  CONSTRAINT `fk_audit_admin`
    FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. Tabel admin_login_attempts (rate-limit login admin, minimal Bagian 1.5)
--    5 percobaan gagal / IP / 15 menit → 429.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_login_attempts` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email`        VARCHAR(255) DEFAULT NULL,
  `ip`           VARCHAR(45)  NOT NULL,
  `success`      TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_attempts_ip_time` (`ip`, `created_at`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. Seed: akun superadmin + 3 template awal (F8)
--    WAJIB GANTI password setelah login pertama (development saja).
--    Email    : admin@jagocv.local
--    Password : Admin#12345
-- ---------------------------------------------------------------------
INSERT INTO `users` (`first_name`, `last_name`, `email`, `password_hash`, `role`, `plan`, `auth_provider`, `is_admin`, `status`, `is_new_user`)
VALUES ('Budiono', 'Siregar', 'admin@jagocv.local', '$2y$10$eSP1Pm460vwWHaLDZFj1rexu5qqHLZapOXR5hwC0phZk9JREjdG6W', 'Super Admin', 'free', 'local', 1, 'active', 0)
ON DUPLICATE KEY UPDATE `is_admin` = 1, `password_hash` = VALUES(`password_hash`);

SET @admin_id = (SELECT `id` FROM `users` WHERE `email` = 'admin@jagocv.local' LIMIT 1);

INSERT INTO `templates` (`name`, `category`, `description`, `config_json`, `layout_key`, `engine_version`, `status`, `created_by`) VALUES
('Modern Minimalist ATS', 'CV ATS', 'Dokumen didukung: CV ATS & Resume Standar — layout bawaan application jagoCV.', JSON_OBJECT('layout', 'standar'), 'standar', 'v2.4', 'published', @admin_id),
('Tech Specialist Pro',   'CV ATS', 'Dokumen didukung: CV ATS & Tech Summary — layout fokus keahlian teknis.',   JSON_OBJECT('layout', 'tech'),    'tech',    'v2.4', 'published', @admin_id),
('Fresh Graduate Entry',  'CV ATS', 'Dokumen didukung: CV ATS & Entry Level — layout ringkas untuk fresh graduate.', JSON_OBJECT('layout', 'entry'), 'entry',   'v2.4', 'published', @admin_id)
ON DUPLICATE KEY UPDATE `created_by` = VALUES(`created_by`);
