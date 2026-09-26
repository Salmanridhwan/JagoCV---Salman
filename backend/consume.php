<?php
/**
 * POST /backend/consume.php
 * Memakai 1 poin untuk satu kali generate dokumen (CV / Resume / Portfolio).
 * Operasi atomik: poin hanya berkurang bila masih > 0.
 * Respons: { ok, points, message }
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_fail('Metode harus POST.', 405);
}

$user = require_user();
$userId = (int) $user['id'];

$pdo = db();

// Kurangi poin hanya bila masih ada sisa (atomik, cegah nilai minus / double-spend).
$stmt = $pdo->prepare(
    'UPDATE users SET points = points - 1 WHERE id = ? AND points > 0'
);
$stmt->execute([$userId]);

if ($stmt->rowCount() !== 1) {
    json_fail('Poin Anda habis. Silakan lakukan top up untuk melanjutkan.', 402);
}

// Catat riwayat pemakaian (abaikan bila tabel belum ada).
try {
    $pdo->prepare(
        "INSERT INTO point_transactions (user_id, type, points, description) VALUES (?, 'usage', -1, 'Generate 1 dokumen')"
    )->execute([$userId]);
} catch (PDOException $e) {
    // Tabel point_transactions belum ada (migrasi belum dijalankan) — abaikan.
}

$stmt = $pdo->prepare('SELECT points FROM users WHERE id = ?');
$stmt->execute([$userId]);
$points = (int) ($stmt->fetch()['points'] ?? 0);

json_response(true, [
    'points'  => $points,
    'message' => '1 poin digunakan untuk generate.',
]);
