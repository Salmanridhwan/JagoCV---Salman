# Panduan Fitur Register & Login jagoCV

Fitur autentikasi jagoCV terdiri dari dua jalur:

1. **Email + password** — registrasi & login biasa (tanpa Google).
2. **Google Sign-In** — login/daftar sekali klik lewat akun Google.

Backend berupa **PHP murni** yang berjalan di **Apache/XAMPP** dan terhubung ke
**MySQL (phpMyAdmin)**. Frontend (Vite, port 3000) memanggil API lewat fetch.

```
Browser ──► Vite dev server (localhost:3000)  ← UI React/TS
        └─► Apache (localhost) /backend/*.php ──► MySQL "jagocv"
```

---

## 1. Setup Database (phpMyAdmin)

1. Nyalakan **Apache** dan **MySQL** dari XAMPP Control Panel.
2. Buka <http://localhost/phpmyadmin>.
3. Tab **Import** → pilih file `database/jagocv.sql` → **Import**.
4. Database `jagocv` akan terbentuk dengan 3 tabel:

| Tabel           | Fungsi                                                        |
| --------------- | ------------------------------------------------------------- |
| `users`         | Akun (nama, email, hash password, google_sub, plan, avatar...) |
| `documents`     | CV/Resume/Portfolio milik user (untuk dashboard)               |
| `subscriptions` | Riwayat paket pricing (free/pro/business)                      |

> Kredensial MySQL default XAMPP: user `root`, password kosong. Jika berbeda,
> ubah konstanta `DB_USER` / `DB_PASS` di `backend/config.php`.

---

## 2. Menjalankan Backend PHP

Letakkan project (atau symlink-kan) sehingga bisa diakses Apache, contoh:

```bash
# macOS/Linux — jalankan dari induk folder project:
ln -s "$(pwd)/JagoCV---Salman" /Applications/XAMPP/htdocs/jagoCV---Salman
```

Verifikasi API sudah hidup:

```bash
curl http://localhost/jagoCV---Salman/backend/me.php
# → {"ok":false,"message":"Tidak terautentikasi. Silakan login terlebih dahulu."}
```

---

## 3. Menjalankan Frontend

```bash
npm install
npm run dev   # Vite di http://localhost:3000
```

Jika nama folder di `htdocs` berbeda, sesuaikan `VITE_API_BASE_URL` di `.env`.

### Alur yang bisa dicoba

- **Register**: buka `http://localhost:3000` → *Daftar* → isi form → akun
  tersimpan di tabel `users` (password ter-hash bcrypt) → otomatis masuk
  dashboard.
- **Login**: *Masuk* → email + password → token sesi 7 hari disimpan di
  `localStorage`.
- **Logout**: tombol logout di dashboard menghapus sesi.
- Sesi dipulihkan otomatis saat halaman dibuka ulang (cek ke `me.php`).

---

## 4. Setup Google Sign-In (Client ID)

Fitur Google memakai **tombol "Sign in with Google" resmi** dari Google
Identity Services (`renderButton`), yang membuka **popup pemilih akun**
setiap kali diklik — bukan One Tap (`prompt()`).

> **Kenapa bukan One Tap?** One Tap sering gagal muncul dengan alasan
> `unknown_reason` karena: (a) cooldown setelah popup sebelumnya ditutup,
> (b) pembatasan FedCM/third-party cookies di Chrome, (c) akun Google
> belum login di browser. Tombol resmi TIDAK punya cooldown dan selalu
> membuka popup — jauh lebih andal untuk development.

### 4.1 Konfigurasi di Google Cloud Console

Project: <https://console.cloud.google.com/apis/credentials?project=jagocv-509604>

1. **APIs & Services → Credentials** → buka OAuth 2.0 Client ID Anda
   (atau buat baru: **Create Credentials → OAuth client ID**).
   - Application type: **Web application**.
   - **Authorized JavaScript origins** (persis, tanpa trailing slash):
     - `http://localhost:3000` ← UI via Vite dev (utama)
     - `http://localhost` ← hanya bila UI dibuka langsung via Apache
   - **Authorized redirect URIs** tidak diperlukan untuk flow ini.
   - Simpan. Perubahan butuh ±5 menit untuk berlaku.
2. **APIs & Services → OAuth consent screen**:
   - Bila **Publishing status = Testing**, HANYA email di daftar
     **Test users** yang bisa login → buka **Audience → Add users**
     dan masukkan Gmail Anda.
   - Atau klik **Publish app** agar semua akun bisa login.
   - Scopes default (`openid`, `email`, `profile`) cukup — tidak perlu
     menambah scope apa pun.
3. Salin **Client ID** (format `xxxx.apps.googleusercontent.com`).

### 4.2 Konfigurasi di project

Client ID dipakai di DUA tempat dan sudah otomatis tersinkron dari satu
sumber — file `.env` di root project:

```env
VITE_GOOGLE_CLIENT_ID="1234-abc.apps.googleusercontent.com"
```

- **Frontend** (`src/js/utils/auth.ts`) membaca `VITE_GOOGLE_CLIENT_ID`
  untuk merender tombol Google.
- **Backend** (`backend/google.php`) membaca baris yang sama dari `.env`
  untuk memvalidasi `aud` token. Tidak perlu set environment variable
  Apache — cukup file `.env`.

Setelah mengubah `.env`, **restart dev server** (`Ctrl+C` lalu `npm run dev`)
karena Vite hanya membaca `.env` saat start.

### 4.3 Alur yang terjadi

```
Halaman login/daftar dibuka
  → di atas tombol custom "Lanjutkan dengan Google" dipasang LAPISAN
    tombol resmi Google yang transparan (desain custom tetap tampil)
Klik tombol → klik diterima lapisan resmi
  → POPUP pemilih akun Google terbuka (tanpa cooldown)
  → ID token (JWT) diterima frontend
  → POST /backend/google.php { credential }
  → PHP verifikasi token ke https://oauth2.googleapis.com/tokeninfo
    + cek aud == Client ID dari .env, cek email_verified
  → email sudah ada? link akun (google_sub) : buat user baru (+2 poin)
  → token sesi aplikasi dikembalikan & disimpan → dashboard
```

> Desain tombol tetap milik aplikasi (custom, sesuai UI login/register).
> Lapisan resmi Google hanya berperan sebagai penerima klik agar popup
> pemilih akun selalu terbuka secara andal.

### 4.4 Troubleshooting

| Gejala | Penyebab & solusi |
| --- | --- |
| Toast "Google Sign-In belum siap…" | Client ID kosong di `.env`, dev server belum di-restart, atau ekstensi (adblock) memblokir `accounts.google.com`. Cek Console browser. |
| Popup terbuka lalu langsung tertutup / "origin mismatch" | Origin halaman tidak terdaftar di **Authorized JavaScript origins** (cek persis: `http://localhost:3000`, bukan `http://127.0.0.1:3000` kecuali memang dipakai). |
| Popup: "Access blocked: app has not completed verification" / "hanya test user" | Consent screen masih **Testing** → tambahkan email Anda sebagai **Test user**, atau **Publish app**. |
| "Token Google bukan untuk aplikasi ini (audience mismatch)" | Client ID di `.env` berbeda dengan yang terdaftar di Google Console → samakan, restart dev server. |
| Klik tombol Google tidak memunculkan popup | Lapisan resmi gagal terpasang — cek tab Network untuk `gsi/client` (matikan adblock), pastikan Console tidak ada error, lalu muat ulang. Bila GSI gagal termuat, tombol custom menampilkan toast penjelasan saat diklik. |
| Buka via `http://localhost` (Apache) gagal CORS | Pastikan `http://localhost` terdaftar di origins Console **dan** di `$allowed_origins` (`backend/config.php`). |

---

## 5. Struktur File

```
database/jagocv.sql          ← skema DB (import via phpMyAdmin)
backend/
  config.php                 ← kredensial MySQL + CORS
  helpers.php                ← respons JSON, validasi, token sesi HMAC
  register.php               ← POST registrasi email/password
  login.php                  ← POST login email/password
  google.php                 ← POST login Google (verifikasi ID token)
  me.php                     ← GET  profil user dari token
  logout.php                 ← POST konfirmasi logout
  .htaccess                  ← pastikan header Authorization diteruskan
src/
  js/utils/auth.ts           ← client API + penyimpanan sesi + GSI
  js/views/auth.ts           ← binding form login/register + tombol Google
  vite-env.d.ts              ← tipe import.meta.env
```

---

## 6. Catatan Keamanan

- Password di-hash dengan `password_hash()` (bcrypt) — tidak pernah disimpan
  mentah.
- Query memakai **prepared statements** (PDO) — tahan SQL injection.
- Token sesi ditandatangani HMAC-SHA256 (`APP_JWT_SECRET` di `config.php`).
  **Ganti secret** sebelum dipakai sungguhan, dan berlaku 7 hari.
- CORS hanya mengizinkan origin dev (`localhost:3000`, `localhost:5173`).
  Tambahkan domain production Anda di `$allowed_origins` saat deploy.
- Untuk produksi, pertimbangkan verifikasi token Google via library resmi
  (mis. `firebase/php-jwt`) agar cek `aud`/`exp` lebih ketat.
