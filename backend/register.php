<?php
/**
 * POST /backend/register.php
 * Registrasi akun baru dengan email + password (provider "local").
 * Body JSON: { first_name, last_name?, email, password }
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_fail('Metode harus POST.', 405);
}

$body        = json_body();
$firstName   = field_str($body, 'first_name');
$lastName    = field_str($body, 'last_name');
$email       = strtolower(field_str($body, 'email'));
$password    = (string) ($body['password'] ?? '');

// ── Validasi ─────────────────────────────────────────────────────────
if ($firstName === '') {
    json_fail('Nama depan wajib diisi.');
}
if (mb_strlen($firstName) > 100 || mb_strlen($lastName) > 100) {
    json_fail('Nama terlalu panjang (maksimal 100 karakter).');
}
if (!valid_email($email)) {
    json_fail('Format email tidak valid.');
}
if (strlen($password) < 8) {
    json_fail('Password minimal 8 karakter.');
}

// ── Cek email sudah terdaftar ────────────────────────────────────────
$stmt = db()->prepare('SELECT id, auth_provider FROM users WHERE email = ?');
$stmt->execute([$email]);
$existing = $stmt->fetch();

if ($existing) {
    json_fail(
        $existing['auth_provider'] === 'google'
            ? 'Email ini terdaftar via Google. Silakan masuk menggunakan tombol "Lanjutkan dengan Google".'
            : 'Email sudah terdaftar. Silakan masuk atau gunakan email lain.',
        409
    );
}

// ── Simpan user baru ─────────────────────────────────────────────────
$passwordHash = password_hash($password, PASSWORD_BCRYPT);

$stmt = db()->prepare(
    'INSERT INTO users (first_name, last_name, email, password_hash, auth_provider) VALUES (?, ?, ?, ?, \'local\')'
);
$stmt->execute([$firstName, $lastName, $email, $passwordHash]);

$userId = (int) db()->lastInsertId();

// ── Auto-login: keluarkan token sesi ─────────────────────────────────
$user = [
    'id'         => $userId,
    'email'      => $email,
    'first_name' => $firstName,
    'last_name'  => $lastName,
];

json_response(true, [
    'message' => 'Registrasi berhasil. Selamat datang di jagoCV!',
    'token'   => issue_token($user),
    'user'    => public_user(array_merge($user, [
        'avatar_url'      => null,
        'role'            => null,
        'plan'            => 'free',
        'portfolio_views' => 0,
        'auth_provider'   => 'local',
    ])),
]);
