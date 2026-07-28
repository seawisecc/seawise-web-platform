# Content Blocks

Isi halaman klien tersusun dari blok. Tiap blok punya `type`, dan `type`
menentukan bentuk kolom `data` (JSONB) serta komponen yang merendernya.

Sumber kebenaran: [`template-master/src/lib/blocks/schemas.ts`](../template-master/src/lib/blocks/schemas.ts).

## Katalog blok

| `type` | Label | Vertical | Structured data yang dihasilkan |
|---|---|---|---|
| `hero` | Hero | semua | — (menyumbang `<h1>` & meta description) |
| `about` | Tentang | semua | — |
| `services` | Layanan | semua | `OfferCatalog` + `Service` |
| `products` | Produk | semua | `ItemList` + `Product` + `Offer` |
| `gallery` | Galeri | semua | `ImageGallery` |
| `testimonials` | Testimoni | semua | `Review` (hanya yang punya rating) |
| `faq` | FAQ | semua | `FAQPage` + `Question` |
| `contact` | Kontak | semua | — (form + WhatsApp) |
| `cta` | Ajakan | semua | — |
| `richtext` | Teks | semua | — |
| `menu` | Menu | restaurant | `Menu` + `MenuSection` + `MenuItem` |
| `rooms` | Kamar | lodging | `HotelRoom` + `Offer` |

## Contoh isi `data`

### `hero`
```json
{
  "eyebrow": "Villa Anandia",
  "headline": "Menginap di tepi sawah Ubud",
  "subheadline": "Tiga villa privat dengan kolam renang pribadi, 10 menit dari pusat Ubud.",
  "alignment": "left",
  "image": { "url": "https://…/hero.webp", "alt": "Kolam renang villa menghadap sawah" },
  "primary_cta": { "label": "Lihat Kamar", "href": "#kamar" },
  "secondary_cta": { "label": "Hubungi Kami", "href": "#kontak" }
}
```

`headline` menjadi satu-satunya `<h1>` di halaman. `subheadline` dipakai
sebagai meta description bila SEO per halaman kosong — jadi tulis kalimat yang
masuk akal dibaca di hasil pencarian, bukan sekadar slogan.

### `products`
```json
{
  "title": "Rangkaian Produk",
  "items": [
    {
      "name": "Serum Vitamin C 15%",
      "description": "Mencerahkan dan meratakan warna kulit.",
      "price": 189000,
      "currency": "IDR",
      "sku": "SRM-VC15",
      "availability": "InStock",
      "bpom_number": "NA18230100123",
      "image": { "url": "https://…/serum.webp", "alt": "Botol serum vitamin C 30ml" }
    }
  ]
}
```

`price` diisi angka murni tanpa titik atau "Rp". Format tampilan ditangani
`Intl.NumberFormat`, dan angka mentahnya dipakai untuk `Offer` di JSON-LD.

Kolom `bpom_number` adalah tambahan khusus vertical kosmetik — nomor izin edar
ditampilkan eksplisit di kartu produk.

### `rooms`
```json
{
  "title": "Tipe Kamar",
  "items": [
    {
      "name": "One Bedroom Pool Villa",
      "description": "45 m² dengan kolam privat dan teras menghadap sawah.",
      "price_from": 1450000,
      "currency": "IDR",
      "max_occupancy": 2,
      "bed_type": "King",
      "size_sqm": 45,
      "amenities": ["Kolam privat", "AC", "Wi-Fi", "Sarapan"],
      "images": [{ "url": "https://…/room-1.webp", "alt": "Kamar tidur dengan ranjang king" }],
      "booking_url": "https://wa.me/62…"
    }
  ]
}
```

## Menambah tipe blok baru

Empat langkah, tidak ada migrasi database:

**1. Tulis schema** di `src/lib/blocks/schemas.ts`

```ts
export const eventsSchema = z.object({
  title: z.string().default(""),
  items: z.array(z.object({
    name: z.string(),
    starts_at: z.string(),
    location: z.string().default(""),
  })).default([]),
});
```

**2. Daftarkan** di `blockSchemas` dan `BLOCK_META`

```ts
export const blockSchemas = { …, events: eventsSchema } as const;

export const BLOCK_META = {
  …,
  events: { label: "Acara", description: "Jadwal acara mendatang.", verticals: ["venue"] },
};
```

**3. Buat komponen** `src/components/blocks/Events.tsx`, lalu tambahkan satu
`case` di `BlockRenderer.tsx`. TypeScript akan menolak build kalau langkah ini
terlewat — `_exhaustive: never` di `default` memaksanya.

**4. Tambahkan field admin** di `src/lib/blocks/fields.ts`, dan bila blok itu
punya arti SEO, tambahkan mapping di `src/lib/seo/jsonld.ts`.

## Aturan yang perlu dipatuhi

- **Semua field harus punya `.default()`.** Klien sering menyimpan blok yang
  belum lengkap; tanpa default, blok tersebut hilang dari halaman.
- **Jangan simpan HTML mentah di `data`.** Isi ditampilkan sebagai teks, dan
  itu disengaja — konten klien tidak boleh bisa menyisipkan markup.
- **Alt text bukan opsional secara praktik.** Field-nya boleh kosong supaya
  data lama tidak rusak, tapi galeri tanpa alt text akan kehilangan nilai SEO
  gambar. Ini salah satu hal yang dijual di paket SEO Managed.
- **Satu blok, satu tanggung jawab.** Kalau sebuah blok butuh lebih dari
  sepuluh field, itu tanda seharusnya dipecah jadi dua.

## Batasan per tier

Batasan jumlah section (Shore maksimal 4–5, Reef 5–6, Current 8–10) **tidak**
dipaksakan oleh database. Itu keputusan komersial, ditegakkan saat provisioning
lewat `scripts/new-client.mjs` dan di kontrak — bukan di runtime, supaya
upgrade tier tidak memerlukan migrasi data.

Yang ditegakkan sistem: `features.reorder` mengunci tombol atur urutan di admin
untuk tier Shore dan Reef, dan diperiksa ulang di server pada `moveBlock()`.
