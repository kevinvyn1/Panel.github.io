Single Page Panel
- index.html menampilkan login dan admin dalam satu halaman.
- Token disimpan di cookie, expired setelah 2 jam.
- Jika cookie valid, halaman langsung tampil admin tanpa login.

Cara jalan lokal
1. npm install
2. cp .env.example .env lalu set JWT_SECRET, USERNAME, PASSWORD, SESSION_HOURS=2
3. npm run dev
4. Buka http://localhost:8080/
