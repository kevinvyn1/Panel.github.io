# Sheets JSONP Integration (Fix CORS)

Masalah Anda:
- `getDataRange` null → project Apps Script tidak terkait spreadsheet tertentu, atau sheet `Whitelist` belum ada.
- CORS blocked → Web App tidak mengirim header `Access-Control-Allow-Origin`.

Solusi di paket ini:
- Apps Script memakai **SPREADSHEET_ID** (pasti membuka file yang benar) dan membuat sheet `Whitelist` jika belum ada.
- Endpoint `doGet` mendukung **JSONP** (`?callback=...`) sehingga **tidak butuh CORS** untuk **GET**.
- Untuk **POST**, klien kirim `mode: "no-cors"` lalu me-*reload* daftar via JSONP.

## Langkah
1) Buat spreadsheet → ambil **ID** dari URL (di antara `/d/` dan `/edit`).  
2) Buka **Apps Script** → tempel `integrations/apps_script/Code.js` → isi:
   ```js
   const SPREADSHEET_ID = '...';
   const TOKEN = '...';
   ```
3) **Deploy → Web app** (Execute as *Me*, Access *Anyone*). Ambil URL Web App.
4) `js/config.js`:
   ```js
   export const DATA_PROVIDER = 'sheet';
   export const SHEET_API_URL = '<<WEB_APP_URL>>';
   export const SHEET_TOKEN   = '<<TOKEN>>';
   ```
5) Deploy GitHub Pages → buka `admin.html` → klik **Muat Ulang** untuk cek data.

> Catatan: JSONP hanya dipakai untuk **GET list**. Untuk operasi kompleks/aman, pertimbangkan proxy (Supabase Edge Function/Cloudflare Worker) agar bisa pakai CORS header & autentikasi yang lebih kuat.
