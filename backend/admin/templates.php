<?php
/**
 * Endpoint CRUD template (Menu 2, ADMIN_IMPLEMENTATION.md).
 *   GET    /backend/admin/templates.php?q=&category=&status=&page=&per_page=
 *   POST   { name, category, description, thumbnail_url, engine_version, layout_key, config_json, status }
 *   PUT    { id, ...field sama dengan POST }  (termasuk toggle status)
 *   DELETE ?id=
 * Validasi (md Bagian Menu 2): name wajib ≤100, kategori enum valid,
 * thumbnail https URL bila diisi, config_json object JSON, hapus gagal 409 bila dipakai.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET' && $method !== 'POST' && $method !== 'PUT' && $method !== 'DELETE') {
    json_fail('Metode harus GET, POST, PUT, atau DELETE.', 405);
}

$admin = require_admin();
$pdo   = db();

// ── Validasi bersama untuk POST/PUT ──────────────────────────────────
function validate_template_payload(array $body, bool $withId = false): array
{
    $data = [];
    if ($withId) {
        $id = (int) ($body['id'] ?? 0);
        if ($id <= 0) {
            json_fail('Template id wajib diisi.', 422);
        }
        $data['id'] = $id;
    }

    $name = field_str($body, 'name');
    if ($name === '' || mb_strlen($name) > 100) {
        json_fail('Nama template wajib diisi (maksimal 100 karakter).', 422);
    }
    $data['name'] = $name;

    $category = field_str($body, 'category');
    if (!in_array($category, ['CV ATS', 'Resume', 'Portfolio'], true)) {
        json_fail('Kategori harus salah satu: CV ATS, Resume, Portfolio.', 422);
    }
    $data['category'] = $category;

    $status = field_str($body, 'status') ?: 'draft';
    if (!in_array($status, ['draft', 'published', 'archived'], true)) {
        json_fail('Status harus draft, published, atau archived.', 422);
    }
    $data['status'] = $status;

    $data['description']   = mb_substr(field_str($body, 'description'), 0, 255);
    $data['engine_version'] = mb_substr(field_str($body, 'engine_version') ?: 'v2.4', 0, 10);

    // layout_key: mapping ke renderer user yang sudah ada (F8) atau kustom (NULL).
    $layout = field_str($body, 'layout_key');
    if ($layout !== '' && !in_array($layout, ['standar', 'tech', 'entry'], true)) {
        json_fail('Layout hanya boleh standar, tech, entry, atau kosong (kustom).', 422);
    }
    $data['layout_key'] = $layout !== '' ? $layout : null;

    // thumbnail: wajib https:// bila diisi (md Bagian Menu 2).
    $thumb = field_str($body, 'thumbnail_url');
    if ($thumb !== '' && !filter_var($thumb, FILTER_VALIDATE_URL)) {
        json_fail('URL thumbnail tidak valid (gunakan URL lengkap https://…).', 422);
    }
    $data['thumbnail_url'] = $thumb !== '' ? $thumb : null;

    // token_package_id: token yang dipasang ke template (nullable).
    // Saat user generate dengan template ini, biaya generate mengikuti token tsb.
    $tokenRaw = $body['token_package_id'] ?? null;
    if ($tokenRaw === null || $tokenRaw === '' || $tokenRaw === 'null' || (int) $tokenRaw === 0) {
        $data['token_package_id'] = null;
    } else {
        $tokenId = (int) $tokenRaw;
        $check   = db()->prepare('SELECT 1 FROM token_packages WHERE id = ?');
        $check->execute([$tokenId]);
        if (!$check->fetch()) {
            json_fail('Token yang dipilih tidak ditemukan.', 422);
        }
        $data['token_package_id'] = $tokenId;
    }

    // config_json HARUS object JSON valid (disimpan sebagai JSON, bukan string).
    $cfgRaw = trim((string) ($body['config_json'] ?? ''));
    $cfg    = json_decode($cfgRaw === '' ? '{}' : $cfgRaw, true);
    if ($cfgRaw !== '' && $cfgRaw !== '{}' && !is_array($cfg)) {
        json_fail('config_json harus JSON object yang valid.', 422);
    }
    $data['config_json'] = is_array($cfg) ? $cfg : [];

    return $data;
}

// ══ GET: daftar + summary ════════════════════════════════════════════
if ($method === 'GET') {
    $q        = field_str($_GET, 'q');
    $category = field_str($_GET, 'category');
    $status   = field_str($_GET, 'status'); // publish-like: published|draft|archived|nonaktif

    $where  = ['1=1'];
    $params = [];
    if ($q !== '') {
        $where[]  = '(t.name LIKE :q OR t.description LIKE :q)';
        $params[':q'] = '%' . $q . '%';
    }
    if (in_array($category, ['CV ATS', 'Resume', 'Portfolio'], true)) {
        $where[]  = 't.category = :cat';
        $params[':cat'] = $category;
    }
    if ($status === 'nonaktif') {
        $where[]  = "t.status <> 'published'";
    } elseif (in_array($status, ['draft', 'published', 'archived'], true)) {
        $where[]  = 't.status = :st';
        $params[':st'] = $status;
    }

    // usage_count dihitung dari dokumen yang layout payload-nya cocok (F8).
    $sql = "SELECT t.id, t.name, t.category, t.description, t.thumbnail_url, t.config_json,
                   t.layout_key, t.engine_version, t.status, t.created_at, t.updated_at,
                   t.token_package_id, tk.name AS token_name, tk.token_amount AS token_amount,
                   tk.cost_per_generate AS token_cost_per_generate, tk.is_active AS token_is_active,
                   (SELECT COUNT(*) FROM document_details dd
                     WHERE JSON_UNQUOTE(JSON_EXTRACT(dd.payload, '$.\"layout\"')) = t.layout_key
                       AND t.layout_key IS NOT NULL) AS usage_count
            FROM templates t
            LEFT JOIN token_packages tk ON tk.id = t.token_package_id
            WHERE " . implode(' AND ', $where) . '
            ORDER BY t.updated_at DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $templates = array_map(static function (array $t): array {
        $t['id']          = (int) $t['id'];
        $t['usage_count'] = (int) $t['usage_count'];
        $t['config']      = json_decode((string) $t['config_json'], true) ?: [];
        unset($t['config_json']);

        // Ringkasan token yang terpasang (null bila belum dipilih).
        $t['token_package_id'] = $t['token_package_id'] !== null ? (int) $t['token_package_id'] : null;
        $t['token'] = $t['token_package_id'] === null ? null : [
            'id'                => (int) $t['token_package_id'],
            'name'              => (string) ($t['token_name'] ?? ''),
            'token_amount'      => (int) ($t['token_amount'] ?? 0),
            'cost_per_generate' => (int) ($t['token_cost_per_generate'] ?? 0),
            'is_active'         => (int) ($t['token_is_active'] ?? 0) === 1,
        ];
        unset($t['token_name'], $t['token_amount'], $t['token_cost_per_generate'], $t['token_is_active']);
        return $t;
    }, $stmt->fetchAll());

    // Summary kartu per kategori (angka riil DB, bukan mockup PNG).
    $summary = ['total' => 0, 'CV ATS' => 0, 'Resume' => 0, 'Portfolio' => 0, 'nonaktif' => 0];
    foreach ($templates as $t) {
        $summary['total']++;
        $summary[$t['category']]++;
        if ($t['status'] !== 'published') {
            $summary['nonaktif']++;
        }
    }

    json_response(true, ['summary' => $summary, 'templates' => $templates]);
}

// ══ POST:/template create ════════════════════════════════════════════
if ($method === 'POST') {
    $d = validate_template_payload(json_body());

    // Nama unik per kategori (unique key uq_templates_name_cat).
    $check = $pdo->prepare('SELECT 1 FROM templates WHERE name = ? AND category = ?');
    $check->execute([$d['name'], $d['category']]);
    if ($check->fetch()) {
        json_fail('Template dengan nama yang sama sudah ada di kategori ini.', 409);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO templates (name, category, description, thumbnail_url, config_json, layout_key, token_package_id, engine_version, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $d['name'], $d['category'], $d['description'], $d['thumbnail_url'],
        json_encode($d['config_json'], JSON_UNESCAPED_UNICODE), $d['layout_key'],
        $d['token_package_id'], $d['engine_version'], $d['status'], (int) $admin['id'],
    ]);
    $id = (int) $pdo->lastInsertId();

    log_audit((int) $admin['id'], 'CREATE', 'templates', $id, null, $d, null);
    json_response(true, ['message' => 'Template dibuat.', 'id' => $id]);
}

// ══ PUT: update ══════════════════════════════════════════════════════
if ($method === 'PUT') {
    $d = validate_template_payload(json_body(), true);
    $id = $d['id'];

    $stmt = $pdo->prepare('SELECT * FROM templates WHERE id = ?');
    $stmt->execute([$id]);
    $before = $stmt->fetch();
    if (!$before) {
        json_fail('Template tidak ditemukan.', 404);
    }

    // Nama unik per kategori (kecuali baris ini sendiri).
    $check = $pdo->prepare('SELECT 1 FROM templates WHERE name = ? AND category = ? AND id <> ?');
    $check->execute([$d['name'], $d['category'], $id]);
    if ($check->fetch()) {
        json_fail('Template dengan nama yang sama sudah ada di kategori ini.', 409);
    }

    $stmt = $pdo->prepare(
        'UPDATE templates SET name = ?, category = ?, description = ?, thumbnail_url = ?,
                                config_json = ?, layout_key = ?, token_package_id = ?, engine_version = ?, status = ?
         WHERE id = ?'
    );
    $stmt->execute([
        $d['name'], $d['category'], $d['description'], $d['thumbnail_url'],
        json_encode($d['config_json'], JSON_UNESCAPED_UNICODE), $d['layout_key'],
        $d['token_package_id'], $d['engine_version'], $d['status'], $id,
    ]);

    $after = $d;
    unset($after['id']);
    log_audit((int) $admin['id'], 'UPDATE', 'templates', $id, $before, $after, null);
    json_response(true, ['message' => 'Template diperbarui.']);
}

// ══ DELETE: hapus (dilarang bila template masih dipakai dokumen) ═════
$id = (int) ($_GET['id'] ?? 0);
if ($id <= 0) {
    json_fail('Template id wajib diisi.', 422);
}

$stmt = $pdo->prepare('SELECT * FROM templates WHERE id = ?');
$stmt->execute([$id]);
$template = $stmt->fetch();
if (!$template) {
    json_fail('Template tidak ditemukan.', 404);
}

// Cek pemakaian: layout payload cocok dengan layout_key template.
if ($template['layout_key'] !== null) {
    $check = $pdo->prepare(
        "SELECT COUNT(*) FROM document_details
         WHERE JSON_UNQUOTE(JSON_EXTRACT(payload, '$.\"layout\"')) = ?"
    );
    $check->execute([$template['layout_key']]);
    if ((int) $check->fetchColumn() > 0) {
        json_fail(
            'Template ini masih dipakai dokumen lama sehingga tidak bisa dihapus. Nonaktifkan saja (ubah jadi draft).',
            409
        );
    }
}

$pdo->prepare('DELETE FROM templates WHERE id = ?')->execute([$id]);
log_audit((int) $admin['id'], 'DELETE', 'templates', $id, $template, null, 'Hapus template');

json_response(true, ['message' => 'Template dihapus.']);
