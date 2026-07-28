# Setup Supabase — Langkah Pertama

Dikerjakan **satu kali saja**. Setelah ini selesai, semua klien berikutnya
cukup lewat `scripts/new-client.mjs`.

Perkiraan waktu: 30–45 menit.

---

## Langkah 1 — Buat project Supabase baru

Buka [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.

| Isian | Nilai | Alasan |
|---|---|---|
| Name | `seawise-clients` | Bedakan dengan project company profile Seawise sendiri |
| Database password | acak, panjang | **Simpan di password manager sekarang** — tidak bisa dilihat lagi nanti |
| Region | Southeast Asia (Singapore) | Terdekat ke Bali; latensi terendah untuk klien Indonesia |
| Plan | Free dulu | Naikkan ke Pro **sebelum** klien berbayar pertama |

> Project Free otomatis di-*pause* setelah tidak aktif. Aman untuk tahap
> membangun, tidak aman untuk situs klien yang sudah tayang.

Project ini terpisah dari project company profile Seawise — sesuai Bagian 11
dokumen rangkuman. Alasannya: data klien dan data internal punya profil risiko
berbeda, dan mencampurnya membuat migrasi di masa depan jauh lebih sulit.

---

## Langkah 2 — Ambil kredensial

**Project Settings → API Keys**

| Yang dicari | Bentuk | Dipakai di |
|---|---|---|
| Project URL | `https://xxxx.supabase.co` | Semua project Vercel |
| Publishable key | `sb_publishable_…` | Semua project Vercel (aman di browser) |
| Secret key | `sb_secret_…` | **Hanya mesin lokal**, untuk `new-client.mjs` |

Kalau dashboard masih menampilkan `anon` dan `service_role` — itu kunci versi
lama yang akan dihentikan akhir 2026. Buat kunci baru lewat tombol
*Create new API keys*, dan pakai yang baru sejak awal.

**Secret key melewati RLS sepenuhnya.** Jangan pernah memasangnya di project
Vercel, jangan commit, jangan kirim lewat chat.

---

## Langkah 3 — Jalankan migration

Dua jalur. Pilih **A** kalau ingin cepat mulai, **B** kalau ingin rapi sejak
awal (dan ini yang direkomendasikan untuk jangka panjang).

### Jalur A — SQL Editor di dashboard (paling cepat)

**Dashboard → SQL Editor → New query.**

Jalankan **satu per satu, berurutan**, dan pastikan setiap langkah sukses
sebelum lanjut:

1. Tempel isi `supabase/migrations/20260727000001_init_schema.sql` → **Run**
2. Tempel isi `supabase/migrations/20260727000002_rls_policies.sql` → **Run**
3. Tempel isi `supabase/migrations/20260727000003_storage.sql` → **Run**

Urutan tidak boleh ditukar — file 2 memakai tabel dari file 1, file 3 memakai
fungsi dari file 2.

### Jalur B — Supabase CLI (direkomendasikan)

```bash
brew install supabase/tap/supabase        # macOS
supabase login

cd ~/Desktop/Seawise-Web-Platform
supabase link --project-ref <project-ref>  # ref ada di URL dashboard
supabase db push
```

`db push` membaca folder `supabase/migrations/` dan menerapkan semuanya
berurutan. Keunggulannya: perubahan skema berikutnya tinggal menambah file
migration baru, dan riwayatnya tercatat — bukan tempel-tempel manual yang
gampang lupa dijalankan di suatu tahap.

Kalau migration storage gagal karena masalah izin, jalankan file ketiga saja
lewat SQL Editor. Schema `storage` memang punya aturan kepemilikan sendiri.

---

## Langkah 4 — Isi data demo

**SQL Editor** → tempel isi `supabase/seed.sql` → **Run**.

Ini membuat satu site demo (`Seawise Demo`) berisi enam section, supaya kamu
bisa melihat template berjalan sebelum ada klien nyata.

---

## Langkah 5 — Verifikasi

Jalankan di SQL Editor. Semua harus sesuai yang diharapkan:

```sql
-- 1. Enam tabel terbentuk
select table_name from information_schema.tables
where table_schema = 'public' order by table_name;
-- Harapan: content_blocks, leads, media, pages, profiles, sites

-- 2. RLS aktif di semua tabel
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relkind = 'r'
order by relname;
-- Harapan: relrowsecurity = true untuk semua

-- 3. Policy terpasang
select tablename, count(*) as jumlah_policy
from pg_policies where schemaname = 'public'
group by tablename order by tablename;
-- Harapan: setiap tabel punya minimal 2 policy

-- 4. Data demo masuk
select s.name, s.status, count(cb.id) as jumlah_blok
from public.sites s
left join public.content_blocks cb on cb.site_id = s.id
group by s.id, s.name, s.status;
-- Harapan: Seawise Demo | active | 6

-- 5. Bucket storage terbentuk
select id, public from storage.buckets where id = 'site-media';
-- Harapan: site-media | true
```

---

## Langkah 6 — Uji kebocoran antar klien

Ini bagian yang paling mudah dilewati dan paling mahal kalau salah. RLS adalah
satu-satunya pembatas antar klien di platform ini — satu policy keliru bisa
membocorkan data semua klien sekaligus.

Tempel isi `supabase/tests/rls_test.sql` di SQL Editor dan jalankan. Skrip
membuat data uji, memeriksa empat skenario, lalu `rollback` — tidak ada yang
tertinggal di database.

Yang diharapkan muncul di panel *Messages*:

```
OK  anon tidak bisa membaca draft
OK  anon tidak bisa insert content_blocks
OK  anon tidak bisa membaca leads
```

Kalau ada yang `GAGAL`, **jangan lanjut**. Periksa apakah file migration kedua
benar-benar berhasil dijalankan sampai selesai.

Ulangi uji ini setiap kali kamu menyentuh file policy.

---

## Langkah 7 — Sambungkan ke aplikasi

```bash
cd ~/Desktop/Seawise-Web-Platform/template-master
cp .env.example .env.local
```

Isi `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
NEXT_PUBLIC_SITE_ID=00000000-0000-4000-8000-000000000001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SITE_ID` di atas adalah site demo dari `seed.sql`.

```bash
npm install
npm run dev
```

Buka http://localhost:3000 — enam section dengan konten contoh harus tampil.
Cek juga `/sitemap.xml` dan `/robots.txt`.

> Kalau `npm install` bermasalah, hapus dulu folder `node_modules` yang ada
> (sisa instalasi yang tidak selesai), lalu ulangi.

---

## Langkah 8 — Akun superadmin untuk diri sendiri

**Authentication → Users → Add user**, isi email dan password kamu sendiri.
Salin `User UID` yang muncul, lalu di SQL Editor:

```sql
insert into public.profiles (user_id, site_id, role, full_name)
values ('<user-uid>', null, 'superadmin', 'Nama Kamu');
```

`site_id` harus `null` untuk superadmin — ada CHECK constraint yang memaksanya,
supaya peran superadmin tidak pernah tanpa sengaja terikat ke satu klien.

Buka http://localhost:3000/admin dan login. Kamu seharusnya bisa mengubah
konten site demo.

---

## Selesai — lalu apa

Setelah semua langkah di atas lolos, database sudah siap dan tidak perlu
disentuh lagi untuk klien-klien berikutnya.

**Sebelum klien berbayar pertama:**

- [ ] Naikkan Supabase ke plan Pro (project Free akan di-*pause*)
- [ ] Aktifkan Point-in-time recovery
- [ ] Simpan URL, publishable key, dan secret key di password manager
- [ ] Susun draft kontrak sesuai Bagian 9 dokumen rangkuman

Langkah berikutnya ada di [`04-onboarding-klien.md`](04-onboarding-klien.md).

---

## Kalau ada yang tidak beres

**`relation "auth.users" does not exist`**
Migration dijalankan di database biasa, bukan project Supabase. Schema `auth`
hanya ada di Supabase.

**`permission denied for schema storage`**
Jalankan file migration ketiga lewat SQL Editor dashboard, bukan CLI.

**`function public.has_site_access does not exist`**
File migration kedua belum dijalankan atau berhenti di tengah. Jalankan ulang
dari awal file tersebut — semua perintahnya aman diulang.

**Halaman menampilkan "Situs belum aktif"**
`NEXT_PUBLIC_SITE_ID` tidak cocok dengan baris di tabel `sites`, atau
`status` bukan `active`. Cek dengan `select id, name, status from public.sites;`

**Situs kosong padahal data ada**
Blok masih `published = false`, atau publishable key salah. Cek panel Network
di browser — kalau ada respons 401, kuncinya yang keliru.
