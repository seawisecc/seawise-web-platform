-- =====================================================================
-- Seawise Web Platform — 002 Row Level Security
--
-- PENTING: RLS adalah satu-satunya batas isolasi antar klien di platform
-- ini (lihat Bagian 10 dokumen rangkuman). Setiap perubahan di file ini
-- WAJIB diuji dengan skrip di supabase/tests/rls_test.sql sebelum deploy.
-- =====================================================================

alter table public.sites          enable row level security;
alter table public.profiles       enable row level security;
alter table public.content_blocks enable row level security;
alter table public.pages          enable row level security;
alter table public.media          enable row level security;
alter table public.leads          enable row level security;

-- Paksa RLS juga berlaku untuk owner tabel (bukan service_role).
alter table public.sites          force row level security;
alter table public.profiles       force row level security;
alter table public.content_blocks force row level security;
alter table public.pages          force row level security;
alter table public.media          force row level security;
alter table public.leads          force row level security;

-- ---------------------------------------------------------------------
-- HELPER FUNCTIONS
-- SECURITY DEFINER + search_path terkunci supaya tidak bisa di-hijack,
-- dan supaya query di dalamnya tidak memicu rekursi RLS di profiles.
-- ---------------------------------------------------------------------
create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'superadmin'
  );
$$;

create or replace function public.user_site_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.site_id from public.profiles p
  where p.user_id = auth.uid() and p.site_id is not null;
$$;

create or replace function public.has_site_access(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_superadmin()
      or exists (
        select 1 from public.profiles p
        where p.user_id = auth.uid() and p.site_id = target
      );
$$;

revoke execute on function public.is_superadmin()          from public;
revoke execute on function public.user_site_ids()          from public;
revoke execute on function public.has_site_access(uuid)    from public;
grant  execute on function public.is_superadmin()          to authenticated;
grant  execute on function public.user_site_ids()          to authenticated;
grant  execute on function public.has_site_access(uuid)    to authenticated, anon;

-- ---------------------------------------------------------------------
-- SITES
-- ---------------------------------------------------------------------
drop policy if exists sites_public_read   on public.sites;
drop policy if exists sites_member_read   on public.sites;
drop policy if exists sites_member_update on public.sites;
drop policy if exists sites_admin_all     on public.sites;

-- Pengunjung anonim boleh baca site yang aktif (dibutuhkan untuk render publik).
create policy sites_public_read on public.sites
  for select to anon
  using (status = 'active');

create policy sites_member_read on public.sites
  for select to authenticated
  using (status = 'active' or public.has_site_access(id));

-- Klien boleh update site miliknya, TAPI kolom theme/struktur dikunci
-- lewat GRANT kolom di bawah — bukan lewat policy.
create policy sites_member_update on public.sites
  for update to authenticated
  using (public.has_site_access(id))
  with check (public.has_site_access(id));

create policy sites_admin_all on public.sites
  for all to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- ---------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------
drop policy if exists profiles_self_read on public.profiles;
drop policy if exists profiles_admin_all on public.profiles;

create policy profiles_self_read on public.profiles
  for select to authenticated
  using (user_id = auth.uid() or public.is_superadmin());

create policy profiles_admin_all on public.profiles
  for all to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- ---------------------------------------------------------------------
-- CONTENT_BLOCKS
-- ---------------------------------------------------------------------
drop policy if exists blocks_public_read on public.content_blocks;
drop policy if exists blocks_owner_read  on public.content_blocks;
drop policy if exists blocks_owner_write on public.content_blocks;
drop policy if exists blocks_admin_all   on public.content_blocks;

create policy blocks_public_read on public.content_blocks
  for select to anon
  using (
    published = true
    and exists (select 1 from public.sites s where s.id = site_id and s.status = 'active')
  );

create policy blocks_owner_read on public.content_blocks
  for select to authenticated
  using (
    public.has_site_access(site_id)
    or (published = true
        and exists (select 1 from public.sites s where s.id = site_id and s.status = 'active'))
  );

create policy blocks_owner_write on public.content_blocks
  for all to authenticated
  using (public.has_site_access(site_id))
  with check (public.has_site_access(site_id));

create policy blocks_admin_all on public.content_blocks
  for all to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- ---------------------------------------------------------------------
-- PAGES
-- ---------------------------------------------------------------------
drop policy if exists pages_public_read on public.pages;
drop policy if exists pages_owner_all   on public.pages;

create policy pages_public_read on public.pages
  for select to anon
  using (
    published = true
    and exists (select 1 from public.sites s where s.id = site_id and s.status = 'active')
  );

create policy pages_owner_all on public.pages
  for all to authenticated
  using (public.has_site_access(site_id))
  with check (public.has_site_access(site_id));

-- ---------------------------------------------------------------------
-- MEDIA
-- ---------------------------------------------------------------------
drop policy if exists media_public_read on public.media;
drop policy if exists media_owner_all   on public.media;

create policy media_public_read on public.media
  for select to anon
  using (exists (select 1 from public.sites s where s.id = site_id and s.status = 'active'));

create policy media_owner_all on public.media
  for all to authenticated
  using (public.has_site_access(site_id))
  with check (public.has_site_access(site_id));

-- ---------------------------------------------------------------------
-- LEADS
-- Anonim boleh INSERT (submit form) tapi TIDAK boleh SELECT.
-- ---------------------------------------------------------------------
drop policy if exists leads_public_insert on public.leads;
drop policy if exists leads_owner_read    on public.leads;
drop policy if exists leads_owner_update  on public.leads;

create policy leads_public_insert on public.leads
  for insert to anon, authenticated
  with check (exists (select 1 from public.sites s where s.id = site_id and s.status = 'active'));

create policy leads_owner_read on public.leads
  for select to authenticated
  using (public.has_site_access(site_id));

create policy leads_owner_update on public.leads
  for update to authenticated
  using (public.has_site_access(site_id))
  with check (public.has_site_access(site_id));

-- ---------------------------------------------------------------------
-- TABLE & COLUMN GRANTS
--
-- RLS menentukan BARIS mana yang terlihat; GRANT menentukan OPERASI apa
-- yang boleh dilakukan sama sekali. Keduanya diperlukan.
--
-- Semua hak dicabut lebih dulu, lalu diberikan satu per satu — supaya
-- tidak bergantung pada default privileges bawaan Supabase yang bisa
-- berubah.
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

revoke all on public.sites, public.profiles, public.content_blocks,
              public.pages, public.media, public.leads
  from anon, authenticated;

-- anon: hanya membaca konten publik, dan mengirim pesan lewat form.
grant select on public.sites          to anon;
grant select on public.content_blocks to anon;
grant select on public.pages          to anon;
grant select on public.media          to anon;
grant insert on public.leads          to anon;

-- authenticated: mengelola isi situsnya sendiri (dibatasi lagi oleh RLS).
grant select                         on public.profiles       to authenticated;
grant select                         on public.sites          to authenticated;
grant select, insert, update, delete on public.content_blocks to authenticated;
grant select, insert, update, delete on public.pages          to authenticated;
grant select, insert, update, delete on public.media          to authenticated;
grant select, insert, update         on public.leads          to authenticated;

-- Klien hanya boleh mengubah nama, info bisnis, dan konfigurasi SEO.
-- theme_config, tier, domain, status, dan features TIDAK di-grant — jadi
-- klien tidak bisa mengganti tema atau menaikkan paketnya sendiri, bahkan
-- lewat panggilan langsung ke API Supabase.
grant update (name, business_info, seo_config) on public.sites to authenticated;
