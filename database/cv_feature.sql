-- =====================================================================
-- Fitur Generate CV: tabel detail dokumen (payload JSON form CV).
-- Jalankan di phpMyAdmin (tab SQL) pada database "jagocv".
-- =====================================================================

CREATE TABLE IF NOT EXISTS `document_details` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `document_id` BIGINT UNSIGNED NOT NULL,
  `payload`     JSON NOT NULL COMMENT 'Seluruh data form CV (nama, pengalaman, pendidikan, keahlian, tema)',
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_document_details_doc` (`document_id`),
  CONSTRAINT `fk_document_details_doc`
    FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
