# SEO Playbook

SEO di platform ini bukan fitur yang ditambahkan belakangan — ia diturunkan
dari data yang sama dengan yang merender halaman. Konsekuensinya: klien yang
mengisi kontennya dengan benar otomatis mendapat SEO teknis yang benar.

## 1. Apa yang otomatis

| Elemen | Sumber data | Berkas |
|---|---|---|
| `<title>` | `pages.seo.title` → `sites.seo_config.default_title` → nama site | `lib/seo/metadata.ts` |
| Meta description | `pages.seo.description` → hero `subheadline` → about `body` | `lib/seo/metadata.ts` |
| Canonical | `NEXT_PUBLIC_SITE_URL` + slug | `lib/seo/metadata.ts` |
| Open Graph & Twitter | Judul + deskripsi + OG image | `lib/seo/metadata.ts` |
| OG image | Dibuat runtime dari nama + warna tema | `app/opengraph-image.tsx` |
| JSON-LD | `sites.vertical` + tiap `content_blocks.type` | `lib/seo/jsonld.ts` |
| `sitemap.xml` | Tabel `pages` yang `published` | `app/sitemap.ts` |
| `robots.txt` | `seo_config.noindex` | `app/robots.ts` |
| `lang` | `sites.locale` | `app/layout.tsx` |

## 2. Rantai prioritas metadata

```
pages.seo.title          ─┐
                          ├─► kalau kosong ─► sites.seo_config.default_title
                          │                    ─► kalau kosong ─► sites.name
pages.seo.description    ─┤
                          ├─► kalau kosong ─► hero.subheadline
                          │   ─► kalau kosong ─► about.body (dipotong 155 karakter)
                          │       ─► kalau kosong ─► seo_config.default_description
```

Rantai ini yang membuat paket Reef tetap punya metadata layak tanpa Seawise
menulis apa pun secara manual, sekaligus memberi ruang untuk paket SEO Managed
menimpanya per halaman.

## 3. Structured data

Tiap situs menghasilkan satu `@graph` berisi:

- **Entitas bisnis** — tipenya ditentukan `sites.vertical`:
  `restaurant` → `Restaurant`, `lodging` → `LodgingBusiness`,
  `cosmetics` → `Store`, `generic` → `LocalBusiness`.
- **WebSite** — menghubungkan situs ke entitas bisnis.
- **BreadcrumbList** — hanya untuk halaman selain beranda.
- **Node turunan dari blok** — FAQ, produk, menu, kamar, galeri, review.

Menambah vertical baru cukup menambah satu baris di `VERTICAL_SCHEMA_TYPE`.

**Catatan tentang rich result:** structured data yang benar adalah syarat, bukan
jaminan. Google memutuskan sendiri kapan menampilkan rich result. Jangan
menjanjikan bintang rating atau FAQ accordion muncul di hasil pencarian — yang
bisa dijanjikan adalah markup-nya valid dan memenuhi syarat.

## 4. Rendering

Semua halaman publik adalah Server Component yang di-*prerender*. Tidak ada
konten yang hanya muncul setelah JavaScript jalan.

Dua tempat yang mudah keliru dan sudah ditangani:

- **FAQ** memakai `<details>` HTML, bukan state React. Jawaban ada di HTML awal
  meski accordion tertutup.
- **JSON-LD** ditulis sebagai `<script type="application/ld+json">` di HTML
  awal, bukan disuntik lewat `useEffect`.

## 5. Checklist sebelum situs klien tayang

**Wajib**

- [ ] `sites.status` = `active` dan `seo_config.noindex` = `false`
- [ ] `NEXT_PUBLIC_SITE_URL` sudah domain final, bukan URL `.vercel.app`
- [ ] Custom domain terpasang dan redirect www → non-www (atau sebaliknya) konsisten
- [ ] Buka `/robots.txt` — pastikan tidak `Disallow: /`
- [ ] Buka `/sitemap.xml` — pastikan semua halaman publik ada
- [ ] Uji satu halaman di [Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Tiap halaman punya tepat satu `<h1>` (satu blok `hero` per halaman)
- [ ] Semua gambar punya alt text yang deskriptif
- [ ] Meta description tiap halaman 120–155 karakter dan berbeda satu sama lain

**Disarankan**

- [ ] Daftarkan domain di Google Search Console, kirim sitemap
- [ ] Isi `business_info` lengkap (alamat, koordinat, jam buka) — penting untuk pencarian lokal
- [ ] Buat/klaim profil Google Business dengan NAP yang persis sama dengan situs
- [ ] Jalankan Lighthouse; target LCP < 2,5 dtk di 4G
- [ ] Ganti OG image otomatis dengan gambar asli untuk klien yang aktif di media sosial

## 6. Batas antara paket standar dan "SEO Managed"

Sudah termasuk semua paket (Reef ke atas) — **SEO teknis**:
struktur HTML benar, metadata terisi, structured data valid, sitemap, halaman
cepat, mobile-friendly.

Dijual terpisah — **SEO konten dan berkelanjutan**:
riset kata kunci, penulisan ulang judul dan deskripsi per halaman, optimasi alt
text, pembangunan konten baru, pemantauan Search Console, penanganan penurunan
peringkat, dan pelaporan bulanan.

Pembedaan ini penting saat menjual. Kalimat yang bisa dipakai: *"Situs Anda
akan dibangun agar Google mudah membacanya. Apakah Anda muncul di peringkat
satu untuk kata kunci tertentu bergantung pada persaingan dan konten — itu
pekerjaan berkelanjutan yang kami tawarkan terpisah."*

## 7. Yang tidak bisa dijanjikan

- Peringkat tertentu dalam jangka waktu tertentu.
- Hasil instan. Domain baru umumnya butuh 3–6 bulan untuk stabil.
- Kekebalan dari perubahan algoritma Google.

Menjanjikan hal-hal ini adalah cara tercepat kehilangan klien di bulan ketiga.
