# Arsitektur Teknis

## 1. Gambaran besar

```
                       ┌──────────────────────────┐
   klien-a.com  ────►  │ Vercel project A         │ ─┐
                       │ NEXT_PUBLIC_SITE_ID = A  │  │
                       └──────────────────────────┘  │
                       ┌──────────────────────────┐  │   ┌──────────────────┐
   klien-b.com  ────►  │ Vercel project B         │ ─┼──►│ Supabase (1 proj)│
                       │ NEXT_PUBLIC_SITE_ID = B  │  │   │ RLS per site_id  │
                       └──────────────────────────┘  │   └──────────────────┘
                       ┌──────────────────────────┐  │
   klien-c.com  ────►  │ Vercel project C         │ ─┘
                       └──────────────────────────┘
                          ▲
                          └── semuanya dari 1 repo: template-master
```

Satu repo, banyak deployment, satu database. Perbedaan antar klien seluruhnya
ada di data — bukan di kode.

## 2. Kenapa satu env var, bukan routing per domain

Alternatif yang lebih umum adalah satu deployment yang membaca `Host` header
lalu mencari site yang cocok. Pola itu ditolak karena:

- Bug atau limit di satu klien langsung memengaruhi semua klien.
- Cache statis jadi rumit — tiap request harus tahu tenant-nya lebih dulu.
- Custom domain harus dikelola lewat API Vercel, bukan lewat UI.

Dengan `NEXT_PUBLIC_SITE_ID` per project, tiap situs bisa di-*prerender*
sepenuhnya statis. Halaman klien dilayani dari CDN tanpa menyentuh Supabase
sama sekali sampai `revalidate` habis.

Harganya: menambah klien berarti membuat project Vercel baru. Itu sebabnya
`scripts/new-client.mjs` ada — supaya biaya rutin ini tetap kecil.

## 3. Model data

### `sites`
Satu baris per klien. Empat kolom JSONB memisahkan hal-hal yang berubah
dengan irama berbeda:

| Kolom | Berubah saat | Siapa yang boleh ubah |
|---|---|---|
| `theme_config` | Desain disepakati | Seawise saja |
| `seo_config` | Optimasi SEO | Seawise (atau klien SEO Managed) |
| `business_info` | Alamat/jam buka berubah | Klien |
| `features` | Klien upgrade paket | Seawise saja |

Pemisahan ini bukan kosmetik: kolom yang boleh diubah klien dibatasi lewat
`GRANT UPDATE (kolom)` di migration RLS, bukan lewat pengecekan di aplikasi.
Artinya klien yang mengirim request langsung ke API Supabase tetap tidak bisa
mengganti temanya sendiri.

### `content_blocks`
Isi halaman. Kolom `data` (JSONB) strukturnya berbeda tiap `type`, dan
database sengaja tidak tahu bedanya. Validasi ada di `src/lib/blocks/schemas.ts`.

Konsekuensi yang perlu disadari: data lama bisa jadi tidak cocok dengan schema
baru. Karena itu `parseBlock()` membuang blok yang gagal validasi alih-alih
melempar error — situs klien tetap tayang, dan masalahnya tercatat di log.

Kolom `page_slug` memungkinkan multi-halaman tanpa tabel tambahan. Halaman
tier Shore dan Reef cukup memakai `home`.

### `pages`
Metadata per halaman: judul, label navigasi, dan override SEO. Dipisah dari
`content_blocks` supaya sitemap dan navigasi bisa dibangun tanpa membaca
seluruh isi halaman.

### `profiles`
Menghubungkan `auth.users` ke `sites`. Satu user bisa punya beberapa site
(berguna kalau satu pemilik punya dua bisnis). `role = 'superadmin'` sengaja
dipaksa `site_id IS NULL` lewat CHECK constraint.

### `media` dan `leads`
`media` mencatat aset di Supabase Storage beserta alt text. `leads` menampung
kiriman form kontak — anon boleh INSERT tapi tidak boleh SELECT.

## 4. Isolasi antar klien

Tiga lapis, dari luar ke dalam:

1. **Deployment** — tiap klien punya project Vercel dan env var sendiri.
2. **RLS** — semua tabel `FORCE ROW LEVEL SECURITY`, akses ditentukan fungsi
   `has_site_access(site_id)`.
3. **Column grant** — kolom sensitif di `sites` dicabut dari role
   `authenticated`.

Fungsi helper RLS memakai `SECURITY DEFINER` dengan `search_path` terkunci.
Tanpa itu, query ke `profiles` di dalam policy `profiles` akan rekursif.

**Ini titik risiko terbesar platform.** Satu policy yang salah bisa membocorkan
data semua klien sekaligus — beda karakter dengan hosting terpisah seperti
WordPress. Karenanya `supabase/tests/rls_test.sql` wajib dijalankan setiap kali
policy disentuh.

## 5. Alur render

```
Request  →  Vercel Edge (HTML statis dari cache)
              └── kalau kedaluwarsa (>5 menit):
                    layout.tsx  →  getSite()     ─┐
                    page.tsx    →  getBlocks()   ─┼─ dedup lewat React cache()
                                →  getPage()     ─┘
                    → parseBlock() validasi Zod
                    → BlockRenderer render komponen
                    → buildJsonLd() sisipkan structured data
```

`getSite`, `getPages`, dan `getBlocks` dibungkus `cache()` dari React sehingga
`generateMetadata` dan komponen halaman berbagi satu hasil query, bukan dua.

`revalidate = 300` dipilih sebagai kompromi: perubahan konten klien tampak
dalam lima menit, dan Supabase tetap hampir tidak tersentuh trafik. Untuk
perubahan lewat admin panel, `revalidatePath('/', 'layout')` membuatnya tampil
langsung tanpa menunggu.

## 6. Tema

`sites.theme_config` → `themeToCssVars()` → atribut `style` pada `<html>`.
Komponen hanya memakai `var(--brand-primary)` dan kawan-kawan.

Nilai warna divalidasi dengan regex hex sebelum masuk CSS. Ini bukan
formalitas — tanpa itu, isi kolom database bisa menyuntikkan CSS sembarang.

`auditThemeContrast()` menghitung rasio kontras WCAG dan memberi peringatan di
console saat development kalau kombinasi warna klien gagal AA.

## 7. Batasan yang sudah diketahui

| Batasan | Dampak | Rencana |
|---|---|---|
| Semua klien di satu Postgres | Klien dengan query berat memperlambat yang lain | Pantau slow query; pisahkan klien besar ke project sendiri kalau perlu |
| Bandwidth Vercel | Klien vertical foto (hotel/villa) berisiko overage | Pertimbangkan Cloudflare Pages untuk vertical ini |
| Bergantung pada satu orang | Semua klien berhenti kalau pengelola tidak tersedia | SOP tertulis + delegasi saat klien >15 |
| Editor JSON di admin | Klien non-teknis bisa keliru mengisi daftar produk | Form berulang khusus, setelah tahu vertical mana yang paling sering dipakai |
