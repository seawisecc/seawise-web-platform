-- =====================================================================
--  Leuca, hilangkan tanda pisah panjang (em dash) dari seluruh konten.
--
--  Em dash lazim dalam tipografi Inggris tetapi jarang dipakai di teks
--  Indonesia, sehingga mudah terbaca sebagai gaya yang dipinjam. Koma
--  dan titik menyampaikan jeda yang sama tanpa menarik perhatian.
--
--  Tanda pisahnya tidak sekadar dibuang: ia diganti koma atau titik,
--  karena menghapusnya begitu saja menyisakan spasi ganda dan kalimat
--  yang menggantung.
--
--  Aman dijalankan berulang.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Lihat dulu apa saja yang akan berubah
-- ---------------------------------------------------------------------
select 'sites.name'   as lokasi, name as isi
  from public.sites
 where id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f' and name like '%—%'
union all
select 'sites.seo_config', seo_config::text
  from public.sites
 where id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f' and seo_config::text like '%—%'
union all
select 'blok: ' || type, left(data::text, 300)
  from public.content_blocks
 where site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f' and data::text like '%—%'
union all
select 'pages: ' || slug, coalesce(title, '') || ' | ' || coalesce(seo::text, '')
  from public.pages
 where site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
   and (title like '%—%' or seo::text like '%—%');

-- ---------------------------------------------------------------------
-- 2. Judul situs
--
--    Ditangani terpisah dari teks biasa. "Leuca, Eau de Parfum" membaca
--    seperti daftar; sebagai judul, tanpa tanda baca justru lebih tegas.
-- ---------------------------------------------------------------------
update public.sites
set
  name = replace(replace(name, ' — ', ' '), '—', ' '),
  seo_config = jsonb_set(
    seo_config,
    '{default_title}',
    to_jsonb(
      replace(
        replace(coalesce(seo_config ->> 'default_title', ''), ' — ', ' '),
        '—', ' '
      )
    )
  )
where id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f';

-- ---------------------------------------------------------------------
-- 3. Sisa setelan SEO, termasuk deskripsi bawaan
--
--    Di kalimat, jeda panjang paling wajar diwakili koma.
-- ---------------------------------------------------------------------
update public.sites
set
  seo_config    = replace(replace(seo_config::text,    ' — ', ', '), '—', ', ')::jsonb,
  business_info = replace(replace(business_info::text, ' — ', ', '), '—', ', ')::jsonb
where id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
  and (seo_config::text like '%—%' or business_info::text like '%—%');

-- ---------------------------------------------------------------------
-- 4. Seluruh isi halaman
--
--    Mencakup judul bagian, deskripsi produk, rincian aroma, jawaban FAQ,
--    dan teks alternatif gambar. Sekali jalan untuk semua bahasa, karena
--    katalognya memang tunggal.
-- ---------------------------------------------------------------------
update public.content_blocks
set data = replace(replace(data::text, ' — ', ', '), '—', ', ')::jsonb
where site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
  and data::text like '%—%';

-- ---------------------------------------------------------------------
-- 5. Judul halaman dan penimpaan SEO per halaman
-- ---------------------------------------------------------------------
update public.pages
set
  title     = replace(replace(title, ' — ', ' '), '—', ' '),
  nav_label = replace(replace(nav_label, ' — ', ' '), '—', ' '),
  seo       = replace(replace(seo::text, ' — ', ', '), '—', ', ')::jsonb
where site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
  and (title like '%—%' or nav_label like '%—%' or seo::text like '%—%');

-- ---------------------------------------------------------------------
-- 6. Rapikan spasi ganda yang mungkin tersisa
-- ---------------------------------------------------------------------
update public.sites
set name = btrim(regexp_replace(name, '\s+', ' ', 'g'))
where id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f';

update public.content_blocks
set data = regexp_replace(data::text, '(?<=[^\s"]) {2,}(?=[^\s"])', ' ', 'g')::jsonb
where site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
  and data::text like '%  %';

-- ---------------------------------------------------------------------
-- 7. Periksa hasilnya. Seharusnya tidak ada baris yang kembali.
-- ---------------------------------------------------------------------
select 'sites' as tabel, name as sisa
  from public.sites
 where id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
   and (name like '%—%' or seo_config::text like '%—%' or business_info::text like '%—%')
union all
select 'content_blocks', type
  from public.content_blocks
 where site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f' and data::text like '%—%'
union all
select 'pages', slug
  from public.pages
 where site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
   and (title like '%—%' or nav_label like '%—%' or seo::text like '%—%');

-- ---------------------------------------------------------------------
-- 8. Lihat judul barunya
-- ---------------------------------------------------------------------
select name, seo_config ->> 'default_title' as judul_seo
  from public.sites
 where id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f';
