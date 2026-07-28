# SOP Onboarding Klien

Dari kesepakatan sampai situs tayang. Tujuan SOP ini bukan formalitas — ini
yang membuat klien kedua di vertical yang sama selesai dalam 10–12 jam, bukan
30 jam.

## Tahap 0 — Sebelum menulis kode

- [ ] Paket disepakati tertulis (Shore / Reef / Current / Trench)
- [ ] DP 50% diterima
- [ ] Kontrak ditandatangani — termasuk jumlah revisi dan jalur upgrade
- [ ] **Domain didaftarkan atas nama dan akun klien**, bukan akun Seawise.
      Seawise cukup diberi akses DNS. Ini poin mitigasi risiko terpenting:
      kalau kerja sama berakhir, tidak ada proses transfer kepemilikan.
- [ ] Materi diterima: logo, foto, teks, daftar produk/menu/kamar

> Kalau materi belum lengkap, jangan mulai. Menunggu materi di tengah
> pengerjaan adalah penyebab utama proyek molor.

## Tahap 1 — Provisioning (±15 menit)

```bash
export NEXT_PUBLIC_SUPABASE_URL=...
export SUPABASE_SECRET_KEY=...

node scripts/new-client.mjs \
  --slug nama-klien \
  --name "Nama Bisnis" \
  --vertical lodging \
  --tier reef \
  --domain domainklien.com
```

Skrip membuat baris `sites` (status `draft`, `noindex: true`), halaman `home`,
dan set blok awal sesuai vertical. Catat `site_id` yang tercetak.

## Tahap 2 — Vercel (±10 menit)

1. Import repo `template-master` sebagai project baru.
2. Isi Environment Variables:

   | Variabel | Nilai |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | sama untuk semua klien |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | sama untuk semua klien |
   | `NEXT_PUBLIC_SITE_ID` | **dari langkah 1** |
   | `NEXT_PUBLIC_SITE_URL` | `https://domainklien.com` |

3. Deploy, lalu pastikan URL `.vercel.app` sudah tampil (masih kosong, wajar).

## Tahap 3 — Isi konten (bagian terlama)

Lewat `/admin` atau langsung di Supabase untuk pekerjaan borongan.

Urutan yang paling efisien:

1. **`business_info` dulu** — alamat, telepon, WhatsApp, jam buka, koordinat,
   media sosial. Ini yang mengisi structured data dan footer sekaligus.
2. **`theme_config`** — warna dari logo klien. Jalankan `npm run dev` dan
   perhatikan peringatan kontras di console.
3. **Blok satu per satu** dari atas ke bawah. Hero terakhir, karena kalimatnya
   paling mudah ditulis setelah melihat isi halaman lain.
4. **Upload gambar** ke Supabase Storage bucket `site-media`, folder
   `{site_id}/`. Isi alt text saat mengunggah — bukan nanti.

## Tahap 4 — Akun klien (paket Reef ke atas)

1. Buat user di Supabase Auth dengan email klien.
2. Tambahkan baris `profiles`:

```sql
insert into public.profiles (user_id, site_id, role, full_name)
values ('<user_id>', '<site_id>', 'owner', 'Nama Klien');
```

3. Kirim tautan reset password ke klien, bukan password lewat WhatsApp.

## Tahap 5 — Review klien

- Kirim URL `.vercel.app`, belum domain asli.
- Situs masih `noindex` — aman dari terindeks setengah jadi.
- Kumpulkan revisi dalam **satu kali kiriman**, bukan dicicil. Ini yang
  membuat "2x revisi major" bermakna; tanpa aturan ini, revisi tak berujung.

## Tahap 6 — Peluncuran

- [ ] Pelunasan diterima
- [ ] Custom domain ditambahkan di Vercel, DNS diarahkan
- [ ] `NEXT_PUBLIC_SITE_URL` diubah ke domain final, lalu **redeploy**
      (variabel `NEXT_PUBLIC_*` ikut ke dalam build — mengubahnya tanpa
      redeploy tidak berpengaruh)
- [ ] `sites.status` → `active`
- [ ] `seo_config.noindex` → `false`
- [ ] Jalankan checklist di [`03-seo-playbook.md`](03-seo-playbook.md) §5
- [ ] Daftarkan di Google Search Console, kirim sitemap
- [ ] Serahkan panduan singkat pemakaian admin ke klien

## Tahap 7 — Setelah tayang

- Catat tanggal jatuh tempo maintenance (auto-renew tahunan, notice 30 hari).
- Catat berapa jam yang benar-benar terpakai. Angka ini yang menentukan apakah
  harga tier perlu disesuaikan — bukan perasaan.
- Kalau ini klien pertama di sebuah vertical, luangkan waktu merapikan preset
  dan tipe blok barunya. Klien berikutnya di vertical yang sama adalah tempat
  margin sebenarnya berada.

## Estimasi waktu

| Tahap | Vertical sudah ada | Vertical baru |
|---|---|---|
| Provisioning + Vercel | 0,5 jam | 0,5 jam |
| Bangun tipe blok & komponen | — | 12–18 jam |
| Isi konten | 4–6 jam | 4–6 jam |
| Tema & penyesuaian | 2–3 jam | 4–6 jam |
| Review & revisi | 2–3 jam | 3–5 jam |
| Peluncuran | 1 jam | 1 jam |
| **Total** | **10–13 jam** | **25–36 jam** |

Selisih inilah alasan tier Trench dihargai jauh lebih tinggi, dan alasan
diskon untuk satu-dua klien pertama di vertical baru harus disebut sebagai
investasi riset — bukan dijadikan harga standar.
