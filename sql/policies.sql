-- Kebijakan RLS
-- Hanya admin yang boleh melihat whitelist
create policy "whitelist_select_admins_only"
on public.whitelist for select
to authenticated
using ( exists (select 1 from public.admins a where a.user_id = auth.uid()) );

-- Hanya admin yang boleh insert/update/delete whitelist
create policy "whitelist_write_admins_only"
on public.whitelist for all
to authenticated
using ( exists (select 1 from public.admins a where a.user_id = auth.uid()) )
with check ( exists (select 1 from public.admins a where a.user_id = auth.uid()) );

-- Tabel admins: hanya superuser (dashboard/sql) yang boleh mengelola, tidak ada kebijakan untuk authenticated
-- (Tambahkan entri admin pertama via SQL editor Supabase)
