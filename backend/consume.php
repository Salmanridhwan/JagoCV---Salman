<?php
/**
 * POST /backend/consume.php
 * Memakai 1 token untuk satu kali generate dokumen (CV / Resume / Portfolio).
 * Operasi atomik: token hanya berkurang bila masih > 0.
 *
 * Body JSON (opsional):
 *   { "layout": "standar", "template_id": 1 }
 *
 * Bila template/layout dikirim, server memeriksa token yang dipasang admin
 * pada template tersebut (templates.token_package_id):
 *   - token belum dipasang  → generate diizinkan (tanpa batas token).
 *   - token nonaktif        → generate DITOLAK 403.
 *   - token aktif           → generate diizinkan, biaya per generate dicatat
 *                             mengikuti token_packages.cost_per_generate.
 *
 * Respons: { ok, points, message, token? }
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_fail('Metode harus POST.', 405);
}

$user   = require_user();
$userId = (int) $user['id'];

$body       = json_body_optional();
$layout     = field_str($body, 'layout');
$templateId = (int) ($body['template_id'] ?? 0);

$pdo = db();

// ── Resolusi token dari template (bila konteksnya diketahui) ─────────
$token = null;
$templateName = null;

try {
    $sql = 'SELECT t.id, t.name, t.token_package_id,
                   tk.id AS tk_id, tk.name AS tk_name, tk.token_amount, tk.cost_per_generate, tk.is_active
              FROM templates t
              LEFT JOIN token_packages tk ON tk.id = t.token_package_id
             WHERE ';
    $params = [];
    if ($templateId > 0) {
        $sql .= 't.id = :tid';
        $params[':tid'] = $templateId;
    } elseif ($layout !== '') {
        $sql .= 't.layout_key = :lay';
        $params[':lay'] = $layout;
    } else {
        $sql .= '0 = 1';
    }
    $sql .= ' LIMIT 1';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $row = $stmt->fetch();

    if ($row) {
        $templateName = (string) $row['name'];
        if ($row['tk_id'] !== null) {
            $token = [
                'id'                => (int) $row['tk_id'],
                'name'              => (string) $row['tk_name'],
                'token_amount'      => (int) $row['token_amount'],
                'cost_per_generate' => (int) $row['cost_per_generate'],
                'is_active'         => (int) $row['is_active'] === 1,
            ];
        }
    }
} catch (PDOException $e) {
    // Tabel token belum dimigrasi — lanjut tanpa batas token.
    $token = null;
}

// Token nonaktif = template diblokir untuk generate baru.
if ($token !== null && !$token['is_active']) {
    json_fail(
        "Template \"{$templateName}\" memakai token \"{$token['name']}\" yang sedang nonaktif. "
        . 'Pilih template lain atau hubungi admin.',
        403
    );
}

// ── Kurangi 1 token secara atomik (cegah minus / double-spend) ───────
$stmt = $pdo->prepare('UPDATE users SET points = points - 1 WHERE id = ? AND points > 0');
$stmt->execute([$userId]);

if ($stmt->rowCount() !== 1) {
    json_fail('Token Anda habis. Silakan lakukan top up untuk melanjutkan.', 402);
}

// Catat riwayat pemakaian beserta token & biaya yang berlaku.
$desc = 'Generate 1 dokumen';
if ($token !== null) {
    $desc .= " — token {$token['name']} (Rp " . number_format($token['cost_per_generate'], 0, ',', '.') . '/generate)';
} elseif ($templateName !== null) {
    $desc .= " — template {$templateName}";
}

try {
    $pdo->prepare(
        "INSERT INTO point_transactions (user_id, type, points, description) VALUES (?, 'usage', -1, ?)"
    )->execute([$userId, mb_substr($desc, 0, 255)]);
} catch (PDOException $e) {
    // Tabel point_transactions belum ada (migrasi belum dijalankan) — abaikan.
}

$stmt = $pdo->prepare('SELECT points FROM users WHERE id = ?');
$stmt->execute([$userId]);
$points = (int) ($stmt->fetch()['points'] ?? 0);

$response = [
    'points'  => $points,
    'message' => '1 token digunakan untuk generate.',
];
if ($token !== null) {
    $response['token'] = $token;
}

json_response(true, $response);
