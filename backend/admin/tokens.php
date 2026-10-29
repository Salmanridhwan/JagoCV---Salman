<?php
/**
 * Endpoint CRUD Manajemen Token (TRANSAKSI & KOMERSIAL → Manajemen Token).
 *
 *   GET    /backend/admin/tokens.php?q=&status=
 *   POST   { name, token_amount, cost_per_generate, is_active }
 *   PUT    { id, ...field sama dengan POST }   (termasuk toggle status)
 *   DELETE ?id=
 *
 * Model data (tabel `token_packages`):
 *   - token_amount      : jumlah token pada paket/tier ini.
 *   - cost_per_generate : nominal Rupiah untuk SATU kali generate dokumen
 *                         memakai token ini (mis. 2000 → Rp 2.000 / generate).
 *
 * Token dipasang ke template lewat `templates.token_package_id` (Manajemen
 * Template). Saat user generate dengan template tersebut, biaya generate
 * mengikuti token yang terpasang di template itu.
 *
 * Hapus token ditolak (409) bila masih terpasang pada template — matikan
 * saja (toggle nonaktif) agar template lama tidak kehilangan konfigurasi.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($method, ['GET', 'POST', 'PUT', 'DELETE'], true)) {
    json_fail('Metode harus GET, POST, PUT, atau DELETE.', 405);
}

$admin = require_admin();
$pdo   = db();

// ── Validasi bersama untuk POST/PUT ──────────────────────────────────
function validate_token_payload(array $body, bool $withId = false): array
{
    $data = [];
    if ($withId) {
        $id = (int) ($body['id'] ?? 0);
        if ($id <= 0) {
            json_fail('Token id wajib diisi.', 422);
        }
        $data['id'] = $id;
    }

    $name = field_str($body, 'name');
    if ($name === '' || mb_strlen($name) > 60) {
        json_fail('Nama token wajib diisi (maksimal 60 karakter).', 422);
    }
    $data['name'] = $name;

    // Jumlah token: angka bulat ≥ 0 (0 = paket tanpa alokasi token).
    $amountRaw = $body['token_amount'] ?? null;
    if ($amountRaw === null || $amountRaw === '' || !is_numeric($amountRaw)) {
        json_fail('Jumlah token wajib berupa angka.', 422);
    }
    $amount = (int) $amountRaw;
    if ($amount < 0 || $amount > 100_000_000) {
        json_fail('Jumlah token harus antara 0 dan 100.000.000.', 422);
    }
    $data['token_amount'] = $amount;

    // Harga sekali generate: nominal Rupiah ≥ 0.
    $costRaw = $body['cost_per_generate'] ?? null;
    if ($costRaw === null || $costRaw === '' || !is_numeric($costRaw)) {
        json_fail('Harga sekali generate wajib berupa angka (Rupiah).', 422);
    }
    $cost = (int) $costRaw;
    if ($cost < 0 || $cost > 100_000_000) {
        json_fail('Harga sekali generate harus antara 0 dan 100.000.000.', 422);
    }
    $data['cost_per_generate'] = $cost;

    // is_active: terima bool / "1" / "0" / "true" / "false".
    $activeRaw = $body['is_active'] ?? 1;
    $data['is_active'] = filter_var($activeRaw, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true ? 1 : 0;

    return $data;
}

// ══ GET: daftar token + ringkasan ════════════════════════════════════
if ($method === 'GET') {
    $q      = field_str($_GET, 'q');
    $status = field_str($_GET, 'status'); // aktif | nonaktif

    $where  = ['1=1'];
    $params = [];
    if ($q !== '') {
        $where[]      = 'name LIKE :q';
        $params[':q'] = '%' . $q . '%';
    }
    if ($status === 'aktif') {
        $where[] = 'is_active = 1';
    } elseif ($status === 'nonaktif') {
        $where[] = 'is_active = 0';
    }

    // used_by_templates = berapa template yang memakai token ini.
    $sql = "SELECT tp.id, tp.name, tp.token_amount, tp.cost_per_generate, tp.is_active,
                   tp.sort_order, tp.created_at, tp.updated_at,
                   (SELECT COUNT(*) FROM templates t WHERE t.token_package_id = tp.id) AS used_by_templates
            FROM token_packages tp
            WHERE " . implode(' AND ', $where) . '
            ORDER BY tp.sort_order ASC, tp.token_amount ASC, tp.id ASC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $tokens = array_map(static function (array $t): array {
        return [
            'id'                => (int) $t['id'],
            'name'              => (string) $t['name'],
            'token_amount'      => (int) $t['token_amount'],
            'cost_per_generate' => (int) $t['cost_per_generate'],
            'is_active'         => (int) $t['is_active'] === 1,
            'sort_order'        => (int) $t['sort_order'],
            'used_by_templates' => (int) $t['used_by_templates'],
            'created_at'        => (string) $t['created_at'],
            'updated_at'        => (string) $t['updated_at'],
        ];
    }, $stmt->fetchAll());

    $summary = ['total' => 0, 'aktif' => 0, 'nonaktif' => 0];
    foreach ($tokens as $t) {
        $summary['total']++;
        $summary[$t['is_active'] ? 'aktif' : 'nonaktif']++;
    }

    json_response(true, ['summary' => $summary, 'tokens' => $tokens]);
}

// ══ POST: tambah token ═══════════════════════════════════════════════
if ($method === 'POST') {
    $d = validate_token_payload(json_body());

    // Nama unik (uq_token_packages_name).
    $check = $pdo->prepare('SELECT 1 FROM token_packages WHERE name = ?');
    $check->execute([$d['name']]);
    if ($check->fetch()) {
        json_fail('Token dengan nama yang sama sudah ada.', 409);
    }

    // sort_order otomatis di urutan terakhir.
    $next = (int) $pdo->query('SELECT COALESCE(MAX(sort_order), 0) + 1 FROM token_packages')->fetchColumn();

    $stmt = $pdo->prepare(
        'INSERT INTO token_packages (name, token_amount, cost_per_generate, is_active, sort_order, created_by)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $d['name'], $d['token_amount'], $d['cost_per_generate'], $d['is_active'], $next, (int) $admin['id'],
    ]);
    $id = (int) $pdo->lastInsertId();

    log_audit((int) $admin['id'], 'CREATE', 'token_packages', $id, null, $d, null);
    json_response(true, ['message' => 'Token dibuat.', 'id' => $id]);
}

// ══ PUT: ubah token (termasuk toggle status) ═════════════════════════
if ($method === 'PUT') {
    $d  = validate_token_payload(json_body(), true);
    $id = $d['id'];

    $stmt = $pdo->prepare('SELECT * FROM token_packages WHERE id = ?');
    $stmt->execute([$id]);
    $before = $stmt->fetch();
    if (!$before) {
        json_fail('Token tidak ditemukan.', 404);
    }

    $check = $pdo->prepare('SELECT 1 FROM token_packages WHERE name = ? AND id <> ?');
    $check->execute([$d['name'], $id]);
    if ($check->fetch()) {
        json_fail('Token dengan nama yang sama sudah ada.', 409);
    }

    $stmt = $pdo->prepare(
        'UPDATE token_packages
            SET name = ?, token_amount = ?, cost_per_generate = ?, is_active = ?
          WHERE id = ?'
    );
    $stmt->execute([$d['name'], $d['token_amount'], $d['cost_per_generate'], $d['is_active'], $id]);

    $after = $d;
    unset($after['id']);
    log_audit((int) $admin['id'], 'UPDATE', 'token_packages', $id, $before, $after, null);
    json_response(true, ['message' => 'Token diperbarui.']);
}

// ══ DELETE: hapus (ditolak bila masih dipakai template) ══════════════
$id = (int) ($_GET['id'] ?? 0);
if ($id <= 0) {
    json_fail('Token id wajib diisi.', 422);
}

$stmt = $pdo->prepare('SELECT * FROM token_packages WHERE id = ?');
$stmt->execute([$id]);
$token = $stmt->fetch();
if (!$token) {
    json_fail('Token tidak ditemukan.', 404);
}

$check = $pdo->prepare('SELECT COUNT(*) FROM templates WHERE token_package_id = ?');
$check->execute([$id]);
$used = (int) $check->fetchColumn();
if ($used > 0) {
    json_fail(
        "Token ini masih dipakai {$used} template. Lepas dulu dari template tersebut, atau nonaktifkan saja tokennya.",
        409
    );
}

$pdo->prepare('DELETE FROM token_packages WHERE id = ?')->execute([$id]);
log_audit((int) $admin['id'], 'DELETE', 'token_packages', $id, $token, null, 'Hapus token');

json_response(true, ['message' => 'Token dihapus.']);
