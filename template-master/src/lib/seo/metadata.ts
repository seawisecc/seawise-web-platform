import "server-only";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/env";
import { getSite, getPage, getPages, getBlocks, findBlock } from "@/lib/site";
import { toMetaDescription, absoluteUrl } from "@/lib/utils";

/**
 * Halaman terjemahan ditandai lewat `pages.seo.hreflang`. Kalau sebuah situs
 * punya lebih dari satu halaman ber-hreflang, semuanya saling menunjuk
 * (termasuk x-default) supaya Google tahu keduanya versi bahasa dari konten
 * yang sama — bukan konten duplikat.
 */
async function buildLanguageAlternates(): Promise<Record<string, string> | undefined> {
  const pages = await getPages();
  const translated = pages.filter((p) => typeof p.seo?.hreflang === "string" && p.seo.hreflang);

  if (translated.length < 2) return undefined;

  const alternates: Record<string, string> = {};
  for (const p of translated) {
    alternates[p.seo.hreflang as string] = p.slug === "home" ? "/" : `/${p.slug}`;
  }

  const primary = translated.find((p) => p.slug === "home") ?? translated[0];
  alternates["x-default"] = primary.slug === "home" ? "/" : `/${primary.slug}`;

  return alternates;
}

/**
 * Satu fungsi ini dipakai oleh SEMUA halaman lewat `generateMetadata`.
 * Urutan prioritas sumber data:
 *   1. SEO override per halaman (kolom pages.seo) — diisi lewat admin.
 *   2. Konten blok pertama halaman (hero headline / subheadline).
 *   3. Default level site (sites.seo_config).
 *
 * Artinya klien yang tidak mengisi apa pun tetap dapat metadata layak,
 * dan klien "SEO Managed" bisa menimpanya per halaman.
 */
export async function buildMetadata(pageSlug = "home"): Promise<Metadata> {
  const [site, page, blocks, languages] = await Promise.all([
    getSite(),
    getPage(pageSlug),
    getBlocks(pageSlug),
    buildLanguageAlternates(),
  ]);

  if (!site) {
    return { title: "Situs belum aktif", robots: { index: false, follow: false } };
  }

  const hero = findBlock(blocks, "hero");
  const about = findBlock(blocks, "about");

  const isHome = pageSlug === "home";

  const rawTitle =
    page?.seo?.title ||
    (isHome ? site.seo.default_title || site.name : page?.title) ||
    site.name;

  const title = isHome
    ? rawTitle
    : site.seo.title_template.includes("%s")
      ? site.seo.title_template.replace("%s", rawTitle)
      : `${rawTitle} | ${site.name}`;

  const description = toMetaDescription(
    page?.seo?.description ||
      hero?.data.subheadline ||
      about?.data.body ||
      site.seo.default_description,
  );

  const canonicalPath = isHome ? "/" : `/${pageSlug}`;
  const canonical = `${SITE_URL}${canonicalPath}`;

  // Gambar yang diunggah klien. Kalau kosong, pratinjau memakai gambar yang
  // dihasilkan app/opengraph-image.tsx.
  const ogImage = page?.seo?.og_image || site.seo.default_og_image;
  const customOgImage = ogImage ? absoluteUrl(ogImage, SITE_URL) : null;
  const noindex = site.seo.noindex || page?.seo?.noindex === true;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    applicationName: site.name,
    alternates: { canonical: canonicalPath, languages },
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    verification: site.seo.google_site_verification
      ? { google: site.seo.google_site_verification }
      : undefined,
    openGraph: {
      type: "website",
      siteName: site.name,
      title,
      description,
      url: canonical,
      locale: site.locale.replace("-", "_"),
      // Sengaja TIDAK diisi saat klien belum mengunggah gambarnya sendiri.
      //
      // Next.js sudah memasang og:image otomatis untuk app/opengraph-image.tsx,
      // memakai alamat sebenarnya beserta penanda cache-nya. Menuliskan alamat
      // itu manual justru menimpanya dengan tebakan — dan tebakan yang meleset
      // membuat pratinjau tampil tanpa gambar, tanpa satu pun pesan kesalahan.
      ...(customOgImage
        ? { images: [{ url: customOgImage, width: 1200, height: 630, alt: title }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: site.seo.twitter_handle ?? undefined,
      // Tanpa twitter-image tersendiri, Next memakai opengraph-image yang sama.
      ...(customOgImage ? { images: [customOgImage] } : {}),
    },
    // Ikon diambil dari data klien, bukan berkas statis di repo — satu
    // codebase melayani banyak klien, jadi favicon tidak boleh ikut build.
    icons: site.seo.favicon
      ? {
          icon: absoluteUrl(site.seo.favicon, SITE_URL),
          apple: absoluteUrl(site.seo.favicon, SITE_URL),
        }
      : undefined,
    formatDetection: { telephone: false },
  };
}
