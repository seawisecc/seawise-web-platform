-- =====================================================================
--  KLIEN: Leuca — de perfume   (paket Reef, vertical cosmetics)
--
--  Jalankan di Supabase → SQL Editor → New query → Run.
--  Aman dijalankan ulang: baris lama akan ditimpa.
--
--  site_id : 7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f
--
--  Catatan: email, telepon, WhatsApp, dan Instagram di bawah masih
--  PLACEHOLDER. Ganti dengan data asli Leuca sebelum situs tayang.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Baris site — identitas, tema, SEO, info bisnis
-- ---------------------------------------------------------------------
insert into public.sites
  (id, slug, name, domain, vertical, tier, status, locale, timezone,
   theme_config, seo_config, business_info, features)
values (
  '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f',
  'leuca',
  'Leuca',
  null,
  'cosmetics',
  'reef',
  'active',
  'id-ID',
  'Asia/Makassar',

  -- Tema beige hangat, mengikuti warna kemasan kraft Leuca.
  -- Lolos WCAG AA: teks 13.4:1, teks di area muted 12.0:1,
  -- emas terhadap latar 4.4:1, teks putih di atas tombol emas 5.0:1.
  $json${
    "preset": "warm-sand",
    "colors": {
      "primary":    "#8A6A2F",
      "secondary":  "#B08D33",
      "accent":     "#8C3A2A",
      "background": "#F5EFE4",
      "foreground": "#2A241C",
      "muted":      "#EBE2D2"
    },
    "fonts":  { "heading": "fraunces", "body": "inter" },
    "radius": "sm",
    "motion": "expressive"
  }$json$::jsonb,

  $json${
    "title_template": "%s | Leuca",
    "default_title": "Leuca — Eau de Parfum",
    "default_description": "Lima varian eau de parfum Leuca dalam kemasan 30 ml dan 10 ml. Diracik untuk bertahan seharian.",
    "default_og_image": null,
    "twitter_handle": null,
    "noindex": false,
    "google_site_verification": null
  }$json$::jsonb,

  $json${
    "legal_name": "Leuca",
    "email": "halo@leuca.id",
    "phone": "+62 812-0000-0000",
    "whatsapp": "6281200000000",
    "street": "",
    "city": "Denpasar",
    "region": "Bali",
    "postal_code": "80228",
    "country": "ID",
    "latitude": null,
    "longitude": null,
    "price_range": "Rp 45.000 - Rp 117.000",
    "opening_hours": [
      { "days": ["Mo","Tu","We","Th","Fr","Sa"], "opens": "09:00", "closes": "18:00" }
    ],
    "social": { "instagram": "https://instagram.com/leuca.parfum" }
  }$json$::jsonb,

  -- Paket Reef: panel admin aktif, atur urutan section belum termasuk.
  $json${ "admin_panel": true, "reorder": false, "payment": false, "wa_auto": false }$json$::jsonb
)
on conflict (id) do update set
  name          = excluded.name,
  vertical      = excluded.vertical,
  tier          = excluded.tier,
  status        = excluded.status,
  theme_config  = excluded.theme_config,
  seo_config    = excluded.seo_config,
  business_info = excluded.business_info,
  features      = excluded.features;

-- ---------------------------------------------------------------------
-- 2. Halaman — Indonesia (home) dan Inggris (/en)
--    Kunci "hreflang" di kolom seo yang memicu tag alternate di HTML.
-- ---------------------------------------------------------------------
insert into public.pages (site_id, slug, title, nav_label, show_in_nav, nav_position, published, seo)
values
  ('7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f', 'home', 'Beranda', 'Indonesia', true, 0, true,
   $json${
     "hreflang": "id",
     "description": "Lima varian eau de parfum Leuca dalam kemasan 30 ml dan 10 ml. Diracik di Bali untuk bertahan seharian."
   }$json$::jsonb),
  ('7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f', 'en', 'English', 'English', true, 1, true,
   $json${
     "hreflang": "en",
     "title": "Leuca - Artisanal Eau de Parfum from Bali",
     "description": "Five eau de parfum by Leuca, available in 30 ml and 10 ml. Blended in Bali to last through the day."
   }$json$::jsonb)
on conflict (site_id, slug) do update set
  title       = excluded.title,
  nav_label   = excluded.nav_label,
  nav_position= excluded.nav_position,
  published   = excluded.published,
  seo         = excluded.seo;

-- ---------------------------------------------------------------------
-- 3. Isi halaman Indonesia
-- ---------------------------------------------------------------------
delete from public.content_blocks
where site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f';

insert into public.content_blocks (site_id, page_slug, type, position, published, data) values

('7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f', 'home', 'hero', 0, true, $json${
  "eyebrow": "The Golden Drop From Nature",
  "headline": "Setetes emas dari alam",
  "subheadline": "Lima eau de parfum yang diracik untuk bertahan seharian. Tersedia dalam kemasan 30 ml dan 10 ml.",
  "alignment": "center",
  "primary_cta":   { "label": "Lihat Koleksi", "href": "#produk" },
  "secondary_cta": { "label": "Pesan Sekarang", "href": "#kontak" }
}$json$::jsonb),

('7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f', 'home', 'about', 1, true, $json${
  "title": "Tentang Leuca",
  "body": "Leuca berangkat dari satu keyakinan sederhana: aroma yang baik tidak harus mahal, dan tidak harus datang dari jauh.\n\nSetiap varian dibangun dari tiga lapis aroma. Lapis pembuka yang menyapa di menit pertama, lapis jantung yang bertahan sepanjang siang, dan lapis dasar yang tertinggal di kain sampai malam.",
  "stats": [
    { "value": "5",      "label": "Varian aroma" },
    { "value": "6-8 jam","label": "Ketahanan rata-rata" },
    { "value": "2",      "label": "Pilihan ukuran" }
  ]
}$json$::jsonb),

('7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f', 'home', 'products', 2, true, $json${
  "title": "Koleksi",
  "subtitle": "Setiap harga sudah termasuk kemasan. Pilih ukuran sesuai kebutuhan.",
  "items": [
    {
      "name": "Amber Saint",
      "description": "Hangat dan resin. Saffron serta kayu manis membuka, lalu mengendap menjadi ambergris dan oud yang bertahan lama.",
      "sku": "LEU-AMS",
      "currency": "IDR",
      "availability": "InStock",
      "variants": [
        { "label": "30 ml", "price": 117000, "sku": "LEU-AMS-30" },
        { "label": "10 ml", "price": 45000,  "sku": "LEU-AMS-10" }
      ],
      "details": [
        { "label": "Atas",   "value": "Saffron, Cinnamon, Pink Pepper" },
        { "label": "Tengah", "value": "Amberwood, Jasmine, Bulgarian Rose" },
        { "label": "Dasar",  "value": "Ambergris, Oud, Fir Resin, Sandalwood" }
      ],
      "image": { "url": "/leuca/amber-saint.jpg", "alt": "Botol dan kemasan parfum Leuca Amber Saint" }
    },
    {
      "name": "Sant Licor",
      "description": "Kopi dan vanila berpadu gardenia. Manis yang dewasa, paling pas untuk malam hari.",
      "sku": "LEU-SNL",
      "currency": "IDR",
      "availability": "InStock",
      "variants": [
        { "label": "30 ml", "price": 117000, "sku": "LEU-SNL-30" },
        { "label": "10 ml", "price": 45000,  "sku": "LEU-SNL-10" }
      ],
      "details": [
        { "label": "Atas",   "value": "Pink Pepper, Orange Blossom, Pear" },
        { "label": "Tengah", "value": "Coffee, White Jasmine, Gardenia" },
        { "label": "Dasar",  "value": "Vanilla, Patchouli, Cedarwood, Cashmere Wood" }
      ],
      "image": { "url": "/leuca/sant-licor.jpg", "alt": "Botol dan kemasan parfum Leuca Sant Licor" }
    },
    {
      "name": "Pyrus Abyss",
      "description": "Pir dan apel hijau yang segar, berlabuh pada patchouli dan driftwood. Ringan untuk siang hari.",
      "sku": "LEU-PYA",
      "currency": "IDR",
      "availability": "InStock",
      "variants": [
        { "label": "30 ml", "price": 117000, "sku": "LEU-PYA-30" },
        { "label": "10 ml", "price": 45000,  "sku": "LEU-PYA-10" }
      ],
      "details": [
        { "label": "Atas",   "value": "Pear, Green Apple, Bergamot" },
        { "label": "Tengah", "value": "Freesia, White Rose, Muguet" },
        { "label": "Dasar",  "value": "Patchouli, Driftwood, Amber, White Musk" }
      ],
      "image": { "url": "/leuca/pyrus-abyss.jpg", "alt": "Botol dan kemasan parfum Leuca Pyrus Abyss" }
    },
    {
      "name": "White Damask",
      "description": "Mawar damask dan melati putih di atas musk yang lembut. Klasik, bersih, mudah dipakai kapan saja.",
      "sku": "LEU-WHD",
      "currency": "IDR",
      "availability": "InStock",
      "variants": [
        { "label": "30 ml", "price": 117000, "sku": "LEU-WHD-30" },
        { "label": "10 ml", "price": 45000,  "sku": "LEU-WHD-10" }
      ],
      "details": [
        { "label": "Atas",   "value": "Pink Pepper, Bergamot, Aldehydes" },
        { "label": "Tengah", "value": "Damask Rose, White Jasmine, Lily of the Valley" },
        { "label": "Dasar",  "value": "White Musk, Cedarwood, Sandalwood, Vanilla" }
      ],
      "image": { "url": "/leuca/white-damask.jpg", "alt": "Botol dan kemasan parfum Leuca White Damask" }
    },
    {
      "name": "Blue Carpus",
      "description": "Bergamot dan lavender yang tenang, dengan cendana serta musk sebagai dasar. Bersih dan netral.",
      "sku": "LEU-BLC",
      "currency": "IDR",
      "availability": "InStock",
      "variants": [
        { "label": "30 ml", "price": 117000, "sku": "LEU-BLC-30" },
        { "label": "10 ml", "price": 45000,  "sku": "LEU-BLC-10" }
      ],
      "details": [
        { "label": "Atas",   "value": "Bergamot, Lemon, Pink Pepper" },
        { "label": "Tengah", "value": "Lavender, Geranium, Cardamom" },
        { "label": "Dasar",  "value": "Sandalwood, Patchouli, White Musk, Ambergris" }
      ],
      "image": { "url": "/leuca/blue-carpus.jpg", "alt": "Botol dan kemasan parfum Leuca Blue Carpus" }
    }
  ]
}$json$::jsonb),

('7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f', 'home', 'gallery', 3, true, $json${
  "title": "Galeri",
  "layout": "masonry",
  "images": []
}$json$::jsonb),

('7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f', 'home', 'faq', 4, true, $json${
  "title": "Pertanyaan Umum",
  "items": [
    { "question": "Berapa lama aromanya bertahan?",
      "answer": "Sebagai eau de parfum, Leuca umumnya bertahan 6 sampai 8 jam di kulit dan lebih lama lagi di kain. Varian dengan dasar oud dan ambergris seperti Amber Saint cenderung paling awet." },
    { "question": "Apa bedanya kemasan 30 ml dan 10 ml?",
      "answer": "Isinya sama persis, hanya berbeda volume. Ukuran 10 ml cocok untuk dibawa bepergian atau mencoba varian baru sebelum membeli ukuran penuh." },
    { "question": "Bagaimana cara menyimpannya?",
      "answer": "Simpan di tempat sejuk dan jauh dari sinar matahari langsung. Hindari menyimpan di kamar mandi karena perubahan suhu mempercepat perubahan aroma." },
    { "question": "Apakah bisa dikirim ke luar Bali?",
      "answer": "Bisa. Pengiriman ke seluruh Indonesia memakai kurir reguler. Hubungi kami lewat WhatsApp untuk perhitungan ongkos kirim." }
  ]
}$json$::jsonb),

('7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f', 'home', 'contact', 5, true, $json${
  "title": "Pesan Sekarang",
  "subtitle": "Kirim pesan lewat formulir atau langsung WhatsApp. Kami balas di jam kerja.",
  "show_form": true,
  "show_map": false,
  "whatsapp_text": "Halo Leuca, saya ingin memesan parfum."
}$json$::jsonb),

-- ---------------------------------------------------------------------
-- 4. Isi halaman Inggris
-- ---------------------------------------------------------------------

('7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f', 'en', 'hero', 0, true, $json${
  "eyebrow": "The Golden Drop From Nature",
  "headline": "A golden drop from nature",
  "subheadline": "Five eau de parfum blended to last through the day. Available in 30 ml and 10 ml.",
  "alignment": "center",
  "primary_cta":   { "label": "View Collection", "href": "#produk" },
  "secondary_cta": { "label": "Order Now", "href": "#kontak" }
}$json$::jsonb),

('7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f', 'en', 'about', 1, true, $json${
  "title": "About Leuca",
  "body": "Leuca began with a simple conviction: a good fragrance need not be expensive, and need not come from far away.\n\nEach variant is built from three layers. An opening that greets you in the first minutes, a heart that carries through the afternoon, and a base that lingers on fabric into the night.",
  "stats": [
    { "value": "5",       "label": "Fragrances" },
    { "value": "6-8 hrs", "label": "Average longevity" },
    { "value": "2",       "label": "Sizes" }
  ]
}$json$::jsonb),

('7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f', 'en', 'products', 2, true, $json${
  "title": "The Collection",
  "subtitle": "Every price includes packaging. Choose the size that suits you.",
  "items": [
    {
      "name": "Amber Saint",
      "description": "Warm and resinous. Saffron and cinnamon open, then settle into long-lasting ambergris and oud.",
      "sku": "LEU-AMS", "currency": "IDR", "availability": "InStock",
      "variants": [
        { "label": "30 ml", "price": 117000, "sku": "LEU-AMS-30" },
        { "label": "10 ml", "price": 45000,  "sku": "LEU-AMS-10" }
      ],
      "details": [
        { "label": "Top",   "value": "Saffron, Cinnamon, Pink Pepper" },
        { "label": "Heart", "value": "Amberwood, Jasmine, Bulgarian Rose" },
        { "label": "Base",  "value": "Ambergris, Oud, Fir Resin, Sandalwood" }
      ],
      "image": { "url": "/leuca/amber-saint.jpg", "alt": "Leuca Amber Saint eau de parfum bottle and box" }
    },
    {
      "name": "Sant Licor",
      "description": "Coffee and vanilla wrapped in gardenia. A grown-up sweetness, best worn at night.",
      "sku": "LEU-SNL", "currency": "IDR", "availability": "InStock",
      "variants": [
        { "label": "30 ml", "price": 117000, "sku": "LEU-SNL-30" },
        { "label": "10 ml", "price": 45000,  "sku": "LEU-SNL-10" }
      ],
      "details": [
        { "label": "Top",   "value": "Pink Pepper, Orange Blossom, Pear" },
        { "label": "Heart", "value": "Coffee, White Jasmine, Gardenia" },
        { "label": "Base",  "value": "Vanilla, Patchouli, Cedarwood, Cashmere Wood" }
      ],
      "image": { "url": "/leuca/sant-licor.jpg", "alt": "Leuca Sant Licor eau de parfum bottle and box" }
    },
    {
      "name": "Pyrus Abyss",
      "description": "Crisp pear and green apple anchored by patchouli and driftwood. Light enough for daytime.",
      "sku": "LEU-PYA", "currency": "IDR", "availability": "InStock",
      "variants": [
        { "label": "30 ml", "price": 117000, "sku": "LEU-PYA-30" },
        { "label": "10 ml", "price": 45000,  "sku": "LEU-PYA-10" }
      ],
      "details": [
        { "label": "Top",   "value": "Pear, Green Apple, Bergamot" },
        { "label": "Heart", "value": "Freesia, White Rose, Muguet" },
        { "label": "Base",  "value": "Patchouli, Driftwood, Amber, White Musk" }
      ],
      "image": { "url": "/leuca/pyrus-abyss.jpg", "alt": "Leuca Pyrus Abyss eau de parfum bottle and box" }
    },
    {
      "name": "White Damask",
      "description": "Damask rose and white jasmine over soft musk. Classic, clean, easy to wear anytime.",
      "sku": "LEU-WHD", "currency": "IDR", "availability": "InStock",
      "variants": [
        { "label": "30 ml", "price": 117000, "sku": "LEU-WHD-30" },
        { "label": "10 ml", "price": 45000,  "sku": "LEU-WHD-10" }
      ],
      "details": [
        { "label": "Top",   "value": "Pink Pepper, Bergamot, Aldehydes" },
        { "label": "Heart", "value": "Damask Rose, White Jasmine, Lily of the Valley" },
        { "label": "Base",  "value": "White Musk, Cedarwood, Sandalwood, Vanilla" }
      ],
      "image": { "url": "/leuca/white-damask.jpg", "alt": "Leuca White Damask eau de parfum bottle and box" }
    },
    {
      "name": "Blue Carpus",
      "description": "Calm bergamot and lavender grounded in sandalwood and musk. Clean and neutral.",
      "sku": "LEU-BLC", "currency": "IDR", "availability": "InStock",
      "variants": [
        { "label": "30 ml", "price": 117000, "sku": "LEU-BLC-30" },
        { "label": "10 ml", "price": 45000,  "sku": "LEU-BLC-10" }
      ],
      "details": [
        { "label": "Top",   "value": "Bergamot, Lemon, Pink Pepper" },
        { "label": "Heart", "value": "Lavender, Geranium, Cardamom" },
        { "label": "Base",  "value": "Sandalwood, Patchouli, White Musk, Ambergris" }
      ],
      "image": { "url": "/leuca/blue-carpus.jpg", "alt": "Leuca Blue Carpus eau de parfum bottle and box" }
    }
  ]
}$json$::jsonb),

('7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f', 'en', 'faq', 3, true, $json${
  "title": "Frequently Asked",
  "items": [
    { "question": "How long does it last?",
      "answer": "As an eau de parfum, Leuca typically lasts 6 to 8 hours on skin and longer on fabric. Variants with an oud and ambergris base, such as Amber Saint, tend to last longest." },
    { "question": "What is the difference between 30 ml and 10 ml?",
      "answer": "The formula is identical, only the volume differs. The 10 ml is made for travel or for trying a new scent before committing to a full bottle." },
    { "question": "How should I store it?",
      "answer": "Keep it somewhere cool and out of direct sunlight. Avoid the bathroom, as swings in temperature shorten the life of the fragrance." },
    { "question": "Do you ship outside Bali?",
      "answer": "Yes. We ship across Indonesia via standard courier. Message us on WhatsApp for a shipping quote." }
  ]
}$json$::jsonb),

('7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f', 'en', 'contact', 4, true, $json${
  "title": "Order Now",
  "subtitle": "Send us a message through the form or on WhatsApp. We reply during business hours.",
  "show_form": true,
  "show_map": false,
  "whatsapp_text": "Hello Leuca, I would like to order a fragrance."
}$json$::jsonb);

-- ---------------------------------------------------------------------
-- 5. Ringkasan hasil
-- ---------------------------------------------------------------------
select p.slug as halaman,
       count(cb.id) as jumlah_blok,
       string_agg(cb.type, ', ' order by cb.position) as urutan
from public.pages p
left join public.content_blocks cb
       on cb.site_id = p.site_id and cb.page_slug = p.slug
where p.site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
group by p.slug
order by p.slug;
