# Panel Bundle

Ini adalah bundle statis untuk halaman **Admin Panel** + proteksi login sisi klien yang cocok dijalankan di GitHub Pages / hosting statis.

## Struktur
- `index.html` — halaman login
- `admin.html` — halaman admin (file persis seperti yang Anda kirim)
- `assets/styles.css` — gaya tampilan
- `js/config.js` — konfigurasi (password, provider data)
- `js/auth.js` — modul autentikasi sederhana (localStorage token + TTL)
- `js/index.js` — skrip login
- `js/admin.js` — logika panel, navigasi, CRUD mock/provider

## Cara Pakai Cepat
1. Ubah password default di `js/config.js` (`ADMIN_PASS`) atau set via DevTools:
   ```js
   localStorage.setItem('ADMIN_PASS', 'passwordBaruAnda')
   ```
2. (Opsional) Sambungkan data nyata:
   - **Google Apps Script**: set `PROVIDER: 'apps_script'` dan isi `APPS_SCRIPT_URL`.
     - Endpoint yang dipakai:
       - `GET  ?action=list&sheet=v1|v2`
       - `GET  ?action=logs`
       - `POST ?action=create&sheet=v1|v2` (body JSON)
       - `POST ?action=delete&sheet=v1|v2&user_id=...`
   - **Supabase**: placeholder disiapkan, Anda bisa menambahkan implementasinya di `Provider`.
3. Deploy ke GitHub Pages atau hosting statis lain (semua script dari origin sendiri, CSP sudah disetel).

## Catatan Keamanan
- Ini **client-side auth**. Cukup untuk menyembunyikan halaman dari user biasa, tapi tidak sekuat auth server-side.
- Untuk hardening, pertimbangkan menaruh di hosting yang mendukung **HTTP Basic Auth** atau implementasi token/signature server.


