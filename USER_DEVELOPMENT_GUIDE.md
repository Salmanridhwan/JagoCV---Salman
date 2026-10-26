# USER_DEVELOPMENT_GUIDE.md — Dokumentasi Teknis jagoCV (Halaman User)

> Dokumen ini menganalisis project **JagoCV---Salman** yang sudah ada (sisi user)
> dan menjadi acuan pengembangan **halaman admin**. Dokumen TIDAK mengubah
> source code.
>
> Konvensi penulisan:
> - **[FAKTA]** = ditemukan langsung di source code (dapat diverifikasi di
>   path yang dicantumkan).
> - **[REKOMENDASI]** = usulan fitur/keputusan baru, bukan bagian dari sistem saat ini.
> - **[GAP]** = ketidaksesuaian antarbagian yang ditemukan di kode.

---

## 1. Project Overview

### 1.1 Tujuan Aplikasi [FAKTA]
jagoCV adalah **Career Hub Dashboard** untuk mahasiswa/job seeker: mengelola
**ATS CV**, **Visual Resume**, dan **Web Portfolio**.
Sumber: `metadata.json` → *"A dark blue professional Career Hub Dashboard that
allows students to manage their ATS CV, Modern Visual Resume, and Web Portfolios."*

Monetisasi yang sudah ada: **sistem poin (token AI)** — pengguna baru dapat
2 poin gratis, 1 poin per generate dokumen, isi poin lewat top-up
(paket Basic/Pro/Premium) dengan **payment gateway simulasi**.

### 1.2 Teknologi [FAKTA]
| Layer | Teknologi | Bukti |
|---|---|---|
| Frontend | Vanilla **TypeScript** + **Tailwind CSS 4**, bundling **Vite 6** (port 3000) | `package.json`, `vite.config.ts` |
| UI | Template HTML disuntik via `?raw` import; manipulasi DOM langsung (bukan komponen React) | `src/js/views/templateInjector.ts`, `src/js/main.ts` |
| Backend | **PHP murni** di **Apache/XAMPP**, respons JSON | `backend/*.php` |
| Database | **MySQL** `jagocv` via **PDO** (phpMyAdmin/XAMPP) | `backend/config.php`, `database/*.sql` |
| Autentikasi | Token sesi HMAC-SHA256 format JWT + **Google Identity Services** | `backend/helpers.php`, `src/js/utils/auth.ts` |
| Build agregat | Deps terpasang (react, react-dom, lucide-react, motion, @google/genai) namun **tidak dipakai** oleh kode app yang ada saat ini | `package.json`; tidak ada file yang mengimpor `react`/`@google/genai` (chat AI masih mock — `src/js/views/chat.ts`) |

Catatan: `vite.config.ts` masih men-define `process.env.GEMINI_API_KEY`
(infrastruktur AI Gemini siap, tetapi **belum ada pemanggilan Gemini** di kode).

### 1.3 Arsitektur [FAKTA]
```
Browser ──► Vite dev server (localhost:3000)        ← UI TypeScript + Tailwind
        └── proxy /backend/*.php ──► Apache (XAMPP) ──► PHP ──► PDO ──► MySQL "jagocv"
```
- Vite mem-proxy semua request `/backend/*` ke Apache yang dideteksi otomatis
  (port 8080/80, slug folder `jagoCV---Salman`) — `vite.config.ts`
  (`apacheProxyPlugin`, `PROJECT_SLUG`).
- Base URL API dapat di-override lewat `.env` (`VITE_API_BASE_URL`) atau
  tersolusi otomatis dari origin — `src/js/utils/auth.ts` (`resolveBackendBase`).
- Halaman **payment gateway simulasi** adalah entry build terpisah
  (`src/html/payment-gateway.html`, didaftarkan di
  `vite.config.ts → build.rollupOptions.input.paymentGateway`).

### 1.4 Struktur Folder [FAKTA]
```
index.html                    ← shell SPA tunggal: kontainer view-*, topbar-alert, app-wrapper
src/html/*.html               ← template tiap halaman (disuntik ke kontainer view-*)
  landing, login, register, dashboard, create-cv, design-resume, build-portfolio,
  cv-result, resume-result, portfolio-result, profile, edit-profile, pricing,
  point-history, preview-gallery, generic-modal, payment-gateway
src/js/
  main.ts                     ← bootstrap: inject template, bind semua event, restore sesi
  types.ts, data.ts           ← tipe & data mock dashboard (src/js/data.ts: mockDashboardData)
  payment-gateway.ts          ← logika halaman simulasi pembayaran (entry terpisah)
  utils/
    auth.ts                   ← client API + penyimpanan sesi + Google GSI
    points.ts                 ← sistem poin (chip topbar, consume, modal top-up, alert)
    cvData.ts                 ← form CV: collect/restore/draft server/preview/render hasil/PDF
    navigation.ts             ← persistensi view terakhir & step wizard
    toast.ts, theme.ts        ← util UI global
  views/
    router.ts                 ← view switching & bind tombol navigasi (hide/show class)
    auth.ts                   ← binding form login/register + tombol Google
    dashboard.ts              ← populate dashboard (masih dari mock data)
    cv-builder.ts / resume-builder.ts / portfolio-builder.ts ← wizard step builder
    edit-profile.ts           ← form edit profil (nama/email/role/avatar/lokasi)
    pricing.ts                ← halaman top-up (input nominal; checkout masih stub)
    point-history.ts          ← mutasi & riwayat poin (backend belum ada → mock)
    gallery.ts, chat.ts, modal.ts, templateInjector.ts
backend/                      ← API PHP (lihat §4)
database/                     ← skema SQL: jagocv.sql, cv_feature.sql, cv_drafts.sql, migration_payment_gateway.sql
scripts/legacy/…              ← skrip util pengeditan file lama (tidak relevan untuk admin)
```

---

## 2. User Flow [FAKTA]

### 2.1 Registrasi & Login
1. Buka `/` → halaman **landing** (`view-landing`, `src/html/landing.html`).
2. Tombol *Masuk/Daftar* → `view-login` / `view-register`
   (`src/js/views/router.ts: launchLoginApp/launchRegisterApp`).
3. **Email + password**: submit form → `POST /backend/register.php` atau
   `/backend/login.php` (`src/js/views/auth.ts`, `src/js/utils/auth.ts`).
   Validasi klien: nama depan wajib, email wajib, password min 8 karakter.
4. **Google Sign-In**: tombol custom dilapisi tombol resmi GSI transparan
   (`src/js/views/auth.ts: mountOfficialGoogleButton`) → ID token →
   `POST /backend/google.php` → akun dibuat/di-link otomatis.
5. Sukses → `saveSession(token, user)` ke localStorage → `enterApp(user)`:
   isi nama/role/avatar ke topbar & profil, tampilkan poin, alert
   "Pengguna Baru" bila `is_new_user`, lalu `launchDashboardApp()`.

### 2.2 Alur Fitur Utama (di dalam `app-wrapper`)
Semua view di-switch via `hideAllViews()` + `showView(view)` tanpa pindah URL.
View terakhir dipersist di localStorage `jagocv_last_view`
(`src/js/utils/navigation.ts`).

- **Dashboard** (`view-dashboard`, `src/js/views/dashboard.ts`):
  kartu dokument terkini + filter tipe + toggle grid/list. **Data masih mock**
  (`src/js/data.ts`); klik dokumen hanya memunculkan toast.
- **Buat CV ATS** (`view-create-cv`, wizard 5 step, `src/js/utils/cvData.ts`):
  isi form manual (identitas → pengalaman → pendidikan → ringkasan/skill/tema),
  **pratinjau live** rasio A4 di panel kanan, draft di**server per akun**
  (`cv.php?draft=1`, debounce 800 ms), tombol *Hasilkan CV ATS*:
  1. Validasi `full_name` & `email` wajib.
  2. **Payment gate**: `spendPointForGenerate()` → `POST /backend/consume.php`
     (−1 poin); poin habis → modal "Poin Generate Habis" → halaman Pricing
     (`src/js/utils/points.ts`).
  3. `POST /backend/cv.php` → dokumen tersimpan di MySQL
     (`documents` + `document_details`).
  4. Render dokumen A4 di `view-cv-result`; aksi **Salin Teks** /
     **Unduh PDF** (via dialog print — `downloadCvPdf`); draft CV dihapus.
- **Desain Resume** (`view-design-resume`, wizard + chat widget mock):
  tombol *Generate* juga lewat payment gate 1 poin, lalu hanya
  `showView(view-resume-result)` — **hasil resume belum disimpan ke backend**.
- **Bangun Portfolio** (`view-build-portfolio`, wizard 7 step):
  alur sama — payment gate lalu `showView(view-portfolio-result)`
  (hasil mock, belum tersimpan ke server).
- **Profil Akun** (`view-profile`) → **Edit Profil** (`view-edit-profile`
  + `src/js/views/edit-profile.ts`): nama depan/belakang, email, profesi
  (role), lokasi, avatar URL. Simpan → mencoba `POST /backend/update-profile.php`
  (**endpoint ini belum ada di backend** — [GAP]); bila gagal, disimpan lokal
  (`localStorage: jagocv_profile_edits` / `jagocv_profile_location`).
- **Isi Poin (Pricing)** (`view-pricing`, `src/js/views/pricing.ts`):
  input nominal `Rp` + kartu nominal cepat (min Rp2.000). Tombol lanjut
  **checkout masih stub** (`// TODO(checkout)` — `src/js/views/pricing.ts:196`) [GAP].
- **Mutasi & Riwayat Poin** (`view-point-history`, `src/js/views/point-history.ts`):
  filter satu tanggal, unduh laporan PDF (print), "+ Top Up Cepat" ke pricing.
  Mencoba `POST /backend/points-history.php` yang **belum ada** → menampilkan
  MOCK data [GAP].
- **Logout**: `btn-logout` → hapus token/session cache, reset draft CV di memori
  (draft tidak dihapus di server, hanya reset di memori), kembali ke dashboard/landing
  (`src/js/views/router.ts` blok Logout).

### 2.3 Alur Top Up (payment gateway simulasi) [FAKTA]
```
Pilih paket/nominal → (stub belum dihubungkan: POST checkout.php)
→ backend checkout.php buat point_transactions status 'pending'
  + payment_url ke src/html/payment-gateway.html?ref=...&st=1
→ halaman gateway menampilkan ringkasan → "Bayar Sekarang"
→ POST /backend/confirm.php { payment_ref, status }
→ status 'success': poin user +N, transaksi 'success', is_new_user=0
→ location.replace("/") (tidak masuk history; flag anti double-pay di sessionStorage)
```
Sumber: `src/js/payment-gateway.ts`, `backend/checkout.php`, `backend/confirm.php`.

---

## 3. Feature Documentation (halaman & komponen penting)

### 3.1 Daftar halaman & fungsinya [FAKTA]
| Halaman (view id) | Template | Logika | Fungsi utama |
|---|---|---|---|
| Landing | `src/html/landing.html` | `router.ts` | Halaman publik; CTA masuk/daftar |
| Login / Register | `login.html`, `register.html` | `views/auth.ts` | Form auth + tombol Google |
| Dashboard | `dashboard.html` | `views/dashboard.ts` | Ringkasan profil, dokument terkini (mock), filter, grid/list toggle |
| Buat CV ATS | `create-cv.html` | `cvData.ts`, `cv-builder.ts` | Wizard 5 step + preview live + generate (1 poin) |
| Desain Resume | `design-resume.html` | `resume-builder.ts` | Wizard + chat mock; hasil ke `resume-result` |
| Bangun Portfolio | `build-portfolio.html` | `portfolio-builder.ts` | Wizard 7 step + viewport mobile toggle; hasil ke `portfolio-result` |
| Hasil CV | `cv-result.html` | `cvData.ts` | Render dokumen, salin teks, unduh PDF |
| Profil Akun | `profile.html` | `main.ts` | Data akun, poin, view portfolio, tombol upgrade & riwayat |
| Edit Profil | `edit-profile.html` | `edit-profile.ts` | Form edit profil + fallback lokal |
| Pricing / Top-up | `pricing.html` | `pricing.ts` | Input nominal + kartu cepat; checkout stub |
| Mutasi Poin | `point-history.html` | `point-history.ts` | Riwayat (mock), filter tanggal, unduh laporan |
| Galeri Template | `preview-gallery.html` | `gallery.ts` | Tab CV/Resume/Portfolio |
| Modal Generik | `generic-modal.html` | `modal.ts`, `points.ts` | Modal "poin habis" dll. |
| Gateway pembayaran | `payment-gateway.html` (entry terpisah) | `payment-gateway.ts` | Simulasi QRIS/bayar → confirm.php |

### 3.2 Komponen penting yang dapat dipakai ulang untuk admin [FAKTA]
- **Toast global** — `src/js/utils/toast.ts` (`showToast`, `window.showToast`).
- **Modal generik** — `src/html/generic-modal.html` + `src/js/views/modal.ts`
  (sudah dipakai sistem poin: `openTopUpModal()` di `points.ts`).
- **Chip & alert poin di topbar** — `bindPointsChip`, `showNewUserAlertIfNeeded`
  (`src/js/utils/points.ts`).
- **Badge status dokumen** — `buildStatusBadge` (`src/js/views/dashboard.ts`):
  `Selesai` (hijau), `Diterbitkan` (biru), `Draf` (amber).
- **Row tabel transaksi poin** — `rowTemplate`, `statusBadgeClass`,
  `formatRupiah` (`src/js/views/point-history.ts`) — sangat relevan untuk
  tabel monitoring transaksi admin.
- **Print-to-PDF** — `downloadReport` (`point-history.ts`) dan
  `downloadCvPdf` (`cvData.ts`) via `window.print`.
- **Session helpers** — `getToken/getStoredUser/checkSession/clearSession`
  (`src/js/utils/auth.ts`).

### 3.3 Form & validasi [FAKTA]
| Form | Field | Validasi klien | Validasi server |
|---|---|---|---|
| Register (`form-register`) | first/last_name, email, password | wajib, min 8 char (`views/auth.ts`) | email valid, nama ≤100, unique email (409), bcrypt (`backend/register.php`) |
| Login (`form-login`) | email, password | wajib | email valid; pesan generik; auto-rehash bcrypt (`backend/login.php`) |
| CV ATS | full_name, target_role, email, phone, location, linkedin_url, portfolio_url, summary, experiences[], education[], skills (koma), layout (standar/tech/entry), foto (data URL) | `full_name` & `email` wajib sebelum generate (`cvData.ts: generateCvFromManualForm`) | full_name wajib, email valid; payload JSON lain tidak divalidasi detail (`backend/cv.php`) |
| Edit Profil | first/last_name, email, role, location, avatar_url | first wajib, regex email (`edit-profile.ts`) | — (endpoint belum ada) |
| Top-up | nominal (digit, maks 9 angka) | min Rp2.000 (`pricing.ts: validAmount`) | `status`/`payment_ref` divalidasi di `confirm.php`; `package_code` divalidasi di `checkout.php` |

### 3.4 Interaksi pengguna terhadap data
- Draft CV diikat ke **akun secara eksplisit** (bukan browser): cache in-memory
  per `user_id`, logout mereset cache, timer autosave di-invalidasi saat
  epoch/ganti akun berubah (`src/js/utils/cvData.ts: queueDraftSave`).
- Logout tidak menghapus draft server dan tidak menghapus dokumen — hanya sesi.
- Semua klik-navigasi menggunakan id elemen `btn-*` yang di-bind satu kali di
  `bindRouterEvents()` (`src/js/views/router.ts`) — pola yang sama harus
  dipakai bila menambah view admin.

---

## 4. Technical Flow

### 4.1 Routing [FAKTA]
- **Tidak ada URL routing** per halaman: satu `index.html`, halaman = kontainer
  `view-*` di-show/hide dengan class `hidden/block` (`src/js/views/router.ts`).
- Pengecualian: halaman `payment-gateway.html` benar-benar berpindah URL
  (dibuka `checkout.php` via `location.replace`).
- State navigasi: `localStorage.jagocv_last_view` (view), `sessionStorage.jagocv_cv_step`
  (step wizard CV) — `src/js/utils/navigation.ts`.
- Shell: `view-landing`/`view-login`/`view-register` di luar `app-wrapper`;
  semua halaman logged-in di dalam `#app-wrapper` (lihat map id di `index.html`).

### 4.2 Autentikasi [FAKTA]
- **Token**: HMAC-SHA256 (header.payload.signature, base64url) berisi
  `{ sub, email, iat, exp: +7 hari }` — `issue_token/verify_token`
  (`backend/helpers.php`). Secret: `APP_JWT_SECRET` pada `backend/config.php`
  (masih placeholder — wajib diganti sebelum produksi).
- **Klien**: token di `localStorage.jagocv_token`, profil user di
  `localStorage.jagocv_user` (`src/js/utils/auth.ts`). Backend **stateless**:
  `POST /backend/logout.php` hanya konfirmasi, penghapusan dilakukan di klien.
- **Validasi tiap request**: header `Authorization: Bearer` dibaca
  `require_user()`; 401 bila kosong/tidak valid/token kedaluwarsa; user diambil
  ulang dari DB (jadi user yang dihapus di DB otomatis kehilangan akses).
- **Google**: `POST /backend/google.php` verifikasi ID token ke
  `https://oauth2.googleapis.com/tokeninfo`, cek `aud` vs Client ID dari
  `.env` (`VITE_GOOGLE_CLIENT_ID`), cek `email_verified`, lalu upsert/link akun.
- **Backend haeder**: `backend/.htaccess` meneruskan header Authorization
  (`SetEnvIf Authorization ... HTTP_AUTHORIZATION=$1`).
- **CORS**: whitelist origin dev di `$allowed_origins` (`backend/config.php`); preflight OPTIONS dijawab 204.

### 4.3 Authorization [FAKTA]
- **Belum ada konsep role/permission di backend**. Kolom `users.role` adalah
  *profesi pengguna* (contoh: "CS Student & Web Dev" — komentar di
  `database/jagocv.sql`), **bukan** role admin. Semua endpoint sama-sama hanya
  menuntut "user login".
- [GAP] Halaman admin memerlukan mekanisme role baru (lihat §7).

### 4.4 Endpoint API lengkap [FAKTA]
| Endpoint | Metode | Auth | Fungsi | File |
|---|---|---|---|---|
| `/backend/register.php` | POST | – | Registrasi; bonus 2 poin; token | `backend/register.php` |
| `/backend/login.php` | POST | – | Login email/password | `backend/login.php` |
| `/backend/google.php` | POST | – | Login Google (verifikasi tokeninfo) | `backend/google.php` |
| `/backend/me.php` | GET | Bearer | Profil user sesi | `backend/me.php` |
| `/backend/logout.php` | POST | – | Konfirmasi logout (stateless) | `backend/logout.php` |
| `/backend/points.php` | GET | Bearer | Saldo poin + is_new_user | `backend/points.php` |
| `/backend/consume.php` | POST | Bearer | −1 poin (atomik `points > 0`, 402 bila habis) + log `usage` | `backend/consume.php` |
| `/backend/packages.php` | GET | – | Daftar `topup_packages` aktif (fallback konstanta bila tabel kosong) | `backend/packages.php` |
| `/backend/checkout.php` | POST | Bearer | Buat transaksi top-up `pending` + `payment_url` gateway | `backend/checkout.php` |
| `/backend/confirm.php` | POST | Bearer | Selesaikan pembayaran (idempotent, `FOR UPDATE`, `is_new_user=0`) | `backend/confirm.php` |
| `/backend/cv.php` | GET/POST | Bearer | Daftar CV user (`type='ATS CV'`, limit 50) / simpan CV baru (`DOC-XXXX`) | `backend/cv.php` |
| `/backend/cv.php?draft=1` | GET/POST/DELETE | Bearer | Draft CV per akun (tabel `cv_drafts`, upsert) | `backend/cv.php` |
| `/backend/ping.php` | GET | – | Diagnosa PHP/DB/tabel hilang | `backend/ping.php` |

**Respons standar**: `{ ok: true|false, ... }` — semua endpoint memakai
`json_response/json_fail` (`backend/helpers.php`).
**[GAP]** Frontend memanggil endpoint yang **belum ada**:
- `POST /backend/update-profile.php` — `src/js/views/edit-profile.ts`
- `POST /backend/points-history.php` — `src/js/views/point-history.ts`
Keduanya punya fallback lokal/mock, sehingga UI tetap berjalan tanpa server.

### 4.5 Pengolahan data penting
- **Simpan CV** (`backend/cv.php`): transaksi DB — insert `documents`
  (doc_code acak `DOC-0000..9999` dengan retry 5x, `type='ATS CV'`,
  `status='Selesai'`, title = `nama — target_role`) → insert `document_details.payload`
  (JSON form; toleran bila tabel belum dibuat).
- **Draft CV**: `cv_drafts` upsert per `user_id` (`uq_cv_drafts_user`),
  payload JSON bentuk `CvFormData` (`src/js/utils/cvData.ts`).
- **Poin**: saldo = `users.points`; semua mutasi dicatat `point_transactions`.
  Konfirmasi pembayaran memakai transaksi + row-lock agar tidak double-spend
  (`backend/confirm.php`).
- **Toleransi tabel belum terpasang**: banyak endpoint menangkap
  `PDOException` dan tetap merespons (fallback konstanta/log) — penting
  diketahui karena data bisa hilang senyap bila SQL migrasi tidak dijalankan.

---

## 5. Data & Business Logic

### 5.1 Entitas & field [FAKTA] — sumber: `database/*.sql`
**users** (`database/jagocv.sql`)
- `id` PK, `first_name`, `last_name`, `email` UNIQUE, `password_hash`
  (NULL = akun Google), `google_sub` UNIQUE, `avatar_url`,
  `role` (profesi), `plan` ENUM(`free`,`pro`,`business`) default `free`,
  `portfolio_views` INT, `points` INT default 0, `is_new_user` TINYINT,
  `auth_provider` ENUM(`local`,`google`), `created_at/updated_at`.

**documents** — dokumen milik user
- `id`, `user_id` FK→users (CASCADE), `doc_code` UNIQUE (`DOC-####`),
  `title`, `type` ENUM(`ATS CV`,`Visual Resume`,`Web Portfolio`,`Cover Letter`),
  `status` ENUM(`Draf`,`Selesai`,`Diterbitkan`) default `Draf`, timestamps.

**document_details** (`database/cv_feature.sql`) — payload JSON form CV,
UNIQUE per `document_id`, FK CASCADE.

**cv_drafts** (`database/cv_drafts.sql`) — draft form CV per user,
UNIQUE per `user_id`, payload JSON + timestamps.

**subscriptions** — riwayat paket `free/pro/business`,
status `active/cancelled/expired`. **Tidak dipakai oleh endpoint manapun saat ini**
(hanya struktur DB) — catatan untuk admin [FAKTA].

**topup_packages** — `code` UNIQUE (`basic` Rp19.000→1 poin, `pro` Rp49.000→3,
`premium` Rp99.000→10), `features` (dipisah baris), `is_active`.

**point_transactions** — `user_id` FK, `type` ENUM(`purchase`,`signup_bonus`,`usage`),
`points` (+/−), `description`, `package_code`, `payment_method`, `payment_ref`,
`amount`, `status` ENUM(`success`,`pending`,`failed`), `created_at`.

Relasi: `users` 1—N {`documents`, `subscriptions`, `point_transactions`};
`documents` 1—1 `document_details`; `users` 1—1 `cv_drafts`.

### 5.2 Status & aliran data [FAKTA]
- **Status dokumen**: `Draf` → `Selesai` → `Diterbitkan` (ENUM). Implementasi
  saat ini hanya menset `Selesai` saat simpan CV; resume/portfolio belum menulis
  ke `documents`.
- **Status transaksi poin**: `pending` (checkout) → `success`/`failed`
  (confirm.php). Idempotent: transaksi `success` di-confirm ulang → `already:true`.
- **`is_new_user`**: true saat daftar; off setelah top-up pertama berhasil
  (`confirm.php`). Digunakan untuk alert promosi di topbar
  (`src/js/utils/points.ts`).
- **Bonus pendaftaran**: +2 poin + baris `point_transactions type='signup_bonus'`
  (`backend/register.php`, `backend/google.php`, migrasi lama di
  `database/migration_payment_gateway.sql`).
- **Pemakaian poin**: −1 per generate dokumen; `usage` point −1 dengan
  deskripsi "Generate 1 dokumen" (`backend/consume.php`).
- **Kedaluwarsa checkout**: `expires_at` = 1 jam sejak pembuatan
  (`backend/checkout.php`) — namun **tidak ada proses yang otomatis ke-skip
  transaksi kedaluwarsa** (tidak ada cron/job) [FAKTA].
- **Saldo cache klien**: poin di-cache `localStorage.jagocv_points_cache`
  dan disinkron dari server via `points.php` (`src/js/utils/points.ts`).

### 5.3 Proses bisnis yang ditemukan [FAKTA, ringkas]
1. **Acuisisi**: registrasi (lokal/Google) → bonus 2 poin gratis → alert
   promosi top-up.
2. **Produksi dokumen**: isi form/draft → 1 poin → dokumen tersimpan → ekspor
   (print/salin).
3. **Monetisasi**: top-up paket nominal tetap / input nominal bebas (UI) →
   checkout simulasi → poin.
4. **Restorasi draft**: draft server per akun dipulihkan saat login kembali.

---

## 6. Admin Dashboard Requirements [REKOMENDASI]
*(Kecuali ditandai, bagian ini adalah rekomendasi berbasis kemampuan sistem yang
sudah ada. Data sumber: tabel DB + endpoint §4 — tidak ada fitur admin di kode.)*

### 6.1 Halaman admin yang disarankan
| Halaman | Sumber data yang tersedia | CRUD yang bisa didukung |
|---|---|---|
| **Admin Login** | reuse `login.php` + kolom role baru (§7) | – |
| **Overview / Monitoring** | aggregate `users`, `documents`, `point_transactions` | read-only: total user, user baru 7 hari, dokumen per tipe/status, transaksi sukses/gagal, revenue (SUM `amount` status success) |
| **Manajemen User** | `users`, `point_transactions`, `cv_drafts` | read/list/search (email, nama, plan, points, auth_provider); **suspend/ban** (perlu kolom baru); **reset poin / koreksi saldo** (tulis `point_transactions` bukan update langsung); lihat draft per user; reset password (perlu endpoint baru) |
| **Manajemen Dokumen** | `documents` + `document_details` | list global, filter tipe/status/user, ubah status (`Draf/Selesai/Diterbitkan`), hapus; **pratinjau payload CV** dari `document_details.payload` |
| **Manajemen Paket Top-Up** | `topup_packages` | CRUD paket (code/name/price/points/features/is_active) — `packages.php` sudah membaca tabel ini termasuk `is_active`, jadi aktif/nonaktif paket langsung berdampak |
| **Monitoring Transaksi Poin** | `point_transactions` | list + filter (type, status, tanggal, package), tandai/void transaksi `pending` kedaluwarsa (menutup gap expires_at), refund manual (transaksi koreksi) |
| **Manajemen Konten Galeri/Template** | belum ada tabel konten [GAP] | butuh tabel baru bila template ingin dinamis; saat ini template statis di `src/html/preview-gallery.html` |
- **Navigasi admin**: sidebar (Overview, Users, Documents, Packages,
  Transactions, Settings) — mengikuti pola view-switching `router.ts`
  (`hideAllViews/showView`) sehingga tidak perlu menambah router library.

### 6.2 Komponen yang dapat dipakai ulang [FAKTA]
`toast.ts`, `generic-modal` + `modal.ts`, badge status (`dashboard.ts`),
row transaksi (`point-history.ts`), filter chip + grid/list toggle
(`dashboard.ts`), print report (`point-history.ts: downloadReport`),
`checkSession` (`auth.ts`).

---

## 7. Admin Access & Security [REKOMENDASI kecuali ditandai]

### 7.1 Fakta keamanan saat ini [FAKTA]
- Hanya ada **satu** mekanisme auth: token HMAC; tidak ada role table,
  tidak ada endpoint admin, tidak ada middleware `require_admin()`.
- `APP_JWT_SECRET` masih `ganti-secret-ini-dengan-string-acak-panjang`
  (`backend/config.php`) — komentar file sendiri meminta diganti produksi.
- DB XAMPP: user `root` tanpa password (`config.php`) — dev-only.
- CORS whitelist hanya origin dev (`config.php`).

### 7.2 Desain role admin yang disarankan
1. Tambah kolom di `users`: `is_admin TINYINT(1) DEFAULT 0` (paling kecil
   perubahan), atau tabel `user_roles` bila perlu multi-permission.
2. Tambah fungsi `require_admin()` di `backend/helpers.php`: setelah
   `require_user()`, cek `is_admin`; tolak 403.
   Semua endpoint admin baru (`admin/*.php`) wajib melewati ini.
3. Proteksi route sisi frontend: variabel `is_admin` di objek user
   (`public_user()`), guard di `router.ts` (jangan tampilkan view admin bila
   tidak memenuhi) — catat bahwa guard frontend **bukan** keamanan;
   keamanan tetap di `require_admin()`.
4. Permission minimal: `user.read`, `user.update`, `document.read`,
   `document.update`, `document.delete`, `package.crud`,
   `transaction.void` (perluas bertahap bila multi-role).
5. Validasi input admin: ikuti pola `backend/helpers.php` (`field_str`,
   `valid_email`, `json_body`), prepared statements PDO (sudah dipakai di
   semua endpoint — pertahankan).
6. Keamanan data tambahan yang disarankan: audit log admin (tabel baru),
   rate limit login (belum ada), hash tetap bcrypt + jangan pernah ekspos
   `password_hash` (polanya sudah benar via `public_user()`), CORS harus
   ditambah origin produksi, secret via environment.

---

## 8. Development Roadmap

Urutan implementasi yang disarankan (tiap tahap bergantung pada tahap sebelumnya):

| Tahap | Pekerjaan | Dependensi | File yang dibuat/diubah |
|---|---|---|---|
| 0 | Migrasi DB admin: `ALTER TABLE users ADD is_admin`; tabel `audit_log` (opsional) | – | `database/admin_migration.sql` (baru) |
| 1 | `require_admin()` + field `is_admin` di `public_user()` | Tahap 0 | ubah `backend/helpers.php`, `backend/config.php` (ganti secret production) |
| 2 | Admin login (reuse `login.php`; tolak non-admin) + halaman/admin shell SPA baru | Tahap 1 | `src/js/views/admin-auth.ts`, `src/html/admin-shell.html`, `src/js/admin/main-admin.ts`; tambah entry di `vite.config.ts` bila ingin domain/port terpisah |
| 3 | Endpoint admin read: list users, documents, transactions (dengan filter & pagination) | Tahap 1 | `backend/admin/users.php`, `.../documents.php`, `.../transactions.php` |
| 4 | UI monitoring & user management (tabel, search, filter) | Tahap 3 | `src/js/views/admin-users.ts`, `admin-transactions.ts`, template html |
| 5 | Endpoint + UI modifikasi: ubah status dokumen, paket topup CRUD, void transaksi pending, koreksi poin | Tahap 4 | `backend/admin/*.php` (POST/PUT/DELETE), `src/js/views/admin-*.ts` |
| 6 | Tutup gap aplikasi user sebelum melebarkan fitur: `update-profile.php`, `points-history.php` (data riwayat dari `point_transactions`), hubungkan checkout pricing ke `checkout.php` | independen | `backend/update-profile.php`, `backend/points-history.php`, `src/js/views/pricing.ts` (hapus stub) |
| 7 | Landing report/monitoring dashboard (chart) — opsional | Tahap 4 | komponen baru |

Catatan dependensi:
- §4.4 [GAP] mengharuskan **tahap 6** dipandang sebagai bug terbuka sebelum admin
  mengelola data yang datanya belum mengalir (riwayat poin profil adalah
  contoh paling nyata).
- Reuse langsung: `require_user`/`require_admin`, `json_response`,
  `buildStatusBadge`, `rowTemplate`, `showToast`, modal generik,
  pattern `hideAllViews/showView`.

---

## 9. Open Questions (perlu konfirmasi sebelum development)

1. **Model role admin**: cukup satu flag `users.is_admin`, atau perlu multi-role
   dengan permission granular? (backend saat ini belum punya konsep apa pun — §4.3)
2. **`subscriptions` tidak dipakai** oleh kode mana pun [FAKTA] — apakah plan
   (`users.plan`) ditentukan manual admin, otomatis dari top-up, atau fitur
   belum selesai? Berdamping juga dengan sistem poin: apakah keduanya
   (plan & poin) tetap diparalel?
3. **Pricing/top-up**: tombol "Lanjut" masih stub dan nominal bebas (min Rp2.000)
   sementara `topup_packages` hanya punya 3 paket nominal tetap — alur mana yang
   final? (`src/js/views/pricing.ts` vs `backend/checkout.php`)
4. **Resume & Portfolio** belum menyimpan apapun ke backend — apakah admin perlu
   mengelola dokumen jenis ini, sementara datanya belum ada?
5. **AI Gemini**: `@google/genai` terpasang dan `GEMINI_API_KEY` di-define di
   `vite.config.ts`, tetapi sedikit dipakai (chat mock). Apakah generate dokumen
   menyasar AI (dengan pelacakan token prioritas per paket seperti klaim fitur
   teks di `topup_packages`)? Ini memengaruhi metrik apa yang perlu dipantau.
6. **Transaksi kedaluwarsa**: tidak ada pekerjaan yang mengalir transaksi
   `pending` melewati `expires_at` [FAKTA] — void permanen oleh admin cukup, atau
   perlu job otomatis?
7. **Folder legasi**: `dist/`, `scripts/legacy/` berisi artefak build/skrip
   histori — konfirmasi tidak perlu dipertimbangkan dalam pengembangan admin.
8. **Deploy target**: apakah admin berjalan di domain/port yang sama dengan
   user app (view tambahan dalam SPA yang sama) — memengaruhi tahap 2 dan CORS.

---

### Ringkasan GAP utama (fakta yang menonjol)
| # | Temuan | Lokasi |
|---|---|---|
| 1 | Endpoint `update-profile.php` dipanggil tapi tidak ada di backend | `src/js/views/edit-profile.ts`↔`backend/` |
| 2 | Endpoint `points-history.php` dipanggil tapi tidak ada (riwayat pakai mock) | `src/js/views/point-history.ts:325`↔`backend/` |
| 3 | Checkout pricing masih stub, tidak pernah memanggil `checkout.php` | `src/js/views/pricing.ts:196` |
| 4 | Dashboard menggunakan mock data, tidak membaca `GET /backend/cv.php`/DB | `src/js/data.ts`, `src/js/views/dashboard.ts` |
| 5 | Tidak ada konsep role admin di DB maupun backend | `database/jagocv.sql`, `backend/helpers.php` |
| 6 | `APP_JWT_SECRET` masih placeholder | `backend/config.php` |
| 7 | Resume/Portfolio hanya UI; tidak menulis ke `documents` | `src/js/views/router.ts` (generate) |
| 8 | Deps besar terpasang namun tak terpakai (react, lucide-react, motion, @google/genai) | `package.json` |
