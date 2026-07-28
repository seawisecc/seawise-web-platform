import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Manrope } from "next/font/google";
import "./globals.css";

import { getSite, getPages, getBlocks, PRIMARY_PAGE } from "@/lib/site";
import { sectionLinks, languageLinks, pageLinks } from "@/lib/nav";
import { themeToCssVars, auditThemeContrast } from "@/lib/theme";
import { buildMetadata } from "@/lib/seo/metadata";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MotionRunner } from "@/components/MotionRunner";

/**
 * Konten klien jarang berubah, jadi halaman di-generate statis dan
 * di-revalidate berkala. Ini yang membuat satu Supabase project sanggup
 * melayani banyak situs tanpa query per pengunjung.
 */
export const revalidate = 300;

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
});

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], display: "swap", variable: "--font-manrope" });

const FONT_VARS: Record<string, string> = {
  fraunces: "var(--font-fraunces)",
  inter: "var(--font-inter)",
  manrope: "var(--font-manrope)",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f5c73",
};

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata("home");
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Menu diturunkan dari blok halaman utama. Layout tidak tahu halaman mana
  // yang sedang dibuka, dan itu justru diinginkan: susunan bagian sengaja
  // sama di semua bahasa, sehingga menu tidak berubah-ubah saat berpindah.
  const [site, pages, blocks] = await Promise.all([
    getSite(),
    getPages(),
    getBlocks(PRIMARY_PAGE),
  ]);

  // Menu header kosong hampir selalu berarti blok halaman utama gagal
  // dibaca, bukan bahwa situsnya memang tanpa bagian. Diberitahukan di
  // terminal supaya tidak perlu ditebak dari tampilan.
  if (process.env.NODE_ENV !== "production" && blocks.length === 0) {
    console.warn("[nav] tidak ada blok terbaca di halaman utama — menu header akan kosong.");
  }

  if (!site) {
    return (
      <html lang="id">
        <body className={`${inter.variable} ${fraunces.variable} ${manrope.variable}`}>
          <main className="container-page flex min-h-dvh flex-col items-center justify-center text-center">
            <h1 className="text-2xl">Situs belum aktif</h1>
            <p className="prose-body mt-3">
              Periksa <code>NEXT_PUBLIC_SITE_ID</code> dan pastikan status site di Supabase
              sudah <code>active</code>.
            </p>
          </main>
        </body>
      </html>
    );
  }

  const cssVars = {
    ...themeToCssVars(site.theme),
    "--font-heading": FONT_VARS[site.theme.fonts.heading] ?? FONT_VARS.fraunces,
    "--font-body": FONT_VARS[site.theme.fonts.body] ?? FONT_VARS.inter,
  } as React.CSSProperties;

  // Peringatan kontras hanya muncul saat development — bukan untuk pengunjung.
  if (process.env.NODE_ENV !== "production") {
    for (const w of auditThemeContrast(site.theme)) console.warn(`[theme] ${w}`);
  }

  return (
    <html
      lang={site.locale.split("-")[0]}
      className={`${inter.variable} ${fraunces.variable} ${manrope.variable}`}
      style={cssVars}
      data-motion={site.theme.motion}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-contrast"
        >
          Lompat ke konten
        </a>

        <SiteHeader
          site={site}
          sections={sectionLinks(blocks)}
          pages={pageLinks(pages)}
          languages={languageLinks(pages, site.locale)}
        />
        <main id="konten" className="flex-1">{children}</main>
        <SiteFooter site={site} />
        <MotionRunner />
      </body>
    </html>
  );
}
