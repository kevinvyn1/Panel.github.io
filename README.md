# Demo Proteksi admin.html (Client-side)

**PENTING:** Ini hanyalah proteksi **client-side** untuk situs statis (mis. GitHub Pages). Mudah dibypass lewat devtools dan _direct URL access_. Untuk produksi, gunakan solusi auth server-side (Cloudflare Access, Firebase/Supabase Auth, Auth0/Clerk, dsb).

## Struktur
```
.
├─ index.html      # Login page
├─ admin.html      # Halaman yang diproteksi
└─ js/
   └─ auth.js      # Modul auth (client-side)
```

## Cara Pakai
1. **Ubah password demo** di `index.html` (const `PASSWORD`).
2. Buka `admin.html`. Jika belum login, kamu akan **dilempar** ke `index.html?next=<url-admin>`.
3. Setelah login sukses, kamu akan dikembalikan ke halaman `next` (default: `admin.html`).
4. `requireAuth()` di `admin.html` akan **cek ulang setiap 5 menit**. Jika sesi expired, user dilempar ke `index.html`.

## Konfigurasi
- Masa hidup sesi: default **30 menit** (`login({ ttlMs })`).
- Interval re-check: default **5 menit** (`requireAuth({ checkEveryMs })`).
- Login page diasumsikan `index.html` di folder yang sama. Ubah `LOGIN_PAGE` di `js/auth.js` jika berbeda.

## Keterbatasan
- Tidak benar-benar mengunci file di server (siapa pun yang tahu URL file tetap bisa akses).
- Token & expiry disimpan di `localStorage` (bisa dihapus/dimodifikasi).
- **Solusi produksi**: tempatkan di balik _reverse proxy_ atau gunakan layanan auth server-side yang memeriksa token/JWT sebelum menyajikan konten.

---
Dibuat otomatis untuk kebutuhan demo.