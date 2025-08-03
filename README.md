# Secure GitHub Pages: Username-only + E2E Encryption + CSP + Idle Lock

Versi ini fokus **proteksi maksimal** untuk skenario GitHub Pages (statik) + Supabase:
- **Tidak ada password di kode** (tidak di-hardcode).
- **Username-only** (UI membatasi hanya `adminis`), keamanan inti tetap pada Supabase Auth + **RLS**.
- **Enkripsi ujung-ke-ujung**: Passphrase enkripsi **terpisah** dari password login & **tidak pernah dikirim** ke server.
- **CSP ketat** via meta tag (blok inline script, batasi origin).
- **Idle timeout 5 menit**: passphrase otomatis terhapus dari memori.
- **No storage**: passphrase tidak disimpan di `localStorage/sessionStorage`.

## Setup
1. Buat user Supabase manual:
   - Email: `adminis@example.local`
   - Password: *(pilih sendiri; jangan ditaruh di kode)*
   - Nonaktifkan sign-up publik (invite-only).
2. Buat tabel & RLS (Postgres):
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

create policy "select own notes" on public.notes
for select using (auth.uid() = user_id);

create policy "insert own notes" on public.notes
for insert with check (auth.uid() = user_id);

create policy "update own notes" on public.notes
for update using (auth.uid() = user_id);

create policy "delete own notes" on public.notes
for delete using (auth.uid() = user_id);
```
3. Atur kredensial di `common.js`:
```js
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_PUBLIC_ANON_KEY";
```
4. Deploy ke GitHub Pages.

## Catatan Keamanan
- Gunakan passphrase enkripsi yang **berbeda** dari password Supabase.
- RLS adalah garis pertahanan utama untuk database, karena `anon key` memang publik di klien.
- CSP diatur ketat; hindari menambah inline script atau host pihak ketiga tanpa kebutuhan.
