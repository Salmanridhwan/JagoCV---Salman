<?php
/**
 * Helper bersama untuk API jagoCV: respons JSON, validasi input,
 * dan token sesi (HMAC-SHA256, format mirip JWT: header.payload.signature).
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

// ── Respons JSON ─────────────────────────────────────────────────────

function json_response(bool $ok, array $data = [], int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array_merge(['ok' => $ok], $data), JSON_UNESCAPED_UNICODE);
    exit;
}

function json_fail(string $message, int $status = 400): never
{
    json_response(false, ['message' => $message], $status);
}

/** Ambil dan decode body JSON dari request. */
function json_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        json_fail('Body request harus JSON yang valid.');
    }
    return $data;
}

/** Ambil nilai string dari array, lalu trim. */
function field_str(array $data, string $key): string
{
    return trim((string) ($data[$key] ?? ''));
}

// ── Validasi ─────────────────────────────────────────────────────────

function valid_email(string $email): bool
{
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

// ── Token sesi (HMAC-SHA256) ─────────────────────────────────────────

/** Buat token sesi berisi user_id + email, berlaku 7 hari. */
function issue_token(array $user): string
{
    $header    = ['alg' => 'HS256', 'typ' => 'JWT'];
    $payload   = [
        'sub'   => (int) $user['id'],
        'email' => $user['email'],
        'iat'   => time(),
        'exp'   => time() + 7 * 24 * 3600,
    ];

    $b64 = static fn (array $part): string =>
        rtrim(strtr(base64_encode(json_encode($part)), '+/', '-_'), '=');

    $unsigned = $b64($header) . '.' . $b64($payload);
    $sig      = rtrim(strtr(base64_encode(hash_hmac('sha256', $unsigned, APP_JWT_SECRET, true)), '+/', '-_'), '=');

    return $unsigned . '.' . $sig;
}

/** Verifikasi token; kembalikan payload bila valid, atau null. */
function verify_token(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }

    [$h, $p, $sig] = $parts;
    $expected = rtrim(strtr(base64_encode(hash_hmac('sha256', "$h.$p", APP_JWT_SECRET, true)), '+/', '-_'), '=');
    if (!hash_equals($expected, $sig)) {
        return null;
    }

    $payload = json_decode(base64_decode(strtr($p, '-_', '+/')), true);
    if (!is_array($payload) || !isset($payload['exp']) || (int) $payload['exp'] < time()) {
        return null;
    }

    return $payload;
}

/** Ambil user dari Authorization: Bearer header. Berhenti 401 bila tidak valid. */
function require_user(): array
{
    $header  = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    $headers = function_exists('getallheaders') ? array_change_key_case((array) getallheaders(), CASE_LOWER) : [];
    $bearer  = $headers['authorization'] ?? $header;

    if (!preg_match('/Bearer\s+(\S+)/i', (string) $bearer, $m)) {
        json_fail('Tidak terautentikasi. Silakan login terlebih dahulu.', 401);
    }

    $payload = verify_token($m[1]);
    if ($payload === null) {
        json_fail('Sesi tidak valid atau sudah kedaluwarsa. Silakan login kembali.', 401);
    }

    $stmt = db()->prepare('SELECT id, first_name, last_name, email, google_sub, avatar_url, role, plan, portfolio_views, points, is_new_user, auth_provider FROM users WHERE id = ?');
    $stmt->execute([(int) $payload['sub']]);
    $user = $stmt->fetch();

    if (!$user) {
        json_fail('Akun tidak ditemukan.', 401);
    }

    return $user;
}

/** Bentuk payload user yang aman dikirim ke frontend (tanpa hash password). */
function issue_admin_token(array $user): string
{
    // Token admin: masa berlaku 8 jam (rekomendasi sesi pendek, ADMIN_IMPLEMENTATION.md Bagian 1.3).
    $header  = ['alg' => 'HS256', 'typ' => 'JWT'];
    $payload = [
        'sub'      => (int) $user['id'],
        'email'    => $user['email'],
        'iat'      => time(),
        'exp'      => time() + 8 * 3600,
        'is_admin' => 1,
    ];

    $b64 = static fn (array $part): string =>
        rtrim(strtr(base64_encode(json_encode($part)), '+/', '-_'), '=');

    $unsigned = $b64($header) . '.' . $b64($payload);
    $sig      = rtrim(strtr(base64_encode(hash_hmac('sha256', $unsigned, APP_JWT_SECRET, true)), '+/', '-_'), '=');

    return $unsigned . '.' . $sig;
}

/**
 * Guard SEMUA endpoint admin (Bagian 1.4): wajib dipanggil di awal file.
 * Token harus ber payload is_admin=1, user harus masih admin & status aktif.
 * $perm disiapkan untuk model permission granular (PERLU KEPUTUSAN) — saat ini
 * single-flag is_admin sehingga permission apa pun longitudinal lolos.
 */
function require_admin(?string $perm = null): array
{
    $header  = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    $headers = function_exists('getallheaders') ? array_change_key_case((array) getallheaders(), CASE_LOWER) : [];
    $bearer  = $headers['authorization'] ?? $header;

    if (!preg_match('/Bearer\\s+(\\S+)/i', (string) $bearer, $m)) {
        json_fail('Tidak terautentikasi. Silakan login admin terlebih dahulu.', 401);
    }

    $payload = verify_token($m[1]);
    if ($payload === null || (int) ($payload['is_admin'] ?? 0) !== 1) {
        json_fail('Token admin tidak valid. Silakan login kembali.', 401);
    }

    $stmt = db()->prepare(
        'SELECT id, first_name, last_name, email, avatar_url, points, is_admin, status
         FROM users WHERE id = ?'
    );
    $stmt->execute([(int) $payload['sub']]);
    $admin = $stmt->fetch();

    if (!$admin) {
        json_fail('Akun admin tidak ditemukan.', 401);
    }
    if ((int) $admin['is_admin'] !== 1) {
        json_fail('Akses admin ditolak.', 403);
    }
    if (($admin['status'] ?? 'active') !== 'active') {
        json_fail('Akun admin dinonaktifkan.', 403);
    }

    return $admin;
}

/** Bentuk payload admin untuk frontend (tanpa data sensitif). */
function public_admin(array $admin): array
{
    return [
        'id'         => (int) $admin['id'],
        'first_name' => (string) $admin['first_name'],
        'last_name'  => (string) $admin['last_name'],
        'email'      => (string) $admin['email'],
        'avatar_url' => $admin['avatar_url'] ?? null,
        'role_label' => 'Super Admin',
    ];
}

/**
 * Catat jejak aksi admin ke audit_logs (Bagian 2, wajib pada aksi write).
 * Gagal mencatat JANGAN menggagalkan operasi utama — hanya error_log.
 */
function log_audit(int $adminId, string $action, string $table, $targetId, ?array $before, ?array $after, ?string $reason = null): void
{
    try {
        $stmt = db()->prepare(
            'INSERT INTO audit_logs (admin_id, action, target_table, target_id, before_json, after_json, reason, ip, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $adminId,
            $action,
            $table,
            (string) $targetId,
            $before === null ? null : json_encode($before, JSON_UNESCAPED_UNICODE),
            $after === null ? null : json_encode($after, JSON_UNESCAPED_UNICODE),
            $reason,
            $_SERVER['REMOTE_ADDR'] ?? null,
            substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255),
        ]);
    } catch (PDOException $e) {
        error_log('log_audit: ' . $e->getMessage());
    }
}

function public_user(array $user): array
{
    return [
        'id'              => (int) $user['id'],
        'first_name'      => (string) $user['first_name'],
        'last_name'       => (string) $user['last_name'],
        'email'           => (string) $user['email'],
        'avatar_url'      => $user['avatar_url'] ?? null,
        'role'            => $user['role'] ?? null,
        'plan'            => (string) ($user['plan'] ?? 'free'),
        'portfolio_views' => (int) ($user['portfolio_views'] ?? 0),
        'points'          => (int) ($user['points'] ?? 0),
        'is_new_user'     => (bool) ($user['is_new_user'] ?? false),
        'auth_provider'   => (string) ($user['auth_provider'] ?? 'local'),
    ];
}
