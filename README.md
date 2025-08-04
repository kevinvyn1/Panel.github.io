# GitHub Pages + Supabase Secure Starter (Login + Admin Whitelist)

Proyek ini adalah starter **situs statis** (GitHub Pages) dengan autentikasi **Supabase Auth**, panel admin, **RLS** aktif, dan integrasi **Bot Protection** (Turnstile/hCaptcha).

## Langkah Cepat

1) **Supabase**
- Buat proyek → **SQL Editor** → jalankan `sql/schema.sql` lalu `sql/policies.sql`.
- Tambahkan admin pertama (ganti UUID dari `auth.users.id`):
  ```sql
  insert into public.admins (user_id) values ('<UUID>');
  ```
- **Auth → Settings → Sessions**: atur **Inactivity timeout** & **Time-box sessions**.
- **Auth → Settings → Bot Protection**: pilih **Turnstile** atau **hCaptcha** (sesuai yang akan Anda pakai di klien).

2) **Klien (Repo GitHub Pages)**
- Salin `js/config.example.js` → `js/config.js`, isi:
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`
  - `CAPTCHA_PROVIDER` = `"turnstile"` atau `"hcaptcha"`
  - `CAPTCHA_SITE_KEY` = site key dari provider terpilih
- Push ke GitHub. Aktifkan **GitHub Pages** (branch `main`/root).

3) **Login**
- Buka `index.html`, isi email & password (username dipetakan ke email).  
- Jika Bot Protection ON, selesaikan captcha; token akan dikirim via `options: { captchaToken }` ke Supabase.

## Catatan Keamanan
- **JANGAN** memaparkan `service_role` key di klien; gunakan **anon key** + **RLS**.
- GitHub Pages tidak mendukung header kustom, sehingga CSP dipasang via `<meta>`. Direktif `frame-ancestors` memang akan diabaikan—sudah dihapus dari template.
- Anti‑scraping di sini hanya penghalang ringan (bisa dibypass). Fokus utama tetap **RLS**, input validation, dan CSP.
- Untuk cookie HttpOnly/SameSite, dibutuhkan layer server. Supabase JS menyimpan sesi di storage—mitigasi dengan CSP & minim script pihak ketiga.

## Struktur
```
/
├─ index.html        # login + captcha dinamis
├─ admin.html        # panel admin (tabel whitelist + modal tambah)
├─ assets/styles.css # tema merah→hitam, responsif
├─ js/
│  ├─ app.js         # login, captcha, anti-scraping, timeout
│  ├─ admin.js       # CRUD whitelist, cek admin, timeout
│  ├─ config.example.js
├─ sql/
│  ├─ schema.sql     # tabel + enable RLS
│  └─ policies.sql   # kebijakan RLS (admin-only)
└─ README.md
```

## Lanjutkan
- Ingin login **username** (bukan email)? Tambah tabel `profiles` & RLS/Edge Function.
- Tambahkan **PGAudit** untuk audit logging dan atur **PITR** untuk backup berkala.
