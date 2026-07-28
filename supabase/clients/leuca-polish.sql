-- =====================================================================
--  Leuca — perbaikan tampilan hero dan bagian "tentang".
--
--  Dua masalah yang diperbaiki:
--   1. Hero tanpa gambar = blok teks polos di tengah layar kosong.
--      Sekarang dua kolom dengan foto produk sebagai jangkar visual.
--   2. Judul "Tentang Leuca" adalah label, bukan pesan. Diganti kalimat
--      pernyataan supaya bagian itu terbaca editorial, bukan template.
--
--  Tempel di Supabase SQL Editor lalu Run.
-- =====================================================================

update public.content_blocks
set data = data
  || $json${
       "alignment": "left",
       "image": {
         "url": "/leuca/amber-saint.jpg",
         "alt": "Botol dan kemasan eau de parfum Leuca Amber Saint"
       }
     }$json$::jsonb
where site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
  and type = 'hero';

update public.content_blocks
set data = jsonb_set(data, '{title}', '"Aroma yang baik tidak harus mahal, dan tidak harus datang dari jauh."')
where site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
  and type = 'about' and page_slug = 'home';

update public.content_blocks
set data = jsonb_set(data, '{title}', '"A good fragrance need not be expensive, nor come from far away."')
where site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
  and type = 'about' and page_slug = 'en';

-- Kalimat pembuka di "tentang" kini mengulang judul, jadi dipangkas.
update public.content_blocks
set data = jsonb_set(data, '{body}',
  '"Setiap varian dibangun dari tiga lapis aroma. Lapis pembuka yang menyapa di menit pertama, lapis jantung yang bertahan sepanjang siang, dan lapis dasar yang tertinggal di kain sampai malam.\n\nDiracik dan dikemas di Bali, dalam jumlah terbatas setiap kali produksi."')
where site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
  and type = 'about' and page_slug = 'home';

update public.content_blocks
set data = jsonb_set(data, '{body}',
  '"Each variant is built from three layers. An opening that greets you in the first minutes, a heart that carries through the afternoon, and a base that lingers on fabric into the night.\n\nBlended and bottled in Bali, in small batches."')
where site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
  and type = 'about' and page_slug = 'en';

select page_slug, type,
       data ->> 'alignment'          as perataan,
       data -> 'image' ->> 'url'     as gambar,
       left(coalesce(data ->> 'title', data ->> 'headline'), 52) as judul
from public.content_blocks
where site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
  and type in ('hero', 'about')
order by page_slug, position;
