<?php
/**
 * Endpoint Manajemen User (Menu 3, ADMIN_IMPLEMENTATION.md).
 *   GET  ?q=&status=&has_topup=&page=&per_page=   — daftar + summary kartu
 *   GET  ?id=                                     — detail user + dokumen + transaksi
 *   GET  ?export=csv&…                            — ekspor CSV (kolom mengikuti tabel UI)
 *   POST { action:'set_status', user_id, status, reason }
 *   DELETE ?id=                                   — hapus akun (cascade FK), type-to-confirm di UI
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET' && $method !== 'POST' && $method !== 'DELETE') {
    json_fail('Metode harus GET, POST, atau DELETE.', 405);
}

$admin = require_admin();
$pdo   = db();

$docCountSql = '(SELECT COUNT(*) FROM documents d WHERE d.user_id = u.id)';
const TOPUP_SQL = "(SELECT COUNT(*) FROM point_transactions pt WHERE pt.user_id = u.id AND pt.type = 'purchase')";

/** Bangun WHERE + params dari filter query string. */
function build_user_filters(PDO $pdo): array
{
    $where  = ['u.is_admin = 0'];
    $params = [];

    $q = trim((string) ($_GET['q'] ?? ''));
    if ($q !== '') {
        $where[]        = '(u.first_name LIKE :q OR u.last_name LIKE :q OR u.email LIKE :q)';
        $params[':q']   = '%' . $q . '%';
    }

    $status = trim((string) ($_GET['status'] ?? ''));
    if ($status === 'active') {
        $where[] = "u.status = 'active'";
    } elseif ($status === 'inactive') {
        $where[] = "u.status <> 'active'";
    } elseif (in_array($status, ['suspended', 'banned'], true)) {
        $where[]  = 'u.status = :status';
        $params[':status'] = $status;
    }

    if ((($_GET['has_topup'] ?? '') || '') === '1') {
        $where[] = TOPUP_SQL . ' > 0';
    }

    return [$where, $params];
}

$WHERE_SQL = static fn (array $where): string => implode(' AND ', $where);

// ══ Ringkasan 4 kartu (angka riil DB) ════════════════════════════════
$summary = [
    'total'      => (int) $pdo->query('SELECT COUNT(*) FROM users WHERE is_admin = 0')->fetchColumn(),
    'active'     => (int) $pdo->query("SELECT COUNT(*) FROM users WHERE is_admin = 0 AND status = 'active'")->fetchColumn(),
    'suspended'  => (int) $pdo->query("SELECT COUNT(*) FROM users WHERE is_admin = 0 AND status <> 'active'")->fetchColumn(),
    'docs_total' => (int) $pdo->query('SELECT COUNT(*) FROM documents')->fetchColumn(),
];
$summary['active_pct'] = $summary['total'] > 0
    ? round($summary['active'] / $summary['total'] * 100, 1)
    : 0.0;

// ══ Ekspor CSV ═══════════════════════════════════════════════════════
if ($method === 'GET' && (($_GET['export'] ?? '') === 'csv')) {
    [$where, $params] = build_user_filters($pdo);
    $stmt = $pdo->prepare(
        "SELECT u.id, CONCAT(u.first_name, ' ', u.last_name) AS nama, u.email, u.auth_provider,
                u.plan, u.points, u.status, {$docCountSql} AS docs_count, u.created_at
         FROM users u WHERE " . $WHERE_SQL($where) . '
         ORDER BY u.created_at DESC'
    );
    $stmt->execute($params);

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="jagocv-users.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['ID', 'Nama', 'Email', 'Provider', 'Plan', 'Poin', 'Status Akun', 'Total Dokumen', 'Terdaftar']);
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $row['nama'] = trim($row['nama']);
        fputcsv($out, $row);
    }
    fclose($out);
    log_audit((int) $admin['id'], 'EXPORT', 'users', 'csv', null, ['filters' => array_intersect_key($_GET, array_flip(['q', 'status', 'has_topup']))], null);
    exit;
}

// ══ GET list ═════════════════════════════════════════════════════════
if ($method === 'GET' && !isset($_GET['id'])) {
    [$where, $params] = build_user_filters($pdo);

    $page    = max(1, (int) ($_GET['page'] ?? 1));
    $perPage = min(100, max(1, (int) ($_GET['per_page'] ?? 10)));
    $offset  = ($page - 1) * $perPage;

    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM users u WHERE ' . $WHERE_SQL($where));
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    $stmt = $pdo->prepare(
        "SELECT u.id, u.first_name, u.last_name, u.email, u.avatar_url, u.auth_provider,
                u.plan, u.points, u.status, u.created_at,
                {$docCountSql} AS docs_count,
                (" . TOPUP_SQL . " > 0) AS has_topup
         FROM users u
         WHERE " . $WHERE_SQL($where) . "
         ORDER BY u.created_at DESC
         LIMIT $perPage OFFSET $offset"
    );

    $stmt->execute($params);
    $users = array_map(static function (array $u): array {
        $u['id']         = (int) $u['id'];
        $u['points']     = (int) $u['points'];
        $u['docs_count'] = (int) $u['docs_count'];
        $u['has_topup']  = (bool) $u['has_topup'];
        return $u;
    }, $stmt->fetchAll());

    json_response(true, [
        'summary' => $summary,
        'users'   => $users,
        'page'    => $page,
        'per_page' => $perPage,
        'total'   => $total,
        'total_pages' => max(1, (int) ceil($total / $perPage)),
    ]);
}

// ══ GET detail (?id=) ════════════════════════════════════════════════
if ($method === 'GET' && isset($_GET['id'])) {
    $id = (int) $_GET['id'];
    if ($id <= 0) {
        json_fail('id user wajib diisi.', 422);
    }
    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $user = $stmt->fetch();
    if (!$user) {
        json_fail('User tidak ditemukan.', 404);
    }
    $isSelfAdmin = (int) $user['is_admin'] === 1;

    $docsStmt = $pdo->prepare(
        'SELECT id, doc_code, title, type, status, created_at FROM documents WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    );
    $docsStmt->execute([$id]);
    $documents = $docsStmt->fetchAll();

    $trxStmt = $pdo->prepare(
        'SELECT id, type, points, description, amount, status, created_at FROM point_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
    );
    $trxStmt->execute([$id]);
    $transactions = $trxStmt->fetchAll();

    $userPayload = [
        'id'         => (int) $user['id'],
        'first_name' => $user['first_name'],
        'last_name'  => $user['last_name'],
        'email'      => $user['email'],
        'avatar_url' => $user['avatar_url'],
        'auth_provider' => $user['auth_provider'],
        'plan'       => $user['plan'],
        'role'       => $user['role'], // profesi — bukan role akses (F4)
        'points'     => (int) $user['points'],
        'status'     => $user['status'],
        'is_admin'   => $isSelfAdmin,
        'created_at' => $user['created_at'],
    ];

    json_response(true, [
        'user'         => $userPayload,
        'documents'    => $documents,
        'transactions' => $transactions,
    ]);
}

// ══ POST aksi: ubah status akun ══════════════════════════════════════
if ($method === 'POST') {
    $body     = json_body();
    $action   = field_str($body, 'action');
    $userId   = (int) ($body['user_id'] ?? 0);
    $idAdmin  = (int) $admin['id'];
    $reason   = field_str($body, 'reason');

    if ($action !== 'set_status') {
        json_fail('Aksi tidak dikenal.', 422);
    }
    if ($userId <= 0) {
        json_fail('user_id wajib diisi.', 422);
    }
    if ($userId === $idAdmin) {
        json_fail('Tidak dapat mengubah status akun admin sendiri.', 409);
    }
    if ($reason === '') {
        json_fail('Alasan perubahan status wajib diisi.', 422);
    }

    $newStatus = field_str($body, 'status');
    if (!in_array($newStatus, ['active', 'suspended', 'banned'], true)) {
        json_fail('Status harus active, suspended, atau banned.', 422);
    }

    $stmt = $pdo->prepare('SELECT id, first_name, last_name, email, status, is_admin FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $before = $stmt->fetch();
    if (!$before) {
        json_fail('User tidak ditemukan.', 404);
    }
    if ((int) $before['is_admin'] === 1) {
        json_fail('Tidak dapat mengubah status sesama admin.', 409);
    }

    $stmt = $pdo->prepare('UPDATE users SET status = ? WHERE id = ?');
    $stmt->execute([$newStatus, $userId]);

    $after = $before;
    $after['status'] = $newStatus;
    log_audit($idAdmin, 'SET_STATUS', 'users', $userId, $before, $after, $reason);

    json_response(true, ['message' => 'Status akun diubah menjadi ' . $newStatus . '.']);
}

// ══ DELETE akun ══════════════════════════════════════════════════════
$id = (int) ($_GET['id'] ?? 0);
if ($id <= 0) {
    json_fail('id user wajib diisi.', 422);
}
if ($id === (int) $admin['id']) {
    json_fail('Tidak dapat menghapus akun admin sendiri.', 409);
}

$stmt = $pdo->prepare('SELECT id, first_name, last_name, email, status FROM users WHERE id = ?');
$stmt->execute([$id]);
$before = $stmt->fetch();
if (!$before) {
    json_fail('User tidak ditemukan.', 404);
}

$stmt = $pdo->prepare('SELECT is_admin FROM users WHERE id = ?');
$stmt->execute([$id]);
if ((int) $stmt->fetchColumn() === 1) {
    json_fail('Tidak dapat menghapus akun admin.', 409);
}

// FK ON DELETE CASCADE (F6) membersihkan documents, point_transactions, cv_drafts.
$pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
log_audit((int) $admin['id'], 'DELETE', 'users', $id, $before, null, 'Hapus akun + seluruh dokumen/transaksi terkait');

json_response(true, ['message' => 'Akun dihapus beserta seluruh dokumen dan transaksi terkait.']);
