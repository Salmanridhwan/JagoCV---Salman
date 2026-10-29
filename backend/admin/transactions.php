<?php
/**
 * Endpoint Monitoring Transaksi & Pembayaran Masuk (Menu "TRANSAKSI & KOMERSIAL").
 *
 *    GET  ?q=&status=&method=&period=&page=&per_page=  — list + ringkasan kartu
 *    GET  ?id=N                                              — detail 1 transaksi + riwayat user
 *    GET  ?export=csv&…                                      — CSV (kolom mengikuti tabel UI)
 *    POST { id, action:'void', reason }                      — void transaksi pending → failed (+audit)
 *
 * SUMBER DATA: tabel `point_transactions` — satu-satunya ledger transaksi nyata di
 * jagoCV (ditulis oleh checkout.php saat user membuat pembayaran dan oleh
 * confirm.php saat pembayaran diselesaikan). Tabel ini juga dipakai Menu 3
 * (detail user) dan Menu 1 (dashboard), sehingga angka antar-halaman konsisten.
 *
 * F7 (Payment Simulasi — gateway Midtrans/Xendit belum terpasang):
 *   - Endpoint ini TIDAK punya aksi yang bisa menandai transaksi "success".
 *     Admin hanya bisa mem-void transaksi yang masih `pending`. Klaim sukses
 *     hanya boleh datang dari webhook gateway nyata (confirm.php).
 *   - `expires_at` = batas bayar. Bila kosong (baris lama), dipakai aturan
 *     checkout.php: created_at + 1 jam. Baris pending yang lewat batas
 *     ditampilkan "Kedaluwarsa" TANPA mengubah status tersimpan di DB
 *     (tidak ada cron — lihat ADMIN_IMPLEMENTATION.md Menu 5).
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

$httpMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($httpMethod !== 'GET' && $httpMethod !== 'POST') {
    json_fail('Metode harus GET atau POST.', 405);
}

$admin = require_admin();
$pdo   = db();

// ── Ekspresi bersama (dipakai list, ringkasan, detail, CSV) ───────────

/**
 * Batas bayar efektif.
 *
 * FAKTA: tabel `point_transactions` TIDAK punya kolom `expires_at` — checkout.php
 * menghitung `time() + 3600` dan hanya mengirimnya di respons, tidak menyimpannya
 * (dicatat sebagai RISIKO di ADMIN_IMPLEMENTATION.md Menu 5). Karena itu batas
 * bayar diturunkan dari aturan yang sama: created_at + 1 jam.
 *
 * Zona waktu: `created_at` diisi DEFAULT CURRENT_TIMESTAMP dengan MySQL
 * time_zone = SYSTEM (WIB), sama seperti NOW() — jadi keduanya sebanding.
 * Hari 30-hari: pemisahan hari tetap dilakukan oleh formatter frontend.
 */
const TRX_EXPIRES_SQL = 'DATE_ADD(trx.created_at, INTERVAL 1 HOUR)';

/**
 * Status yang ditampilkan UI. `pending` yang lewat batas → `expired`.
 * Nilai kolom `status` di DB tetap apa adanya (jujur: DB tidak diubah diam-diam).
 */
const TRX_UI_STATUS_SQL = "CASE WHEN trx.status = 'pending' AND DATE_ADD(trx.created_at, INTERVAL 1 HOUR) < NOW() THEN 'expired' ELSE trx.status END";

/** FROM + JOIN yang selalu sama (pengguna pemilik transaksi + paket yang dibeli). */
const TRX_FROM_SQL = 'FROM point_transactions trx
        LEFT JOIN topup_packages pkg ON pkg.code = trx.package_code
        JOIN users u ON u.id = trx.user_id';

// ── Label (dipakai UI supaya backend & frontend tidak punya 2 daftar) ─

function trxTypeLabel(string $type): string
{
    return match ($type) {
        'purchase'     => 'Pembelian Paket',
        'usage'        => 'Penggunaan Poin',
        'signup_bonus' => 'Bonus Pendaftaran',
        default        => $type,
    };
}

function trxStatusLabel(string $uiStatus): string
{
    return match ($uiStatus) {
        'success' => 'Berhasil',
        'pending' => 'Menunggu Pembayaran',
        'expired' => 'Kedaluwarsa',
        'failed'  => 'Gagal',
        default   => $uiStatus,
    };
}

/** Nama metode pembayaran yang enak dibaca (kolom DB menyimpan kode slug). */
function trxMethodLabel(?string $code): string
{
    $code = strtolower(trim((string) $code));
    return match ($code) {
        ''              => '—',
        'qris'          => 'QRIS',
        'bca_va'        => 'BCA VA',
        'mandiri_va'    => 'Mandiri VA',
        'bni_va'        => 'BNI VA',
        'gopay'         => 'GoPay E-Wallet',
        'ovo'           => 'OVO E-Wallet',
        'dana'          => 'DANA E-Wallet',
        'shopeepay'     => 'ShopeePay',
        'credit_card'   => 'Kartu Kredit',
        'transfer'      => 'Transfer Manual',
        default         => strtoupper(str_replace('_', ' ', $code)),
    };
}

/** Kelompok ikon chip metode (QR vs bank/kartu) agar kelas warna UI konsisten. */
function trxMethodIcon(?string $code): string
{
    $code = strtolower(trim((string) $code));
    return in_array($code, ['bca_va', 'mandiri_va', 'bni_va', 'credit_card', 'transfer'], true)
        ? 'bank'
        : 'qr';
}

// ── Filter query string ───────────────────────────────────────────────

/**
 * Bangun WHERE + parameter dari query string.
 *
 * @param bool $withStatus false → kartu ringkasan tidak ikut Zero-in saat
 *                         admin memilih satu status.
 */
function buildTrxFilters(bool $withStatus = true): array
{
    $where  = [];
    $params = [];

    $q = trim((string) ($_GET['q'] ?? ''));
    if ($q !== '') {
        // Satu parameter per placeholder: driver MySQL dengan
        // ATTR_EMULATE_PREPARES=false menolak nama parameter yang dipakai
        // berulang dalam satu query (SQLSTATE HY093).
        $where[]       = "(CONCAT('TRX-', LPAD(trx.id, 5, '0')) LIKE :q_code
                          OR trx.payment_ref LIKE :q_ref
                          OR CONCAT(u.first_name, ' ', u.last_name) LIKE :q_nama
                          OR u.email LIKE :q_email)";
        $like          = '%' . $q . '%';
        $params[':q_code']  = $like;
        $params[':q_ref']   = $like;
        $params[':q_nama']  = $like;
        $params[':q_email'] = $like;
    }

    if ($withStatus) {
        $status = trim((string) ($_GET['status'] ?? ''));
        if (in_array($status, ['success', 'pending', 'expired', 'failed'], true)) {
            $where[]         = TRX_UI_STATUS_SQL . ' = :ui_status';
            $params[':ui_status'] = $status;
        }
    }

    $method = trim((string) ($_GET['method'] ?? ''));
    if ($method !== '') {
        $where[]              = 'trx.payment_method = :method';
        $params[':method']    = $method;
    }

    switch (trim((string) ($_GET['period'] ?? ''))) {
        case 'today':
            $where[] = 'DATE(trx.created_at) = CURDATE()';
            break;
        case '7d':
            $where[] = 'trx.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
            break;
        case '30d':
            $where[] = 'trx.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
            break;
        case 'month':
            $where[] = "trx.created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')";
            break;
    }

    return [$where, $params];
}

/** Rangkai WHERE dengan klausa lingkup opsional. */
function trxWhereSql(array $where, array $extra = []): string
{
    $all = array_merge($extra, $where);
    return $all === [] ? '' : 'WHERE ' . implode(' AND ', $all);
}

// ── CSV export (kolom mengikuti tabel UI) ─────────────────────────────

if ($httpMethod === 'GET' && ($_GET['export'] ?? '') === 'csv') {
    [$where, $params] = buildTrxFilters();

    $stmt = $pdo->prepare(
        'SELECT trx.id, trx.payment_ref, CONCAT(u.first_name, \' \', u.last_name) AS nama, u.email,
                trx.amount, trx.payment_method, trx.type, pkg.name AS package_name,
                trx.points, ' . TRX_UI_STATUS_SQL . ' AS ui_status,
                trx.created_at, ' . TRX_EXPIRES_SQL . ' AS expires_effective
         ' . TRX_FROM_SQL . ' ' . trxWhereSql($where) . '
         ORDER BY trx.created_at DESC, trx.id DESC'
    );
    $stmt->execute($params);

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="jagocv-monitoring-transaksi.csv"');

    $out = fopen('php://output', 'w');
    fputcsv($out, [
        'ID Transaksi', 'Referensi Gateway', 'Pengguna', 'Email', 'Nominal (Rp)',
        'Metode', 'Jenis Transaksi', 'Paket', 'Poin', 'Status', 'Waktu Transaksi', 'Batas Bayar',
    ]);
    while ($row = $stmt->fetch()) {
        fputcsv($out, [
            'TRX-' . str_pad((string) $row['id'], 5, '0', STR_PAD_LEFT),
            $row['payment_ref'] ?? '',
            trim((string) $row['nama']),
            $row['email'],
            $row['amount'] === null ? '' : (int) $row['amount'],
            trxMethodLabel($row['payment_method']),
            trxTypeLabel((string) $row['type']),
            $row['package_name'] ?? '',
            (int) $row['points'],
            trxStatusLabel((string) $row['ui_status']),
            (string) $row['created_at'],
            (string) ($row['expires_effective'] ?? ''),
        ]);
    }
    fclose($out);

    log_audit(
        (int) $admin['id'],
        'EXPORT',
        'point_transactions',
        'csv',
        null,
        ['filters' => array_intersect_key($_GET, array_flip(['q', 'status', 'method', 'period']))],
        'Ekspor CSV Monitoring Transaksi'
    );
    exit;
}

// ── Detail 1 transaksi (?id=N) ────────────────────────────────────────

if ($httpMethod === 'GET' && isset($_GET['id'])) {
    $id = (int) $_GET['id'];
    if ($id <= 0) {
        json_fail('Parameter id transaksi wajib diisi.', 422);
    }

    $stmt = $pdo->prepare(
        'SELECT trx.id, trx.type, trx.points, trx.description,
                trx.payment_method, trx.payment_ref, trx.amount, trx.status,
                ' . TRX_UI_STATUS_SQL . ' AS ui_status,
                ' . TRX_EXPIRES_SQL . ' AS expires_effective,
                trx.created_at,
                u.id AS user_id, u.first_name, u.last_name, u.email, u.avatar_url,
                u.points AS user_points, u.plan AS user_plan, u.status AS user_status
         ' . TRX_FROM_SQL . '
         WHERE trx.id = ?'
    );
    $stmt->execute([$id]);
    $trx = $stmt->fetch();
    if (!$trx) {
        json_fail('Transaksi tidak ditemukan.', 404);
    }

    $hist = $pdo->prepare(
        'SELECT id, type, points, amount, payment_method, status, created_at
         FROM point_transactions WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 20'
    );
    $hist->execute([(int) $trx['user_id']]);

    $history = array_map(static function (array $r): array {
        return [
            'id'          => (int) $r['id'],
            'trx_code'    => 'TRX-' . str_pad((string) $r['id'], 5, '0', STR_PAD_LEFT),
            'type'        => $r['type'],
            'type_label'  => trxTypeLabel((string) $r['type']),
            'points'      => (int) $r['points'],
            'amount'      => $r['amount'] === null ? null : (int) $r['amount'],
            'method'      => trxMethodLabel($r['payment_method']),
            'status'      => $r['status'],
            'created_at'  => $r['created_at'],
        ];
    }, $hist->fetchAll());

    json_response(true, [
        'transaction' => [
            'id'                => (int) $trx['id'],
            'trx_code'          => 'TRX-' . str_pad((string) $trx['id'], 5, '0', STR_PAD_LEFT),
            'payment_ref'       => $trx['payment_ref'] ?? null,
            'type'              => $trx['type'],
            'type_label'        => trxTypeLabel((string) $trx['type']),
            'description'       => $trx['description'],
            'points'            => (int) $trx['points'],
            'amount'            => $trx['amount'] === null ? null : (int) $trx['amount'],
            'method'            => trxMethodLabel($trx['payment_method']),
            'method_code'       => $trx['payment_method'],
            'method_icon'       => trxMethodIcon($trx['payment_method']),
            'status'            => $trx['ui_status'],          // status tampilan (pending lewat batas → expired)
            'status_label'      => trxStatusLabel((string) $trx['ui_status']),
            'stored_status'     => $trx['status'],             // isi kolom DB apa adanya
            'expires_at'        => $trx['expires_effective'] ?? null,
            'created_at'        => $trx['created_at'],
            'can_void'          => $trx['status'] === 'pending' && $trx['type'] === 'purchase',
        ],
        'user'    => [
            'id'         => (int) $trx['user_id'],
            'first_name' => $trx['first_name'],
            'last_name'  => $trx['last_name'] ?? '',
            'email'      => $trx['email'],
            'avatar_url' => $trx['avatar_url'] ?? null,
            'points'     => (int) $trx['user_points'],
            'plan'       => $trx['user_plan'],
            'status'     => $trx['user_status'],
        ],
        'history' => $history,
    ]);
}

// ── POST: void transaksi pending ──────────────────────────────────────

if ($httpMethod === 'POST') {
    $body   = json_body();
    $action = field_str($body, 'action');
    $id     = (int) ($body['id'] ?? 0);
    $reason = field_str($body, 'reason');

    if ($action !== 'void') {
        json_fail('Aksi tidak dikenal. Aksi yang tersedia: void.', 422);
    }
    if ($id <= 0) {
        json_fail('id transaksi wajib diisi.', 422);
    }
    if ($reason === '') {
        json_fail('Alasan void wajib diisi.', 422);
    }

    $stmt = $pdo->prepare(
        'SELECT id, user_id, type, points, amount, payment_method, payment_ref, status, created_at
         FROM point_transactions WHERE id = ?'
    );
    $stmt->execute([$id]);
    $before = $stmt->fetch();
    if (!$before) {
        json_fail('Transaksi tidak ditemukan.', 404);
    }
    if ($before['type'] !== 'purchase') {
        json_fail('Hanya transaksi pembelian paket yang dapat di-void.', 409);
    }
    if ($before['status'] !== 'pending') {
        // 409 sesuai acceptance criteria Menu 5: transaksi yang sudah final tidak diubah.
        json_fail(
            'Transaksi sudah berstatus "' . $before['status'] . '" dan tidak dapat di-void. '
            . 'Poin pengguna tidak diubah oleh aksi ini.',
            409
        );
    }

    // Guard status='pending' di WHERE agar tidak balapan dengan confirm.php.
    $upd = $pdo->prepare("UPDATE point_transactions SET status = 'failed' WHERE id = ? AND status = 'pending'");
    $upd->execute([$id]);
    if ($upd->rowCount() === 0) {
        json_fail('Transaksi sudah diproses oleh sistem pembayaran. Muat ulang daftar.', 409);
    }

    $after = $before;
    $after['status'] = 'failed';
    log_audit((int) $admin['id'], 'VOID', 'point_transactions', $id, $before, $after, $reason);

    json_response(true, [
        'message' => 'Transaksi TRX-' . str_pad((string) $id, 5, '0', STR_PAD_LEFT)
            . ' di-void (status → failed). Poin pengguna tidak berubah.',
        'status'  => 'failed',
    ]);
}

// ── Ringkasan kartu (seluruh jenis transaksi) ────────────────────────
// Kartu memakai filter periode/metode/pencarian yang aktif, tapi MENGABAIKAN
// filter status supaya angkanya tidak nol saat admin memilih satu status —
// angka tetap bermakna.
// Lingkupnya SEMUA type (bukan hanya 'purchase'): JagoCV tidak punya paket
// poin, sehingga baris nyata di ledger adalah signup_bonus & usage. Dibatasi
// ke 'purchase' akan membuat ketiga kartu selalu 0 padahal tabel berisi
// transaksi sukses.

[$sumWhere, $sumParams] = buildTrxFilters(false);

$sumStmt = $pdo->prepare(
    'SELECT
        COALESCE(SUM(CASE WHEN ' . TRX_UI_STATUS_SQL . " = 'success' THEN 1 ELSE 0 END), 0) AS success_count,
        COALESCE(SUM(CASE WHEN " . TRX_UI_STATUS_SQL . " = 'success' THEN trx.amount ELSE 0 END), 0) AS success_amount,
        COALESCE(SUM(CASE WHEN " . TRX_UI_STATUS_SQL . " = 'pending' THEN 1 ELSE 0 END), 0) AS pending_count,
        COALESCE(SUM(CASE WHEN " . TRX_UI_STATUS_SQL . " = 'expired' THEN 1 ELSE 0 END), 0) AS expired_count,
        COALESCE(SUM(CASE WHEN " . TRX_UI_STATUS_SQL . " = 'failed'  THEN 1 ELSE 0 END), 0) AS failed_count
     " . TRX_FROM_SQL . ' ' . trxWhereSql($sumWhere)
);
$sumStmt->execute($sumParams);
$agg = $sumStmt->fetch() ?: [];

$summary = [
    'successful_revenue' => (int) ($agg['success_amount'] ?? 0),
    'total_success'      => (int) ($agg['success_count'] ?? 0),
    'total_pending'      => (int) ($agg['pending_count'] ?? 0),
    'total_expired'      => (int) ($agg['expired_count'] ?? 0),
    'total_failed'       => (int) ($agg['failed_count'] ?? 0),
];
$summary['total_problem'] = $summary['total_pending'] + $summary['total_expired'] + $summary['total_failed'];

// ── Opsi filter (diambil dari data nyata, bukan daftar karangan) ──────

$methodRows = $pdo->query(
    "SELECT payment_method AS code, COUNT(*) AS total
     FROM point_transactions
     WHERE payment_method IS NOT NULL AND payment_method <> ''
     GROUP BY payment_method ORDER BY total DESC"
)->fetchAll();

$methods = array_map(static function (array $r): array {
    return [
        'code'  => (string) $r['code'],
        'label' => trxMethodLabel($r['code']),
        'total' => (int) $r['total'],
    ];
}, $methodRows);

// ── Daftar transaksi (paginasi server-side) ───────────────────────────

[$where, $params] = buildTrxFilters();

$page    = max(1, (int) ($_GET['page'] ?? 1));
$perPage = min(100, max(1, (int) ($_GET['per_page'] ?? 5)));
$offset  = ($page - 1) * $perPage;

$countStmt = $pdo->prepare('SELECT COUNT(*) ' . TRX_FROM_SQL . ' ' . trxWhereSql($where));
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();
$totalPages = max(1, (int) ceil($total / $perPage));

// Halaman bisa jadi di luar rentang setelah filter berubah → tarik ke halaman terakhir.
if ($page > $totalPages && $total > 0) {
    $page   = $totalPages;
    $offset = ($page - 1) * $perPage;
}

$listStmt = $pdo->prepare(
    'SELECT trx.id, trx.type, trx.points, trx.package_code, pkg.name AS package_name,
            trx.payment_method, trx.payment_ref, trx.amount,
            ' . TRX_UI_STATUS_SQL . ' AS ui_status,
            ' . TRX_EXPIRES_SQL . ' AS expires_effective,
            trx.created_at,
            u.id AS user_id, u.first_name, u.last_name, u.email, u.avatar_url
     ' . TRX_FROM_SQL . ' ' . trxWhereSql($where) . "
     ORDER BY trx.created_at DESC, trx.id DESC
     LIMIT $perPage OFFSET $offset"
);
$listStmt->execute($params);

$transactions = array_map(static function (array $r): array {
    $expires = $r['expires_effective'] ?? null;
    return [
        'id'            => (int) $r['id'],
        'trx_code'      => 'TRX-' . str_pad((string) $r['id'], 5, '0', STR_PAD_LEFT),
        'payment_ref'   => $r['payment_ref'] ?? null,
        'type'          => (string) $r['type'],
        'type_label'    => trxTypeLabel((string) $r['type']),
        'package_code'  => $r['package_code'] ?? null,
        'package_name'  => $r['package_name'] ?? null,
        'points'        => (int) $r['points'],
        'amount'        => $r['amount'] === null ? null : (int) $r['amount'],
        'method'        => trxMethodLabel($r['payment_method']),
        'method_icon'   => trxMethodIcon($r['payment_method']),
        'status'        => (string) $r['ui_status'],
        'status_label'  => trxStatusLabel((string) $r['ui_status']),
        // Batas bayar hanya relevan selama transaksi masih pending / sudah kedaluwarsa.
        'expires_at'    => in_array($r['ui_status'], ['pending', 'expired'], true) ? $expires : null,
        'created_at'    => $r['created_at'],
        'user'          => [
            'id'         => (int) $r['user_id'],
            'first_name' => $r['first_name'],
            'last_name'  => $r['last_name'] ?? '',
            'email'      => $r['email'],
            'avatar_url' => $r['avatar_url'] ?? null,
        ],
    ];
}, $listStmt->fetchAll());

json_response(true, [
    'summary'      => $summary,
    'filters'      => ['methods' => $methods],
    'transactions' => $transactions,
    'page'         => $page,
    'per_page'     => $perPage,
    'total'        => $total,
    'total_pages'  => $totalPages,
]);