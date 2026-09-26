<?php
/**
 * POST /backend/google.php
 * Login / registrasi via Google Sign-In (One Tap / tombol GSI).
 * Body JSON: { credential: "<Google ID token>" }
 *
 * ID token diverifikasi langsung ke server Google (tokeninfo), lalu user
 * di-upsert: akun google baru dibuat otomatis; bila email sudah terdaftar
 * sebagai akun lokal, akun tersebut di-link ke Google.
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_fail('Metode harus POST.', 405);
}

$body       = json_body();
$credential = trim((string) ($body['credential'] ?? ''));

if ($credential === '') {
    json_fail('Credential Google tidak ditemukan.');
}

// ── Verifikasi ID token ke server Google ─────────────────────────────
$ch = curl_init('https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($credential));
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
]);
$response = curl_exec($ch);
$curlErr  = curl_error($ch);
$httpCode = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);

if ($response === false || $response === '') {
    json_fail('Gagal memverifikasi token Google' . ($curlErr !== '' ? ': ' . $curlErr : '.'), 502);
}

$info = json_decode((string) $response, true);
if (!is_array($info) || isset($info['error_description']) || isset($info['error']) || $httpCode !== 200) {
    json_fail('Token Google tidak valid atau kedaluwarsa.', 401);
}

// Audience harus cocok dengan Client ID aplikasi (bila dikonfigurasi).
$clientId = getenv('GOOGLE_CLIENT_ID') ?: '';
if ($clientId !== '' && (string) ($info['aud'] ?? '') !== $clientId) {
    json_fail('Token Google bukan untuk aplikasi ini (audience mismatch).', 401);
}

$emailVerified = ($info['email_verified'] ?? 'false') === 'true' || ($info['email_verified'] ?? false) === true;
if (!$emailVerified) {
    json_fail('Email Google belum terverifikasi.', 401);
}

$googleSub = (string) ($info['sub'] ?? '');
$email     = strtolower((string) ($info['email'] ?? ''));
$firstName = (string) ($info['given_name'] ?? '');
$lastName  = (string) ($info['family_name'] ?? '');
$avatarUrl = (string) ($info['picture'] ?? '');

if ($googleSub === '' || !valid_email($email)) {
    json_fail('Data profil Google tidak lengkap.', 401);
}

// Nama fallback bila Google tidak mengirim given/family name.
if ($firstName === '' && $lastName === '') {
    $parts     = preg_split('/\s+/', (string) ($info['name'] ?? ''), 2) ?: [];
    $firstName = (string) ($parts[0] ?? 'Pengguna');
    $lastName  = (string) ($parts[1] ?? '');
}

// ── Upsert user ──────────────────────────────────────────────────────
$stmt = db()->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$existing = $stmt->fetch();

if ($existing) {
    // Link akun lokal ke Google bila belum, dan perbarui profil.
    $stmt = db()->prepare(
        "UPDATE users SET google_sub = COALESCE(google_sub, ?), avatar_url = COALESCE(?, avatar_url),
            first_name = COALESCE(NULLIF(?, ''), first_name), last_name = COALESCE(NULLIF(?, ''), last_name),
            auth_provider = IF(auth_provider = 'local', 'google', auth_provider)
         WHERE id = ?"
    );
    $stmt->execute([$googleSub, $avatarUrl !== '' ? $avatarUrl : null, $firstName, $lastName, (int) $existing['id']]);

    $stmt    = db()->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([(int) $existing['id']]);
    $user    = $stmt->fetch() ?: $existing;
    $message = 'Login Google berhasil. Selamat datang kembali, ' . $user['first_name'] . '!';
} else {
    $stmt = db()->prepare(
        'INSERT INTO users (first_name, last_name, email, password_hash, google_sub, avatar_url, auth_provider, points, is_new_user)
         VALUES (?, ?, ?, NULL, ?, ?, \'google\', 2, 1)'
    );
    $stmt->execute([$firstName, $lastName, $email, $googleSub, $avatarUrl !== '' ? $avatarUrl : null]);

    $newUserId = (int) db()->lastInsertId();

    // Catat bonus 2 poin pengguna baru (abaikan bila tabel belum ada).
    try {
        db()->prepare(
            'INSERT INTO point_transactions (user_id, type, points, description) VALUES (?, \'signup_bonus\', 2, \'Bonus pengguna baru: 2 poin gratis\')'
        )->execute([$newUserId]);
    } catch (PDOException $e) {
        // Tabel point_transactions belum ada (migrasi belum dijalankan) — abaikan.
    }

    $stmt = db()->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$newUserId]);
    $user    = $stmt->fetch() ?: [];
    $message = 'Akun Google berhasil dibuat. Selamat datang di jagoCV!';
}

if (!$user) {
    json_fail('Gagal menyimpan data pengguna.', 500);
}

json_response(true, [
    'message' => $message,
    'token'   => issue_token($user),
    'user'    => public_user($user),
]);
