# GitHub Pages: Email Login Only + E2E Encryption + CSP + Idle Lock

- Login: **email + password** saja (tidak ada daftar/signup).
- Enkripsi ujung-ke-ujung di klien (AES-GCM, PBKDF2 310k iter).
- CSP ketat + dukung wss untuk Supabase.
- Idle timeout 5 menit menghapus passphrase dari memori.
- Tidak menyimpan passphrase di storage.

## Setup
1) Isi kredensial di `common.js`:
```js
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_PUBLIC_ANON_KEY";
```
2) Di Supabase:
- Buat user `admin@infernostudios.com` (atau email lain yang dipakai).
- Nonaktifkan sign-up publik (invite-only).
- Buat tabel & RLS:
```sql
create extension if not exists pgcrypto;
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  content_ciphertext text not null,
  iv text not null,
  salt text not null,
  inserted_at timestamptz default now()
);
alter table public.notes enable row level security;
create policy "select own notes" on public.notes for select using (auth.uid() = user_id);
create policy "insert own notes" on public.notes for insert with check (auth.uid() = user_id);
create policy "update own notes" on public.notes for update using (auth.uid() = user_id);
create policy "delete own notes" on public.notes for delete using (auth.uid() = user_id);
```
3) Upload semua file ke repo GitHub Pages kamu.
