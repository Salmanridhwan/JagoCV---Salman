<?php
/**
 * POST /backend/admin/logout.php
 * Logout stateless: frontend menghapus localStorage; backend hanya
 * mencatat aksi LOGOUT ke audit_logs (pola backend/logout.php user).
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_fail('Metode harus POST.', 405);
}

$admin = require_admin();

log_audit((int) $admin['id'], 'LOGOUT', 'users', (int) $admin['id'], null, null, null);

json_response(true, ['message' => 'Logout berhasil.']);
