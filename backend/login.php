<?php
/**
 * POST /backend/login.php
 * Login dengan email + password (provider "local").
 * Body JSON: { email, password }
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_fail('Metode harus POST.', 405);
}

$body     = json_body();
$email    = strtolower(field_str($body, 'email'));
$password = (string) ($body['password'] ?? '');

if (!valid_email($email)) {
    json_fail('Format email tidak valid.');
}
if ($password === '') {
    json_fail('Password wajib diisi.');
}

$stmt = db()->prepare(
    'SELECT id, first_name, last_name, email, password_hash, google_sub, avatar_url, role, plan, portfolio_views, auth_provider
     FROM users WHERE email = ?'
);
$stmt->execute([$email]);
$user = $stmt->fetch();

// Pesan generik agar tidak membocorkan apakah email terdaftar.
if (!$user || $user['password_hash'] === null || !password_verify($password, (string) $user['password_hash'])) {
    json_fail('Email atau password salah.', 401);
}

// Support rehash otomatis bila cost bcrypt berubah.
if (password_needs_rehash((string) $user['password_hash'], PASSWORD_BCRYPT)) {
    $newHash = password_hash($password, PASSWORD_BCRYPT);
    db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        ->execute([$newHash, (int) $user['id']]);
}

json_response(true, [
    'message' => 'Login berhasil. Selamat datang kembali, ' . $user['first_name'] . '!',
    'token'   => issue_token($user),
    'user'    => public_user($user),
]);
