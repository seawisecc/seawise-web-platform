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
