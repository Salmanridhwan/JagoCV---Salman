<?php
/**
 * POST /backend/logout.php
 * Token kita bersifat stateless (disimpan di klien), jadi logout utamanya
 * dilakukan di sisi klien dengan menghapus token dari localStorage.
 * Endpoint ini hanya memberi konfirmasi konsisten bagi frontend.
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_fail('Metode harus POST.', 405);
}

json_response(true, ['message' => 'Logout berhasil.']);
