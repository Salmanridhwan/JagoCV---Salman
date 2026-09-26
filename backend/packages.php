<?php
/**
 * GET /backend/packages.php
 * Daftar paket topup poin yang aktif (basic / pro / premium).
 * Respons: { ok, packages: [{ code, name, price, points, features[] }] }
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    json_fail('Metode harus GET.', 405);
}

// Paket fallback bila tabel belum dibuat (migrasi belum dijalankan).
$fallback = [
    [
        'code'     => 'basic',
        'name'     => 'Basic',
        'price'    => 19000,
        'points'   => 1,
        'features' => [
            '1x generate dokumen (CV / Resume / Portfolio)',
            'Pilihan template dasar',
            'Export PDF standar',
        ],
    ],
    [
        'code'     => 'pro',
        'name'     => 'Pro',
        'price'    => 49000,
        'points'   => 3,
        'features' => [
            '3x generate dokumen (CV / Resume / Portfolio)',
            'Semua template premium',
            'Export PDF kualitas tinggi',
            'Prioritas antrian AI',
        ],
    ],
    [
        'code'     => 'premium',
        'name'     => 'Premium',
        'price'    => 99000,
        'points'   => 10,
        'features' => [
            '10x generate dokumen (CV / Resume / Portfolio)',
            'Semua template premium',
            'Export PDF kualitas tinggi',
            'Prioritas antrian AI tertinggi',
            'Dukungan khusus 24/7',
        ],
    ],
];

try {
    $rows = db()
        ->query('SELECT code, name, price, points, features FROM topup_packages WHERE is_active = 1 ORDER BY price ASC')
        ->fetchAll();
} catch (PDOException $e) {
    json_response(true, ['packages' => $fallback]);
}

if (!$rows) {
    json_response(true, ['packages' => $fallback]);
}

$packages = array_map(static function (array $row): array {
    return [
        'code'     => (string) $row['code'],
        'name'     => (string) $row['name'],
        'price'    => (int) $row['price'],
        'points'   => (int) $row['points'],
        'features' => array_values(array_filter(array_map('trim', explode("\n", (string) $row['features'])))),
    ];
}, $rows);

json_response(true, ['packages' => $packages]);
