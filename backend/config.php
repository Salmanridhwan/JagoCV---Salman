<?php
/**
 * Konfigurasi database & CORS untuk API jagoCV.
 * Sesuaikan kredensial dengan XAMPP/phpMyAdmin Anda (default XAMPP: root, tanpa password).
 */

declare(strict_types=1);

// ── Kredensial MySQL (default XAMPP) ────────────────────────────────
const DB_HOST = '127.0.0.1';
const DB_PORT = 3306;
const DB_NAME = 'jagocv';
const DB_USER = 'root';
const DB_PASS = '';

// ── Secret untuk menandatangani token sesi ──────────────────────────
// GANTI di production! Bisa juga diset lewat environment variable.
const APP_JWT_SECRET = 'ganti-secret-ini-dengan-string-acak-panjang';

// ── CORS: izinkan Vite dev server & frontend lain ───────────────────
$allowed_origins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
// WAJIB mengizinkan Authorization (token Bearer) & Content-Type —
// tanpa ini browser memblokir semua request ber-token (CORS preflight).
header('Access-Control-Allow-Headers: ' . (
    $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] ?? 'Content-Type, Authorization'
));

// Jawab preflight langsung
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/**
 * Koneksi PDO ke MySQL. Script akan berhenti dengan pesan JSON bila gagal.
 */
function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME);
    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'ok'      => false,
            'message' => 'Gagal terhubung ke database. Pastikan MySQL menyala dan database "jagocv" sudah diimpor lewat phpMyAdmin.',
        ]);
        exit;
    }

    return $pdo;
}
