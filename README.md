# Seawise Web Platform

Platform jasa pembuatan website multi-klien. Satu codebase Next.js dan satu
project Supabase melayani semua klien; tiap klien punya deployment Vercel
sendiri yang dibedakan oleh satu environment variable.

Rancangan strategisnya ada di [`docs/00-rangkuman-project.md`](docs/00-rangkuman-project.md).
Repo ini adalah implementasi teknis dari rancangan tersebut.

## Isi folder

```
Seawise-Web-Platform/
├── docs/                  Dokumentasi strategi, arsitektur, dan SOP
├── supabase/              Migration SQL, seed, dan uji RLS
│   ├── migrations/
│   ├── seed.sql
│   ├── tests/rls_test.sql
│   └── functions/         Edge Function untuk notifikasi (WA + email)
├── scripts/
│   └── new-client.mjs     Provisioning klien baru dalam satu perintah
└── template-master/       Aplikasi Next.js — repo yang di-deploy per klien
```

## Stack

| Bagian | Pilihan | Versi |
|---|---|---|
| Framework | Next.js App Router (Turbopack) | 16.2.12 |
| UI | React + Tailwind CSS v4 | 19.2 / 4.3 |
| Data | Supabase (Postgres + Auth + Storage) | — |
| Validasi | Zod | 4.4 |
| Deploy | Vercel (1 project per klien) | — |

Catatan Next.js 16 yang relevan: `middleware.ts` diganti `proxy.ts`, dan
`params` / `searchParams` sekarang berupa Promise yang wajib di-`await`.
Keduanya sudah diterapkan di codebase ini.

## Menjalankan pertama kali

```bash
# 1. Siapkan database
supabase db push                        # jalankan semua migration
psql "$SUPABASE_DB_URL" -f supabase/seed.sql

# 2. Jalankan aplikasi
cd template-master
cp .env.example .env.local              # isi URL, publishable key, SITE_ID
npm install
npm run dev
```

Buka http://localhost:3000. Situs demo (`Seawise Demo`) sudah punya enam
section berisi konten contoh.

## Menambah klien baru

```bash
export NEXT_PUBLIC_SUPABASE_URL=...
export SUPABASE_SECRET_KEY=...          # jangan pernah masuk ke repo

node scripts/new-client.mjs \
  --slug villa-anandia \
  --name "Villa Anandia" \
  --vertical lodging \
  --tier reef \
  --domain villaanandia.com
```

Skrip mencetak `site_id` yang tinggal dipasang sebagai env var di Vercel
project baru. Langkah lengkapnya di [`docs/04-onboarding-klien.md`](docs/04-onboarding-klien.md).

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm run typecheck` | Cek tipe tanpa build |
| `npm run lint` | ESLint |

## Prinsip yang dipegang codebase ini

1. **Menambah vertical baru tidak boleh mengubah skema database.** Tipe blok
   baru cukup didaftarkan di `src/lib/blocks/schemas.ts`.
2. **Tidak ada warna hardcode di komponen.** Semua lewat `var(--brand-*)`
   yang berasal dari `sites.theme_config`.
3. **Satu blok rusak tidak boleh menjatuhkan situs klien.** Blok yang gagal
   validasi Zod dibuang dengan peringatan, bukan melempar error.
4. **SEO ikut data, bukan ditulis manual.** Metadata, JSON-LD, sitemap, dan
   robots semuanya diturunkan dari isi database.
5. **RLS diuji, bukan diasumsikan.** Setiap perubahan policy wajib lolos
   `supabase/tests/rls_test.sql`.

## Dokumentasi

| Berkas | Isi |
|---|---|
| [`00-rangkuman-project.md`](docs/00-rangkuman-project.md) | Rancangan strategi & model bisnis |
| [`01-arsitektur-teknis.md`](docs/01-arsitektur-teknis.md) | Struktur data, alur render, keputusan desain |
| [`02-content-blocks.md`](docs/02-content-blocks.md) | Katalog tipe blok & cara menambah vertical |
| [`03-seo-playbook.md`](docs/03-seo-playbook.md) | Cara kerja SEO otomatis & checklist peluncuran |
| [`04-onboarding-klien.md`](docs/04-onboarding-klien.md) | SOP dari klien deal sampai situs tayang |
| [`05-deployment.md`](docs/05-deployment.md) | Vercel, domain, Cloudflare, dan pemantauan biaya |
| [`06-add-ons.md`](docs/06-add-ons.md) | Payment gateway, notifikasi WA & email |
| [`07-setup-supabase.md`](docs/07-setup-supabase.md) | **Mulai di sini** — setup database sekali jalan |
| [`08-akses-klien.md`](docs/08-akses-klien.md) | Memberi & mencabut akses panel klien |
