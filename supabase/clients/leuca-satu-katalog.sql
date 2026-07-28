-- =====================================================================
--  Leuca — satu katalog produk untuk semua bahasa.
--
--  Sebelum ini setiap bahasa punya salinan produknya sendiri. Akibatnya
--  mengganti satu foto berarti mengunggahnya dua kali, dan kedua halaman
--  cepat atau lambat berbeda isi.
--
--  Skrip ini memindahkan teks Inggris yang sudah ada ke dalam katalog
--  utama sebagai kolom pendamping (name_en, description_en, label_en),
--  lalu mengosongkan blok salinan di halaman /en.
--
--  Aman dijalankan ulang.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Serap teks Inggris ke dalam blok produk halaman utama
-- ---------------------------------------------------------------------
with sumber as (
  select
    (select data from public.content_blocks
      where site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
        and type = 'products' and page_slug = 'home')  as id_data,
    (select data from public.content_blocks
      where site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
        and type = 'products' and page_slug = 'en')    as en_data
),
gabung as (
  select
    coalesce(s.id_data, '{}'::jsonb)
    || jsonb_build_object(
         'title_en',    coalesce(s.en_data ->> 'title', ''),
         'subtitle_en', coalesce(s.en_data ->> 'subtitle', ''),
         'items', (
           select coalesce(jsonb_agg(
             item
             || jsonb_build_object(
                  'name_en',        coalesce(pasangan ->> 'name', ''),
                  'description_en', coalesce(pasangan ->> 'description', ''),
                  'details', (
                    select coalesce(jsonb_agg(
                      d || jsonb_build_object(
                        'label_en',
                        coalesce(
                          (pasangan -> 'details' -> (di - 1)::int ->> 'label'),
                          ''
                        )
                      )
                      order by di
                    ), '[]'::jsonb)
                    from jsonb_array_elements(item -> 'details')
                         with ordinality as dt(d, di)
                  )
                )
             order by ord
           ), '[]'::jsonb)
           from jsonb_array_elements(s.id_data -> 'items')
                with ordinality as t(item, ord)
           -- Pasangan dicari lewat SKU; itu satu-satunya penanda yang
           -- tidak ikut berubah saat teksnya diterjemahkan.
           left join lateral (
             select e
             from jsonb_array_elements(coalesce(s.en_data -> 'items', '[]'::jsonb)) as e
             where e ->> 'sku' = item ->> 'sku'
             limit 1
           ) as p(pasangan) on true
         )
       ) as data_baru
  from sumber s
)
update public.content_blocks cb
set data = g.data_baru
from gabung g
where cb.site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
  and cb.type = 'products'
  and cb.page_slug = 'home'
  and g.data_baru is not null;

-- ---------------------------------------------------------------------
-- 2. Judul galeri versi Inggris
-- ---------------------------------------------------------------------
update public.content_blocks cb
set data = cb.data || jsonb_build_object(
  'title_en',
  coalesce((
    select en.data ->> 'title' from public.content_blocks en
    where en.site_id = cb.site_id and en.type = 'gallery' and en.page_slug = 'en'
  ), '')
)
where cb.site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
  and cb.type = 'gallery'
  and cb.page_slug = 'home';

-- ---------------------------------------------------------------------
-- 3. Kosongkan blok salinan di halaman /en
--
--    Barisnya sengaja TIDAK dihapus: ia masih menentukan posisi bagian
--    dan status tayang di halaman Inggris. Hanya isinya yang dikosongkan,
--    karena situs kini membacanya dari halaman utama.
-- ---------------------------------------------------------------------
update public.content_blocks
set data = '{}'::jsonb
where site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
  and page_slug = 'en'
  and type in ('products', 'gallery');

-- ---------------------------------------------------------------------
-- 4. Periksa hasilnya
-- ---------------------------------------------------------------------
select
  item ->> 'sku'                                as sku,
  item ->> 'name'                               as nama_id,
  item ->> 'name_en'                            as nama_en,
  left(item ->> 'description_en', 40)           as deskripsi_en,
  jsonb_array_length(item -> 'images')          as foto,
  item -> 'details' -> 0 ->> 'label'            as label_id,
  item -> 'details' -> 0 ->> 'label_en'         as label_en
from public.content_blocks,
     jsonb_array_elements(data -> 'items') as item
where site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
  and type = 'products'
  and page_slug = 'home';
