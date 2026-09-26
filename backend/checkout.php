<?php
/**
 * POST /backend/checkout.php
 * Membuat transaksi topup poin (payment gateway simulasi).
 * Body JSON: { package_code, payment_method? }
 * Respons: { ok, payment_ref, amount, points, package_name, payment_url, expires_at }
 *
 * payment_url menunjuk ke halaman simulasi payment gateway
 * (src/html/payment-gateway.html) yang di-serve lewat Vite;
 * halaman itu akan memanggil confirm.php untuk menyelesaikan pembayaran.
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_fail('Metode harus POST.', 405);
}

$user = require_user();
$userId = (int) $user['id'];

$body         = json_body();
$packageCode  = field_str($body, 'package_code');
$paymentMth   = field_str($body, 'payment_method') ?: 'qris';

if ($packageCode === '') {
    json_fail('Kode paket (package_code) wajib dipilih.');
}

// ── Ambil paket dari database (fallback konstan bila tabel belum ada) ─
$package = null;
try {
    $stmt = db()->prepare('SELECT code, name, price, points FROM topup_packages WHERE code = ? AND is_active = 1 LIMIT 1');
    $stmt->execute([$packageCode]);
    $row = $stmt->fetch();
    if ($row) {
        $package = [
            'code'   => (string) $row['code'],
            'name'   => (string) $row['name'],
            'price'  => (int) $row['price'],
            'points' => (int) $row['points'],
        ];
    }
} catch (PDOException $e) {
    // Tabel belum ada — pakai fallback di bawah.
}

if (!$package) {
    $fallback = [
        'basic'   => ['code' => 'basic',   'name' => 'Basic',   'price' => 19000, 'points' => 1],
        'pro'     => ['code' => 'pro',     'name' => 'Pro',     'price' => 49000, 'points' => 3],
        'premium' => ['code' => 'premium', 'name' => 'Premium', 'price' => 99000, 'points' => 10],
    ];
    $package = $fallback[$packageCode] ?? null;
}

if (!$package) {
    json_fail('Paket tidak ditemukan. Pilih paket yang tersedia.', 404);
}

// ── Buat referensi pembayaran & simpan transaksi pending ─────────────
$paymentRef = 'JCV-' . strtoupper(bin2hex(random_bytes(5))) . '-' . time();
$expiresAt  = gmdate('Y-m-d H:i:s', time() + 3600); // berlaku 1 jam

$stored = false;
try {
    $stmt = db()->prepare(
        "INSERT INTO point_transactions (user_id, type, points, description, package_code, payment_method, payment_ref, amount, status)
         VALUES (?, 'purchase', ?, ?, ?, ?, ?, ?, 'pending')"
    );
    $stmt->execute([
        $userId,
        (int) $package['points'],
        'Top up paket ' . $package['name'],
        $package['code'],
        $paymentMth,
        $paymentRef,
        (int) $package['price'],
    ]);
    $stored = true;
} catch (PDOException $e) {
    // Tabel belum ada — transaksi tetap diproses tanpa riwayat.
}

json_response(true, [
    'payment_ref'  => $paymentRef,
    'amount'       => (int) $package['price'],
    'points'       => (int) $package['points'],
    'package_name' => (string) $package['name'],
    'payment_url'  => '/src/html/payment-gateway.html?ref=' . urlencode($paymentRef)
        . '&package=' . urlencode((string) $package['name'])
        . '&points=' . (int) $package['points']
        . '&amount=' . (int) $package['price']
        . '&method=' . urlencode($paymentMth),
    'expires_at'   => $expiresAt,
    'stored'       => $stored,
]);
