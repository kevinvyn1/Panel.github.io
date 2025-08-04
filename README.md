# Supabase + Google Sheets (Apps Script) Integration

Opsi ini membuat **website statis** tetap memakai **Supabase untuk autentikasi & cek admin**, tetapi **data whitelist dibaca/ditulis dari Google Sheets** melalui **Google Apps Script Web App** (aman karena kredensial Sheets tidak ada di klien).

## Setup Apps Script
1. Buat Google Spreadsheet → tambah sheet bernama **Whitelist** dengan header baris 1:
   - A `user_id`
   - B `angka`
   - C `flag` (1/0)
   - D `nama`
   - E `created_at`
2. Buka **Extensions → Apps Script** → buat file `Code.gs` dan tempel isi `integrations/apps_script/Code.gs`.
3. Ganti `TOKEN` pada `Code.gs` (string rahasia bersama).
4. **Deploy**: `Deploy → New deployment → type Web app → Execute as: Me → Who has access: Anyone`. Salin **Web app URL**.
5. Di repo: salin `js/config.example.js` → `js/config.js`, isi:
   - `DATA_PROVIDER = 'sheet'`
   - `SHEET_API_URL = '<Web app URL>'`
   - `SHEET_TOKEN = '<TOKEN yang sama>'`
   - Tetap isi `SUPABASE_URL` & `SUPABASE_ANON_KEY` untuk autentikasi & cek admin.

## Pakai Supabase saja?
Set `DATA_PROVIDER = 'supabase'` → panel admin pakai tabel `public.whitelist` (SQL & policy disediakan di folder `sql/`).

## Catatan
- Apps Script Web App dengan `Content-Type: application/x-www-form-urlencoded` menghindari preflight, sehingga **GitHub Pages** bisa `fetch` langsung.
- Amankan URL dengan `TOKEN` unik dan batasi alamat spreadsheet via proteksi berbasis akun Google Anda.
- Kalau membutuhkan audit/backup: tetap simpan salinan ke Supabase via Edge Function/cron atau buat mekanisme impor/ekspor.
