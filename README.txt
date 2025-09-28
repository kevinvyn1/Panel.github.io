Panel fixed package

Perubahan utama untuk menghentikan loop login
1. Otentikasi front end memakai modul ES dengan penyimpanan sesi di localStorage.
2. protect.js memastikan halaman admin dicek lalu memperpanjang sesi.
3. admin.js menambahkan tombol Keluar yang menghapus sesi agar tidak kembali loop.
4. CSP sudah mengizinkan module script lokal dan endpoint Google Script.

Cara pakai
1. Upload semua file ke GitHub Pages atau hosting statis.
2. Buka index.html untuk login. Setelah berhasil, otomatis pindah ke admin.html.
3. Ganti fungsi fakeVerify di js/app.js bila ingin verifikasi ke backend milikmu.
4. Jika memakai Apps Script atau Supabase, tambahkan domain di CSP di head dokumen.

Struktur
- index.html
- admin.html
- assets/styles.css
- auth/auth.js
- protect.js
- js/app.js
- js/admin.js
