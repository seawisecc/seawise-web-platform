-- =====================================================================
--  Leuca — data kontak asli menggantikan placeholder.
--
--  Berpengaruh ke tiga tempat sekaligus:
--    1. Tombol WhatsApp di header dan bagian kontak
--    2. Footer (email, alamat, tautan Instagram)
--    3. Structured data Schema.org yang dibaca Google untuk pencarian lokal
--
--  Tempel di Supabase SQL Editor lalu Run.
-- =====================================================================

update public.sites
set business_info = $json${
  "legal_name": "Leuca de Perfume",
  "email": "leuca.de.perfume@gmail.com",
  "phone": "+62 812-3759-7759",
  "whatsapp": "6281237597759",
  "street": "",
  "city": "Denpasar",
  "region": "Bali",
  "postal_code": "",
  "country": "ID",
  "latitude": null,
  "longitude": null,
  "price_range": "Rp 45.000 - Rp 117.000",
  "opening_hours": [],
  "social": {
    "instagram": "https://instagram.com/leuca.de.perfume"
  }
}$json$::jsonb
where id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f';

-- Nomor WhatsApp diubah dari 0812… ke 6281… karena tautan wa.me menolak
-- awalan nol. Kode di situs sebenarnya sudah menormalkan ini otomatis,
-- tetapi menyimpannya dalam bentuk yang benar membuat data lebih rapi
-- saat dibaca dari tempat lain.

select name,
       business_info ->> 'email'                        as email,
       business_info ->> 'whatsapp'                     as whatsapp,
       business_info ->> 'city'                         as kota,
       business_info -> 'social' ->> 'instagram'        as instagram
from public.sites
where id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f';
