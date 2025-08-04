# GitHub Pages + Supabase Starter (Login + Admin Whitelist)

Proyek ini adalah starter **situs statis** (GitHub Pages) dengan autentikasi **Supabase Auth** dan panel admin sederhana untuk mengelola tabel `whitelist`.

## Cara Pakai

1. **Duplikasi** repo ini ke GitHub Anda (atau unduh ZIP lalu unggah).
2. Di Supabase:
   - Buat proyek baru.
   - Buka **SQL Editor** dan jalankan `sql/schema.sql` lalu `sql/policies.sql`.
   - Tambahkan **user admin** ke tabel `admins` via SQL Editor, misalnya:
     ```sql
     insert into public.admins (user_id) values ('<UUID auth.users.id>'); 
     ```
   - Di **Auth → Settings** atur **Inactivity timeout** dan **Time-box sessions** sesuai kebutuhan.
   - (Opsional) Aktifkan **CAPTCHA** untuk sign-in/sign-up/reset.
3. Salin `js/config.example.js` menjadi `js/config.js`, isi `SUPABASE_URL` dan `SUPABASE_ANON_KEY`.
4. Aktifkan **GitHub Pages** (branch `main` / folder root). Situs otomatis **HTTPS**.
5. Buka `index.html` untuk login, setelah itu diarahkan ke `admin.html`.

> **Catatan “username”:** Supabase Auth standar menggunakan email/phone. Starter ini memetakan kolom *username* ke **email**. Untuk login benar‑benar via *username*, Anda perlu menambah tabel `profiles` (publik) yang memetakan `username→email` dan kebijakan RLS yang aman, atau menambahkan endpoint server/Edge Function.

## Keamanan & Batasan di Situs Statis

- **RLS wajib** di semua tabel yang diakses dari klien.
- **Jangan pernah** mengekspos `service_role` key. Gunakan **anon key** saja.
- **Cookie HttpOnly/SameSite** tidak bisa dipasang dari JS di situs statis. Supabase JS menyimpan sesi di `localStorage`. Mitigasi: **CSP ketat**, tidak ada inline script, sanitasi input, dan batasi izin Data API via RLS.
- **Rate limiting**: andalkan rate limit Auth bawaan Supabase + throttle di klien. Untuk kebutuhan lanjutan, taruh reverse‑proxy (mis. Cloudflare) atau gateway.
- **Anti‑scraping / DevTools detection** hanya penghalang ringan dan bisa dibypass.
- **Enkripsi kolom**: pertimbangkan `pgcrypto` untuk enkripsi selektif di server‑side. Hindari menyimpan rahasia enkripsi di klien.

## Struktur

```
/
├─ index.html        # halaman login
├─ admin.html        # panel admin (tabel whitelist + modal tambah)
├─ assets/styles.css # tema merah→hitam, responsif
├─ js/
│  ├─ app.js         # login, anti-scraping ringan, timeout klien
│  ├─ admin.js       # CRUD whitelist, cek admin, timeout klien
│  ├─ config.example.js
├─ sql/
│  ├─ schema.sql     # tabel dan enable RLS
│  └─ policies.sql   # kebijakan RLS (admin-only)
```

## Checklist Keamanan Tambahan

- MFA/2FA untuk admin (TOTP).
- Audit logging dengan **PGAudit**.
- Backup otomatis (Daily / PITR) + workflow GitHub Actions (CLI).
- Pemulihan akun terblokir (proses manual + audit).
- Review keamanan berkala (CSP, dependensi, rotasi kunci).

Lihat `docs/` pada jawaban ChatGPT untuk tautan referensi resmi.
