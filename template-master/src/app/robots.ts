import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
import { getSite } from "@/lib/site";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSite();

  // Site yang belum siap tayang (mis. masih review klien) diblokir total.
  if (!site || site.seo.noindex) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
