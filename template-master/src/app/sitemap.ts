import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
import { getPages, getSite } from "@/lib/site";

export const revalidate = 3600;

/**
 * Sitemap dibangun dari data yang benar-benar published, bukan dari daftar
 * route hardcode — jadi halaman yang di-unpublish klien otomatis hilang.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSite();
  if (!site || site.seo.noindex) return [];

  const pages = await getPages();

  return pages
    .filter((p) => p.seo?.noindex !== true)
    .map((p) => ({
      url: p.slug === "home" ? `${SITE_URL}/` : `${SITE_URL}/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: p.slug === "home" ? ("weekly" as const) : ("monthly" as const),
      priority: p.slug === "home" ? 1 : 0.7,
    }));
}
