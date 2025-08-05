-- PostgreSQL schema for Whitelist V1 and V2 (Supabase compatible)

-- ==============================
--  Whitelist V1
-- ==============================
create table if not exists whitelist_v1 (
  id          bigserial primary key,
  userid      bigint      not null,
  angka       bigint      not null,
  flag        smallint    not null check (flag in (0,1)),
  nama        text        not null,
  created_at  timestamptz not null default now()
);

create unique index if not exists whitelist_v1_userid_idx on whitelist_v1 (userid);

-- ==============================
--  Whitelist V2
-- ==============================
create table if not exists whitelist_v2 (
  id          bigserial primary key,
  userid      bigint      not null,
  angka       bigint      not null,
  flag        smallint    not null check (flag in (0,1)),
  kode        text        not null,
  nama        text        not null,
  created_at  timestamptz not null default now()
);

create unique index if not exists whitelist_v2_userid_idx on whitelist_v2 (userid);

-- ==============================
-- Optional unified view
-- ==============================
create or replace view whitelist_all as
select 'v1'::text as version, userid, angka, flag, null::text as kode, nama, created_at
from whitelist_v1
union all
select 'v2', userid, angka, flag, kode, nama, created_at
from whitelist_v2;

-- ==============================
-- Sample insert
-- insert into whitelist_v1 (userid, angka, flag, nama) values (1234567890, 213123, 1, 'Kevin');
-- insert into whitelist_v2 (userid, angka, flag, kode, nama) values (1234567890, 213123, 1, '9213', 'Kevin');
-- ==============================
