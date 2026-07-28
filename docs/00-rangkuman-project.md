# Seawise Web Service Platform — Rangkuman Project

> Dokumen ini adalah rangkuman perencanaan platform jasa pembuatan website multi-klien di bawah Seawise Creative. Disusun sebagai dasar awal untuk pengembangan (Cowork/Claude Code).

---

## 1. Konteks & Tujuan

- Layanan jasa pembuatan website untuk berbagai jenis bisnis klien (**tidak dibatasi 1 vertical** — bisa kosmetik/UMKM, resto, hotel, villa, retail, jasa umum, dll).
- Tujuan strategis: membangun **semi-passive income** — sistem yang bisa reuse dan tidak selalu butuh kerja aktif penuh per klien, supaya ada ruang waktu untuk keluarga.
- Diferensiasi dari kompetitor jasa web generic (WordPress/cPanel murah): custom system berbasis Next.js + Supabase, admin panel self-service untuk klien, SEO/structured data otomatis, dan (khusus segmen kosmetik/skincare) keahlian regulatory/BPOM milik pendiri sebagai nilai tambah.

---

## 2. Arsitektur Teknis

### 2.1 Model Database — Hybrid (Vertical Template + JSONB Content Model)

Alasan: tidak tahu di awal klien akan butuh jenis bisnis apa, sehingga skema per-klien yang fully custom tidak scalable. Solusi:

- **1 Supabase project** dipakai bersama oleh semua klien (bukan 1 project per klien).
- Skema inti generik, dengan isi konten fleksibel lewat kolom JSONB — bukan tabel spesifik per jenis bisnis.

**Tabel inti:**
- `sites` — id, name, domain, theme_config (jsonb), owner_id, status
- `content_blocks` — id, site_id, type, data (jsonb), order, published
- `profiles` — id, user_id (→ auth.users), site_id, role ('owner' / 'superadmin')
- `media` — id, site_id, url, alt_text

**Isolasi antar klien:** `site_id` + Row Level Security (RLS). Validasi struktur JSONB per `type` dilakukan di level aplikasi (misal pakai Zod), bukan di database.

**Vertical template:** dibangun bertahap — mulai dari 1 vertical dulu (bangun content_blocks type, admin form, tema render) sampai matang, baru digeneralisasi ke vertical lain. Tiap vertical baru menambah "jenis type" baru ke content_blocks, bukan mengubah struktur database.

### 2.2 Desain & Tema

- Tema (warna, font, layout preset, animasi) disimpan di `theme_config` (jsonb) pada tabel `sites` — terpisah total dari struktur data konten.
- Preset komponen (misal `ThemeMinimalist`, `ThemeLuxuryVilla`, dst) dibangun sebagai katalog reusable — makin banyak preset terkumpul dari klien-klien sebelumnya, makin cepat onboarding klien baru.
- Animasi/layout benar-benar custom (di luar preset yang ada) = kerja development tambahan, bukan sekadar konfigurasi → masuk kategori add-on berbayar terpisah.

### 2.3 Model Deploy — Pola B (1 Codebase Template, Deploy Terpisah per Klien)

- 1 repo Next.js App Router sebagai "template master".
- Tiap klien = 1 Vercel project terpisah (bukan 1 project shared untuk semua klien), dengan env var `NEXT_PUBLIC_SITE_ID` yang berbeda per klien.
- Semua project tetap connect ke 1 Supabase project yang sama.
- Alasan pilih Pola B dibanding Pola A (shared single deployment): isolasi deploy (bug di 1 klien tidak mematikan klien lain), custom domain lebih mudah dikelola per project, dan fleksibel kalau ada klien yang butuh fork/fitur custom di luar pola umum.

**Platform deploy — Vercel (default) vs alternatif:**
- **Vercel** tetap jadi pilihan utama karena optimasi Next.js paling matang dan workflow onboarding project baru paling cepat (penting karena Pola B butuh banyak project baru dibuat rutin).
- **Cloudflare Pages + Workers** worth dicoba sebagai alternatif/pelengkap — terutama karena domain Seawise sudah dikelola di Cloudflare, dan bandwidth-nya lebih longgar dibanding Vercel. Cocok untuk klien vertical berat gambar (hotel/villa) yang berisiko kena overage bandwidth di Vercel.
- **Railway/Render** jadi opsi kalau ke depan butuh backend/database di luar Supabase dalam 1 dashboard yang sama.
- Self-host VPS (Coolify/Dokploy) sengaja **tidak** dipilih karena butuh effort maintenance server sendiri — bertentangan dengan tujuan semi-passive income.

### 2.4 Admin Panel (CMS Internal)

- Route `/admin`, auth via Supabase Auth.
- RLS: `profiles.role = owner` hanya bisa edit `content_blocks` milik `site_id` mereka sendiri.
- Form dibuat dinamis berdasarkan `content_blocks.type` (reuse 1 admin UI untuk semua vertical).
- Batasi akses klien ke **edit konten saja** (teks, harga, foto, jam buka) — kunci tema/layout/struktur supaya kualitas visual tetap terjaga (ini bagian dari value jual dibanding page builder generic).

### 2.5 SEO — Dibangun Sejak Awal, Bukan Ditambah Belakangan

- Rendering wajib Server-Side Rendering / Static Generation (Next.js Server Components) — hindari client-side rendering murni supaya konten terindeks Google.
- `generateMetadata` dinamis per `site_id` (title, meta description, OG image).
- Custom domain per klien (bukan subdomain) untuk otoritas domain lebih kuat.
- Structured data (Schema.org JSON-LD) di-generate otomatis berdasarkan `content_blocks.type` → map ke schema yang sesuai (`Restaurant`, `LodgingBusiness`, `Product`/`LocalBusiness`, dll).
- Sitemap & robots.txt digenerate otomatis per site dari data yang published.
- **SEO on-page (kualitas isi meta description, alt text, dll) dijual sebagai layanan terpisah** ("SEO Managed"), bukan otomatis termasuk paket standar.

### 2.6 Fitur Add-On Teknis

**Payment gateway (untuk toko online):**
- Gunakan Midtrans atau Xendit (lebih cocok pasar lokal dibanding Stripe) — support QRIS, VA, e-wallet, kartu kredit.
- Alur: checkout → create transaction via API → redirect/embed payment page → webhook masuk ke Supabase Edge Function → update status di tabel `orders`.
- Status transaksi harus dikonfirmasi via webhook, bukan hanya response redirect di browser.

**Notifikasi WhatsApp:**
- Level simpel (gratis): link `wa.me` yang di-generate otomatis, diklik manual oleh admin klien.
- Level otomatis (berbayar): integrasi WhatsApp Business API / provider pihak ketiga (Fonnte, Wablas, dll), trigger otomatis via Supabase Database Webhook + Edge Function.

**Notifikasi email:**
- Pakai Resend atau Supabase built-in SMTP, trigger dari insert row baru di tabel `orders`.

**Arsitektur notifikasi yang disarankan:** 1 Supabase Database Webhook terpusat yang memanggil 1 Edge Function pusat — function itu yang handle logic kirim WA + email + update status sekaligus (bukan logic tersebar di banyak tempat).

---

## 3. Perbandingan dengan WordPress/cPanel (Konteks Positioning)

| Aspek | WordPress/cPanel | Platform Seawise |
|---|---|---|
| Database | 1 MySQL terpisah per klien/hosting | 1 Postgres (Supabase), dipisah via `site_id` + RLS |
| Isolasi | Otomatis by design (infrastruktur terpisah) | Hasil desain aplikasi (RLS), bukan default infra |
| Waktu ke pasar | Cepat (plugin ecosystem matang) | Lebih lambat di awal, cepat setelah template/preset matang |
| Performa/SEO | Butuh banyak plugin tambahan (caching, SEO) | SSR/SSG native, lebih cepat secara default |
| Security surface | Target utama hacking (plugin pihak ketiga rentan) | Lebih kecil, dependency dikontrol sendiri |
| Fleksibilitas non-teknis | Klien bisa install plugin sendiri kapan saja | Semua fitur baru butuh development dari penyedia |
| Handover ke developer lain | Mudah (banyak yang bisa WordPress) | Butuh developer yang paham stack spesifik ini |

---

## 4. Riset Pasar (Bali/Indonesia, hasil survei)

- Landing page: mulai Rp 800rb
- Company profile: umumnya Rp 1–20 juta (kompetitor lokal sering di kisaran Rp 2–3 juta untuk paket basic)
- Toko online: mulai Rp 3–5 juta ke atas
- Hotel/villa/pariwisata: ada kompetitor niche yang juga pakai Next.js, mulai Rp 800rb–3 juta — jadi stack teknis saja belum cukup jadi diferensiasi, harus dari kualitas sistem & SEO
- Biaya tahunan lazim di pasar: hosting Rp200rb–2,5juta/tahun, domain terpisah, SSL (umumnya sudah termasuk gratis di banyak platform modern)
- Banyak vendor "murah di depan" tapi menambah biaya tersembunyi (domain, hosting, revisi) — celah untuk diferensiasi lewat transparansi harga

---

## 5. Model Harga — Paket "Kedalaman Laut"

Struktur paket final menggunakan penamaan kedalaman laut (konsisten dengan identitas Seawise), dari yang paling ringan sampai paling lengkap: **Shore → Reef → Current → Trench**.

### 5.1 Perbandingan Paket

| | 🏖️ **Shore** | 🪸 **Reef** | 🌊 **Current** | 🕳️ **Trench** |
|---|---|---|---|---|
| **Harga** | Rp 1,8 juta | Rp 3,5 – 4 juta | Rp 4,5 – 5 juta | Rp 6 – 7 juta |
| **Cocok untuk** | Promosi 1 produk/acara/event, personal branding sederhana | UMKM yang butuh company profile utuh, vertical sudah tersedia | Bisnis yang mau tampilan lebih personal/beda dari kompetitor sejenis | Bisnis dengan model unik/belum ada template, atau butuh fitur custom penuh |
| **Jumlah halaman/section** | 1 halaman (single page), maks 4–5 section | Maks 5–6 section (hero, tentang, produk/layanan, galeri, kontak) | Maks 8–10 section, bisa reorder sendiri | Tidak dibatasi (disesuaikan kebutuhan bisnis) |
| **Tema** | 1 preset tetap, tanpa pilihan warna | Pilih dari preset yang tersedia | Preset + kustomisasi moderat (warna/layout/animasi ringan) | Full custom (bisa vertical/tema baru) |
| **Admin panel (edit sendiri)** | Tidak ada (perubahan lewat request ke Seawise) | Edit teks, harga, foto | Sama + reorder section sendiri | Sama + akses lebih luas sesuai kebutuhan |
| **SEO dasar** | Metadata standar | Metadata + structured data otomatis | Sama seperti Reef | Sama + bisa dibundling SEO Managed dengan diskon |
| **Add-on (payment/WA otomatis)** | Tidak tersedia | Tidak termasuk, beli terpisah | Bisa tambah 1 add-on (charge terpisah) | 1 add-on termasuk di harga, add-on kedua charge terpisah |
| **Revisi termasuk** | 1x revisi minor | 2x revisi major | 2x revisi major | 2x revisi major + prioritas support |
| **Maintenance tahunan** | Opsional, Rp 1,5 juta/tahun | Rp 1,5 juta/tahun | Rp 1,5 juta/tahun | Rp 1,5 juta/tahun |
| **Estimasi waktu kerja Seawise** | ~4–6 jam | ~10–12 jam (reuse) / ~30–35 jam (vertical baru) | ~15–18 jam | ~35–40+ jam |

### 5.2 Struktur Teknis yang Harus Disiapkan per Paket

| Kebutuhan | Shore | Reef | Current | Trench |
|---|---|---|---|---|
| **Template vertical** | 1 template landing page generik (bisa dipakai semua jenis bisnis) | Perlu vertical sudah tersedia (kosmetik/resto/dll) di `content_blocks` | Sama seperti Reef, + preset animasi tambahan | Kalau vertical belum ada, harus dibangun dari nol (schema, komponen, admin form) |
| **Preset tema** | 1 preset saja cukup | Minimal 3–4 preset warna/layout siap pilih | Sama + preset animasi ringan (fade, scroll reveal, dll) | Custom per klien, jadi preset baru untuk katalog ke depan |
| **`site_id` & row di Supabase** | Perlu (tetap masuk sistem yang sama biar bisa upgrade nanti) | Perlu | Perlu | Perlu |
| **Vercel project & domain** | Perlu (kalau klien mau domain sendiri, +biaya domain terpisah) | Perlu | Perlu | Perlu |
| **Admin panel aktif** | Tidak perlu di-setup untuk klien ini | Perlu | Perlu | Perlu |
| **Setup Edge Function tambahan (notifikasi/payment)** | Tidak ada | Tidak ada | Kalau add-on dipilih, ya | Ya (minimal 1 add-on termasuk) |

### 5.3 Add-On & Layanan Recurring (Di Luar Paket Utama)

| Item | Harga |
|---|---|
| SEO Managed (recurring, terpisah dari maintenance) | Rp 500rb – 1 juta/bulan atau paket tahunan |
| Add-on: Payment Gateway | Rp 1,5 – 2,5 juta one-time (di luar fee transaksi gateway, ditanggung klien) |
| Add-on: WA Otomatis | Rp 500rb – 1 juta one-time + biaya API bulanan diteruskan ke klien |

### 5.4 Catatan Strategi Paket

- **Shore adalah "pintu masuk", bukan produk berdiri sendiri.** Tujuannya menjaring klien kecil/coba-coba dengan harga rendah, lalu di-upsell ke Reef/Current begitu bisnis mereka berkembang. Tetap masukkan ke sistem yang sama (`site_id`, Supabase project sama) supaya upgrade nanti tinggal nambah section, bukan bikin ulang dari nol.
- **Shore sengaja tanpa admin panel** — menjaga effort maintenance rendah (selaras tujuan semi-passive income) dan harga Rp1,8jt tetap masuk akal secara waktu kerja (~4–6 jam). Kalau klien Shore minta akses edit sendiri, itu sinyal mereka perlu naik ke Reef.
- **Jalur upgrade harus jelas di penawaran** — klien yang naik dari Shore/Reef ke tier atas dikenakan selisih harga sebagai upgrade, bukan negosiasi ulang dari nol.
- **Tier "Trench" sengaja dihargai lebih tinggi** karena effort riil ~3x lipat dibanding klien reuse — mencegah subsidi tak sadar ke klien pertama tiap vertical baru. Diskon di 1–2 klien pertama per vertical baru boleh dilakukan sebagai "biaya riset", asal transparan sebagai investasi, bukan standar harga permanen.
- **Sebutkan angka konkret di penawaran** (jumlah section/halaman maksimal, jumlah revisi termasuk) supaya klien tier bawah tidak meminta fitur tier atas dengan harga tier bawah — nyambung ke klausul revisi di kontrak (lihat Bagian 9).

---

## 6. Estimasi Waktu Kerja & Margin

- **Klien pertama per vertical (bangun template dari nol):** ~30–35 jam
- **Klien berikutnya, vertical sama (reuse template):** ~10–12 jam
- Efektif rate: klien pertama ~Rp121rb/jam (investasi aset), klien reuse ~Rp364rb/jam (sehat)
- Implikasi: makin banyak vertical yang sudah punya template matang, makin besar proporsi klien yang masuk kategori "reuse" → margin waktu makin baik

---

## 7. Model Biaya Infrastruktur & Target Klien

**Biaya infra fixed (tidak bertambah linear per klien, sampai batas overage):**
- Vercel Pro: ~$20/bulan (per seat/orang, bukan per project)
- Supabase Pro: ~$25/bulan (1 project, dipakai bersama semua klien)
- Total: ~Rp 8,6 juta/tahun (estimasi, tergantung kurs)

**Breakeven & target:**
- Breakeven murni infra (maintenance Rp1,5jt/klien/tahun): ~6 klien aktif
- Target sehat untuk margin waktu/effort (~60-70% dari maintenance fee jadi margin): 15–20 klien aktif
- Overage risk: klien vertical berat gambar (hotel/villa) bisa memicu biaya tambahan storage/bandwidth — perlu dimonitor, bukan dihindari sejak awal

---

## 8. Skema Kepemilikan (Mitigasi Risiko Legal/Ketergantungan)

- **Domain**: didaftarkan atas nama/akun klien sendiri sejak awal (bukan akun penyedia jasa) — penyedia hanya diberi akses admin/DNS. Kalau kerja sama putus, akses dicabut tanpa proses transfer kepemilikan yang rumit.
- **Vercel project**: 1 project per klien (Pola B) memudahkan transfer project ke akun/team lain jika klien ingin pindah.
- **Data di Supabase**: karena multi-tenant shared, perlu script export khusus (dump data filter `site_id`) untuk migrasi jika klien keluar — ini dijadikan **biaya migrasi/exit resmi** di kontrak, bukan gratis.

---

## 9. Usulan Aturan Kontrak

- **Kepemilikan**: source code template/sistem dasar tetap IP penyedia jasa; konten, data, dan domain sepenuhnya milik klien.
- **Pembayaran**: DP 50% di awal, pelunasan setelah selesai & disetujui.
- **Revisi**: 2x revisi major termasuk paket; revisi tambahan dikenakan biaya per paket/jam terpisah.
- **Maintenance**: auto-renew tahunan, notice period 30 hari sebelum jatuh tempo jika klien ingin berhenti.
- **SLA**: hindari janji uptime 24/7 mutlak (infra shared); gunakan bahasa "best effort" dengan target waktu respons masalah.
- **Exit clause**: proses migrasi data & handover akses punya timeline jelas (misal 14 hari kerja), dengan biaya migrasi terpisah dari maintenance.

---

## 10. Risiko & Hal yang Perlu Diwaspadai

1. **RLS sebagai single point of failure** — bug di policy bisa membocorkan data lintas klien sekaligus, beda karakter risiko dibanding hosting terisolasi fisik seperti WordPress.
2. **Noisy neighbor** — 1 klien dengan beban query berat bisa memperlambat performa klien lain di Supabase project yang sama.
3. **Dependency/bus factor** — semua klien bergantung pada 1 orang; perlu dipikirkan titik kapan mulai perlu SOP terdokumentasi atau delegasi (asisten paruh waktu), sebelum jumlah klien jadi bottleneck waktu dan mengganggu tujuan semi-passive/waktu keluarga.
4. **Godaan over-customization** — makin banyak klien minta fitur/tema di luar preset, makin jauh dari tujuan semi-passive income; perlu disiplin batasi custom request atau charge signifikan lebih mahal untuk itu.
5. **Testing beban** — perlu simulasi/stress test sebelum skala klien besar untuk memastikan 1 klien dengan traffic tinggi tidak mengganggu klien lain (dilakukan sambil jalan, sesuai keputusan saat ini).

---

## 11. Roadmap Awal (Prioritas Realistis)

1. Buat Supabase project baru — **terpisah dari project company profile Seawise sendiri**.
2. Desain 4 tabel inti (`sites`, `content_blocks`, `profiles`, `media`).
3. Bangun template **Shore** dulu (paling sederhana: 1 preset, tanpa admin panel) — modal awal tercepat untuk mulai jualan sambil sistem Reef/Current/Trench dikembangkan.
4. Bangun 1 vertical pertama end-to-end untuk tier **Reef** (pilih sesuai klien pertama yang tersedia), render dari content_blocks.
5. Tambahkan admin panel setelah render publik Reef sudah stabil — ini jadi basis tier Current & Trench juga.
6. Susun draft kontrak berdasarkan aturan di Bagian 9, termasuk jalur upgrade antar tier, sebelum menerima klien berbayar pertama.
7. Setelah beberapa klien Reef (reuse) berjalan lancar, evaluasi ulang harga tier & pertimbangkan generalisasi ke vertical baru untuk kasus Trench.

---

*Dokumen ini adalah rangkuman strategi & arsitektur — bukan spesifikasi teknis final. Detail implementasi (skema field JSONB per tipe, struktur komponen React, dsb.) akan dikembangkan bertahap saat development dimulai.*

*Update terakhir: struktur paket final "Shore / Reef / Current / Trench" (Bagian 5) dan catatan opsi platform deploy alternatif (Bagian 2.3).*
