<?php
/**
 * POST /backend/confirm.php
 * Menyelesaikan pembayaran (callback payment gateway simulasi).
 * Body JSON: { payment_ref, status?: "success" | "failed" }
 *
 * Bila success: poin user ditambah sesuai transaksi, status transaksi
 * jadi 'success', dan penanda is_new_user dimatikan (user sudah top up).
 * Idempotent: transaksi yang sudah 'success' tidak diproses dua kali.
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_fail('Metode harus POST.', 405);
}

$user = require_user();
$userId = (int) $user['id'];

$body       = json_body();
$paymentRef = field_str($body, 'payment_ref');
$status     = strtolower(field_str($body, 'status') ?: 'success');

if ($paymentRef === '') {
    json_fail('payment_ref wajib diisi.');
}
if (!in_array($status, ['success', 'failed'], true)) {
    json_fail('status harus "success" atau "failed".');
}

$pdo = db();

try {
    $stmt = $pdo->prepare(
        'SELECT id, user_id, points, package_code, payment_method, status FROM point_transactions
         WHERE payment_ref = ? AND user_id = ? AND type = \'purchase\' LIMIT 1'
    );
    $stmt->execute([$paymentRef, $userId]);
    $tx = $stmt->fetch();
} catch (PDOException $e) {
    json_fail('Riwayat transaksi belum tersedia. Jalankan migrasi database terlebih dahulu.', 500);
}

if (!$tx) {
    json_fail('Transaksi tidak ditemukan.', 404);
}
if ($tx['status'] === 'success') {
    // Idempotent: kembalikan saldo terkini tanpa menambah poin lagi.
    $stmt = $pdo->prepare('SELECT points, is_new_user FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    json_response(true, [
        'message'     => 'Pembayaran sudah pernah dikonfirmasi.',
        'points'      => (int) ($row['points'] ?? 0),
        'is_new_user' => (bool) ($row['is_new_user'] ?? false),
        'already'     => true,
    ]);
}
if ($tx['status'] === 'failed') {
    json_fail('Transaksi ini sudah gagal. Silakan buat transaksi baru.', 409);
}

if ($status === 'failed') {
    $pdo->prepare("UPDATE point_transactions SET status = 'failed' WHERE id = ?")
        ->execute([(int) $tx['id']]);
    json_response(true, [
        'message' => 'Pembayaran dibatalkan/gagal.',
        'status'  => 'failed',
    ]);
}

// ── Success: tambah poin & tandai transaksi sukses ───────────────────
$pdo->beginTransaction();
try {
    // Kunci row transaksi agar tidak dikonfirmasi ganda secara paralel.
    $stmt = $pdo->prepare('SELECT status FROM point_transactions WHERE id = ? FOR UPDATE');
    $stmt->execute([(int) $tx['id']]);
    $current = $stmt->fetch();
    if (!$current || $current['status'] !== 'pending') {
        $pdo->rollBack();
        json_response(true, [
            'message'     => 'Pembayaran sudah pernah dikonfirmasi.',
            'already'     => true,
        ]);
    }

    $pdo->prepare("UPDATE point_transactions SET status = 'success' WHERE id = ?")
        ->execute([(int) $tx['id']]);
    $pdo->prepare('UPDATE users SET points = points + ?, is_new_user = 0 WHERE id = ?')
        ->execute([(int) $tx['points'], $userId]);

    $pdo->commit();
} catch (PDOException $e) {
    $pdo->rollBack();
    json_fail('Gagal menyelesaikan pembayaran. Coba lagi.', 500);
}

$stmt = $pdo->prepare('SELECT points, is_new_user FROM users WHERE id = ?');
$stmt->execute([$userId]);
$row = $stmt->fetch();

json_response(true, [
    'message'     => 'Pembayaran berhasil! Poin Anda bertambah.',
    'points'      => (int) ($row['points'] ?? 0),
    'is_new_user' => (bool) ($row['is_new_user'] ?? false),
    'status'      => 'success',
]);
