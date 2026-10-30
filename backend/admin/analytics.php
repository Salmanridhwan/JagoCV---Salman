<?php
/**
 * GET /backend/admin/analytics.php
 * Data Dashboard & Analytics (Menu 1, ADMIN_IMPLEMENTATION.md).
 * Query: ?period=7d|30d&page=N&per_page=K (default 5, max 100)
 *        &only=all|overview|activities
 *
 * `only` memungkinkan frontend mengambil potongan respons saja:
 *   overview   → kartu + chart + distribusi template + ringkasan transaksi
 *   activities → tabel aktivitas (paged) saja
 * Dipakai agar ganti periode / ganti halaman tidak memuat ulang seluruh data
 * (payload kecil → transisi di UI mulus, tanpa reload halaman).
 *
 * Respons: { ok, period, cards, chart, template_usage, transactions, activities, generated_at }
 * Bagian yang tidak diminta tidak disertakan (key hilang dari JSON).
 * Angka riil dari DB (users/documents/point_transactions) — bukan mockup PNG.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    json_fail('Metode harus GET.', 405);
}

$admin = require_admin();

$period  = ($_GET['period'] ?? '30d') === '7d' ? '7d' : '30d';
$days    = $period === '7d' ? 7 : 30;

// ── Pagination tabel aktivitas (konvensi Bagian 2) ───────────────────
$page     = max(1, (int) ($_GET['page'] ?? 1));
$perPage  = min(100, max(1, (int) ($_GET['per_page'] ?? 5)));
$offset   = ($page - 1) * $perPage;

// ── Potongan respons yang diminta (hemat payload untuk update parsial) ──
$only = (string) ($_GET['only'] ?? 'all');
if (!in_array($only, ['all', 'overview', 'activities'], true)) {
    $only = 'all';
}
$needOverview   = $only !== 'activities';
$needActivities = $only !== 'overview';

try {
$pdo = db();

$payload = ['period' => $period];

// ═════════════════════════════════════════════════════════════════════
// OVERVIEW — kartu, grafik, distribusi template, ringkasan transaksi
// ═════════════════════════════════════════════════════════════════════
if ($needOverview) {

// ── Kartu: pengguna ──────────────────────────────────────────────────
$usersTotal    = (int) $pdo->query('SELECT COUNT(*) FROM users WHERE is_admin = 0')->fetchColumn();
$usersActive   = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE is_admin = 0 AND status = 'active'")->fetchColumn();
$usersSuspended = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE is_admin = 0 AND status <> 'active'")->fetchColumn();

// Pertumbuhan periode ini vs periode sebelumnya (durasi sama).
$stmt = $pdo->prepare("SELECT
    SUM(created_at >= (NOW() - INTERVAL ? DAY)) AS cur,
    SUM(created_at >= (NOW() - INTERVAL ? DAY) AND created_at < (NOW() - INTERVAL ? DAY)) AS prev
    FROM users WHERE is_admin = 0");
$stmt->execute([$days, $days * 2, $days]);
$row    = $stmt->fetch();
$curNew  = (int) ($row['cur'] ?? 0);
$prevNew = (int) ($row['prev'] ?? 0);
$usersGrowth = $prevNew > 0 ? round(($curNew - $prevNew) / $prevNew * 100, 1) : ($curNew > 0 ? 100.0 : 0.0);

// ── Kartu: dokumen ───────────────────────────────────────────────────
$docsTotal = (int) $pdo->query('SELECT COUNT(*) FROM documents')->fetchColumn();
$stmt = $pdo->prepare("SELECT
    SUM(created_at >= (NOW() - INTERVAL ? DAY)) AS cur,
    SUM(created_at >= (NOW() - INTERVAL ? DAY) AND created_at < (NOW() - INTERVAL ? DAY)) AS prev
    FROM documents");
$stmt->execute([$days, $days * 2, $days]);
$row      = $stmt->fetch();
$docsCur  = (int) ($row['cur'] ?? 0);
$docsPrev = (int) ($row['prev'] ?? 0);
$docsGrowth = $docsPrev > 0 ? round(($docsCur - $docsPrev) / $docsPrev * 100, 1) : ($docsCur > 0 ? 100.0 : 0.0);

// ── Kartu: pendapatan token bulan ini (status success saja — pembayaran masih simulasi F7) ──
$revenueMonth = (int) $pdo->query(
    "SELECT COALESCE(SUM(amount), 0) FROM point_transactions
     WHERE type = 'purchase' AND status = 'success'
       AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')"
)->fetchColumn();

// ── Grafik pertumbuhan: 7d = harian (7 titik), 30d = mingguan (4 titik) ──
$chart = [];
if ($period === '7d') {
    $stmt = $pdo->prepare(
        "SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS bucket,
                DATE_FORMAT(created_at, '%d %b') AS label,
                COUNT(*) AS users
         FROM users WHERE is_admin = 0
           AND created_at >= (NOW() - INTERVAL ? DAY)
         GROUP BY bucket, label"
    );
    $stmt->execute([$days]);
    $rowUsers = [];
    foreach ($stmt->fetchAll() as $r) {
        $rowUsers[$r['bucket']] = ['label' => $r['label'], 'users' => (int) $r['users']];
    }
    $stmt = $pdo->prepare(
        "SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS bucket,
                DATE_FORMAT(created_at, '%d %b') AS label,
                COUNT(*) AS docs
         FROM documents
         WHERE created_at >= (NOW() - INTERVAL ? DAY)
         GROUP BY bucket, label"
    );
    $stmt->execute([$days]);
    $rowDocs = [];
    foreach ($stmt->fetchAll() as $r) {
        $rowDocs[$r['bucket']] = ['label' => $r['label'], 'docs' => (int) $r['docs']];
    }
    for ($i = $days - 1; $i >= 0; $i--) {
        $b = date('Y-m-d', strtotime("-{$i} day"));
        $chart[] = [
            'label' => $rowUsers[$b]['label'] ?? ($rowDocs[$b]['label'] ?? date('d M', strtotime($b))),
            'users' => (int) ($rowUsers[$b]['users'] ?? 0),
            'docs'  => (int) ($rowDocs[$b]['docs'] ?? 0),
        ];
    }
} else {
    $stmt = $pdo->prepare(
        "SELECT YEARWEEK(created_at, 3) AS wk, COUNT(*) AS users
         FROM users
         WHERE is_admin = 0 AND created_at >= (NOW() - INTERVAL ? DAY)
         GROUP BY wk"
    );
    $stmt->execute([$days]);
    $rowUsers = [];
    foreach ($stmt->fetchAll() as $r) {
        $rowUsers[(string) $r['wk']] = (int) $r['users'];
    }
    $stmt = $pdo->prepare(
        "SELECT YEARWEEK(created_at, 3) AS wk, COUNT(*) AS docs
         FROM documents
         WHERE created_at >= (NOW() - INTERVAL ? DAY)
         GROUP BY wk"
    );
    $stmt->execute([$days]);
    $rowDocs = [];
    foreach ($stmt->fetchAll() as $r) {
        $rowDocs[(string) $r['wk']] = (int) $r['docs'];
    }
    $weeks = [];
    for ($i = 3; $i >= 0; $i--) {
        $monday = strtotime("-{$i} week monday");
        $wk = (string) date('oW', $monday);
        $weeks[$wk] = 'Minggu ' . (4 - $i);
    }
    $order = array_keys($weeks);
    foreach ($order as $wk) {
        $chart[] = [
            'label' => $weeks[$wk],
            'users' => (int) ($rowUsers[$wk] ?? 0),
            'docs'  => (int) ($rowDocs[$wk] ?? 0),
        ];
    }
}

// ── Distribusi template: group payload->"layout" (FAKTA F8) ──────────
$layoutRows = $pdo->query(
    "SELECT JSON_UNQUOTE(JSON_EXTRACT(payload, '$.\"layout\"')) AS layout, COUNT(*) AS total
     FROM document_details
     GROUP BY layout
     ORDER BY total DESC"
)->fetchAll();
$usageTotal = 0;
$usage = [];
foreach ($layoutRows as $r) {
    if ($r['layout'] === null || $r['layout'] === 'null') {
        continue;
    }
    $usage[] = ['layout' => $r['layout'], 'total' => (int) $r['total']];
    $usageTotal += (int) $r['total'];
}
$layoutLabel = ['standar' => 'Modern Minimalist ATS', 'tech' => 'Tech Specialist Pro', 'entry' => 'Fresh Graduate Entry'];
foreach ($usage as &$u) {
    $u['label'] = $layoutLabel[$u['layout']] ?? ucfirst($u['layout']);
    $u['pct']   = $usageTotal > 0 ? round($u['total'] / $usageTotal * 100, 1) : 0.0;
}
unset($u);

// ── Ringkasan transaksi (periode) + metode ───────────────────────────
$stmt = $pdo->prepare(
    "SELECT status, COUNT(*) AS n, COALESCE(SUM(amount), 0) AS amount
     FROM point_transactions
     WHERE type = 'purchase' AND created_at >= (NOW() - INTERVAL ? DAY)
     GROUP BY status"
);
$stmt->execute([$days]);
$trx = ['success' => 0, 'pending' => 0, 'failed' => 0, 'amount_success' => 0, 'by_method' => []];
foreach ($stmt->fetchAll() as $r) {
    $statusKey = (string) $r['status'];
    if (in_array($statusKey, ['success', 'pending', 'failed'], true)) {
        $trx[$statusKey] = (int) $r['n'];
    }
    if ($statusKey === 'success') {
        $trx['amount_success'] = (int) $r['amount'];
    }
}
$stmt = $pdo->prepare(
    "SELECT COALESCE(payment_method, 'Tidak diketahui') AS method, COUNT(*) AS n, COALESCE(SUM(amount), 0) AS amount
     FROM point_transactions
     WHERE type = 'purchase' AND status = 'success' AND created_at >= (NOW() - INTERVAL ? DAY)
     GROUP BY method"
);
$stmt->execute([$days]);
foreach ($stmt->fetchAll() as $r) {
    $trx['by_method'][] = ['method' => $r['method'], 'count' => (int) $r['n'], 'amount' => (int) $r['amount']];
}

$payload['cards'] = [
    'users_total'     => $usersTotal,
    'users_active'    => $usersActive,
    'users_suspended' => $usersSuspended,
    'users_new'       => $curNew,
    'users_growth'    => $usersGrowth,
    'docs_total'      => $docsTotal,
    'docs_new'        => $docsCur,
    'docs_growth'     => $docsGrowth,
    'revenue_month'   => $revenueMonth,
];
$payload['chart']          = $chart;
$payload['template_usage'] = ['total' => $usageTotal, 'items' => $usage];
$payload['transactions']   = $trx;

} // end if ($needOverview)

// ═════════════════════════════════════════════════════════════════════
// ACTIVITIES — tabel Aktivitas Platform & Transaksi Terkini (paged)
// ═════════════════════════════════════════════════════════════════════
if ($needActivities) {

// ── Tabel Aktivitas Platform & Transaksi Terkini (paged) ─────────────
// Sumber data yang BENAR-BENAR direkam backend saja (FAKTA F12) —
// jenis aktivitas "Login Baru" TIDAK direkan backend, jadi tidak dimasukkan.
$stmt = $pdo->prepare(
    "SELECT SQL_CALC_FOUND_ROWS * FROM (
        SELECT pt.id, pt.created_at, pt.type, pt.status, pt.amount, pt.payment_method, pt.package_code, pt.points,
               u.first_name, u.last_name, u.email, u.avatar_url, u.id AS user_id
        FROM point_transactions pt
        JOIN users u ON u.id = pt.user_id
        WHERE pt.type IN ('purchase', 'usage')
        UNION ALL
        SELECT d.id, d.created_at, CONCAT('doc:', d.type) AS type, d.status AS status, NULL AS amount,
               NULL AS payment_method, NULL AS package_code, NULL AS points,
               u.first_name, u.last_name, u.email, u.avatar_url, u.id AS user_id
        FROM documents d
        JOIN users u ON u.id = d.user_id
    ) AS t
    ORDER BY t.created_at DESC
    LIMIT {$perPage} OFFSET {$offset}"
);
$stmt->execute();
$rows = $stmt->fetchAll();
$totalActivities = (int) $pdo->query('SELECT FOUND_ROWS()')->fetchColumn();

$activities = [];
foreach ($rows as $r) {
    $type = (string) $r['type'];
    if (str_starts_with($type, 'doc:')) {
        $activity = 'Generate ' . substr($type, 4);
        $detail   = 'Dokumen ' . (string) ($r['status'] ?? '');
        $ok       = true;
    } elseif ($type === 'purchase') {
        $activity = 'Top Up Poin';
        $detail   = ($r['package_code'] ? ucfirst((string) $r['package_code']) : 'Paket') .
                    ' — ' . number_format((int) $r['amount'], 0, ',', '.') .
                    ' (' . ($r['payment_method'] ?? 'metode') . ')';
        $ok = ($r['status'] ?? '') === 'success';
    } else { // usage
        $activity = 'Generate CV (pakai poin)';
        $detail   = abs((int) $r['points']) . ' poin terpakai';
        $ok       = true;
    }
    $activities[] = [
        'id'        => ($type === 'purchase' ? 'trx' : 'doc') . '-' . $r['id'],
        'user_id'   => (int) $r['user_id'],
        'name'      => trim($r['first_name'] . ' ' . $r['last_name']),
        'email'     => $r['email'],
        'avatar'    => $r['avatar_url'],
        'initials'  => mb_strtoupper(mb_substr($r['first_name'], 0, 1) . mb_substr($r['last_name'] ?: $r['first_name'], strlen($r['first_name']) > 1 ? 1 : 0, 1)),
        'activity'  => $activity,
        'detail'    => $detail,
        'status'    => $ok ? 'Sukses' : ucfirst((string) $r['status']),
        'status_ok' => $ok,
        'created_at'=> $r['created_at'],
    ];
}
$totalPages = max(1, (int) ceil($totalActivities / $perPage));

// Halaman di luar jangkauan (mis. data menyusut) dikembalikan ke halaman
// terakhir agar pager tidak menampilkan posisi yang mustahil.
$payload['activities'] = [
    'rows' => $activities,
    'total' => $totalActivities,
    'page' => min($page, $totalPages),
    'per_page' => $perPage,
    'total_pages' => $totalPages,
];

} // end if ($needActivities)

$payload['generated_at'] = date('c');

json_response(true, $payload);
} catch (PDOException $e) {
    error_log('analytics.php: ' . $e->getMessage());
    json_fail('Gagal mengambil data analitik dari database.', 500);
}
