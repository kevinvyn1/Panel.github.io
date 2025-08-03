# GitHub Pages + Supabase Auth + Enkripsi (AES-GCM)

Template ini menunjukkan cara membuat situs **GitHub Pages (github.io)** dengan:

- **Login/Signup** memakai **Supabase Auth** (email & password).
- **Database** Postgres di Supabase (tabel `notes`).
- **End-to-end encryption** sederhana di sisi klien: isi catatan **dienkripsi di browser** (AES‑GCM + PBKDF2) sebelum dikirim ke server.

> ⚠️ Ini contoh edukasi. Untuk produksi, pertimbangkan pengelolaan kunci yang lebih matang (mis. per‑user key yang disegel, rotasi key, dsb.).

## Cara Pakai

### 1) Buat proyek Supabase
1. Masuk ke [supabase.com](https://supabase.com) dan buat project.
2. Buka `Project Settings` → `API`, catat **Project URL** dan **anon public key**.
3. Aktifkan **Email/Password** di `Authentication` → `Providers`.

### 2) Buat tabel & RLS
Di `SQL Editor`, jalankan:

```sql
-- Extension berguna (biasanya sudah aktif)
create extension if not exists pgcrypto;
create extension if not exists uuid-ossp;

-- Tabel notes
create table if not exists public.notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  content_ciphertext text not null,
  iv text not null,
  salt text not null,
  inserted_at timestamp with time zone default now()
);

alter table public.notes enable row level security;

-- Kebijakan RLS: user hanya bisa akses miliknya sendiri
create policy "select own notes" on public.notes
for select using (auth.uid() = user_id);

create policy "insert own notes" on public.notes
for insert with check (auth.uid() = user_id);

create policy "update own notes" on public.notes
for update using (auth.uid() = user_id);

create policy "delete own notes" on public.notes
for delete using (auth.uid() = user_id);
```

### 3) Isi kredensial di `app.js`
Edit baris atas:
```js
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_PUBLIC_ANON_KEY";
```

### 4) Deploy ke GitHub Pages
1. Buat repository publik, mis. `username/secure-notes`.
2. Upload file: `index.html`, `app.js`, `style.css`.
3. Aktifkan GitHub Pages: `Settings` → `Pages` → Source: `main` / `/ (root)`.
4. Buka `https://username.github.io/secure-notes/`

## Cara Kerja Enkripsi
- Password pengguna **tidak pernah** dikirim untuk enkripsi. Ia dipakai untuk login dan juga untuk **menurunkan kunci** via PBKDF2 (150k iter, SHA‑256).
- Tiap catatan memakai **salt** dan **IV** acak.
- Yang disimpan di DB: `ciphertext`, `iv`, `salt`. Server tidak tahu isi catatan.

## Batasan Demo
- Kunci enkripsi diturunkan dari password dan **disimpan di memori** sementara. Saat reload halaman, Anda perlu memasukkan password untuk dekripsi massal.
- Untuk produksi: gunakan manajemen kunci yang lebih baik (mis. per‑user master key yang dienkripsi dengan password dan disimpan di server di bawah RLS).

Selamat mencoba!
