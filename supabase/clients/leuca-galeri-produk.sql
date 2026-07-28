-- =====================================================================
--  Leuca — pindahkan foto produk dari satu foto ke galeri.
--
--  Kolom `image` (satu foto) dipindahkan menjadi elemen pertama `images`.
--  Setelah ini, foto tambahan tinggal diseret di panel admin dan pengunjung
--  bisa menggesernya di kartu produk.
--
--  Data lama tidak dihapus: `image` tetap ada sebagai cadangan, dan situs
--  memakainya hanya bila `images` kosong.
-- =====================================================================

update public.content_blocks
set data = jsonb_set(
  data,
  '{items}',
  (
    select coalesce(jsonb_agg(
      case
        when item ? 'images' and jsonb_array_length(item -> 'images') > 0
          then item
        when item ? 'image' and coalesce(item -> 'image' ->> 'url', '') <> ''
          then item || jsonb_build_object('images', jsonb_build_array(item -> 'image'))
        else item || jsonb_build_object('images', '[]'::jsonb)
      end
      order by ord
    ), '[]'::jsonb)
    from jsonb_array_elements(data -> 'items') with ordinality as t(item, ord)
  )
)
where site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
  and type = 'products'
  and jsonb_typeof(data -> 'items') = 'array';

-- Periksa hasilnya
select page_slug,
       item ->> 'name'                          as produk,
       jsonb_array_length(item -> 'images')     as jumlah_foto,
       item -> 'images' -> 0 ->> 'alt'          as alt_foto_pertama
from public.content_blocks,
     jsonb_array_elements(data -> 'items') as item
where site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
  and type = 'products'
order by page_slug, produk;
