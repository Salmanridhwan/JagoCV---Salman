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

1. Buka <https://console.cloud.google.com/apis/credentials>.
2. **Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (Vite dev)
     - `http://localhost` (bila UI juga dibuka via Apache)
3. Salin **Client ID** (format `xxxx.apps.googleusercontent.com`).
4. Tempel ke `.env`:

   ```env
   VITE_GOOGLE_CLIENT_ID="1234-abc.apps.googleusercontent.com"
   ```

5. Restart `npm run dev`. Tombol **"Lanjutkan dengan Google"** kini membuka
   popup Google; setelah izin diberikan, backend memverifikasi ID token ke
   server Google lalu membuat/menghubungkan akun.

> Belum mengisi Client ID? Aplikasi tetap jalan; tombol Google hanya
> menampilkan toast pengingat.

### Cara kerja Google flow

```
Klik tombol → popup Google → ID token (JWT) diterima frontend
  → POST /backend/google.php { credential }
  → PHP verifikasi ke https://oauth2.googleapis.com/tokeninfo
  → email sudah ada? link akun (google_sub) : buat user baru
  → token sesi aplikasi dikembalikan & disimpan
```

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
