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
