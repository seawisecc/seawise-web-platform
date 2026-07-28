import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSite, getPage, getPages, getBlocks } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildJsonLd } from "@/lib/seo/jsonld";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 300;

// Halaman selain 'home' di-generate statis saat build; halaman baru yang
// dibuat klien lewat admin tetap dilayani lewat ISR.
export async function generateStaticParams() {
  const pages = await getPages();
  return pages.filter((p) => p.slug !== "home").map((p) => ({ slug: p.slug }));
}

// Next.js 16: params adalah Promise dan wajib di-await.
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return buildMetadata(slug);
}

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params;

  const [site, page, blocks] = await Promise.all([
    getSite(),
    getPage(slug),
    getBlocks(slug),
  ]);

  if (!site || !page) notFound();

  const jsonLd = buildJsonLd({ site, blocks, pageSlug: slug, pageTitle: page.title });

  // Halaman terjemahan menandai bahasanya di level elemen. Root <html> memakai
  // bahasa utama situs, jadi tanpa ini pembaca layar dan Google akan menganggap
  // halaman Inggris ditulis dalam bahasa Indonesia.
  const pageLang = page.seo?.hreflang;

  return (
    <>
      <JsonLd json={jsonLd} />
      <div lang={pageLang || undefined}>
        <BlockRenderer blocks={blocks} site={site} lang={pageLang || "id"} />
      </div>
    </>
  );
}
