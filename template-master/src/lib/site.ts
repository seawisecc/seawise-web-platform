import "server-only";
import { cache } from "react";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/server";
import { SITE_ID } from "@/lib/env";
import { parseBlock, type ParsedBlock } from "@/lib/blocks/schemas";

/* ------------------------------ schema ------------------------------ */

export const themeConfigSchema = z.object({
  preset: z.string().default("coastal"),
  colors: z
    .object({
      primary: z.string().default("#0f5c73"),
      secondary: z.string().default("#7fb7c4"),
      accent: z.string().default("#e8b04b"),
      background: z.string().default("#fbfaf7"),
      foreground: z.string().default("#12222a"),
      muted: z.string().default("#eef2f3"),
    })
    // prefault (bukan default) supaya nilai kosong tetap diisi field-by-field.
    .prefault({}),
  fonts: z
    .object({
      heading: z.enum(["fraunces", "inter", "manrope"]).default("fraunces"),
      body: z.enum(["inter", "manrope"]).default("inter"),
    })
    .prefault({}),
  radius: z.enum(["none", "sm", "md", "lg", "full"]).default("md"),
  motion: z.enum(["none", "subtle", "expressive"]).default("subtle"),
});

export const seoConfigSchema = z.object({
  title_template: z.string().default("%s"),
  default_title: z.string().default(""),
  default_description: z.string().default(""),
  default_og_image: z.string().nullable().default(null),
  // Ikon kecil di tab browser dan bookmark. Kosong berarti pakai bawaan.
  favicon: z.string().nullable().default(null),
  twitter_handle: z.string().nullable().default(null),
  noindex: z.boolean().default(false),
  google_site_verification: z.string().nullable().default(null),
});

export const businessInfoSchema = z.object({
  legal_name: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  whatsapp: z.string().default(""),
  street: z.string().default(""),
  city: z.string().default(""),
  region: z.string().default(""),
  postal_code: z.string().default(""),
  country: z.string().default("ID"),
  latitude: z.number().nullable().default(null),
  longitude: z.number().nullable().default(null),
  price_range: z.string().default(""),
  opening_hours: z
    .array(
      z.object({
        days: z.array(z.string()).default([]),
        opens: z.string().default(""),
        closes: z.string().default(""),
      }),
    )
    .default([]),
  social: z.record(z.string(), z.string()).default({}),
});

export const featuresSchema = z.object({
  admin_panel: z.boolean().default(false),
  reorder: z.boolean().default(false),
  payment: z.boolean().default(false),
  wa_auto: z.boolean().default(false),
});

export type ThemeConfig = z.infer<typeof themeConfigSchema>;
export type SeoConfig = z.infer<typeof seoConfigSchema>;
export type BusinessInfo = z.infer<typeof businessInfoSchema>;
export type Features = z.infer<typeof featuresSchema>;

export type Site = {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  vertical: string;
  tier: "shore" | "reef" | "current" | "trench";
  locale: string;
  theme: ThemeConfig;
  seo: SeoConfig;
  business: BusinessInfo;
  features: Features;
};

export type PageMeta = {
  slug: string;
  title: string;
  navLabel: string | null;
  showInNav: boolean;
  navPosition: number;
  seo: {
    title?: string;
    description?: string;
    og_image?: string;
    noindex?: boolean;
    /** Kode bahasa halaman ini, mis. "id" atau "en". Memicu tag hreflang. */
    hreflang?: string;
  };
  updatedAt: string;
};

/* ---------------------------- data access ---------------------------- */

/**
 * `cache()` men-dedup panggilan dalam satu request (generateMetadata +
 * komponen halaman memanggil fungsi yang sama tanpa dua kali query).
 * Caching lintas-request diatur lewat `export const revalidate` di route.
 */
export const getSite = cache(async (): Promise<Site | null> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("sites")
    .select("id, slug, name, domain, vertical, tier, locale, theme_config, seo_config, business_info, features")
    .eq("id", SITE_ID)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("[site] gagal mengambil data site:", error.message);
    return null;
  }
  if (!data) return null;

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    domain: data.domain,
    vertical: data.vertical,
    tier: data.tier,
    locale: data.locale ?? "id-ID",
    theme: themeConfigSchema.parse(data.theme_config ?? {}),
    seo: seoConfigSchema.parse(data.seo_config ?? {}),
    business: businessInfoSchema.parse(data.business_info ?? {}),
    features: featuresSchema.parse(data.features ?? {}),
  };
});

export const getPages = cache(async (): Promise<PageMeta[]> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("pages")
    .select("slug, title, nav_label, show_in_nav, nav_position, seo, updated_at")
    .eq("site_id", SITE_ID)
    .eq("published", true)
    .order("nav_position", { ascending: true });

  if (error || !data) return [];

  return data.map((p) => ({
    slug: p.slug,
    title: p.title,
    navLabel: p.nav_label,
    showInNav: p.show_in_nav,
    navPosition: p.nav_position,
    seo: (p.seo ?? {}) as PageMeta["seo"],
    updatedAt: p.updated_at,
  }));
});

export const getPage = cache(async (slug: string): Promise<PageMeta | null> => {
  const pages = await getPages();
  return pages.find((p) => p.slug === slug) ?? null;
});

/**
 * Halaman utama — sumber tunggal untuk blok yang membawa aset dan angka.
 */
export const PRIMARY_PAGE = "home";

/**
 * Blok yang isinya bukan bahasa: foto, harga, urutan produk.
 *
 * Blok seperti ini disimpan SEKALI di halaman utama, lalu dipakai ulang
 * oleh halaman terjemahan. Teks di dalamnya diterjemahkan lewat kolom
 * pendamping (`name_en`, `description_en`), bukan lewat salinan blok.
 *
 * Sebelumnya tiap bahasa punya salinannya sendiri. Akibatnya mengganti
 * satu foto berarti mengunggahnya dua kali, dan cepat atau lambat kedua
 * halaman tidak lagi sama.
 */
const SHARED_TYPES = new Set(["products", "gallery"]);

export const getBlocks = cache(async (pageSlug = PRIMARY_PAGE): Promise<ParsedBlock[]> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("content_blocks")
    .select("id, type, data, position")
    .eq("site_id", SITE_ID)
    .eq("page_slug", pageSlug)
    .eq("published", true)
    .order("position", { ascending: true });

  if (error) {
    console.error("[site] gagal mengambil content_blocks:", error.message);
    return [];
  }

  let rows = data ?? [];

  if (pageSlug !== PRIMARY_PAGE) {
    const shared = rows.filter((b) => SHARED_TYPES.has(b.type)).map((b) => b.type);

    if (shared.length > 0) {
      const { data: primary } = await supabase
        .from("content_blocks")
        .select("type, data")
        .eq("site_id", SITE_ID)
        .eq("page_slug", PRIMARY_PAGE)
        .in("type", shared);

      const byType = new Map((primary ?? []).map((b) => [b.type, b.data]));

      // Baris di halaman terjemahan hanya menentukan posisi dan status
      // tayang; isinya selalu diambil dari halaman utama.
      rows = rows.map((b) =>
        byType.has(b.type) ? { ...b, data: byType.get(b.type) } : b,
      );
    }
  }

  return rows.map(parseBlock).filter((b): b is ParsedBlock => b !== null);
});

/** Blok bertipe ini dikelola dari halaman utama, bukan per bahasa. */
export function isSharedBlockType(type: string): boolean {
  return SHARED_TYPES.has(type);
}

/** Ambil blok pertama dengan tipe tertentu — dipakai untuk turunkan metadata. */
export function findBlock<T extends ParsedBlock["type"]>(
  blocks: ParsedBlock[],
  type: T,
): Extract<ParsedBlock, { type: T }> | undefined {
  return blocks.find((b) => b.type === type) as Extract<ParsedBlock, { type: T }> | undefined;
}
