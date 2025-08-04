-- Kebijakan RLS
-- Hanya admin yang boleh melihat whitelist
create policy if not exists "whitelist_select_admins_only"
on public.whitelist for select
to authenticated
using ( exists (select 1 from public.admins a where a.user_id = auth.uid()) );

-- Hanya admin yang boleh insert/update/delete whitelist
create policy if not exists "whitelist_write_admins_only"
on public.whitelist for all
to authenticated
using ( exists (select 1 from public.admins a where a.user_id = auth.uid()) )
with check ( exists (select 1 from public.admins a where a.user_id = auth.uid()) );
