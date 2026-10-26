<?php
/**
 * POST /backend/admin/login.php
 * Login khusus admin (Bagian 1.3 ADMIN_IMPLEMENTATION.md).
 * Body JSON: { email, password } — TANPA login Google (akun admin dibuat internal).
 * Non-admin → 401 tanpa token. Rate limit: 5 percobaan gagal / IP / 15 menit → 429.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_fail('Metode harus POST.', 405);
}

$body     = json_body();
$email    = strtolower(field_str($body, 'email'));
$password = (string) ($body['password'] ?? '');
$ip       = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

if (!valid_email($email) || $password === '') {
    json_fail('Email dan password wajib diisi.');
}

// ── Rate limit sederhana: 5 kegagalan / IP / 15 menit ────────────────
try {
    $stmt = db()->prepare(
        "SELECT COUNT(*) FROM admin_login_attempts
         WHERE ip = ? AND success = 0 AND created_at > (NOW() - INTERVAL 15 MINUTE)"
    );
    $stmt->execute([$ip]);
    if ((int) $stmt->fetchColumn() >= 5) {
        json_fail('Terlalu banyak percobaan login. Coba lagi 15 menit lagi.', 429);
    }
} catch (PDOException $e) {
    error_log('login.php rate-limit: ' . $e->getMessage()); // tabel belum dibuat — jangan blokir login
}

// ── Verifikasi kredensial admin ──────────────────────────────────────
$stmt = db()->prepare(
    'SELECT id, first_name, last_name, email, password_hash, avatar_url, points, is_admin, status
     FROM users WHERE email = ?'
);
$stmt->execute([$email]);
$admin = $stmt->fetch();

$invalid = !$admin
    || $admin['password_hash'] === null
    || !password_verify($password, (string) $admin['password_hash']);

if ($invalid) {
    try {
        db()->prepare('INSERT INTO admin_login_attempts (email, ip, success) VALUES (?, ?, 0)')
            ->execute([$email, $ip]);
    } catch (PDOException $e) {
        error_log('login.php attempt-log: ' . $e->getMessage());
    }
    // Pesan generik agar tidak membocorkan apakah email terdaftar (pola login.php).
    json_fail('Email atau password salah.', 401);
}

if ((int) $admin['is_admin'] !== 1) {
    // Non-admin mencoba halaman admin → tolak tanpa token (Bagian 1.3).
    try {
        db()->prepare('INSERT INTO admin_login_attempts (email, ip, success) VALUES (?, ?, 0)')
            ->execute([$email, $ip]);
    } catch (PDOException $e) {
        error_log('login.php attempt-log: ' . $e->getMessage());
    }
    json_fail('Akun ini bukan admin. Akses ditolak.', 403);
}

if (($admin['status'] ?? 'active') !== 'active') {
    json_fail('Akun admin dinonaktifkan. Hubungi superadmin lain.', 403);
}

try {
    db()->prepare('INSERT INTO admin_login_attempts (email, ip, success) VALUES (?, ?, 1)')
        ->execute([$email, $ip]);
} catch (PDOException $e) {
    error_log('login.php attempt-log: ' . $e->getMessage());
}

log_audit((int) $admin['id'], 'LOGIN', 'users', (int) $admin['id'], null, null, 'Login admin berhasil');

json_response(true, [
    'message' => 'Login berhasil. Selamat datang, ' . $admin['first_name'] . '!',
    'token'   => issue_admin_token($admin),
    'admin'   => public_admin($admin),
]);
