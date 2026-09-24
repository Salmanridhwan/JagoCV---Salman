-- =====================================================================
-- jagoCV — Skema Database MySQL
-- Cara pakai:
--   1. Nyalakan Apache & MySQL di XAMPP Control Panel.
--   2. Buka http://localhost/phpmyadmin
--   3. Tab "Import" → pilih file ini → "Import".
--    (atau via terminal: mysql -u root -p < jagocv.sql)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `jagocv`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `jagocv`;

-- ---------------------------------------------------------------------
-- Tabel: users
-- Menyimpan akun registrasi email/password (auth_provider = 'local')
-- maupun akun Google Sign-In (auth_provider = 'google', password NULL).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name`      VARCHAR(100)  NOT NULL,
  `last_name`       VARCHAR(100)  NOT NULL DEFAULT '',
  `email`           VARCHAR(255)  NOT NULL,
  `password_hash`   VARCHAR(255)  DEFAULT NULL COMMENT 'bcrypt via password_hash(); NULL = akun khusus Google',
  `google_sub`      VARCHAR(64)   DEFAULT NULL COMMENT 'ID unik (sub) dari akun Google',
  `avatar_url`      VARCHAR(512)  DEFAULT NULL,
  `role`            VARCHAR(120)  DEFAULT NULL COMMENT 'Profesi/role pengguna, cth: CS Student & Web Dev',
  `plan`            ENUM('free','pro','business') NOT NULL DEFAULT 'free',
  `portfolio_views` INT UNSIGNED  NOT NULL DEFAULT 0,
  `auth_provider`   ENUM('local','google') NOT NULL DEFAULT 'local',
  `created_at`      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_google_sub` (`google_sub`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Tabel: documents
-- CV / Resume / Portfolio milik tiap user (dashboard "Dokumen Terkini").
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `documents` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `doc_code`   VARCHAR(20)  NOT NULL COMMENT 'Kode yang tampil di UI, cth: DOC-8012',
  `title`      VARCHAR(200) NOT NULL,
  `type`       ENUM('ATS CV','Visual Resume','Web Portfolio','Cover Letter') NOT NULL,
  `status`     ENUM('Draf','Selesai','Diterbitkan') NOT NULL DEFAULT 'Draf',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_documents_doc_code` (`doc_code`),
  KEY `idx_documents_user` (`user_id`),
  CONSTRAINT `fk_documents_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Tabel: subscriptions
-- Riwayat paket harga (halaman pricing → upgrade plan).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `plan`       ENUM('free','pro','business') NOT NULL DEFAULT 'free',
  `status`     ENUM('active','cancelled','expired') NOT NULL DEFAULT 'active',
  `started_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_subscriptions_user` (`user_id`),
  CONSTRAINT `fk_subscriptions_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
