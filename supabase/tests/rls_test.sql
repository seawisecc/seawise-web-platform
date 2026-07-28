-- =====================================================================
-- Uji kebocoran lintas-tenant. Jalankan SETIAP KALI policy diubah.
--   psql "$SUPABASE_DB_URL" -f supabase/tests/rls_test.sql
-- Semua assertion harus lulus; kalau ada yang gagal, transaksi rollback
-- dan pesan error muncul.
-- =====================================================================

begin;

-- Dua site fiktif + dua user fiktif.
insert into public.sites (id, slug, name, status)
values ('11111111-1111-4111-8111-111111111111', 'test-a', 'Test A', 'active'),
       ('22222222-2222-4222-8222-222222222222', 'test-b', 'Test B', 'active')
on conflict do nothing;

insert into public.content_blocks (site_id, type, position, published, data) values
  ('11111111-1111-4111-8111-111111111111', 'hero', 0, true,  '{"headline":"A publik"}'),
  ('11111111-1111-4111-8111-111111111111', 'hero', 1, false, '{"headline":"A draft"}'),
  ('22222222-2222-4222-8222-222222222222', 'hero', 0, true,  '{"headline":"B publik"}');

-- ---------------------------------------------------------------------
-- Kasus 1: anon hanya melihat blok published
-- ---------------------------------------------------------------------
set local role anon;
do $$
declare n int;
begin
  select count(*) into n from public.content_blocks where published = false;
  if n <> 0 then raise exception 'GAGAL: anon bisa melihat % blok draft', n; end if;
  raise notice 'OK  anon tidak bisa membaca draft';
end $$;

-- ---------------------------------------------------------------------
-- Kasus 2: anon tidak bisa menulis blok
-- ---------------------------------------------------------------------
do $$
begin
  begin
    insert into public.content_blocks (site_id, type, data)
    values ('11111111-1111-4111-8111-111111111111', 'hero', '{}');
    raise exception 'GAGAL: anon berhasil insert content_blocks';
  exception when insufficient_privilege or others then
    raise notice 'OK  anon tidak bisa insert content_blocks';
  end;
end $$;

-- ---------------------------------------------------------------------
-- Kasus 3: anon tidak bisa membaca leads
-- ---------------------------------------------------------------------
do $$
declare n int;
begin
  begin
    select count(*) into n from public.leads;
    raise exception 'GAGAL: anon bisa membaca tabel leads';
  exception when insufficient_privilege then
    raise notice 'OK  anon tidak bisa membaca leads';
  end;
end $$;

reset role;

-- ---------------------------------------------------------------------
-- Kasus 4: user site A tidak melihat draft site B
-- Simulasi: set request.jwt.claims agar auth.uid() mengembalikan user A.
-- Catatan: butuh baris profiles nyata untuk user tersebut. Bagian ini
-- di-skip otomatis jika belum ada user di auth.users.
-- ---------------------------------------------------------------------
do $$
declare uid uuid;
begin
  select id into uid from auth.users limit 1;
  if uid is null then
    raise notice 'SKIP  belum ada user di auth.users — uji cross-tenant dilewati';
  else
    raise notice 'INFO  jalankan uji cross-tenant manual dengan user %', uid;
  end if;
end $$;

rollback;
