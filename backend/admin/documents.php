<?php
/**
 * Endpoint Monitoring Dokumen (Menu 4 sebagai tab dari User & Dokumen).
 *   GET /backend/admin/documents.php?q=&type=&status=&user_id=&page=&per_page=
 *   GET ?id=  → detail + payload form CV (read-only) + draft user bila ada.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    json_fail('Metode harus GET.', 405);
}

$admin = require_admin();
$pdo   = db();

// ── Detail dokumen (?id=) ────────────────────────────────────────────
if (isset($_GET['id'])) {
    $id = (int) $_GET['id'];
    if ($id <= 0) {
        json_fail('id dokumen wajib diisi.', 422);
    }
    $stmt = $pdo->prepare(
        'SELECT d.*, u.first_name, u.last_name, u.email, u.status AS user_status
         FROM documents d JOIN users u ON u.id = d.user_id
         WHERE d.id = ?'
    );
    $stmt->execute([$id]);
    $doc = $stmt->fetch();
    if (!$doc) {
        json_fail('Dokumen tidak ditemukan.', 404);
    }

    // Payload form CV (read-only) + draft user bila ada (md Menu 4).
    $payload = null;
    try {
        $stmt = $pdo->prepare('SELECT payload FROM document_details WHERE document_id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        $payload = $row ? (json_decode((string) $row['payload'], true) ?: null) : null;
    } catch (PDOException $e) {
        error_log('documents.php payload: ' . $e->getMessage());
    }

    $draft = null;
    try {
        $stmt = $pdo->prepare('SELECT payload, updated_at FROM cv_drafts WHERE user_id = ?');
        $stmt->execute([(int) $doc['user_id']]);
        $row = $stmt->fetch();
        if ($row) {
            $draft = ['payload' => json_decode((string) $row['payload'], true) ?: null, 'updated_at' => $row['updated_at']];
        }
    } catch (PDOException $e) {
        error_log('documents.php draft: ' . $e->getMessage());
    }

    json_response(true, [
        'document' => [
            'id'         => (int) $doc['id'],
            'doc_code'   => $doc['doc_code'],
            'title'      => $doc['title'],
            'type'       => $doc['type'],
            'status'     => $doc['status'],
            'owner'      => trim($doc['first_name'] . ' ' . $doc['last_name']),
            'owner_email' => $doc['email'],
            'owner_status' => $doc['user_status'],
            'created_at' => $doc['created_at'],
        ],
        'payload' => $payload,
        'layout'  => $payload['layout'] ?? null,
        'draft'   => $draft,
    ]);
}

// ── Daftar dokumen (pagination server-side, konvensi Bagian 2) ───────
$where  = ['1=1'];
$params = [];

$q = trim((string) ($_GET['q'] ?? ''));
if ($q !== '') {
    $where[]      = '(d.doc_code LIKE :q OR d.title LIKE :q OR u.first_name LIKE :q OR u.last_name LIKE :q OR u.email LIKE :q)';
    $params[':q'] = '%' . $q . '%';
}
$type = trim((string) ($_GET['type'] ?? ''));
if (in_array($type, ['ATS CV', 'Visual Resume', 'Web Portfolio', 'Cover Letter'], true)) {
    $where[]      = 'd.type = :type';
    $params[':type'] = $type;
}
$status = trim((string) ($_GET['status'] ?? ''));
if (in_array($status, ['Draf', 'Selesai', 'Diterbitkan'], true)) {
    $where[]      = 'd.status = :status';
    $params[':status'] = $status;
}
$userId = (int) ($_GET['user_id'] ?? 0);
if ($userId > 0) {
    $where[]      = 'd.user_id = :uid';
    $params[':uid'] = $userId;
}

$page    = max(1, (int) ($_GET['page'] ?? 1));
$perPage = min(100, max(1, (int) ($_GET['per_page'] ?? 10)));
$offset  = ($page - 1) * $perPage;

$countStmt = $pdo->prepare(
    'SELECT COUNT(*) FROM documents d JOIN users u ON u.id = d.user_id WHERE ' . implode(' AND ', $where)
);
$countStmt->execute($params);
$total      = (int) $countStmt->fetchColumn();
$totalPages = max(1, (int) ceil($total / $perPage));

// Layout dibaca dari payload (FAKTA F8) — hanya untuk CV ATS yang punya detail.
$stmt = $pdo->prepare(
    "SELECT d.id, d.doc_code, d.title, d.type, d.status, d.created_at,
            d.user_id, u.first_name, u.last_name, u.email, u.status AS user_status,
            (SELECT JSON_UNQUOTE(JSON_EXTRACT(dd.payload, '$.\"layout\"')) FROM document_details dd WHERE dd.document_id = d.id) AS layout
     FROM documents d
     JOIN users u ON u.id = d.user_id
     WHERE " . implode(' AND ', $where) . '
     ORDER BY d.created_at DESC
     LIMIT ' . $perPage . ' OFFSET ' . $offset
);
$stmt->execute($params);
$documents = array_map(static function (array $d): array {
    $d['id']         = (int) $d['id'];
    $d['user_id']    = (int) $d['user_id'];
    $d['owner']      = trim($d['first_name'] . ' ' . $d['last_name']);
    $d['user_status'] = $d['user_status'];
    return $d;
}, $stmt->fetchAll());

json_response(true, [
    'documents'   => $documents,
    'page'        => $page,
    'per_page'    => $perPage,
    'total'       => $total,
    'total_pages' => $totalPages,
]);
