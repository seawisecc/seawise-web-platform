import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSite, getPage, getBlocks } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildJsonLd } from "@/lib/seo/jsonld";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata("home");
}

export default async function HomePage() {
  const [site, page, blocks] = await Promise.all([
    getSite(),
    getPage("home"),
    getBlocks("home"),
  ]);

  if (!site) notFound();

  const jsonLd = buildJsonLd({
    site,
    blocks,
    pageSlug: "home",
    pageTitle: page?.title ?? site.name,
  });

  return (
    <>
      <JsonLd json={jsonLd} />
      <BlockRenderer blocks={blocks} site={site} />
    </>
  );
}
