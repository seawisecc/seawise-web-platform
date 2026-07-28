import { z } from "zod";
import { id as localeId } from "zod/locales";

// Pesan validasi tampil di panel yang dipakai pemilik bisnis, bukan hanya
// di log pengembang. Tanpa ini klien membaca "expected number, received
// undefined" dan tidak tahu harus berbuat apa.
z.config(localeId());

/**
 * ---------------------------------------------------------------------
 * SUMBER KEBENARAN untuk struktur `content_blocks.data`.
 *
 * Database sengaja menyimpan JSONB tanpa constraint. Validasi ada di sini
 * supaya menambah vertical baru = menambah satu entry di file ini, bukan
 * migrasi database.
 *
 * Cara menambah tipe blok baru:
 *   1. Tulis schema-nya di bawah.
 *   2. Daftarkan di `blockSchemas` + `BLOCK_META`.
 *   3. Buat komponennya di src/components/blocks/ dan daftarkan di
 *      BlockRenderer.tsx.
 *   4. Kalau blok itu punya arti SEO, tambahkan mapping di lib/seo/jsonld.ts.
 * ---------------------------------------------------------------------
 */

export const imageSchema = z.object({
  url: z.string().default(""),
  alt: z.string().default(""),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const ctaSchema = z.object({
  label: z.string().default(""),
  href: z.string().default("#"),
});

const alignment = z.enum(["left", "center"]).default("left");

/* ------------------------------ blok umum ------------------------------ */

export const heroSchema = z.object({
  eyebrow: z.string().default(""),
  headline: z.string().default(""),
  subheadline: z.string().default(""),
  alignment,
  image: imageSchema.optional(),
  primary_cta: ctaSchema.optional(),
  secondary_cta: ctaSchema.optional(),
});

export const aboutSchema = z.object({
  title: z.string().default(""),
  body: z.string().default(""),
  image: imageSchema.optional(),
  stats: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .default([]),
});

export const servicesSchema = z.object({
  title: z.string().default(""),
  subtitle: z.string().default(""),
  layout: z.enum(["grid", "list"]).default("grid"),
  items: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().default(""),
        price: z.string().optional(),
        icon: z.string().optional(),
        image: imageSchema.optional(),
      }),
    )
    .default([]),
});

/** Ukuran/kemasan berbeda dengan harga sendiri (mis. 30 ml dan 10 ml). */
export const variantSchema = z.object({
  label: z.string(),
  price: z.number().nonnegative(),
  sku: z.string().optional(),
});

export const productsSchema = z.object({
  title: z.string().default(""),
  subtitle: z.string().default(""),
  // Terjemahan Inggris. Foto, harga, dan urutan TIDAK diduplikasi — hanya
  // teksnya. Satu katalog, banyak bahasa.
  title_en: z.string().default(""),
  subtitle_en: z.string().default(""),
  items: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().default(""),
        name_en: z.string().default(""),
        description_en: z.string().default(""),
        // Dipakai kalau produk hanya punya satu harga.
        price: z.number().nonnegative().optional(),
        // Dipakai kalau produk punya beberapa ukuran. Kalau terisi,
        // `price` diabaikan dan harga terendah jadi harga "mulai dari".
        variants: z.array(variantSchema).default([]),
        currency: z.string().default("IDR"),
        sku: z.string().optional(),
        availability: z.enum(["InStock", "OutOfStock", "PreOrder"]).default("InStock"),
        // Foto tunggal — bentuk lama, dipertahankan agar data yang sudah ada
        // tidak rusak. Dipakai sebagai cadangan bila `images` kosong.
        image: imageSchema.optional(),
        // Beberapa foto per produk, ditampilkan sebagai galeri geser.
        images: z.array(imageSchema).default([]),
        // Rincian tambahan yang tampil sebagai daftar (mis. notes parfum,
        // kandungan aktif, ukuran). Sengaja generik supaya bisa dipakai
        // vertical lain tanpa menambah field baru.
        details: z
          .array(
            z.object({
              label: z.string(),
              label_en: z.string().default(""),
              value: z.string(),
            }),
          )
          .default([]),
        // Khusus vertical kosmetik: nomor izin edar BPOM.
        bpom_number: z.string().optional(),
      }),
    )
    .default([]),
});

export const gallerySchema = z.object({
  title: z.string().default(""),
  title_en: z.string().default(""),
  layout: z.enum(["grid", "masonry", "carousel"]).default("grid"),
  images: z.array(imageSchema).default([]),
});

export const testimonialsSchema = z.object({
  title: z.string().default(""),
  items: z
    .array(
      z.object({
        quote: z.string(),
        author: z.string(),
        role: z.string().optional(),
        rating: z.number().min(1).max(5).optional(),
        avatar: imageSchema.optional(),
      }),
    )
    .default([]),
});

export const faqSchema = z.object({
  title: z.string().default(""),
  items: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
});

export const contactSchema = z.object({
  title: z.string().default(""),
  subtitle: z.string().default(""),
  show_form: z.boolean().default(true),
  show_map: z.boolean().default(false),
  whatsapp_text: z.string().default(""),
});

export const ctaBlockSchema = z.object({
  headline: z.string().default(""),
  body: z.string().default(""),
  cta: ctaSchema.optional(),
});

export const richTextSchema = z.object({
  title: z.string().default(""),
  body: z.string().default(""),
});

/* --------------------- blok spesifik vertical --------------------- */

/** Vertical: restaurant */
export const menuSchema = z.object({
  title: z.string().default(""),
  categories: z
    .array(
      z.object({
        name: z.string(),
        items: z
          .array(
            z.object({
              name: z.string(),
              description: z.string().default(""),
              price: z.number().nonnegative().optional(),
              currency: z.string().default("IDR"),
              tags: z.array(z.string()).default([]),
              image: imageSchema.optional(),
            }),
          )
          .default([]),
      }),
    )
    .default([]),
});

/** Vertical: lodging (hotel/villa) */
export const roomsSchema = z.object({
  title: z.string().default(""),
  items: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().default(""),
        price_from: z.number().nonnegative().optional(),
        currency: z.string().default("IDR"),
        max_occupancy: z.number().int().positive().optional(),
        bed_type: z.string().optional(),
        size_sqm: z.number().positive().optional(),
        amenities: z.array(z.string()).default([]),
        images: z.array(imageSchema).default([]),
        booking_url: z.string().optional(),
      }),
    )
    .default([]),
});

/* ------------------------------ registry ------------------------------ */

export const blockSchemas = {
  hero: heroSchema,
  about: aboutSchema,
  services: servicesSchema,
  products: productsSchema,
  gallery: gallerySchema,
  testimonials: testimonialsSchema,
  faq: faqSchema,
  contact: contactSchema,
  cta: ctaBlockSchema,
  richtext: richTextSchema,
  menu: menuSchema,
  rooms: roomsSchema,
} as const;

export type BlockType = keyof typeof blockSchemas;

export type BlockDataMap = {
  [K in BlockType]: z.infer<(typeof blockSchemas)[K]>;
};

export type ParsedBlock = {
  [K in BlockType]: { id: string; type: K; position: number; data: BlockDataMap[K] };
}[BlockType];

/** Metadata untuk label di admin panel & pembatasan per vertical. */
export const BLOCK_META: Record<
  BlockType,
  { label: string; description: string; verticals: "all" | string[] }
> = {
  hero: { label: "Hero", description: "Bagian pembuka dengan judul besar dan tombol aksi.", verticals: "all" },
  about: { label: "Tentang", description: "Cerita atau profil singkat bisnis.", verticals: "all" },
  services: { label: "Layanan", description: "Daftar layanan atau paket.", verticals: "all" },
  products: { label: "Produk", description: "Katalog produk dengan harga.", verticals: "all" },
  gallery: { label: "Galeri", description: "Kumpulan foto.", verticals: "all" },
  testimonials: { label: "Testimoni", description: "Kutipan dari pelanggan.", verticals: "all" },
  faq: { label: "FAQ", description: "Pertanyaan yang sering diajukan.", verticals: "all" },
  contact: { label: "Kontak", description: "Form kontak, WhatsApp, dan alamat.", verticals: "all" },
  cta: { label: "Ajakan", description: "Blok ajakan bertindak singkat.", verticals: "all" },
  richtext: { label: "Teks", description: "Paragraf bebas.", verticals: "all" },
  menu: { label: "Menu", description: "Daftar menu per kategori.", verticals: ["restaurant"] },
  rooms: { label: "Kamar", description: "Tipe kamar/unit beserta fasilitas.", verticals: ["lodging"] },
};

export function isBlockType(value: string): value is BlockType {
  return value in blockSchemas;
}

/**
 * Parse baris database jadi blok yang aman dipakai komponen.
 * Blok dengan tipe tak dikenal atau data rusak dibuang, bukan bikin
 * seluruh halaman error — satu blok salah tidak boleh menjatuhkan situs klien.
 */
export function parseBlock(row: {
  id: string;
  type: string;
  data: unknown;
  position: number;
}): ParsedBlock | null {
  if (!isBlockType(row.type)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[blocks] tipe tidak dikenal: "${row.type}" (id ${row.id})`);
    }
    return null;
  }

  const result = blockSchemas[row.type].safeParse(row.data ?? {});
  if (!result.success) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[blocks] data tidak valid untuk "${row.type}" (id ${row.id})`, result.error.issues);
    }
    return null;
  }

  return {
    id: row.id,
    type: row.type,
    position: row.position,
    data: result.data,
  } as ParsedBlock;
}
