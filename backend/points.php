<?php
/**
 * GET /backend/points.php
 * Mengambil saldo poin user yang sedang login.
 * Respons: { ok, points, is_new_user }
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    json_fail('Metode harus GET.', 405);
}

$user = require_user();

json_response(true, [
    'points'      => (int) ($user['points'] ?? 0),
    'is_new_user' => (bool) ($user['is_new_user'] ?? false),
]);
