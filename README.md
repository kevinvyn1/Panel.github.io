# GitHub Pages + Username-only Login → Redirect ke "Channel" (Dashboard)

Versi ini memisahkan **halaman login (`index.html`)** dan **halaman dashboard (`dashboard.html`)**.
Setelah login sukses, pengguna otomatis **dialihkan (redirect)** ke dashboard (channel terpisah).

## File
- `index.html` — Form login (username-only).
- `dashboard.html` — Halaman "channel" berisi catatan terenkripsi.
- `common.js` — Inisialisasi Supabase + util kripto.
- `auth.js` — Logika login + redirect ke `dashboard.html`.
- `dashboard.js` — Guard sesi, CRUD catatan, dekripsi, logout.
- `style.css` — Styling.

## Cara pakai (ringkas)
1. Buat user di Supabase: `adminis@example.local` dengan password Anda.
2. Nonaktifkan sign-up publik agar tidak ada akun lain yang masuk.
3. Buat tabel + RLS (lihat versi sebelumnya; gunakan `gen_random_uuid()`).
4. Isi `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di `common.js`.
5. Deploy ke GitHub Pages.

Saat user login sukses di `index.html`, kode akan melakukan:
```js
sessionStorage.setItem("enc_password", password);
window.location.href = "dashboard.html";
```
Di `dashboard.html`, jika tidak ada sesi Supabase, user akan dipaksa kembali ke `index.html`.
