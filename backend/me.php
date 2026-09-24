<?php
/**
 * GET /backend/me.php
 * Memeriksa sesi: kembalikan data user bila token valid,
 * atau 401 bila tidak ada / token kedaluwarsa (frontend akan pakai ini
 * untuk auto-login saat halaman dibuka ulang).
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    json_fail('Metode harus GET.', 405);
}

$user = require_user();

json_response(true, ['user' => public_user($user)]);
