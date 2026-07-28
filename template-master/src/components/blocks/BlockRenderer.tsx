import type { ParsedBlock } from "@/lib/blocks/schemas";
import type { Site } from "@/lib/site";

import { Hero } from "./Hero";
import { About } from "./About";
import { Services } from "./Services";
import { Products } from "./Products";
import { Gallery } from "./Gallery";
import { Testimonials } from "./Testimonials";
import { Faq } from "./Faq";
import { Contact } from "./Contact";
import { Cta } from "./Cta";
import { RichText } from "./RichText";
import { Menu } from "./Menu";
import { Rooms } from "./Rooms";

/**
 * Satu-satunya tempat tipe blok dipetakan ke komponen.
 * Menambah tipe baru = tambah satu `case` di sini + schema di
 * lib/blocks/schemas.ts. Tidak ada perubahan lain yang diperlukan.
 */
function renderBlock(block: ParsedBlock, site: Site, lang: string) {
  switch (block.type) {
    case "hero":         return <Hero data={block.data} />;
    case "about":        return <About data={block.data} />;
    case "services":     return <Services data={block.data} />;
    case "products":     return <Products data={block.data} lang={lang} />;
    case "gallery":      return <Gallery data={block.data} lang={lang} />;
    case "testimonials": return <Testimonials data={block.data} />;
    case "faq":          return <Faq data={block.data} />;
    case "contact":      return <Contact data={block.data} business={site.business} />;
    case "cta":          return <Cta data={block.data} />;
    case "richtext":     return <RichText data={block.data} />;
    case "menu":         return <Menu data={block.data} />;
    case "rooms":        return <Rooms data={block.data} />;
    default: {
      // Memaksa compile error kalau ada tipe blok yang lupa didaftarkan.
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}

export function BlockRenderer({
  blocks,
  site,
  lang = "id",
}: {
  blocks: ParsedBlock[];
  site: Site;
  /** Bahasa halaman. Blok yang dibagikan antar bahasa memakainya untuk
      memilih kolom teks yang tepat tanpa perlu salinan blok terpisah. */
  lang?: string;
}) {
  return (
    <>
      {blocks.map((block) => (
        <div key={block.id}>{renderBlock(block, site, lang)}</div>
      ))}
    </>
  );
}
