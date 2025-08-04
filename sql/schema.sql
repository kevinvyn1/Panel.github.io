-- Skema dasar
create table if not exists public.admins (
  user_id uuid primary key,               -- auth.users.id
  created_at timestamp with time zone default now()
);

create table if not exists public.whitelist (
  id bigserial primary key,
  user_id text not null,                  -- kolom A
  angka integer not null,                 -- kolom B
  flag boolean not null default false,    -- kolom C (1/0)
  nama text not null,                     -- kolom D
  created_at timestamp with time zone default now()
);

-- Aktifkan RLS
alter table public.admins enable row level security;
alter table public.whitelist enable row level security;
