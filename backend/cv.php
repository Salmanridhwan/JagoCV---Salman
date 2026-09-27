<?php
/**
 * POST /backend/cv.php
 * Simpan CV hasil generate (form manual) ke database MySQL/phpMyAdmin.
 * Body JSON: { full_name, target_role, email, ... } (lihat CvFormData di frontend)
 * Header   : Authorization: Bearer <token>
 *
 * GET /backend/cv.php
 * Mengembalikan daftar dokumen CV milik user yang sedang login.
 *
 * Endpoint draft per-akun (?draft=1) — menggantikan localStorage:
 *   GET    /backend/cv.php?draft=1  → { ok, draft: <payload|null> }
 *   POST   /backend/cv.php?draft=1  → simpan/upsert draft milik user login
 *   DELETE /backend/cv.php?draft=1  → hapus draft user login
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'POST' && $method !== 'GET' && $method !== 'DELETE') {
    json_fail('Metode harus POST, GET, atau DELETE.', 405);
}

$user = require_user();
$userId = (int) $user['id'];

// ══ DRAFT CV PER AKUN (?draft=1) ═══════════════════════════════════
if (isset($_GET['draft'])) {
    if ($method === 'GET') {
        try {
            $stmt = db()->prepare('SELECT payload FROM cv_drafts WHERE user_id = ?');
            $stmt->execute([$userId]);
            $row = $stmt->fetch();
        } catch (PDOException $e) {
            // Tabel cv_drafts belum ada (migrasi belum dijalankan).
            error_log('cv.php draft GET: ' . $e->getMessage());
            json_response(true, ['draft' => null]);
        }
        $payload = $row ? json_decode((string) $row['payload'], true) : null;
        json_response(true, ['draft' => is_array($payload) ? $payload : null]);
    }

    if ($method === 'POST') {
        $body = json_body();
        if (!isset($body['full_name'])) {
            json_fail('Payload draft tidak valid.');
        }
        try {
            // Upsert: satu baris draft per user (user_id unik).
            $stmt = db()->prepare(
                'INSERT INTO cv_drafts (user_id, payload) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE payload = VALUES(payload)'
            );
            $stmt->execute([$userId, json_encode($body, JSON_UNESCAPED_UNICODE)]);
        } catch (PDOException $e) {
            error_log('cv.php draft POST: ' . $e->getMessage());
            json_fail('Gagal menyimpan draft. Pastikan tabel cv_drafts sudah dibuat.', 500);
        }
        json_response(true, ['message' => 'Draft tersimpan.']);
    }

    // DELETE
    try {
        db()->prepare('DELETE FROM cv_drafts WHERE user_id = ?')->execute([$userId]);
    } catch (PDOException $e) {
        error_log('cv.php draft DELETE: ' . $e->getMessage());
    }
    json_response(true, ['message' => 'Draft dihapus.']);
}

// ══ DOKUMEN CV (GET daftar / POST simpan) ═══════════════════════════

if ($method === 'GET') {
    // Daftar CV milik user (metadata saja, tanpa payload besar).
    $stmt = db()->prepare(
        'SELECT d.id, d.doc_code, d.title, d.type, d.status, d.created_at
         FROM documents d
         WHERE d.user_id = ? AND d.type = "ATS CV"
         ORDER BY d.created_at DESC
         LIMIT 50'
    );
    $stmt->execute([(int) $user['id']]);

    json_response(true, ['documents' => $stmt->fetchAll()]);
}

// ── POST: simpan CV baru ─────────────────────────────────────────────
$body       = json_body();
$fullName   = field_str($body, 'full_name');
$targetRole = field_str($body, 'target_role');
$email      = strtolower(field_str($body, 'email'));

if ($fullName === '') {
    json_fail('Nama lengkap wajib diisi.');
}
if ($email !== '' && !valid_email($email)) {
    json_fail('Format email pada data CV tidak valid.');
}

// Buat doc_code unik, cth: DOC-8012 (retry bila tabrakan).
$docCode = '';
for ($i = 0; $i < 5; $i++) {
    $candidate = 'DOC-' . str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
    $check = db()->prepare('SELECT 1 FROM documents WHERE doc_code = ?');
    $check->execute([$candidate]);
    if (!$check->fetch()) {
        $docCode = $candidate;
        break;
    }
}
if ($docCode === '') {
    json_fail('Gagal membuat kode dokumen. Coba lagi.', 500);
}

$title = $fullName . ($targetRole !== '' ? ' — ' . $targetRole : '');

try {
    db()->beginTransaction();

    // 1. Metadata dokumen (tabel documents sudah ada dari jagocv.sql).
    $stmt = db()->prepare(
        'INSERT INTO documents (user_id, doc_code, title, type, status)
         VALUES (?, ?, ?, "ATS CV", "Selesai")'
    );
    $stmt->execute([(int) $user['id'], $docCode, $title]);
    $documentId = (int) db()->lastInsertId();

    // 2. Payload lengkap form (butuh tabel document_details — jalankan
    //    database/cv_feature.sql di phpMyAdmin bila belum ada).
    try {
        $stmt = db()->prepare('INSERT INTO document_details (document_id, payload) VALUES (?, ?)');
        $stmt->execute([$documentId, json_encode($body, JSON_UNESCAPED_UNICODE)]);
    } catch (PDOException $e) {
        // Tabel document_details belum ada → CV tetap tersimpan (metadata),
        // namun detail form tidak. Jangan gagalkan seluruh request.
        error_log('cv.php: document_details gagal — ' . $e->getMessage());
    }

    db()->commit();
} catch (PDOException $e) {
    if (db()->inTransaction()) {
        db()->rollBack();
    }
    error_log('cv.php: ' . $e->getMessage());
    json_fail('Gagal menyimpan CV ke database. Pastikan MySQL menyala.', 500);
}

json_response(true, [
    'message'  => 'CV berhasil disimpan ke database.',
    'document' => [
        'id'      => $documentId,
        'doc_code' => $docCode,
        'title'   => $title,
        'type'    => 'ATS CV',
        'status'  => 'Selesai',
    ],
]);
