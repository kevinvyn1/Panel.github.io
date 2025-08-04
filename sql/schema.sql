-- (Tetap tersedia jika Anda pilih provider 'supabase')
create table if not exists public.admins (
  user_id uuid primary key,
  created_at timestamp with time zone default now()
);
create table if not exists public.whitelist (
  id bigserial primary key,
  user_id text not null,
  angka integer not null,
  flag boolean not null default false,
  nama text not null,
  created_at timestamp with time zone default now()
);
alter table public.admins enable row level security;
alter table public.whitelist enable row level security;
