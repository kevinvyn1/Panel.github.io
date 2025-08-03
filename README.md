# Diagnostics Build — "Failed to fetch" Helper

Gunakan build ini untuk melacak sumber error jaringan/CSP/CORS.
- Tombol **Diagnosa** di halaman login akan mencoba fetch ke:
  - `/auth/v1/settings`
  - `/rest/v1/`
- CSP `connect-src` sementara dilonggarkan ke semua `https:`/`wss:` (debug). Setelah normal, pakai build secure.

## Langkah
1) Edit `common.js` → isi `SUPABASE_URL` & `SUPABASE_ANON_KEY`.
2) Upload ke GitHub Pages, buka `index.html`, klik **Diagnosa**.
3) Baca log di panel “Diagnosa”:
   - Kalau masih “Failed to fetch”: kemungkinan CSP dari reverse proxy/CDN lain, AdBlock, atau domain Supabase salah.
   - Jika dapat status 401/404/200: koneksi tembus; masalah ada di kredensial atau user/password.

Setelah beres, balik ke paket secure yang connect-src lebih ketat.
