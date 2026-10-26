<?php
/**
 * GET /backend/admin/me.php
 * Validasi sesi admin (frontend guard memanggil ini saat halaman dibuka).
 * 401 bila token tidak valid → frontend redirect ke /admin-login.html.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    json_fail('Metode harus GET.', 405);
}

$admin = require_admin();

json_response(true, ['admin' => public_admin($admin)]);
