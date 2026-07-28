-- =====================================================================
--  Buat profil pengelola.
--
--  PRASYARAT: user-nya harus sudah ada di Supabase → Authentication →
--  Users → Add user. Skrip ini hanya menghubungkan user itu ke tabel
--  profiles; ia tidak membuat akun.
--
--  Ganti alamat email di bawah kalau berbeda.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Akun Seawise — superadmin, bisa mengelola SEMUA situs klien.
--    site_id wajib null; ada CHECK constraint yang memaksanya, supaya
--    peran superadmin tidak pernah tanpa sengaja terikat ke satu klien.
-- ---------------------------------------------------------------------
insert into public.profiles (user_id, site_id, role, full_name)
select u.id, null, 'superadmin', 'Seawise Studio'
from auth.users u
where u.email = 'seawise.cc@gmail.com'
  and not exists (
    select 1 from public.profiles p
    where p.user_id = u.id and p.role = 'superadmin'
  );

-- ---------------------------------------------------------------------
-- 2. Akun klien Leuca — owner, hanya bisa mengelola situs Leuca.
--    Aktifkan setelah membuat user dengan email klien.
--    Hapus tanda komentar dan sesuaikan emailnya.
-- ---------------------------------------------------------------------
-- insert into public.profiles (user_id, site_id, role, full_name)
-- select u.id, '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f', 'owner', 'Leuca'
-- from auth.users u
-- where u.email = 'email-klien@contoh.com'
--   and not exists (
--     select 1 from public.profiles p
--     where p.user_id = u.id
--       and p.site_id = '7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'
--   );

-- ---------------------------------------------------------------------
-- 3. Periksa hasilnya
-- ---------------------------------------------------------------------
select u.email,
       p.role,
       coalesce(s.name, 'semua situs') as akses,
       p.full_name
from public.profiles p
join auth.users u on u.id = p.user_id
left join public.sites s on s.id = p.site_id
order by p.role, u.email;
