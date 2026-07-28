# Deployment & Operasional

> Untuk langkah pertama kali — GitHub, project Vercel, dan berpindah antar
> klien — lihat [09-alur-kerja-harian.md](09-alur-kerja-harian.md). Berkas
> ini berisi rujukan dan hal-hal operasional jangka panjang.

## 1. Vercel (default)

Satu project per klien. Repo yang sama, env var berbeda.

**Pengaturan project**

| Item | Nilai |
|---|---|
| Framework preset | Next.js |
| Build command | `npm run build` (default) |
| Root directory | `template-master` |
| Node version | 22.x |

**Environment variable**

Sama untuk semua klien: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
Berbeda per klien: `NEXT_PUBLIC_SITE_ID`, `NEXT_PUBLIC_SITE_URL`.

`SUPABASE_SECRET_KEY` **tidak pernah** dipasang di project klien. Key itu
hanya dipakai di mesin lokal untuk menjalankan skrip provisioning.

> Karena `NEXT_PUBLIC_*` disematkan saat build, mengubahnya wajib diikuti
> redeploy. Ini kesalahan paling sering saat pindah dari `.vercel.app` ke
> domain asli.

## 2. Domain

**Pendaftaran atas nama klien.** Ini keputusan bisnis, bukan teknis: kalau
domain terdaftar di akun Seawise, setiap perpisahan berubah jadi negosiasi.

Untuk domain yang dikelola di Cloudflare:

| Tipe | Nama | Nilai | Proxy |
|---|---|---|---|
| A | `@` | `76.76.21.21` | DNS only |
| CNAME | `www` | `cname.vercel-dns.com` | DNS only |

Matikan proxy (awan abu-abu). Proxy Cloudflare di depan Vercel menambah satu
lapisan cache yang membuat masalah sulit dilacak tanpa manfaat berarti.

Pilih satu bentuk kanonik — `domainklien.com` atau `www.domainklien.com` — dan
redirect yang lain. Dua versi yang sama-sama bisa diakses membelah sinyal SEO.

## 3. Cloudflare Pages sebagai alternatif

Layak dipertimbangkan untuk klien vertical berat gambar (hotel, villa) yang
berisiko kena overage bandwidth Vercel.

**Sebelum memindahkan klien, uji dulu:**

- OpenGraph image runtime (`next/og`) di runtime Workers
- Server Actions (form kontak dan simpan konten admin)
- ISR / `revalidate` — perilakunya tidak identik dengan Vercel

Rekomendasi: pertahankan Vercel sebagai default sampai ada klien yang benar-benar
mendekati batas bandwidth. Memindahkan seluruh armada ke platform kedua
menggandakan hal yang harus dirawat — bertentangan dengan tujuan semi-passive.

## 4. Supabase

Satu project untuk semua klien.

- **Pro plan (~$25/bulan)** diperlukan begitu ada klien berbayar — terutama
  karena project Free otomatis di-*pause* saat tidak aktif. Situs klien yang
  mati karena database di-pause adalah kegagalan yang tidak bisa dijelaskan.
- **Point-in-time recovery** aktifkan setelah beberapa klien berjalan.
- **Backup**: Pro sudah menyediakan backup harian. Tetap jalankan dump manual
  sebelum menjalankan migration apa pun.

**Menerapkan migration**

```bash
supabase link --project-ref <ref>
supabase db push
psql "$SUPABASE_DB_URL" -f supabase/tests/rls_test.sql   # wajib setelah ubah policy
```

## 5. Pemantauan biaya

Infra bersifat tetap sampai batas overage, jadi yang perlu diawasi adalah
kapan batas itu terlampaui.

| Sumber daya | Batas Vercel Pro | Tanda bahaya |
|---|---|---|
| Bandwidth | 1 TB/bulan | Satu klien >100 GB/bulan |
| Image optimization | 5.000 sumber unik | Klien dengan galeri >200 foto |
| Function invocation | 1 juta/bulan | Terlalu banyak halaman dinamis |

| Sumber daya | Batas Supabase Pro | Tanda bahaya |
|---|---|---|
| Database | 8 GB | Tabel `leads` menumpuk tanpa dibersihkan |
| Storage | 100 GB | 20+ klien vertical foto |
| Bandwidth | 250 GB/bulan | Gambar dilayani tanpa optimasi Next.js |

Periksa sekali sebulan. Kalau satu klien menyumbang porsi besar, itu bahan
diskusi harga maintenance yang jujur — bukan biaya yang diserap diam-diam.

## 6. Ketika ada yang rusak

**Situs klien blank / "Situs belum aktif"**
`NEXT_PUBLIC_SITE_ID` salah, atau `sites.status` bukan `active`.

**Perubahan konten tidak muncul**
Tunggu lewat `revalidate` (5 menit), atau simpan ulang lewat admin yang memicu
`revalidatePath`. Kalau tetap tidak muncul, cek apakah blok `published`.

**Klien tidak bisa login ke `/admin`**
Cek baris `profiles` — `site_id` harus sama persis dengan `NEXT_PUBLIC_SITE_ID`
project tersebut.

**Gambar tidak tampil**
`next.config.ts` hanya mengizinkan hostname Supabase dari
`NEXT_PUBLIC_SUPABASE_URL`. Gambar dari domain lain akan ditolak.

**Curiga ada kebocoran data lintas klien**
Anggap serius sampai terbukti sebaliknya. Jalankan `supabase/tests/rls_test.sql`,
periksa apakah ada policy yang baru diubah, dan periksa apakah ada kode yang
memakai service role key di jalur request.

## 7. Rutin berkala

**Bulanan** — periksa penggunaan Vercel & Supabase; bersihkan `leads` lama.

**Triwulan** — perbarui dependensi (`npm outdated`), jalankan
`npm run build` + `npm run typecheck` untuk semua perubahan sebelum
menyebarkannya ke project klien; jalankan Lighthouse pada dua-tiga situs klien.

**Tahunan** — perpanjang maintenance; tinjau ulang harga tier berdasarkan jam
kerja yang tercatat; audit ulang policy RLS secara menyeluruh.
