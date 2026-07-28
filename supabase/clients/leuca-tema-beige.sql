-- =====================================================================
--  Leuca — ganti tema dari hitam ke beige hangat.
--  Tempel di Supabase SQL Editor lalu Run. Hanya menyentuh warna;
--  konten, harga, dan halaman tidak tersentuh sama sekali.
-- =====================================================================

update public.sites
set theme_config = $json${
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
}$json$::jsonb
where id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f';

select name,
       theme_config -> 'colors' ->> 'background' as latar,
       theme_config -> 'colors' ->> 'primary'    as utama,
       theme_config ->> 'motion'                 as gerak
from public.sites
where id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f';
