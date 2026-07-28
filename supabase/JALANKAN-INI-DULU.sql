-- =====================================================================
--  SEAWISE WEB PLATFORM — JALANKAN SEKALI SAJA
--
--  Cara pakai:
--    1. Buka Supabase Dashboard → SQL Editor → New query
--    2. Salin SELURUH isi file ini (Cmd+A lalu Cmd+C)
--    3. Tempel di editor, klik RUN
--
--  Berisi (berurutan):
--    - Skema tabel
--    - Row Level Security + policy
--    - Bucket storage
--    - Data demo
--
--  Aman dijalankan ulang kalau ada yang gagal di tengah.
-- =====================================================================



-- ####################################################################
-- ##  BAGIAN: migrations/20260727000001_init_schema.sql
-- ####################################################################

-- =====================================================================
-- Seawise Web Platform — 001 Init Schema
-- Multi-tenant: 1 Supabase project, dipisah per site_id.
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
do $$ begin
  create type site_status as enum ('draft', 'active', 'suspended', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type site_tier as enum ('shore', 'reef', 'current', 'trench');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('owner', 'editor', 'superadmin');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- TABLE: sites
-- 1 row = 1 website klien.
-- ---------------------------------------------------------------------
create table if not exists public.sites (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,              -- identitas internal, cth: 'villa-anandia'
  name          text not null,                     -- nama bisnis tampil
  domain        text unique,                       -- custom domain produksi, cth: 'villaanandia.com'
  vertical      text not null default 'generic',   -- 'generic' | 'cosmetics' | 'restaurant' | 'lodging' | ...
  tier          site_tier not null default 'shore',
  status        site_status not null default 'draft',
  locale        text not null default 'id-ID',
  timezone      text not null default 'Asia/Makassar',

  -- Konfigurasi tema: warna, font, radius, layout preset, animasi.
  theme_config  jsonb not null default '{}'::jsonb,

  -- Konfigurasi SEO level site: title template, default description, verifikasi, dll.
  seo_config    jsonb not null default '{}'::jsonb,

  -- Data bisnis untuk structured data (alamat, telp, jam buka, sosmed).
  business_info jsonb not null default '{}'::jsonb,

  -- Flag fitur per paket: { "admin_panel": true, "payment": false, "wa_auto": false }
  features      jsonb not null default '{}'::jsonb,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.sites is 'Satu baris per website klien. Isolasi tenant memakai kolom id sebagai site_id.';

create index if not exists sites_domain_idx on public.sites (domain) where domain is not null;
create index if not exists sites_status_idx on public.sites (status);

-- ---------------------------------------------------------------------
-- TABLE: profiles
-- Menghubungkan auth.users ke site. 1 user bisa punya >1 site.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  site_id     uuid references public.sites (id) on delete cascade,
  role        user_role not null default 'owner',
  full_name   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint profiles_user_site_unique unique (user_id, site_id),
  -- superadmin tidak terikat ke satu site
  constraint profiles_role_site_check check (
    (role = 'superadmin' and site_id is null) or (role <> 'superadmin' and site_id is not null)
  )
);

create index if not exists profiles_user_id_idx on public.profiles (user_id);
create index if not exists profiles_site_id_idx on public.profiles (site_id);

-- ---------------------------------------------------------------------
-- TABLE: content_blocks
-- Konten fleksibel. Struktur per `type` divalidasi di aplikasi (Zod),
-- bukan di database.
-- ---------------------------------------------------------------------
create table if not exists public.content_blocks (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references public.sites (id) on delete cascade,
  page_slug   text not null default 'home',  -- multi-halaman tanpa tabel baru
  type        text not null,                 -- 'hero' | 'about' | 'services' | 'products' | ...
  data        jsonb not null default '{}'::jsonb,
  position    integer not null default 0,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on column public.content_blocks.data is
  'Payload spesifik per type. Skema divalidasi di layer aplikasi memakai Zod (lihat src/lib/blocks/schemas.ts).';

create index if not exists content_blocks_site_page_idx
  on public.content_blocks (site_id, page_slug, position);
create index if not exists content_blocks_published_idx
  on public.content_blocks (site_id, published);
create index if not exists content_blocks_type_idx on public.content_blocks (type);
create index if not exists content_blocks_data_gin on public.content_blocks using gin (data);

-- ---------------------------------------------------------------------
-- TABLE: pages
-- Metadata per halaman (SEO override, judul, urutan nav).
-- ---------------------------------------------------------------------
create table if not exists public.pages (
  id            uuid primary key default gen_random_uuid(),
  site_id       uuid not null references public.sites (id) on delete cascade,
  slug          text not null default 'home',
  title         text not null,
  nav_label     text,
  show_in_nav   boolean not null default true,
  nav_position  integer not null default 0,
  seo           jsonb not null default '{}'::jsonb,  -- { title, description, og_image, noindex }
  published     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint pages_site_slug_unique unique (site_id, slug)
);

create index if not exists pages_site_idx on public.pages (site_id, published);

-- ---------------------------------------------------------------------
-- TABLE: media
-- ---------------------------------------------------------------------
create table if not exists public.media (
  id            uuid primary key default gen_random_uuid(),
  site_id       uuid not null references public.sites (id) on delete cascade,
  storage_path  text not null,           -- path di Supabase Storage bucket 'site-media'
  url           text not null,           -- public URL hasil resolve
  alt_text      text not null default '',-- penting untuk SEO & aksesibilitas
  caption       text,
  width         integer,
  height        integer,
  mime_type     text,
  size_bytes    bigint,
  created_at    timestamptz not null default now()
);

create index if not exists media_site_idx on public.media (site_id);

-- ---------------------------------------------------------------------
-- TABLE: leads
-- Submission form kontak / inquiry. Dipakai semua vertical.
-- ---------------------------------------------------------------------
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references public.sites (id) on delete cascade,
  name        text not null,
  email       text,
  phone       text,
  message     text,
  source      text default 'contact_form',
  meta        jsonb not null default '{}'::jsonb,
  handled     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists leads_site_created_idx on public.leads (site_id, created_at desc);

-- ---------------------------------------------------------------------
-- TRIGGER: updated_at otomatis
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['sites', 'profiles', 'content_blocks', 'pages'] loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at();', t, t);
  end loop;
end $$;


-- ####################################################################
-- ##  BAGIAN: migrations/20260727000002_rls_policies.sql
-- ####################################################################

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


-- ####################################################################
-- ##  BAGIAN: migrations/20260727000003_storage.sql
-- ####################################################################

-- =====================================================================
-- Seawise Web Platform — 003 Storage bucket untuk media klien
-- Konvensi path: {site_id}/{filename}
-- Isolasi dilakukan dengan mencocokkan folder pertama ke site_id user.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists site_media_public_read on storage.objects;
drop policy if exists site_media_owner_write on storage.objects;

create policy site_media_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'site-media');

-- Folder pertama harus berupa UUID yang valid. Pengecekan regex dilakukan
-- lebih dulu supaya cast ke uuid tidak melempar error saat ada berkas dengan
-- struktur folder tak terduga — error di dalam policy akan memblokir semua
-- operasi, bukan hanya berkas yang bermasalah.
create or replace function public.storage_site_id(object_name text)
returns uuid
language sql
immutable
as $$
  select case
    when (storage.foldername(object_name))[1] ~*
         '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then ((storage.foldername(object_name))[1])::uuid
    else null
  end;
$$;

create policy site_media_owner_write on storage.objects
  for all to authenticated
  using (
    bucket_id = 'site-media'
    and public.storage_site_id(name) is not null
    and public.has_site_access(public.storage_site_id(name))
  )
  with check (
    bucket_id = 'site-media'
    and public.storage_site_id(name) is not null
    and public.has_site_access(public.storage_site_id(name))
  );


-- ####################################################################
-- ##  BAGIAN: seed.sql
-- ####################################################################

-- =====================================================================
-- Seawise Web Platform — Seed demo
-- Jalankan setelah migration. Membuat 1 site demo tier "Shore" supaya
-- template-master bisa langsung dijalankan tanpa klien nyata.
-- =====================================================================

insert into public.sites (id, slug, name, domain, vertical, tier, status, theme_config, seo_config, business_info, features)
values (
  '00000000-0000-4000-8000-000000000001',
  'demo-seawise',
  'Seawise Demo',
  null,
  'generic',
  'reef',
  'active',
  jsonb_build_object(
    'preset', 'coastal',
    'colors', jsonb_build_object(
      'primary',    '#0f5c73',
      'secondary',  '#7fb7c4',
      'accent',     '#e8b04b',
      'background', '#fbfaf7',
      'foreground', '#12222a',
      'muted',      '#eef2f3'
    ),
    'fonts', jsonb_build_object('heading', 'fraunces', 'body', 'inter'),
    'radius', 'md',
    'motion', 'subtle'
  ),
  jsonb_build_object(
    'title_template',      '%s | Seawise Demo',
    'default_title',       'Seawise Demo — Jasa Pembuatan Website',
    'default_description', 'Website custom berbasis Next.js dan Supabase untuk bisnis Anda. Cepat, aman, dan siap ditemukan di Google.',
    'default_og_image',    null,
    'twitter_handle',      null,
    'noindex',             false
  ),
  jsonb_build_object(
    'legal_name',  'Seawise Studio',
    'email',       'seawise.cc@gmail.com',
    'phone',       '+6281000000000',
    'whatsapp',    '6281000000000',
    'street',      'Jl. Contoh No. 1',
    'city',        'Denpasar',
    'region',      'Bali',
    'postal_code', '80111',
    'country',     'ID',
    'latitude',    -8.670458,
    'longitude',   115.212629,
    'opening_hours', jsonb_build_array(
      jsonb_build_object('days', jsonb_build_array('Mo','Tu','We','Th','Fr'), 'opens', '09:00', 'closes', '17:00')
    ),
    'social', jsonb_build_object('instagram', 'https://instagram.com/seawise.cc')
  ),
  jsonb_build_object('admin_panel', true, 'payment', false, 'wa_auto', false, 'reorder', false)
)
on conflict (id) do nothing;

insert into public.pages (site_id, slug, title, nav_label, show_in_nav, nav_position, published, seo)
values (
  '00000000-0000-4000-8000-000000000001', 'home', 'Beranda', 'Beranda', true, 0, true,
  jsonb_build_object('description', 'Website custom untuk bisnis Anda — cepat, aman, dan SEO-ready sejak hari pertama.')
)
on conflict (site_id, slug) do nothing;

delete from public.content_blocks where site_id = '00000000-0000-4000-8000-000000000001';

insert into public.content_blocks (site_id, page_slug, type, position, published, data) values
('00000000-0000-4000-8000-000000000001', 'home', 'hero', 0, true, jsonb_build_object(
  'eyebrow',  'Seawise Studio',
  'headline', 'Website yang bekerja untuk bisnis Anda, bukan sebaliknya',
  'subheadline', 'Dibangun custom dengan Next.js dan Supabase. Cepat dibuka, aman, dan sudah dioptimalkan untuk mesin pencari sejak hari pertama.',
  'alignment', 'center',
  'primary_cta',   jsonb_build_object('label', 'Lihat Paket', 'href', '#paket'),
  'secondary_cta', jsonb_build_object('label', 'Hubungi Kami', 'href', '#kontak'),
  'image', jsonb_build_object('url', '', 'alt', '')
)),
('00000000-0000-4000-8000-000000000001', 'home', 'about', 1, true, jsonb_build_object(
  'title', 'Kenapa Seawise',
  'body',  'Kami tidak memakai template pasaran. Setiap situs dibangun di atas sistem yang sama-sama kami rawat, sehingga Anda dapat kecepatan, keamanan, dan kontrol penuh atas konten tanpa perlu mengurus server.',
  'image', jsonb_build_object('url', '', 'alt', ''),
  'stats', jsonb_build_array(
    jsonb_build_object('value', '<1 dtk', 'label', 'Waktu muat halaman'),
    jsonb_build_object('value', '100%',   'label', 'Server-side rendered'),
    jsonb_build_object('value', '24/7',   'label', 'Panel edit mandiri')
  )
)),
('00000000-0000-4000-8000-000000000001', 'home', 'services', 2, true, jsonb_build_object(
  'title', 'Paket Layanan',
  'subtitle', 'Empat tingkat kedalaman, satu sistem yang sama.',
  'layout', 'grid',
  'items', jsonb_build_array(
    jsonb_build_object('title', 'Shore',   'description', 'Satu halaman untuk promosi produk atau acara.',                'price', 'Rp 1,8 jt',   'icon', 'waves'),
    jsonb_build_object('title', 'Reef',    'description', 'Company profile lengkap dengan panel edit mandiri.',            'price', 'Rp 3,5–4 jt', 'icon', 'shell'),
    jsonb_build_object('title', 'Current', 'description', 'Tampilan lebih personal, bisa atur ulang urutan section.',      'price', 'Rp 4,5–5 jt', 'icon', 'wind'),
    jsonb_build_object('title', 'Trench',  'description', 'Sistem custom penuh untuk model bisnis yang tidak biasa.',      'price', 'Rp 6–7 jt',   'icon', 'anchor')
  )
)),
('00000000-0000-4000-8000-000000000001', 'home', 'gallery', 3, true, jsonb_build_object(
  'title', 'Galeri',
  'layout', 'masonry',
  'images', jsonb_build_array()
)),
('00000000-0000-4000-8000-000000000001', 'home', 'faq', 4, true, jsonb_build_object(
  'title', 'Pertanyaan Umum',
  'items', jsonb_build_array(
    jsonb_build_object('question', 'Apakah domain atas nama saya?', 'answer', 'Ya. Domain didaftarkan atas nama dan akun Anda sejak awal. Kami hanya diberi akses DNS untuk keperluan teknis.'),
    jsonb_build_object('question', 'Berapa lama pengerjaannya?',    'answer', 'Paket Shore sekitar 3–5 hari kerja. Reef dan Current 1–2 minggu, tergantung kelengkapan materi dari Anda.'),
    jsonb_build_object('question', 'Apakah saya bisa edit sendiri?','answer', 'Mulai paket Reef ke atas Anda mendapat panel admin untuk mengubah teks, harga, dan foto kapan saja.')
  )
)),
('00000000-0000-4000-8000-000000000001', 'home', 'contact', 5, true, jsonb_build_object(
  'title', 'Mulai Proyek Anda',
  'subtitle', 'Ceritakan kebutuhan bisnis Anda, kami balas dalam 1x24 jam.',
  'show_form', true,
  'show_map', false,
  'whatsapp_text', 'Halo Seawise, saya ingin konsultasi soal pembuatan website.'
));

