-- =====================================================================
-- Fitur Draft CV per akun: simpan isi form CV di server (MySQL), bukan
-- localStorage, agar draft terikat ke akun — bukan ke browser.
-- Jalankan di phpMyAdmin (tab SQL) pada database "jagocv".
-- =====================================================================

CREATE TABLE IF NOT EXISTS `cv_drafts` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `payload`    JSON NOT NULL COMMENT 'Seluruh data form CV (nama, pengalaman, pendidikan, keahlian, tema)',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cv_drafts_user` (`user_id`),
  CONSTRAINT `fk_cv_drafts_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
