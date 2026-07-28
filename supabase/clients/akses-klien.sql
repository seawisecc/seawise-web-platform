-- =====================================================================
--  Memberi klien akses ke panel situsnya sendiri.
--
--  PRASYARAT: user sudah dibuat di Supabase → Authentication → Users.
--  Skrip ini hanya menghubungkan user itu ke satu site_id.
--
--  GANTI DUA NILAI DI BAWAH, lalu Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Bagian 1 — Beri akses
-- ---------------------------------------------------------------------
with target as (
  select
    'email-klien@contoh.com'::text                        as klien_email,
    '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'::uuid          as target_site,
    'Nama Pemilik'::text                                  as nama
)
insert into public.profiles (user_id, site_id, role, full_name)
select u.id, t.target_site, 'owner', t.nama
from target t
join auth.users u on u.email = t.klien_email
where not exists (
  select 1 from public.profiles p
  where p.user_id = u.id and p.site_id = t.target_site
);

-- ---------------------------------------------------------------------
-- Bagian 2 — Peta akses seluruh klien
--
-- Jalankan kapan saja untuk melihat siapa memegang apa. Ini pengganti
-- dashboard terpusat: panel /admin tiap klien hanya menampilkan situs
-- miliknya sendiri, jadi gambaran menyeluruh hanya ada di sini.
-- ---------------------------------------------------------------------
select
  s.name                                   as situs,
  s.tier,
  s.status,
  coalesce(s.domain, s.slug || ' (belum ada domain)') as alamat,
  coalesce(
    string_agg(u.email || ' · ' || p.role, e'\n' order by u.email),
    'BELUM ADA AKUN KLIEN'
  )                                        as pemegang_akses
from public.sites s
left join public.profiles p on p.site_id = s.id
left join auth.users u      on u.id = p.user_id
group by s.id, s.name, s.tier, s.status, s.domain, s.slug
order by s.name;

-- ---------------------------------------------------------------------
-- Bagian 3 — Mencabut akses (saat kerja sama berakhir)
--
-- Menghapus baris profiles memutus akses ke panel seketika. Akun auth-nya
-- sendiri boleh dibiarkan; tanpa baris profil, ia tidak bisa apa-apa.
-- ---------------------------------------------------------------------
-- delete from public.profiles
-- where site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
--   and role = 'owner';
