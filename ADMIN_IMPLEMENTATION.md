# ADMIN_IMPLEMENTATION.md — Acuan Implementasi Halaman Admin jagoCV

> Dokumen ini **bukan kode** — ini acuan/keputusan pengembangan halaman admin,
> disusun dari analisis source code + dokumentasi yang ada, dan tampilan (UI)
> **berpatokan pada folder `desain patokan`** (3 file PNG: Dashboard & Analytics,
> Manajemen Template CV, Manajemen User & Dokumen — disarikan di Bagian 1.7).
> Dokumen ini TIDAK menimpa dokumentasi lain; sebaliknya dirancang untuk
> mendampinginya.
>
> ## Status dokumen referensi yang ditemukan
> | Dokumen | Status | Catatan |
> |---|---|---|
> | `USER_DEVELOPMENT_GUIDE.md` | **ADA** (root project) | Analisis sisi user — 9 bagian, gap, endpoint, relasi DB. Menjadi dasar utama dokumen ini. |
> | `ADMIN_DEVELOPMENT_SPEC.md` | **TIDAK ADA** — tidak ditemukan file bernama ini maupun `ADMIN*.md` lain di repo (verifikasi: glob `ADMIN*.md` → 0 hasil) | Bagian yang biasanya dikandungnya (requirement admin) diisi mandiri di dokumen ini. |
>
> ## Konvensi penandaan kondisi project
> Tersebar di tiap fitur, dirangkum juga di Bagian C:
> - **SUDAH ADA** — ditemukan & terverifikasi di source code (path dicantumkan; transaksi/payment dianggap **simulasi**, data mock dianggap **bukan data produksi**).
> - **PERLU DIUBAH** — sudah ada tetapi perlu penyesuaian.
> - **PERLU DIBUAT** — belum tersedia di project.
> - **PERLU KEPUTUSAN** — membutuhkan konfirmasi bisnis sebelum coding.

---

## Bagian 0 — Fakta dasar dari source code (fondasi semua keputusan)

Semua pernyataan di bawah **FAKTA**, terverifikasi; detail lengkapnya ada di
`USER_DEVELOPMENT_GUIDE.md` (meskipun dokumen ini berdiri sendiri).

| # | Fakta | Lokasi |
|---|---|---|
| F1 | Stack: frontend Vite 6 + vanilla TypeScript + Tailwind 4 (port 3000); backend **PHP murni** di Apache/XAMPP; **MySQL** `jagocv` via PDO. Deps `react`, `lucide-react`, `motion`, `@google/genai` terpasang tapi **tidak dipakai** kode app. | `package.json`, `vite.config.ts` |
| F2 | SPA satu `index.html`: switching view `hidden/block`, **tanpa URL routing**. Pengecualian: `src/html/payment-gateway.html` (entry build terpisah). | `index.html`, `src/js/views/router.ts` |
| F3 | Autentikasi: token HMAC-SHA256 mirip JWT `{sub, email, iat, exp:7d}`, stateless, disimpan `localStorage.jagocv_token` + `jagocv_user`; validasi via `require_user()` (401). Tidak ada refresh token, tidak ada server-side session. | `backend/helpers.php`, `src/js/utils/auth.ts` |
| F4 | **Tidak ada role admin**: kolom `users.role` adalah *profesi pengguna*, bukan hak akses. Tidak ada `require_admin()`, tidak ada endpoint admin. | `database/jagocv.sql`, `backend/helpers.php` |
| F5 | 13 endpoint backend `POST/GET` (register, login, google, me, logout, points, consume, packages, checkout, confirm, cv ✓draft, ping). Format respons konsisten `{ok, ...}` via `json_response/json_fail`. Semua query PDO prepared statements. | `backend/*.php` |
| F6 | Tabel DB: `users`, `documents`, `document_details`, `cv_drafts`, `subscriptions` (tak terpakai), `topup_packages`, `point_transactions`. Relasi 1:N dari `users`; `documents` 1:1 `document_details`; draft 1:1 user. | `database/*.sql` |
| F7 | Sistem poin: bonus 2 poin saat register; −1 poin per generate (atomik, 402 bila habis); checkout → transaksi `pending` → confirm (idempotent, row-lock `FOR UPDATE`, `is_new_user=0`). **Payment gateway = simulasi** (`src/html/payment-gateway.html`), bukan pembayaran nyata. | `backend/checkout.php`, `confirm.php`, `consume.php` |
| F8 | Template CV di halaman user **hardcoded** sebagai radio `input[name="ats-layout"]` values `standar | tech | entry` + renderer di `updateCvLivePreview`/`renderCvResult`. **Tidak ada tabel template di DB.** | `src/html/create-cv.html:421-522`, `src/js/utils/cvData.ts` |
| F9 | Integrasi AI **belum ada**: `@google/genai` terpasang, `GEMINI_API_KEY` di-define `vite.config.ts`, tetapi tidak ada pemanggilan Gemini; widget chat adalah **mock** (footer menampilkan tanggal hardcode). Prepare untuk API key. | `src/js/views/chat.ts`, `vite.config.ts:142` |
| F10 | **GAP** frontend memanggil endpoint yang belum ada: `POST /backend/update-profile.php` (`edit-profile.ts`), `POST /backend/points-history.php` (`point-history.ts:325`). Checkout pricing masih **stub** (`pricing.ts:196`). Dashboard masih pakai **mock data** (`src/js/data.ts`), tidak membaca DB. | — |
| F11 | Komponen reusable: `showToast`, modal generik (`generic-modal.html` + `modal.ts`), badge status (`dashboard.ts: buildStatusBadge`), row transaksi (`point-history.ts: rowTemplate`), unduh PDF via print (`point-history.ts: downloadReport`, `cvData.ts: downloadCvPdf`), `checkSession` (`auth.ts`). | — |
| F12 | Riwayat/aktivitas yang benar-benar produktif di backend: `point_transactions` (signup_bonus/purchase/usage), `documents.created_at`, `cv_drafts.updated_at`. **Tidak ada log aktivitas generik** (login history, IP dsb.). | `database/*.sql` |
| F13 | Keamanan saat ini: `APP_JWT_SECRET` masih placeholder; DB `root` tanpa password (dev); CORS whitelist origin dev saja; tidak ada rate-limit; header Authorization diteruskan via `backend/.htaccess`. | `backend/config.php`, `backend/.htaccess` |

---

## Bagian 1 — Arsitektur Admin (navigasi, login, proteksi, keamanan) [REKOMENDASI]

*(kecuali ditandai FAKTA, keseluruhan bagian ini adalah desain baru; dibangun di atas kemampuan F1–F13)*

### 1.1 Strategi penempatan halaman admin
Dua opsi; default disarankan opsi A:
- **A (disarankan): aplikasi SPA terpisah** — entry Vite baru `admin.html` +
  asset `src/admin/*` (pattern sama dengan `payment-gateway.html` yang sudah
  menjadi entry kedua di `vite.config.ts → build.rollupOptions.input`). Isolasi
  dari app user; tidak menyuntik view admin ke `index.html`.
- **B: view tambahan di SPA yang sama** — tidak disarankan: kode user
  (`main.ts`) mem-bootstrap semua binding saat `DOMContentLoaded`; menambah
  view admin berarti menambah binding + guard di tiap titik.

### 1.2 Sidebar & navigasi admin (UI mengikuti desain patokan — Bagian 1.7)

Struktur sidebar sesuai desain: **bukan** daftar datar 13 item, melainkan
**dikelompokkan 3 section** dengan label grup. Item aktif = pill gelap
(slate-900) teks putih rounded penuh + ikon garis; item pasif = teks abu di
atas latar putih. Layout flat-13 yang lama dihapus — peta di bawah ini
adalah satu-satunya acuan sidebar:

```
(admin-shell.html — sidebar desktop / drawer mobile)
├─ Logo atas: [ikon] JagoCV — ADMIN CENTER
├─ GROUP "MAIN MENU"
│  ├─ Dashboard & Analytics    → view-dash             (Menu 1)
│  ├─ Manajemen Template       → view-templates        (Menu 2)
│  └─ User & Dokumen           → view-users            (Menu 3; Menu 4 jadi tab)
├─ GROUP "TRANSAKSI & KOMERSIAL"
│  ├─ Monitoring Transaksi     → view-transactions     (Menu 5)
│  └─ Manajemen Harga & Token  → view-pricing-admin    (Menu 6)
├─ GROUP "SISTEM & DUKUNGAN"
│  ├─ Konfigurasi API AI       → view-ai-config        (Menu 7)
│  ├─ Feedback & Laporan       → view-feedback         (Menu 8)
│  ├─ Audit Log Aktivitas      → view-audit            (Menu 9)
│  ├─ Laporan & Ekspor         → view-reports          (Menu 10)
│  └─ Pengaturan Fitur         → view-features         (Menu 13)
└─ Kartu status fixed bawah: "● Gateway Terkoneksi — Midtrans / Xendit 99.9%"
```

Konsekuensi konkret struktur baru:
- **"User & Dokumen" = 1 item nav**: tabel dokumen dari Menu 4 digabung sebagai
  tab di dalam `view-users` (`tab-documents`); seluruh spesifikasi Menu 4 tetap
  berlaku, hanya sumber navigasinya berubah — jangan buat sidebar item terpisah.
- **Menu 11 (Role & Permission) TIDAK punya item sidebar di desain** —
  ditempatkan sebagai blok/subview dalam `view-features` (Pengaturan Fitur)
  atau dibuka menu sendiri — **PERLU KEPUTUSAN** pada saat implementasi Tahap 2.
- **Menu 12 (Riwayat Aktivitas) juga tidak punya item sidebar** — timeline
  tetap hidup di `view-users-detail` (Menu 3/12), konsistensinya tetap aman.
- Label menu dipakai PERSIS seperti desain ("Dashboard & Analytics",
  "Manajemen Template", "User & Dokumen", "Monitoring Transaksi",
  "Manajemen Harga & Token", dst.); judul halaman tiap menu di Bagian 3
  menyesuaikan (mis. Menu 2 = "Katalog & Manajemen Template CV").
- Kartu status gateway di dasar sidebar: bila pembayaran masih simulasi (F7)
  tulis "● Mode Simulasi — Gateway belum terpasang"; jangan tampilkan
  "Midtrans / Xendit 99.9%" sebelum gateway riil ada. Cara UI mendapatkan
  status ini: endpoint ping/status admin (PERLU DIBUAT, kecil).

Topbar admin (tampil di SEMUA view, mengikuti desain):
| Elemen | Spesifikasi |
|---|---|
| Search global | pill rounded penuh, placeholder `Cari data, user, ID transaksi…`; Fase 1: memfilter menu/tabel aktif (server-side `?q=`, Bagian 2); global cross-entity search = fase lanjutan — **PERLU KEPUTUSAN** |
| Toggle bahasa `ID / EN` | ID aktif default (pill gelap); i18n penuh mahal — Fase 1: EN tampil ter-disable — **PERLU KEPUTUSAN** kapan EN divalidkan |
| Bel notifikasi | dot merah; Fase 1 isi minimal = jumlah feedback status `Baru` (Menu 8); tanpa isi = tanpa dot — **PERLU KEPUTUSAN** scope lanjutan |
| Chip user | avatar + nama admin (bold) + subjudul role admin ("Super Admin"); klik → dropdown profil + logout |

- Konten: kontainer `view-*` (polanya sama dengan app user:
  `hideAllViews/showView`; lihat `src/js/views/router.ts`).
- Menu **ditampilkan/dirender sesuai permission** user admin (payload `permissions[]`),
  tetapi *render sesuai permission hanyalah UX*; keamanan tetap di backend (1.5).
- Router admin: helper `showAdminView(id)` dengan histori `localStorage`
  (`jagocv_admin_last_view`) mengikuti pola `navigation.ts` milik user — jangan
  ikuti pola `router.ts` user secara mentah jika opsi A dipilih (kode admin
  boleh terfinit terpisah).

### 1.3 Alur login admin [PERLU DIBUAT semua poin]
1. Halaman `src/admin/admin-login.html` (form email + password; **tanpa tombol
   Google** — akun admin dibuat internal).
2. `POST /backend/admin/login.php` (baru): sama seperti `login.php`
   + verifikasi `is_admin=1`; user non-admin → `403` dan **jangan** kirim token.
3. Respons: token (reuse `issue_token`, payload diperluas `is_admin` +
   `permissions[]`) dan profil admin (`public_user()` diperluas).
4. Sesi `localStorage` di-separate key: `jagocv_admin_token` agar tidak
   tercampur app user.
5. Proteksi halaman: bila token tidak ada → redirect ke form login;
   bila token ada → `checkSession` di-op yang `me.php` versi admin.
6. Logout: hapus localStorage + `POST /backend/admin/logout.php`
   (reuse pola `logout.php` stateless).
7. Durasi sesi: token admin memakai mekanisme kedaluwarsa 7 hari yang sama
   dengan app user (F3); durasi lebih pendek (mis. 2–8 jam) untuk sesi admin
   direkomendasikan — **PERLU KEPUTUSAN**: durasi sesi admin.

### 1.4 Proteksi route (frontend = UX, backend = keamanan)
- Frontend guard (`src/admin/guard.ts`):
  ```ts
  export async function requireAdminPage(names: string[]): Promise<AdminUser|null>
  // null → redirect /admin-login.html
  ```
- Backend guard yang disiapkan (dasarnya dari pola `require_user()`):
  ```php
  // backend/helpers.php (baru, PHP) — wajib dipanggil di awal setiap endpoint admin
  function require_admin(array $perm = null): array {
    $u = require_user();
    if (!(int)($u['is_admin'] ?? 0)) json_fail('Akses admin ditolak.', 403);
    if ($perm && !permissions_has($u, $perm)) json_fail('Forbidden (permission).', 403);
    return $u;
  }
  ```
  Catatan: potongan di atas adalah **spesifikasi perilaku**, bukan kode final.

### 1.5 Keamanan API admin (gabungan F13 + baru)
| Area | Kondisi | Yang diwajibkan untuk admin |
|---|---|---|
| Secret | `APP_JWT_SECRET` placeholder (F13) | Ganti; ambil dari environment (.env/server) bukan hardcode — **PERLU DIUBAH** |
| CORS | whitelist dev (`config.php`) | tambahkan origin admin & produksi — **PERLU DIUBAH** |
| Role DB | tak ada (`users.role` = profesi, F4) | kolom `users.is_admin` + tabel `admin_permissions` — **PERLU DIBUAT** |
| Rate limit | tidak ada (F13) | minimal pada `admin/login.php` — **PERLU DIBUAT** |
| Prepared statement | sudah semua endpoint user (F5) | pertahankan di semua endpoint admin — **SUDAH ADA (pola)** |
| Ekspos data | `public_user()` sudah bersih tanpa `password_hash` (F5) | pertahankan — **SUDAH ADA (pola)** |
| Audit | tidak ada (F12) | tabel + helper `log_audit()` — **PERLU DIBUAT** |

### 1.6 Standar respons & kode error endpoint admin wajib
Mengikuti pola user (F5): `{ok:true,...}` / `{ok:false,message}` dengan status:
`401 unauthorized, 403 permission/role, 404 not found, 409 konflik, 422 validasi, 500 server`.
Tetap menerima `require_user/require_admin` di setiap file; **tidak** ada data
yang dibaca bila guard ditolak (fail-fast setelah guard, sebelum query).

### 1.7 Desain visual patokan (BARU — patokan UI untuk seluruh halaman admin)

Sumber desain — folder eksternal `desain patokan` (3 file PNG):

| File PNG | Dipakai di |
|---|---|
| `Dashboard & Analytics - JagoCV Admin.png` | Desain halaman Menu 1 |
| `Manajemen Template CV - JagoCV Admin.png` | Desain halaman Menu 2 |
| `Manajemen User & Dokumen - JagoCV Admin.png` | Desain halaman Menu 3 (+ tabel Menu 4) |

PNG ini adalah **patokan UI yang dikunci**: Menu 1/2/3 wajib mengikuti susunan,
nomor, dan komponennya; Menu 5–13 mengikuti pola komponen yang sama di bawah
agar seluruh admin terlihat satu produk. **Semua konten di PNG adalah mockup**
— angka riil HANYA dari DB (lihat Bagian 5), bukan dari PNG.

**Komponen bersama (dipakai ulang di semua menu admin):**

| # | Elemen | Spesifikasi |
|---|---|---|
| D1 | Sidebar | lebar ±290px, latar putih; 3 label grup section UPPERCASE kecil abu (`MAIN MENU`, `TRANSAKSI & KOMERSIAL`, `SISTEM & DUKUNGAN`); item nav = ikon garis + label; item aktif = pill gelap (slate-900) teks putih rounded penuh; logo atas `[ikon] JagoCV / ADMIN CENTER`; kartu status gateway fixed di dasar. Strukturnya: Bagian 1.2. |
| D2 | Topbar | search global pill (`Cari data, user, ID transaksi…`) + toggle bahasa `ID / EN` + bel notifikasi ber-dot merah + chip user (avatar + nama bold + subjudul role admin). Spesifikasi perilaku: Bagian 1.2. |
| D3 | Header halaman | badge mint `● LIVE WORKSPACE MODE` + caption `Pembaruan otomatis tiap 30 detik` (implementasi: polling 30s ke endpoint data menu tersebut); H1 besar bold; subjudul abu maks. 2 baris; tombol aksi utama pill gelap di sisi kanan. |
| D4 | Kartu statistik | label UPPERCASE kecil + angka besar bold + ikon dalam bulatan di kanan; varian warna: **mint/teal** (metrik utama/positif), **rose/pink** (metrik risiko/peringatan), **navy hampir-hitam** (metrik finansial; boleh sub-CTA tombol translusen). |
| D5 | Chip filter | bar filter berupa pill: aktif = gelap solid teks putih; non-aktif = outline abu; jumlah item ditulis dalam tanda kurung, mis. `Semua Status`, `Semua Template (12)`. |
| D6 | Info banner | kartu strip dengan ikon ℹ untuk menyampaikan aturan bisnis (contoh Menu 2: penonaktifan template tidak menghapus dokumen lama). |
| D7 | Tabel | header kolom UPPERCASE huruf kecil abu; baris dipisah garis tipis; kolom entitas = avatar inisial (lingkaran pastel) + nama bold + chip ID kecil (`USR-####`) + email abu; status = badge titik berwarna (`● Aktif` hijau, `● Dinonaktifkan` merah, `● Sukses` hijau perbaris); kolom aksi terakhir berupa ikon garis. |
| D8 | Footer tabel | teks `Menampilkan X – Y dari Z (baris/keterangan)` kiri + tombol angka `1 2 3 … N` dan tombol panah kanan; halaman aktif = pill gelap. Pagination tetap server-side (Bagian 2). |
| D9 | Kartu konten | semua blok konten = kartu `rounded-2xl` dengan border abu tipis, di atas latar abu muda; jarak antar-kartu konsisten. Grafik pertumbuhan (Menu 1) memakai toggle rentang waktu di ujung kanan-atas kartu. |

**Pemetaan komponen menerjankan menu:** kartu statistik D4 dipakai di Menu 1
(3 kartu) dan Menu 3 (4 kartu); chip D5 dipakai di Menu 2/3 dan tabel lainnya
(Menu 4/5/9); tabel D7/D8 dipakai di semua menu bertabel; badge LIVE WORKSPACE
MODE (D3) ditampilkan di menu yang punya polling data realtime (Menu 1 dan
Menu 3 minimal, mengikuti desain) — menu lain boleh tanpa polling.

---

## Bagian 2 — Konvensi berulang (dipakai semua menu; cukup didokumentasikan sekali)

Berlaku untuk semua Menu 1–13 kecuali menu menentukan hal khusus. Ini dibuat
agar tiap menu tidak mengulang.

| Aspek | Spesifikasi |
|---|---|
| **Loading state** | setiap tabel/kartu punya skeleton (`min-[max-2].animate-pulse`), state `aria-busy`, tombol aksi dinonaktifkan saat submit (pola `setButtonLoading` di `src/js/views/auth.ts`). |
| **Empty state** | ikon + teks + tombol tindakan kosong (pola `emptyTemplate` `src/js/views/point-history.ts`). |
| **Success state** | global `showToast` (utils/toast.ts) + refresh data otomatis. |
| **Error state** | `showToast` untuk gagal fetch; pesan inline bila form (pola `showFormError`, `views/auth.ts`); jangan pernah silent-fail. |
| **Pagination** | server-side selalu: `?page=N&per_page=K (default 25, max 100)`; backend wajib memakai `LIMIT/OFFSET` + ORDER + COUNT; frontend menampilkan "halaman X dari Y". |
| **Pencarian & filter** | diterima server-side via query string bare (contoh: `?q=&filter[type]=&filter[status]=`); backend memakai placeholder PDO (`LIKE :q`), jangan interpolasi string. |
| **Dialog konfirmasi** | pakai modal generik (`generic-modal.html` + `modal.ts`); semua aksi destruktif (hapus, void, ubah harga, disable fitur) wajib double-confirm + input konfirmasi; setiap konfirmasi = audit log (Bagian 1.6). |
| **Format tanggal & Rupiah** | reuse `formatTanggal`, `formatRupiah` (`src/js/views/point-history.ts`) — pindahkan ke `src/admin/format.ts`, jangan di-copy. |
| **Ekspor** | semua ekspor CSV; bila kebutuhan PDF, gunakan pola print yang ada (`downloadReport`) — backend menyediakan endpoint ekspor CSV; kolom CSV mengikuti kolom tabel di menu terkait. |
| **Skema tabel audit** | `audit_logs`: actor, action, target_table, target_id, before JSON, after JSON, ip, user_agent, created_at + helper `log_audit()` (`backend/helpers.php`). Wajib pada semua aksi `write` di Menu 2/3/4/5/6/7/9/13 (lihat Bagian 1.6). |

---

## Bagian 3 — Spesifikasi 13 Menu Admin

Format tiap menu:
> **Status kondisi** → **Tujuan** → **Subhalaman** → **UI/tabel kolom** →
> **Aksi & form** → **Alur admin (E→S)** → **Data sumber (DB, endpoint, file)** →
> **Kebutuhan baru** → **Acceptance criteria / skenario uji**.

> **Catatan desain patokan**: UI Menu 1, 2, dan 3 **terkunci mengikuti 3 PNG**
> di folder `desain patokan` (Bagian 1.7). Menu lain (5–13) mengikuti pola &
> komponen yang sama (D1–D9) supaya admin terlihat satu produk. Angka dalam
> PNG adalah konten mockup — data riil HANYA dari DB (lihat Bagian 5).

---

### Menu 1 — Dashboard & Analytics

**Status kebutuhan:** PERLU DIBUAT (sumber data ada: F6, F7; UI & endpoint belum ada).

**Desain patokan (UI terkunci)**: mengikuti `Dashboard & Analytics - JagoCV Admin.png` (Bagian 1.7, D3/D4/D7/D8/D9).
Susunan halaman sesuai desain: header `Selamat Datang, Admin JagoCV!` + tombol
`Unduh Ringkasan Mingguan` (polaa ekspor CSV mingguan — pola Menu 10); 3 kartu
statistik: `Total Pengguna Aktif`, `Total Dokumen Digenerate`,
`Pendapatan Token Bulan Ini` (kartu navy dengan sub-CTA `Buka Laporan
Finansial` → navigasi ke `view-reports`/`view-transactions`, tetap satu
endpoint); panel `Statistik Pertumbuhan Pengguna & Dokumen` — grafik garis
mingguan + toggle `7 Hari | 30 Hari Terakhir` di panel; panel `Distribusi
Template` (bar tumpuk + 3 proporsi CV ATS / Resume / Portfolio; tombol `Lihat
Template` → `view-templates`); tabel `Aktivitas Platform & Transaksi Terkini`
(kolom Pengguna / Aktivitas / Detail Modul / Waktu / Status badge) + field
`Filter pengguna / modul…` + tombol `Filter Status` + pagination.
- `Pembaruan otomatis tiap 30 detik` (badge LIVE WORKSPACE MODE) = polling
  30 detik pada endpoint analytics di bawah; saat fetch gagal, kartu tetap
  menampilkan data terakhir + toast gagal + penanda waktu update.
- Jenis aktivitas `Login Baru` di desain **BELUM punya sumber data** (F12 —
  tidak ada log login): hilangkan row-type ini atau tambahkan pencatatan login
  di backend — **PERLU KEPUTUSAN**; jangan fabricate.
- Angka di PNG (24.850 user, Rp148.500.000, dsb.) adalah konten mockup — kartu
  memakai angka riil dari DB.

**Tujuan & manfaat**
Gambaran instan kesehatan platform: pertumbuhan user, produksi dokumen,
transaksi & pendapatan top-up (simulasi), untuk keputusan operasional harian.

**Subhalaman & navigasi**: satu view `view-dash` (tidak ada subkanal). Pilih rentang
waktu: `7 hari | 30 hari | semester | custom (date-input)`.

**Komponen UI (kartu + tabel)**
| Kartu | Nilai (rumus) | Sumber DB |
|---|---|---|
| Total user | `COUNT(users)` | `users.created_at` |
| Pertumbuhan user | `COUNT(created_at >= X)` vs periode sebelumnya (persentase) | idem |
| User baru | bonus transaksi `signup_bonus` vs periode sebelumnya | idem |
| Dokumen dibuat | `COUNT(documents WHERE user_id != 0)` + pertumbuhan | `documents.created_at` |
| Dokumen per tipe | group by `type` (ATS CV / Visual Resume / Web Portfolio / Cover Letter) | `documents.type` |
| Template populer | group by `document_details.payload->layout` (menggantikan versi template yang ada di CV yang dibuat; F8) | `document_details.payload` |
| Statistik generate CV | `COUNT(point_transactions type='usage')` + konsumsi poin | `point_transactions.type` |
| Ringkasan transaksi | jumlah `success` + `failed` + `pending` + nilainya; **pendapatan hanyalah transaksi status `success` fitur simulasi** | `point_transactions.status, amount` |
| Tabel top-up per metode (opsional) | group by `payment_method` | `point_transactions.payment_method` |

**Aksi & form**: klik kartu → dashboard belum membuka detail; rentang waktu
form-band. Filter memilih menggunakan`: input.date` (periode) kebencuk setiap ini
menganchor ke `created_at` (bukan waktu update). Klik `Buat penjelasan (chip) `
(default "Semua waktu" vs custom). Modification *use-case* unchanged.

**Alur admin**: buka `admin.html` → `view-dash` → pilih periode → kartu update
(server-side recompute) → klik "Dokumen per Tipe" chips → tabel ringkasan
divenci. Semuaia di-card multi-tier (read-only).

**States** (konvensi Bagian 2): skeleton saat fetch; toast gagal bila error
server; konfirmasi retain; kartu `0` tanpa error.

**Data sumber / Endpoint / File**
| Yang dibutuhkan | Sumber |
|---|---|
| Endpoint baru | `GET /backend/admin/analytics.php?period=7d|30d|custom&from&to` → `{ok, users_total, users_growth, docs_total, docs_growth, docs_by_type:{}, template_usage:{}, generates:{count,total_points}, transactions:{success,pending,failed}, revenue:{total,by_method:{}}}` |
| File backend | `backend/admin/analytics.php` (baru); ble apo table F6/F7 keno agar-changes |
| File frontend | `src/admin/views/dashboard-analytics.ts` (baru), `src/admin/dashboard.html` (baru) |
| DB | tidak ada tabel baru — agregasi SQL on-the-fly (F6, F7) |

**Kebutuhan baru**: tabel `{}` rupiah aggregate via SQL; caching in-file
(opasional, sesuaikan PERLU KEPUTUSAN). Eksekusi si SQL ter-quote dan menggunakan `DATE(created_at)` (bukan string).

**Perlu keputusan (business)**: PERLU KEPUTUSAN apakah "template populer" dihitung
dari `layout` (F8) yang hanyalah pilihan di form CV, atau dihitung dari tabel
template baru (Menu 2) yang akan muncul.

**Acceptance criteria**: semua kartu menampilkan angka; filter periode
memengaruhi setiap kartu; tidak ada endpoint lain yang terpanggil; angka cocok
pada query DB sederhana yang setelar.

**Skenario uji**
1. user baru daftar (bonus 2 poin) di hari ini → kartu "User Baru" bertambah.
2. generate CV 1x → kartu "Generate" bertambah 1, poin −1.
3. transaksi `pending` tidak menambah revenue; `failed` tidak menambah revenue.
4. memilih periode 7 hari mengubah semua kartu.

---

### Menu 2 — Manajemen Template (CV ATS, Resume, Web Portfolio)

**Status kebutuhan:** PERLU DIBUAT (tidak ada tabel template di DB, tidak ada
endpoint, tidak ada CRUD UI; template saat ini hardcoded — F8).

**Desain patokan (UI terkunci)**: mengikuti `Manajemen Template CV - JagoCV Admin.png` (Bagian 1.7, D4/D5/D6/D10).
Susunan halaman sesuai desain: breadcrumb kecil `KATALOG DESAIN & DOKUMEN •
Engine Core v2.4`; header `Katalog & Manajemen Template CV` + tombol `+ Tambah
Template Baru`; 3 kartu ringkas jumlah template per kategori (CV ATS / Resume
/ Portofolio — varian warna mint/rose/navy D4); bar chip filter `Semua
Template (N) | ATS-Friendly (N) | Resume Visual (N) | Portofolio (N) |
Arsip/Nonaktif` + search `Cari nama template / tag…` (D5); info banner
aturan bisnis penonaktifan template (D6); grid kartu template sesuai D10
(thumbnail, badge `● Aktif` / `● Draft`, tag chip kategori/ATS Verified,
nama + chip versi, metrik penggunaan, toggle Aktif/Nonaktif, tombol `Edit`,
menu `⋮`).
- Metrik kartu yang **belum punya sumber** (rating desain ★, "Paling
  Diminati", "conversion rate ATS Pass") jangan ditampilkan sebelum
  sumbernya ada; `Total Penggunaan` boleh dihitung dari COUNT dokumen yang
  memakai template (bila Menu 2 punya `template_id` pada dokumen) — metrik
  minimal lain: **PERLU KEPUTUSAN**.
- Kartu `● Draft / Dalam Pengujian` pada desain (template "Academic &
  Research CV" v2.5 Beta) menunjukkan bahwa status pipeline bisa lebih dari
  draft/published: minimal implementasi `draft|published`, enum lanjutan
  `beta/testing` — **PERLU KEPUTUSAN**.
- Form fields CRUD di bawah tetap dipakai; tatapannya berubah (**modal**
  `+ Tambah Template Baru` / Edit sesuai perancangan guru di atas).

**Tujuan & manfaat**
Admin mengelola katalog template sehingga template yang tersedia bagi user bisa
diatur tanpa mengubah kode frontend; admin yang dianugerah (terlihat, dianjurkan
via tabel template).

**Subhalaman & navigasi**
- `view-templates` (daftar, filter kategori & status).
- `view-templates-new` (form pembaruan/berdasak ada).
- Template detail (preview + metadata).

**Komponen UI / tabel**
UI grid kartu template (pola kartu thumbnail di `views/dashboard.ts`).
Kolom tabel untuk mode list: `ID, Nama, Kategori (CV ATS/Resume/Portfolio),
Thumbnail, Thumbnail, status (Draft/Published), Desain JSON URL, dibuat,
diperbarui`.

**Aksi / form / validasi**
- Tombol: `+ Template Baru`, edit (pencil), publikasi / draft, thumbnail,
  duplicate (opsional).
- Form fields: `name`, `category` (enum: CV ATS | Resume | Web Portfolio),
  `description`, `thumbnail_url` (URL/gambar), `status (draft/published)`,
  `config_json` (editor textarea JSON dengan validasi `JSON.parse`).
- Validasi: name wajib ≤100; category wajib valid; thumbnail_url wajib
  https://… URL valid; `config_json` harus object JSON valid (nyimpan sebagai
  JSON, bukan string) ; deletion tidak diperbolehkan bila digunakan oleh dokumen.
- Dialog konfirmasi: setiap publis/unpublis/hapus.

**Alur admin**
1. Buka template → grid ter-load.
2. Klik `+ Template Baru` → modal `Template Form` → isi title, kategori,
   thumbnail, isi config JSON → coba render preview mini menggunakan renderer
   (yang ada di user app: `updateCvLivePreview`-like mini renderer via
   sanabilaton live) → save.
3. Template manage → select rows → action bulk "Publish"/"Unpublish" (progress
  棵; rows untuk template).
4. Template digunakan user di UI user (bila publish yang digunakan) is
   mengethod the using (bagi user, kemunculan kartu template), lalu mengontrol
   untuk admin. Template create/edit "legacy` codense semua yang dibuat adalah template standat).

**States**: skeleton load; empty state (0 template) dengan CTA "+ Template Baru";
tolongin bad-form endpoint gagal; toast bila berhasil publish. 
**Error states**: name/kategori/jumlah tidak valid → inline error; delete template
yang sedang dipakai → toast error + suggestion "Set non-publikasi dulu".

**Data sumber / Endpoint / File**
| Yang dibutuhkan | Sumber |
|---|---|
| Tabel DB baru | `templates` (`id`, `name`, `category` ENUM('CV ATS','Resume','Web Portfolio'), `description`, `thumbnail_url`, `config_json` JSON, `status` ENUM('draft','published'), `created_by` FK→users, `created_at`, `updated_at`) + **migrasi mengisi seed** dari F8 (3 layout CV user: standar/tech/entry sebagai template awal CV ATS). |
| Endpoint admin baru | `GET /backend/admin/templates.php` (list+filter+pagination); `POST /backend/admin/templates.php` (create); `PUT /backend/admin/templates.php` (update); `DELETE /backend/admin/templates.php` (hapus, cek terpakai). |
| Endpoint user baru | `GET /backend/templates.php` (publik, no-auth; **is_active/published only**; dipakai app user di view user sebagai kode dropdown formulir di static HTML saat ini) — **PERLU KEPUTUSAN** bagian integrasi (lihat bawah). |
| File backend | `backend/admin/templates.php` (baru), `backend/templates.php` (baru), `database/templates.sql` (baru) |
| File frontend admin | `src/admin/views/templates.ts` (baru), `src/admin/templates.html` (baru) |
| File frontend user (integrasi) | ubah `src/html/create-cv.html` (render kartu layout dinamis) atau tetap hardcoded pada menu perlu — **PERLU KEPUTUSAN** |
| Komponen reusable | toast, modal generik, filter chip (`dashboard.ts`) |

**Kebutuhan baru/risiko**
- Renderer CV user saat ini **hardcoded 3 layout** (`updateCvLivePreview` & `renderCvResult`
  di `cvData.ts`). Biasika template dinamis menjadi viewer JSON render —
  **PERLU DIUBAH** jika template harus mampu lebih dari 3 layout; jika template
  hanya menglontransformation 3 layout yang ada, cukup meng-host (mapping)
  name/kategori thumbnail → layout CHIP enum.
- Resume/Portfolio builder (`resume-builder.ts`, `portfolio-builder.ts`)
  belum menyimpan hasil ke DB (F10, F12); jika template kategori Resume/Portfolio
  akan dipakai user, generate harus menyimpan `documents.type` yang sesuai —
  **PERLU DIUBAH / PERLU DIBUAT**.

**Perlu keputusan (business)**
1. Apakah template dinamis harus menggantikan desain CV hardcoded atau hanya
   jadi katalog + thumbnail (form tetap 3 layout)?
2. Apakah Resume/Portfolio yang saat ini masuk mock harus didukung fitur
   template lebih dulu (tidak mungkin passive, sebelum generate pull data)?
3. Menggunakan th buat cardboard katalog template (pola `dashboard.ts`).

**Acceptance criteria**
- Admin dapat CRUD template; form tersimpan di tabel `templates`; tidak bisa
  menghapus template yang terpakai.
- Template non-published/privasi non-publish tidak mengharap halaman user
  yang satisfy (deployable CV app)
- Validasi form tidak memperbolehkan default field `name/kategori`.

**Skenario uji**
1. Create template baru category CV ATS → muncul di admin grid AND (bila TERPUBLIKASIKAN di) di halaman user.
2. Update `status` ke `draft` pada template yang dipakai dokumen lama → snapshot dokumen lama TIDAK berubah (`document_details.payload` sudah tersimpan).
3. Lakukan invalid JSON config → form menampilka error inline.
4. Template delete yang belum digunakan → dialog konfirmasi → meterol; template
   terpakai gagal dengan pesan yang mudah dimengerti.

---

### Menu 3 — Manajemen User

**Status kebutuhan / sub-set fitur**:
- **SUDAH ADA (data saja, jangan UI): tabel perilakan** — `users` punya semua kolom
  yang dipakai (F6): nama, email, provider, plan, points, avatar, role (profesi).
- **SUDAH ADA / PERLU DIUBAH**: profil field edit (nama/email/role/avatar) pada user
  kali edit aktual app: UI edit app milik user memanggil `update-profile.php`
  yang belum ada (F10). Untuk admin: **PERLU DIBUAT** `update-profile.php`
  versi admin.
- **PERLU DIBUAT**: suspend/ban/reset password/koreksi point.

**Tujuan & manfaat**
Melihat & mengelola akun: mencari user, melihat detail akun (paket, poin,
dokumen), mengubah status akun, koreksi poin bila ada masalah top-up.

**Desain patokan (UI terkunci)**: mengikuti `Manajemen User & Dokumen - JagoCV Admin.png` (Bagian 1.7, D4/D5/D7/D8). Desain gambar tersebut untuk halaman **User & Dokumen** — satu menu yang menggabungkan Menu 3 (list user) + Menu 4 (tabel dokumen sebagai tab).
Susunan halaman sesuai desain: header `Manajemen Pengguna & Dokumen`; 4 kartu
ringkas: `Total Pengguna`, `Pengguna Aktif` (+% retensi), `Dokumen
Digenerate`, `Akun Ditangguhkan` (varian warna mint/navy/putih/rose); bar
pencarian `Cari nama atau User ID…` + chip `Semua Status | Aktif | Nonaktif |
Memiliki Transaksi Top Up` + tombol `Export CSV` (arah ke Menu 10); tabel
`Daftar Pengguna Aktif & Terdaftar` sesuai D7: checkbox multi-select,
PENGUNA (avatar inisial + nama + chip `USR-###` + email), STATUS AKUN (●
Aktif / ● Dinonaktifkan), SALDO POIN AI (ikon koin + N Poin), TOTAL DOKUMEN,
AKSI = ikon per baris: folder (buka dokumen user), pensil (edit), ⊘
(nonaktifkan); untuk akun dinonaktifkan ikon berubah: kunci-terbuka
(aktifkan kembali), tempat sampah (hapus, type-to-confirm Bagian 2); footer
pagination server-side D8.
- Chip ID `USR-####`: format tampilan publik = `USR-` + `users.id` yang
  di-pad (contoh desain 8821); jangan buat kolom DB baru untuk ini.
- Filter `Memiliki Transaksi Top Up` = EXISTS row `point_transactions` type
  `purchase` milik user tersebut (SUDAH ADA, F7).
- Teks `Enkripsi AES-256 aktif pada kolom kredensial` di header-tabel desain
  adalah **klaim atas fitur keamanan**: jangan tampilkan sebelum benar-benar
  diimplementasi — **PERLU KEPUTUSAN** implementasi (cangkupan kolom, token) atau hapus teks ini di UI.
- Status akun di desain memakai label `Aktif / Dinonaktifkan` — cukup
  sederhana, sementara nonaktif-vs-banned dibedakan di bagian status (di
  detail user full label `aktif / suspended / banned`);ensi metes pemutusan
  tetap di bawah `users.status`.

**Subhalaman & navigasi**
- `view-users` — daftar + filter.
- `view-users-detail/:id` — detail lengkap akun + dokumen + transaksi.

**Komponen UI / kolom tabel**
| Kolom | Sumber |
|---|---|
| `ID, Nama (first+last), Email` | `users` |
| `Provider` (chip local/google) | `users.auth_provider` |
| `Plan` (chip free/pro/business) | `users.plan` |
| `Poin` | `users.points` |
| `Status` (Aktif/Suspended/Banned) | baru — `users.status`; FAKTA: kolom ini belum ada |
| `Dokumen` (count) | `COUNT(documents WHERE user_id)` |
| `Terdaftar` | `users.created_at` |

Filter chips: `provider = | plan | status | terdaftar rentang | punya dokumen |` + search `q`
(email/nama/substring).

**Aksi & form**
- `view-users`: search, filter, pagination; aksi per-row → detail.
- `view-users-detail`:
  - Info akun: profil, plan, poin, provider, avatar, keuntungan terdaftar,
    kolom, drop-down dipoole (read-only).
  - Aksi:
    1. **Edit profil** (nama/email/role/avatar) — form; validasi sama dengan
       aturan server user (`register.php`: name ≤100, email valid; dan `email`.
       Komitmen email perlu cek unique — **PERLU DIBUAT** `admin inline check`).
    2. **Koreksi poin** (tambah/kurang) — form `{delta, reason}`; alasan wajib;
       ditulis sebagai baris `point_transactions` (`type` baru `admin_adjust`) —
       **PERLU DIBUAT**: menambah nilai ENUM harus migrasi.
    3. **Ubah status** — select (aktif/suspended/banned) + dialog konfirmasi +
       alasan wajib.
    4. **Reset password** — modal → tulis `password_hash` baru → kirim link?        via infrastruktur email yang BELUM ADA di project ini — kebetulan
       **PERLU DIBUAT** infrastruktur email ATAU dipilih mekanisme manual
       sementara — **PERLU KEPUTUSAN**).
    5. **Hapus akun** — modal konfirmasi type-to-confirm email; cascade FK
       (`documents`/`point_transactions`/`cv_drafts`) otomatis — FAKEA (cascade
       didefinisikan di scheme F6).
- Chart tapak profession skill (profil telolet) — *bukan* role admin (F4;
  jangan samakan).

**Alur admin**
1. Buka users → search "budi" → baris user → klik baris akan menguasai detail.
2. Detail → tab "Transaksi Poin" → temukan transaksi `pending` menggang.
3. Admin menjalankan decoded menu `Koreksi Poin` → menulis `+5` karena
   kegagalan top-up (transaksi bersih via void di Menu 5) → konfirmasi → toast.
4. Setiap tindakan untuk `update` menabling audit log (Bagian 2 kolom).

**States**: konvensi Bagian 2; **error unik**: hapus admin lain → toast error
"tidak dapat menghapus admin" — PERLU DIBUAT guard.
**Empty state**: hasil pencarian 0 → CTA "reset filter".

**Data sumber / Endpoint / File**
| Yang dibutuhkan | Sumber |
|---|---|
| DB baru | kolom `users.status` ENUM('active','suspended','banned') DEFAULT 'active'; kolom point_transactions `type` + `admin_adjust`; **PERLU DIBUAT** |
| Table existing | `users`, `documents`, `point_transactions`, `cv_drafts` (lengkap F6) |
| Endpoint baru | `GET /admin/users.php` (list+search+filter+page), `GET /admin/users.php?id=` (detail), `PUT /admin/users.php` (profil), `POST /admin/users.php` (koreksi poin, ubah status, reset password), `DELETE /admin/users.php` (hapus) |
| File backend | `backend/admin/users.php` (baru); koreksi poin memakai `admin/users.php` + migrasi DB |
| File frontend | `src/admin/views/users.ts` (baru), `src/admin/users.html` (baru), `src/admin/views/users-detail.ts` (baru) |
| Reuse | `public_user()` (helpers.php) tanpa password; badge plan/status |

**Kebutuhan baru / risiko**
- **PERLU DIBUAT** guard: pengelimus ahrom semell danger untuk mengirim email —
  kata awal user transaksi kom mulai user rule keep safe.
- **PERLU KEPUTUSAN**: hukum alasan reset password tanpa email. Alternatif:
  akun no admin dari DB (needs business decision).

**Acceptance criteria**
- Admin dapat mencari user berdasarkan nama/email; filter & pagination berfungsi;
- detail memosum Google UC documen; kam berbin;
- koreksi poin menulis BOTH `users.points` dan `point_transactions` (type
  `admin_adjust`) — bukan hanya satu;
- destruktif butuh confirm type-to-confirm;
- sebuah ikon yang "user terhapus" berikan di card detail. 

**Skenario uji**
1. Search email + filter `provider=google` → hasil sesuai.
2. Koreksi +5 poin: users.points bertambah 5; muncul row `point_transactions`
   (−5 bila negatif); tidak transparance data.
3. Ubah status banned → teba `users.status` = banned; (admin bisa "unban") — diri
   database tanpa junk.
4. Reset protok保密 email → entri tampil di audit log; user terkait tidak menerima
   dan sukses serangan.
5. Non-admin mencoba admin endpoint → 403, data tidak terbaca.

---

### Menu 4 — Monitoring Dokumen & Aktivitas

**Status kebutuhan:** PERLU DIBUAT untuk sisi admin (UI, filter, endpoint).
Data mentah dokumen CV yang benar sudah ada di DB — `documents` +
`document_details` (FAKTA, F10); riwayat aktivitas terbatas pada yang sudah
direkam backend (F12); data resume/portfolio belum tersimpan (`F10`).

**Tujuan & manfaat**
Admin melihat semua dokumen yang dihasilkan user (jenis, template, waktu,
status) dan riwayat aktivitas yang direkam backend — bukan untuk mengedit
dokumen, tapi untuk diagnosa bila ada masalah generate.

**Subhalaman & navigasi**
- `view-documents` — tabel semua dokumen + filter.
- `view-documents-detail/id` — payload form CV (read-only) + draft bila ada.
- `view-activity` — riwayat aktivitas memakai only sumber **yang sudah ada**:
  `point_transactions`, `documents.created_at`, `cv_drafts.updated_at` (F12).
  Jangan menampilkan data yang tidak benar-benar direkam backend — koordinasi
  sumber data dengan Menu 12.

**Komponen UI / kolom**
| Kolom | Sumber |
|---|---|
| `doc_code, title` | `documents` (FAKTA: doc_code `DOC-####` generate `cv.php`) |
| `Jenis` | `documents.type` |
| `Pemilik` (nama+email) | JOIN `users` |
| `Status` | `documents.status` (Draf/Selesai/Diterbitkan badge reuse) |
| `Layout/Template` | `document_details.payload->layout` (FAKTA CV only) |
| `Dibuat` | `documents.created_at` |

**Aksi & form**
- Filter: jenis, status, periode, pencarian (doc_code/title/email).
- Aksi read: `Lihat detail` (payload), `Unduh PDF` (via print pattern).
- Aksi admin (opsional/dengan konfirmasi): reset `status`; `hapus dokumen`.
  Setiap write → audit.
- **PERLU DIBUAT**: jika decide via VM baseline.

**Alur admin**
1. Buka `view-documents` → filter `status=Selesai` + tanggal hari ini.
2. Klik baris → detail → payload JSON form CV untuk diinginkan
   (verify bila user melaporkan hasil generate salah).
3. Selesai — tidak ada write ke hasil CV (kecuali hapus).

**States**: konvensi Bagian 2; empty state "Belum ada dokumen yang cocok filter".

**Data sumber / Endpoint / File**
| Yang dibutuhkan | Sumber |
|---|---|
| DB | `documents`, `document_details`, `cv_drafts` — **SUDAH ADA** (F6) |
| Endpoint baru | `GET /backend/admin/documents.php` (list+filter) & `?id=` detail payload; `DELETE` opsional |
| File backend | `backend/admin/documents.php` (baru) |
| File frontend | `src/admin/views/documents.ts`, `documents-detail.ts` (baru) |
| Reuse | badge status (`dashboard.ts`), payload render mini (`cvData.ts`, judul read-only) |

**Kebutuhan baru**
- **PERLU DIBUAT**: sumber data yang belum tersedia data resume/portfolio
  (F10) — untuk saat ini admin hanya akan melihat dokumen ATS CV, kecuali
  fitur resume/portfolio disimpan dulu ke backend (PERLU KEPUTUSAN: apakah
  scope termasuk resume/portfolio setelah datanya tersedia).
- **PERLU DIBUAT**: endpoint activity log tabel generik (Menu 12)

**Acceptance criteria**
- Filter daftar dokumen berfungsi: doc_code, title, jenis, status, periode,
  pemilik (nama/email).
- Detail payload CV (`document_details.payload`) tampil read-only dan lengkap.
- Tidak ada kolom data sensitif yang terekspos di tabel.
- Aksi delete/hapus status selalu melewati dialog konfirmasi + audit log.

**Skenario uji**
1. User menyimpan CV lewat halaman user → dokumen muncul di tabel admin
   dengan metadata lengkap.
2. User menghapus draft CV (`DELETE cv.php?draft=1`) → tabel `cv_drafts`
   kosong untuk akun itu, namun list dokumen admin tidak berubah.
3. Filter `type='ATS CV' AND status='Draf'` → daftar kosong dengan empty state.

---

### Menu 5 — Monitoring Transaksi & Kendala Top-Up

**Status kebutuhan:** PERLU DIBUAT (markdown transaksi poin & status tersedia — F7;
kumpulan data "kenal kendala" filing itu deployer lebih lanjut).

**Tujuan & manfaat**
Admin memantau transaksi top-up (berhasil/pending/gagal) dan menangani kendala:
membuat ulang status, memverifikasi transaksi bermasalah, voiding transaksi
`pending` yang kedaluwarsa (gap terbuka karena tidak ada cron — FAQTE FAKTA
`expires_at` hanya simpan tempat).

**Subhalaman & navigasi**
- `view-transactions` — tabel; filter status/period/method.
- `view-transactions-detail` — detail akuisasi (transaksi + user + alur void/refund).

**Komponen UI / kolom**
| Kolom | Sumber |
|---|---|
| `payment_ref` (JCV-...) | `point_transactions.payment_ref` |
| `User` | JOIN users |
| `Tipe` (purchase/usage/signup_bonus/admin_adjust) | `point_transactions.type` |
| `Poin (+/−)` | `point_transactions.points` |
| `Nominal` | `point_transactions.amount` (0 bila bukan purchase) |
| `Metode` (QRIS/...) | `point_transactions.payment_method` |
| `Status` (Berhasil/Pending/Gagal — reuse badge point-história) | `point_transactions.status` |
| `Dibuat / Kedaluwarsa` | `created_at`, `expires_at` (FAKTA: expires_at disimpan di response checkout, ≠ kolom tabel — lihat bagian Kebutuhan Baru) |

Filter: status, tipe, metode, periode, user; pencarian `q` (payment_ref/email).

**Aksi & form**
- Lihat detail (readonly), **Void transaksi pending** `{reason wajib}` —
  set status `failed`, dialog konfirmasi, audit.
- **Refund manual** (opsional, PERLU KEPUTUSAN): baris `point_transactions`
  correction ref (type `admin_adjust`urchase literals) (`ges disimpan` dengan
  negative) — tidak mengubah baris asli.
- **Tandai sebagai kendala** (opsional): catatan mengemukakak — combo write audit;
  dengan ENDPOINT catatan `payment_ref` kadang berbeda (F12).
- Ulang (retry) — abbreviated `messages` — PERLU KEPUTUSAN (business).

**Alur admin (kendala top-up), end-to-end**
1. User melapor "top-up tidak masuk" (Menu 8 Feedback) dengan `payment_ref`.
2. Admin search `payment_ref` di view-transactions → status masih `pending`
   dan `expires_at` sudah lewat → aksi **Void** + alasan → konfirmasi.
3. Admin ke Menu 3 (detail user) → koreksi poin bila user butuh manual
   (+N, `reason`).
4. Semua steps video audit log (Menu 9).

**States**: konvensi Bagian 2; success/failed badge reuse rowTemplate;
`already:true` idempotent — admin UI harus menampilkan pesan ini apa adanya.

**Data sumber / Endpoint / File**
| Yang dibutuhkan | Sumber |
|---|---|
| DB | `point_transactions` — **SUDAH ADA**; kolom baru `note` (opsional) **PERLU DIBUAT** |
| Endpoint baru | `GET /backend/admin/transactions.php` (list+filter), `GET ?ref=` detail, `POST /backend/admin/transactions.php` (void/refund) |
| File backend | `backend/admin/transactions.php` (baru) |
| File frontend | `src/admin/views/transactions.ts`, `transactions-detail.ts` (baru) |
| Reuse | `rowTemplate`, `statusBadgeClass`, `formatRupiah` (`point-history.ts`) |
| Kontrak konsisten | re-PEND and Tek DOI ID ORDER     |

**Kebutuhan baru / risiko**
- FAKTA: `expires_at` di-generate checkout (`gmdate`+3600) hanya dikirim di
  respons, **tidak disimpan di tabel** — supaya admin bisa filter kedaluwarsa,
  perlu menambah kolom `expires_at DATETIME` di `point_transactions`
  (**PERLU DIBUAT / spesifikasi migrasi**), agar void kedaluwarsa mengalir.
   - Alternatif: hitung `created_at + INTERVAL 1 HOUR` di SQL tanpa kolom —
     sempurna bila aturan 1 jam tetap konstanta release — **PERLU KEPUTUSAN**.
- **PERLU DIBUAT**: penulisan status after settle di `payment-ref`.
- FAKTA: `update confirm.php` idempotent — admin view-void harus menjaga
  bahwa keep `pending`.

**Acceptance criteria / skenario uji**
1. Filter status pending → list transaksi pending. 
2. Void transaksi pending valid konfromasi & alasan → status jadi `failed`,
   poin tidak berubah; audit log  wpisali.
3. Void transaksi sudah `success` (sudah dipakai) → response 409 "sudah
   succeeded"; TIDAK mengubah user.points.
4. Refund manual → menambah row correction +N, tidak memodifikasi row asli.
5. Non-admin → 403 tanpa data lcuanyos.

---

### Menu 6 — Manajemen Harga (paket top-up)

**Status kebutuhan:** PERLU DIBUAT (data `topup_packages` SUDAH ADA di DB dan
dibaca `packages.php` termasuk `is_active` (F6/F5); endpoint CRUD admin
belum ada).

**Tujuan & manfaat**
Admin mengatur harga/point/status aktif tiap paket tanpa deploy; perubahan
harga **tidak boleh mengubah transaksi lawas** (harga dipotret di
`point_transactions.amount`, bukan dari join current `packages`).

**Subhalaman & navigasi**: `view-pricing-admin` satu view dengan tabel paket
+ modal Edit (3 paket seed: basic 19000/1poin, pro 49000/3, premium 99000/10 — F6).

**Komponen UI / kolom**: `Code, Nama, Harga (Rp), Poin, Fitur (multiline), is_active (toggle), diperbarui`.

**Aksi & form / validasi**
- `+ Paket` (opsional), `Edit`, `Aktif/Nonaktif` toggle (perlu konfirmasi toggle),
  `Riwayat harga` (read-only, di audit log Menu 9).
- Form: `name`, `price` (angka bulat ≥ 0), `points` (bulat > 0), `features`
  (textarea per-baris; dipisah newline), `is_active`.
- Validasi server: price integer; points integer > 0; code unique (409).
- **Aturan bisnis wajib**: TIDAK mengedit nilai transaksi lama. Harga yang
  dipotret user saat checkout ternyata sudah disimpan sebagai
  `point_transactions.amount` di row transaksi (FAKTA `checkout.php`) —
  perubahan `topup_packages.price` tidak akan memengaruhi transaksi old. —
  **SUDAH ADA** *desain ini sudah benar*; pastikan endpoint admin TIDAK
  menulis ulang row transaksi lama.

**Alur admin**
1. Buka Harga → pilih paket "Pro" → Edit → ubah 49.000 → 59.000 → alasan
   (wajib) → konfirmasi → save → verifikasi bahwa transaksi lama tetap
   menyimpan harga lama (Rp49.000).
2. Nonaktifkan paket "Basic" → dialog → `is_active=0` -> package di harga
   user list `packages.php` tidak lagi muncul (FAKTA file memfilter
   `is_active=1`).

**States**: konvensi Bagian 2.

**Data sumber / Endpoint / File**
| Yang dibutuhkan | Sumber |
|---|---|
| DB | `topup_packages` — **SUDAH ADA** (F6) |
| Endpoint baru | `GET/POST/PUT /backend/admin/packages.php` (+`is_active` toggle) |
| File backend | `backend/admin/packages.php` (baru) |
| File frontend | `src/admin/views/pricing-admin.ts`, `pricing-admin.html` (baru) |
| Sudah kadang bersangkutan | `backend/packages.php` membaca `is_active` (SUDAH ADA); fallback konstan di `packages.php` akan jadi sumber harga bila tabel kosong — pastikan admin tetap menyediakan seed data |
| Risk | `checkout.php` punya fallback constant harga bila tabel tidak ada — hapus fallback tersebut setelah Menu 6 live (PERLU DIUBAH — single source of truth) | 

**Acceptance criteria / uji**
1. Ubah harga basic → setelah itulah packages list di user menampilkan harga
   baru; transaksi lama tidak berubah;
2. Is_active=0 → packages PHPtidak list match atau fallback, tidak ada lebih
   purge;
3. Non-admin memanggil endpoint admin → 403; audit log failed action juga
   menambakak (	required).

---

### Menu 7 — Pengaturan API AI

**Status kebutuhan:** PERLU DIBUAT
- Integrasi AI belum ada (`@google/genai` tak dipakai; chat mock — F9).
- Simpan key server-side; haruse diakses backend saja.

**Tujuan & manfaat**
Mengelola kunci API generator (mis. Gemini) tanpa deploy; key **tidak pernah**
dikirim ke frontend, tidak ditulis ke log, hanya di backend.

**Subhalaman & navigasi**: satu view `view-ai-config` — status provider,
key aktif (tersembunyi, hanya 4-char terlihat), tombol ganti/rotere, toggle
"fitur aktif".

**Komponen UI**: status chip, textbox password, tombol `Simpan`, `Ganti` (modal +
`retype layer bila config type`), tombol `Test koneksi` (opsional) — serta sekali
tampilkan tampilan mask key (*** final 4-character only).

**Aksi & form**
- Simpan key baru (POST) — `type=password` input; backend validasi non-empty
  format `AIza…` (kalau Gemini) — **PERLU DIBUAT**.
- Aktif/Non-aktif integrasi AI (per konfirmasi; memengarwa konfigurasi runtimes).
- **TIDAK BOLEH**: send raw keyotha back to the client (reference indicates di
  Bagian 1.5). likha dikirim key ketika "Test koneksi" — backend internal.

**Alur admin**
1. Buka view-ai-config → status "Key belum diatur".
2. Paste key → save → backend simpan encrypted di config table (tabel baru,
   BUKAN file .env supaya bisa dirotasi via UI); response HANYA
   `{ok:true, last4:"f3Xe", updated_at}`.
3. `Test koneksi` → backend memanggil API dengan key dari server (luar一遍
   dari frontend); kembalikan sukses/failed dan biaya/bangai — **PERLU DIBUAT**.
4. Rotasi key tulis audit log (mengahapus last 4 lama → last baru).

**States/entities/concession**: terkripsi dengan enkripsi AES di server
-secret store: new table `settings` (key, value, updated_by) — **PERLU DIBUAT**;
setema TIDAK me-log key ketika error API (log hanya message generic error).

**Data sumber / Endpoint / File**
| Yang dibutuhkan | Sumber |
|---|---|
| DB baru | `app_settings` (key PRIMARY, value: text, updated_by FK, updated_at) — **PERLU DIBUAT** |
| Endpoint baru | `GET /backend/admin/ai-config.php` (status + last4 only); `POST` (set key); `POST ?action=test` |
| File backend | `backend/admin/ai-config.php` (baru); helper enkripsi (`backend/crypto.php` — **PERLU DIBUAT**) |
| File frontend | `src/admin/views/ai-config.ts` (baru) |
| Terkait | `vite.config.ts:142` men-define `GEMINI_API_KEY` ke client bundle — **PERLU DIUBAH** (hilangkan: ini kebocoran bila key diisi; pindahkan ke server-side konfigurasi) |

**Kebutuhan baru / risiko**: ini adalah fitur yang memerlukan desain konsumen AI
yang tidak ada (F9) — ingat bahwa tanpa generate AI di halaman user,
AI config hanya menyimpan key. **PERLU KEPUTUSAN**: provider mana (Gemini?),
model default, cost tracking — belum ada data ratio.
**PERLU KEPUTUSAN**: enkripsi at-rest vs environment variable.

**Acceptance criteria / uji**
1. Key yang disimpan tidak muncul kembali; hanya last-4 visible.
2. Key tidak ditulis log backend (grep log file — tidak ada `AIza`).
3. Key tidak ada di bundle frontend (`grep key path dist/*.js`).
4. Response test koneksi menampilkan "success/failed" TANPA menampilkan key.
5. Non-admin endpoint kemid 403.

---

### Menu 8 — Feedback & Laporan Pengguna

**Status kebutuhan:** PERLU DIBUAT (tidak ada UI feedback di halaman user, tidak
ada tabel, tidak ada endpoint — verifikasi pencarian `feedback|keluh|saran` di `src/`
hanya menemukan kata "laporan" pada context unrelated).

**Tujuan & manfaat**
Tempat pengguna melaporkan kendala (cth. top-up tidak masuk) sebagai
entry-point untuk alur penanganan di Menu 5; admin dapat menutup laporan
dengan status penyelesaian.

**Subhalaman & navigasi**
- User-side (baru): widget/form kecil di dashboard atau profil: kategori
  (Bug/Top-up/Saran/Lain), deskripsi, `payment_ref` (opsional, auto-fill bila
  dibuka dari transaksi), attachment (opsional dilarang di fase 1).
- Admin: `view-feedback` (list) + `view-feedback-detail` (detail + evidence +
  alur status).

**Komponen UI admin / kolom**
`ID (FB-####), user, kategori, subjek, status (Baru/Ditinjau/Ditangani/Selesai/Ditolak), dibuat, update_terakhir` + pencarian/filter per kategori/status.

**Aksi admin**
- Ubah status (dropdown + `note` wajib saat Dinjau/Ditangan/Selesai) —
  dialog confirm untuk Selesai/Ditolak.
- Kaitkan ke `payment_ref` (link HTML klik ke Menu 5 async detail).

**Alur admin (synergy Menu 5)**
1. User submit feedback top-up ref JCV-XXXX → feedback id FB-001 status Baru.
2. Admin Membuka FB-001 → pindah status Ditinjau + note.
3. Lanjut ke Menu 5 → void transaksi pending → kembali ke FB-001 → Selesai
   + note hasil ("poin dikoreksi +3, ref JCV-XXXX"). Status history tersimpan
   (tabel arus).

**Data sumber / Endpoint / File**
| Yang dibutuhkan | Sumber |
|---|---|
| DB baru | `feedback` (id, user_id FK, category ENUM, subject, message TEXT, payment_ref NULL, status ENUM, created_at, updated_at) + `feedback_notes` (id FK, admin_id FK, note, created_at) |
| Endpoint baru user | `POST /backend/feedback.php` (auth user) |
| Endpoint baru admin | `GET/POST /backend/admin/feedback.php` (list, update status, add note) |
| File backend | `backend/feedback.php`, `backend/admin/feedback.php` (baru) |
| File frontend | user: `src/js/utils/feedback.ts` + tombol di `profile.html`; admin: `src/admin/views/feedback.ts` |

**Kebutuhan baru**: **PERLU DIUBAH** pada halaman user (form + endpoint) — ini
fitur cross-side (user + admin); perlu keputusan apakah user-side dibangun
dulu sebelum admin-side (ya — sebaliknya data tidak akan ada).

**Acceptance criteria / uji**: user dapat membuat feedback; admin dapat
mengubah status + note; status history tersimpan; status Terselesaikan tidak
bisa diubah sembarangan; audit log admin note.

---

### Menu 9 — Audit Log

**Status kebutuhan:** PERLU DIBUAT (tidak ada log apa pun di backend selain
`point_transactions` — F12).

**Tujuan & manfaat**
Jejak setiap tindakan admin sensitif: siapa, kapan, apa yang berubah
(before/after), alasan — memenuhi akuntabilitas gohuan Menu 2/3/4/5/6/7/9/13.

**Komponen UI / kolom**

| Kolom | Sumber |
|---|---|
| `Waktu, Admin (id+nama), Aksi (CREATE/UPDATE/DELETE/VOID/ADJUST/CONFIG), Target (tabel+id), Alasan** (bila dicatat), IP, detail before/after (collapsible JSON viewer)** | tabel `audit_logs` baru |

Filter: admin, tabel target, aksi, rentang tanggal; pencarian target_id/ref.
Read-only; TIDAK ada aksi edit/delete (kecuali purge manual oleh superadmin,
opsional — **PERLU KEPUTUSAN** retensi).

**Alur admin**: buka `view-audit` → filter `admin=Budi&action=ADJUST` →
melihat siapa mengoreksi poin berapa/tools, IP? — menuki di privasi IP
(**PERLU KEPUTUSAN**: simpan IP penuh/hight-as-privacy atau mask).

**Data sumber / Endpoint / File**
| Yang dibutuhkan | Sumber |
|---|---|
| DB baru | `audit_logs` (id, admin_id FK, action ENUM, target_table, target_id, before JSON NULL, after JSON NULL, reason VARCHAR NULL, ip, user_agent, created_at) — konsep sama dengan tabel standalone (Bagian 2 kolom "Test soal departemen crypter") |
| Endpoint | `GET /backend/admin/audit.php` (list+filter, pagination) |
| Helper backend | `log_audit($conn, $adminId, $action, $table, $id, $before, $after, $reason)` — dipanggil setiap write endpoint admin |
| File | `backend/admin/audit.php`, di-mod` backend/helpers.php` (tambah helper) |

**Acceptance criteria / uji**: setiap aksi di Menu 2/3/4/5/6/7/13 menampilkan row;
JSON menampilkan diff before/after; filter bekerja; read-only.

---

### Menu 10 — Laporan & Ekspor Data

**Status kebutuhan:** PERLU DIBUAT (satu-satunya "laporan" yang ada adalah
print PDF mutasi poin milik user — `point-history.ts: downloadReport` — bukan
fitur admin; F11).

**Tujuan & manbaat**
Ekspor CSV user/dokumen/template/transaksi sesuai permission; memudahkan
laporan manajemen & akuntansi.

**Komponen UI**: satu view dengan kartu 4 laporan, tiap kartu: pilih rentang
waktu + filter sama seperti tabel masing-masing + tombol `Unduh CSV`.
Kolom CSV = kolom tabel di menu terkait.

**Aksi & alur**
1. Pilih report "Transaksi" + filter status success + periode bulan ini.
2. `Unduh CSV` → `GET /backend/admin/export.php?type=transactions&from&to`
   → respons `text/csv` + `Content-Disposition: attachment`.
3. Backend streaming query PDO ke CSV (prepared statement; batas kolom; jangan
   menulis **`password_hash`, token, api-key, `cv_drafts.payload`** — data
   sensitif; hanya kolom yang ada di tabel UI).

**Data sumber / Endpoint / File**
| Yang dibutuhkan | Sumber |
|---|---|
| Endpoint baru | `GET /backend/admin/export.php?type=users|documents|templates|transactions` |
| File backend | `backend/admin/export.php` (baru); helper `csv_stream()` |
| File frontend | `src/admin/views/reports.ts` (baru) |

**Data sensitif yang dilarang di ekspor (wajib)**: `users.password_hash`,
`users.google_sub`, `cv_drafts.payload`, `document_details.payload`,
`app_settings.value` (API key), `audit_logs` (except superadmin).
**PERLU KEPUTUSAN**: apakah ekspor data PI (email, nama, IP) perlu
anonymization / flag superadmin-only.

**Acceptance criteria / uji**: setiap CSV bisa dibuka Excel; filter CSV
permintaan waktu sesuai; tidak ada kolom-sensitif list; tercatat di audit
("EXPORT"); permission `report.export` (Bagian Menu 11) menentukan type report.

---

### Menu 11 — Role & Permission Admin

**Status kebutuhan:** PERLU DIBUAT — **dengan catatan tegas**: do NOT treat
`users.role` sebagai role admin (FAKTA — kolom itu profesi user; F4).

**Tujuan & manfaat**
Mengatur akses admin granular: minumum `superadmin` (full access) +
role kustom per checkbox permission.

**Desain (minimal, rekomendasi)**
- Superadmin: full (seeded via migrasi, bukan UI).
- Tabel `admin_roles` (id, name, description, is_system) + `admin_permissions`
  (role_id, perm). Penggantian `users.is_admin TINYINT` → `users.admin_role_id`
  FK NULL (is_admin tidak perlu; role_id NULL = user biasa).
- Daftar permission system dari Bagian 1.4/2: `user.read:user.update`,
  `user.delete`, `document.read`, `document.update`, `document.delete`,
  `template.crud`, `package.crud`, `transaction.void`, `ai.config`,
  `feedback.manage`, `report.export`, `audit.read`, `feature.config`.
- UI admin: kanan kelola role: tabel role + form modal (name, pilih checkbox),
  tombol non-aktif (role bila digunakan admin → bisa non-aktif); tidak
  diperbolehkan mengedit `is_system=1` roles.
- Grid permissions setiap role → default check role superadmin all; avoid
  deleting superadmin — guard.

**Data sumber / Endpoint / File**
| Yang dibutuhkan | Sumber |
|---|---|
| DB baru | `admin_roles`, `admin_permissions`; migrasi `users.is_admin` → `users.admin_role_id` (atau两者 mempertahankan `users.is_admin` sebagai injected field) **PERLU KEPUTUSAN** granular vs single-flag |
| Endpoint | `GET/POST/PUT /backend/admin/roles.php` |
| File | `backend/admin/roles.php`, ubah `helpers.php`(`require_admin` membaca permission), Frontend `src/admin/views/roles.ts` |

**Acceptance criteria / uji**
1. Superadmin membuat role "Editor dokumen" hanya `document.read/_update`
2. Assign ke admin baru; Admin itu login → menu pauling dilihat dilakukan
   document; endpoint admin lain 403.
3. Admin TIDAK bisa edit/hapus `is_system` role.
4. Revoke role aktif → periode token parent admin sampling, session tidak
   langsung dicabut (stateless, F3) → admin dulu ke admin token berikutnya —
   PERLU DIKETAHUI sebagai keterbatasan design (doc di dokumentasi).

---

### Menu 12 — Riwayat Aktivitas Pengguna

**Status kebutuhan:** PERLU DIUBAH (sumber yang sudah direkam:
`point_transactions` [FAKTA F12], `documents.created_at`; tidak ada log
aktivitas generik). Jangan mengarang data yang tidak direkam (login IP,
page view, dsb. — tidak ada).

**Tujuan & manbaat**
Meriwayat aktivitas yang relevan admin: bonus pendaftaran, top-up, salah
top-up correlation, generate dokumen, dan perubahan profil (jika endpoint
update-profile G10 akan dibuat).

**Komponen UI**: tab "Timeline" di `view-users-detail`; timeline vertikal
(reuse pola `rowTemplate` di `point-history.ts`) kolom waktu + ikon per tipe.
Filter tipe: registrasi, top-up, generate, perubahan data.

**Data sumber / Endpoint / File**
| Yang dibutuhkan | Sumber |
|---|---|
| DB | `point_transactions` (+ `documents.created_at` — di sacle) — **SUDAH ADA**; kalau tracking profile update ditambah — **PERLU DIBUAT** (bersama endpoint `update-profile.php`) |
| Endpoint baru | `GET /backend/admin/users.php?id=X&include=timeline` (gabung `point_transactions` + `documents` desc created_at) |
| File | `backend/admin/users.php`, `src/admin/views/users-detail.ts` |

**Acceptance criteria / uji**: timeline user menampilkan semua transaksi poin
dari `point_transactions` dengan status; tidak ada data yang ada tidak di
DB (bukan fabricate); filter tipe bekerja.

---

### Menu 13 — Pengaturan Fitur (feature flags)

**Status kebutuhan:** PERLU DIBUAT (belum ada flag apa pun di kode; UI
authenticล user memeriksa config ** hanya hardcoded** semua fitur selalu on).

**Tujuan & manfaat**
Aktif/non-aktif fitur dari server tanpa deploy; FLAG = kebenarannya di sumber
(perlu backend ke semua fitur), bukan **hanya hide UI**.

**Desain**
Tabel `app_feature_flags` (key PRIMARY, enabled TINYINT, updated_by, updated_at).
Flag wajib **dua h brothersnya**:
- Flag diterima user via endpoint (mis. saat `me.php` juga mengembalikan
  `flags` → di-cache user stoored); frontend menampilkan `showToast("Fitur
  dinonaktifkan")` /*/.

Flag yang disarankan (activee by default — PERLU KEPUTUSAN daftar final):
`templates_dynamic` (Menu 2), `ai_generate` (Menu 7), `feedback` (Menu 8),
`portfolio_export`, dsb. tiap flag harus punya backend merespons **dengan
tonal** (e.g., `templates.php` kembalikan 404/flags-off; generate-card
membaca flag dari me.php).

**Aksi admin**: toggle per-flag + reason (opsional) → confirm → audit log.

**Data sumber / Endpoint / File**
| Yang dibutuhkan | Sumber |
|---|---|
| DB baru | `app_feature_flags` (key, enabled, updated_by, updated_at) |
| Endpoint | `GET/PUT /backend/admin/flags.php` (admin); flag juga di-strim via `me.php` (client cache) — **PERLU DIUBAH** `me.php` (+ `public_user`)? lebih segar sendiri di `GET /backend/flags.php` public no-auth, atau via `me.php` setelah login |
| File | `backend/admin/flags.php`, `frontend src/admin/views/flags.ts`; user app yang bergantung flag: create-cv.html, resume/portfolio builder |

**Acceptance criteria / uji**
1. Toggle `ai_generate` off → user yang refresh tidak melihat tombol generate;
   endpoints relevant membalik 403 "fitur nonaktif" (bukan hanya UI hilang).
2. Re-enable service bekerja kembali.
3. Reason toggle tercatat di audit log Migrasikan baik.

---

## Bagian 4 — Roadmap Implementasi (urutan sesuai dependensi kode)

Urutan disesuaikan dependensi nyata: autentikasi/role adalah prasyarat SEMUA
menu; template & user monitoring menyertakan gap data user (F10); kanvas AI
diletakkan karena fitur gemini belum ada (F9).

| Tahap | Deliverables | Files baru/ubah | Dependensi | Hasil yang diharapkan | Kriteria selesai |
|---|---|---|---|---|---|
| **0 — Migrasi DB admin** | kolom `users.admin_role_id`/`is_admin`, `users.status`, tabel `admin_roles`, `admin_permissions`, `audit_logs`, `app_settings`, `app_feature_flags`, `templates`, `feedback`, `feedback_notes`; `point_transactions`: +`admin_adjust`, +`expires_at` | `database/admin_migration.sql` (baru) | – | Schema siap; seed superadmin + 7 role default | Import SQL sukses; `ping.php` semua table laporan; superadmin dapat login |
| **1 — Fondasi auth & security** | `require_admin()` + permission helper + `log_audit()`; endpoint `admin/login.php`, `admin/me.php`, `admin/logout.php`; halaman login admin + guard frontend | ubah `backend/helpers.php`, `backend/config.php` (secret, CORS); baru `backend/admin/login.php`, `admin/me.php`, `admin/logout.php`, `src/admin/*` login & guard | Tahap 0 | Admin dapat login non-admin 403; audit helper siap dipakai semua tahap | Login admin sukses; non-admin 403; secrft & CORS diganti |
| **2 — Shell & navigasi** | Admin layout sidebar + view-switching + topbar + 13 menu placeholder | `src/admin/admin.html`, `src/admin/main-admin.ts`, `src/admin/sidebars.ts`, template html per-view (stub) + `vite.config.ts` entry admin | Tahap 1 | Struktur halaman siap diisi menu | Navigate semua menu; guard redirect menampilkan |
| **3 — Template & integrasi user** *(faise 1: katalog)* | CRUD templates + seed dari F8; halaman user membaca katalog template | `backend/admin/templates.php`, `backend/templates.php`, `src/admin/views/templates.ts`, ubah `src/html/create-cv.html` + `cvData.ts` (mapping template × 3 layout) | Tahap 2 | Template dinamis jalankan dari admin sampai user | Menu 2 acceptance pass semua |
| **4 — User & dokumen** | list & detail users (profil, poin, transaksi timeline), list documents & detail payload; koreksi poin & ubah status | `backend/admin/users.php`, `backend/admin/documents.php`, `backend/admin/update-user-profile.php` (sekaligus menutup gap endpoint user F10) + frontend | Tahap 2 | Admin mengelola user & dokumen | Menu 3/4/12 acceptance pass |
| **5 — Transaksi & harga** | list transactions void/refund; CRUD packages; perubahan harga tidak menyangkit transaksi lama | `backend/admin/transactions.php`, `backend/admin/packages.php`, hapus fallback harga di `backend/checkout.php` + `packages.php`, frontend transaksi & harga | Tahap 4 | Menu 5/6 acceptance pass; gap expires-at tuntas | Void kedaluwarsa jalan; harga lama tak berubah |
| **6 — Konfigurasi AI** | app_settings + endpoint AI config + rotasi key | `backend/admin/ai-config.php`, `backend/crypto.php`, `src/admin/views/ai-config.ts`, ubah `vite.config.ts` (hapus GEMINI define) | Tahap 2 | Key tersimpan aman server-side | Menu 7 acceptance pass |
| **7 — Lapis monitoring & pendukung** | Analytics dashboard; feedback (user+admin); audit log UI; ekspor CSV; aktivitas user timeline; feature flags | `backend/admin/analytics.php`, `audit.php`, `export.php`, `flags.php`, `backend/feedback.php` + admin, frontend terkait; ubah `src/js/main.ts`/`me.php` untuk flags | Tahap 3–5 (analytics membutuhkan data sempurna menu 3–6) | Semua menu 1, 8–13 live | setiap menu acceptance |
| **8 — Testing, security & integrasi akhir** | test suite manual+automasi; permission matrix test; smoke test keamanan dasar (401/403/SQLi, kebocoran key); uji beban pagination | semua file admin | Tahap 1–7 | Dikeluarkan untuk UAT | semua audit log jalan; tanpa sensitif di ekspor/log; CORS & secret produksi |

Catatan dependensi (fakta berdampak urutan):
- Menu 5 harus setelah Menu 3 karena void/penanganan kendala membutuhkan
  detail user yang riil; pencatatan `admin_adjust` transaksi keduanya.
- Menu 8 feedback user pada user — bila user-side tidak dibangun, data
  admin-side kosong; fitur cross-side harus dipasangkan.
- Tahap 7 seharusnya HANYA setelah menu 3–5 hidup agar analytics tak menampilkan
  angka 0 senperta "fitur rusak".

---

## Bagian 5 — Ringkasan kondisi project (Bagian C di tugas)

| Menu | SUDAH ADA | PERLU DIUBAH | PERLU DIBUAT | PERLU KEPUTUSAN |
|---|---|---|---|---|
| 1 Dashboard/analytics | data sumber: `users`, `documents`, `point_transactions` (F6,F7) | – | endpoint analytics + UI | metrik template populer |
| 2 Template | – | renderer layout hardcoded (F8) | tabel+endpoint CRUD+UI | dinamis vs mapping; sebelum 3 layout cukup |
| 3 User | tabel users lengkap (F6); public_user aman (F5) | – | list/search/detail/endpoint admin, suspend/ban/reset pw, koreksi poin | alasan reset password tanpa email |
| 4 Dokumen/aktivitas | tabel documents & document_details (F6) | – | list/detail endpoint admin | scope resume/portfolio data (belum ada, F10) |
| 5 Transaksi | point_transactions + confirm idempotent (F7) | – | endpoint admin list/void; kolom expires_at/note | refund manual; retry |
| 6 Harga | topup_packages + packages.php membaca is_active (F5,F6) | hapus fallback harga; single source | CRUD admin | – |
| 7 API AI | – | `vite.config.ts` GEMINI define (bocor) | tabel settings + endpoint + enkripsi | provider/model, enkripsi at-rest |
| 8 Feedback | – | – | user form + tabel + endpoints | – |
| 9 Audit log | – | – | tabel + helper + endpoint | retensi, IP privacy |
| 10 Ekspor | – | – | endpoint CSV + UI | PI anonymization |
| 11 Role/permission | – | – | tabel roles/permissions + endpoint | granular vs single-flag is_admin |
| 12 Aktivitas user | point_transactions/documents timestamps (F12) | – | timeline endpoint | menambah event logout/login (butuh log baru) |
| 13 Feature flags | – | – | tabel flags + endpoint + integrasi me.php | daftar flag final |

**Skenario-wajib yang dicatat di seluruh menu** (ringkasan):
- Data mock (`src/js/data.ts`, mock transaksi `point-history.ts`, chat mock)
  **bukan data produksi**; semua analytics admin harus dibangun langsung dari
  DB, jangan dari mock.
- Payment gateway saat ini **simulasi**, bukan gateway pembayaran riil;
  angka revenue adalah angka simulasi sampai gateway riil digantikan
  (PERLU KEPUTUSAN terpisah, bukan bagian halaman admin).
- Endpoint user yang belum ada (F10) berdampak pada admin yang mengandalkan
  data user (update profil, riwayat poin riil) — dijadwalkan Tahap 4.

---

## Bagian 6 — yang belum diketahui / perlu keputusan bisnis (kumpulan)

1. Model role: single-flag `is_admin` vs granular `admin_role_id` (Bagian 1.4, Menu 11).
2. Daftar flag fitur final (Menu 13) — fitur AI & template terlibat.
3. Template CV: dinamis-render penuh atau katalog mapping ke 3 layout hardcoded (Menu 2).
4. Provider/model AI — belum ada data integrasi manapun (Menu 7).
5. Email infrastruktur untuk reset password user (Menu 3) — tidak ada di project.
6. Kebijakan refund manual vs void (`Menu 5`)- apa kebijakan bisnisnya.
7. Retensi & privasi audit log (IP, durasi simpan) (Menu 9).
8. Hubungan paket langganan (`subscriptions`) vs sistem poin — tabel
   `subscriptions` belum dipakai oleh kode manapun (F6); bagaimana admin
   memetakan `plan` user.
