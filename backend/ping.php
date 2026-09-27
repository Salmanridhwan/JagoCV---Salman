<?php
/**
 * GET /backend/ping.php
 * Endpoint diagnosa koneksi (tanpa login).
 * Dipakai oleh dev server Vite untuk mendeteksi Apache, dan bisa dibuka
 * langsung di browser untuk memastikan PHP + MySQL + tabel sudah siap.
 *
 * Respons: { ok, php, apache: true, db: { connected, database, missing_tables[] } }
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

header('Access-Control-Allow-Origin: *');

$missingTables = [];
$dbConnected   = false;

try {
    db(); // Memicu koneksi; PDO melempar exception bila MySQL mati.
    $dbConnected = true;

    $expected = ['users', 'documents', 'subscriptions', 'topup_packages', 'point_transactions', 'document_details'];
    foreach ($expected as $table) {
        try {
            $stmt = db()->prepare('SELECT 1 FROM `' . $table . '` LIMIT 1');
            $stmt->execute();
        } catch (PDOException $e) {
            $missingTables[] = $table;
        }
    }
} catch (PDOException $e) {
    $dbConnected = false; // MySQL mati / database belum dibuat.
}

json_response(true, [
    'php'     => PHP_VERSION,
    'apache'  => true,
    'db'      => [
        'connected'      => $dbConnected,
        'database'       => DB_NAME,
        'missing_tables' => $missingTables,
    ],
]);
