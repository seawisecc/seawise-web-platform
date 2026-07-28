import "server-only";
import { SITE_URL } from "@/lib/env";
import type { Site } from "@/lib/site";
import type { ParsedBlock } from "@/lib/blocks/schemas";
import { absoluteUrl, toMetaDescription } from "@/lib/utils";

type Json = Record<string, unknown>;

/**
 * Structured data (Schema.org JSON-LD) di-generate otomatis dari:
 *   - `sites.vertical`   → tipe entitas utama (Restaurant, LodgingBusiness, …)
 *   - `content_blocks`   → entitas turunan (FAQPage, ItemList, Product, …)
 *
 * Menambah vertical baru cukup menambah entri di VERTICAL_SCHEMA_TYPE.
 */
const VERTICAL_SCHEMA_TYPE: Record<string, string> = {
  generic: "LocalBusiness",
  cosmetics: "Store",
  restaurant: "Restaurant",
  cafe: "CafeOrCoffeeShop",
  lodging: "LodgingBusiness",
  hotel: "Hotel",
  villa: "VacationRental",
  retail: "Store",
  service: "ProfessionalService",
  beauty: "BeautySalon",
  health: "HealthAndBeautyBusiness",
};

const DAY_MAP: Record<string, string> = {
  Mo: "Monday", Tu: "Tuesday", We: "Wednesday", Th: "Thursday",
  Fr: "Friday", Sa: "Saturday", Su: "Sunday",
};

function organizationNode(site: Site): Json {
  const b = site.business;
  const type = VERTICAL_SCHEMA_TYPE[site.vertical] ?? "LocalBusiness";

  const node: Json = {
    "@type": type,
    "@id": `${SITE_URL}/#business`,
    name: b.legal_name || site.name,
    url: SITE_URL,
  };

  if (b.email) node.email = b.email;
  if (b.phone) node.telephone = b.phone;
  if (b.price_range) node.priceRange = b.price_range;

  if (b.street || b.city) {
    node.address = {
      "@type": "PostalAddress",
      streetAddress: b.street || undefined,
      addressLocality: b.city || undefined,
      addressRegion: b.region || undefined,
      postalCode: b.postal_code || undefined,
      addressCountry: b.country || "ID",
    };
  }

  if (b.latitude !== null && b.longitude !== null) {
    node.geo = { "@type": "GeoCoordinates", latitude: b.latitude, longitude: b.longitude };
  }

  if (b.opening_hours.length > 0) {
    node.openingHoursSpecification = b.opening_hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days.map((d) => DAY_MAP[d] ?? d),
      opens: h.opens,
      closes: h.closes,
    }));
  }

  const social = Object.values(b.social).filter(Boolean);
  if (social.length > 0) node.sameAs = social;

  return node;
}

function websiteNode(site: Site): Json {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: site.name,
    inLanguage: site.locale,
    publisher: { "@id": `${SITE_URL}/#business` },
  };
}

function breadcrumbNode(site: Site, pageSlug: string, pageTitle: string): Json | null {
  if (pageSlug === "home") return null;
  return {
    "@type": "BreadcrumbList",
    "@id": `${SITE_URL}/${pageSlug}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: pageTitle, item: `${SITE_URL}/${pageSlug}` },
    ],
  };
}

/** Map tiap tipe blok ke node Schema.org yang relevan. */
function blockNodes(block: ParsedBlock, site: Site): Json[] {
  switch (block.type) {
    case "faq": {
      if (block.data.items.length === 0) return [];
      return [
        {
          "@type": "FAQPage",
          "@id": `${SITE_URL}/#faq`,
          mainEntity: block.data.items.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        },
      ];
    }

    case "products": {
      if (block.data.items.length === 0) return [];
      return [
        {
          "@type": "ItemList",
          "@id": `${SITE_URL}/#products`,
          name: block.data.title || "Produk",
          itemListElement: block.data.items.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Product",
              name: p.name,
              description: toMetaDescription(p.description, 300) || undefined,
              sku: p.sku || undefined,
              image: p.image?.url ? absoluteUrl(p.image.url, SITE_URL) : undefined,
              brand: { "@type": "Brand", name: site.name },
              // Produk dengan beberapa ukuran menghasilkan satu Offer per
              // ukuran, bukan satu harga tunggal — supaya rentang harga di
              // hasil pencarian sesuai kenyataan.
              ...(p.variants.length > 0
                ? {
                    offers: p.variants.map((v) => ({
                      "@type": "Offer",
                      name: v.label,
                      sku: v.sku || undefined,
                      price: v.price,
                      priceCurrency: p.currency,
                      availability: `https://schema.org/${p.availability}`,
                      url: SITE_URL,
                    })),
                  }
                : p.price !== undefined
                  ? {
                      offers: {
                        "@type": "Offer",
                        price: p.price,
                        priceCurrency: p.currency,
                        availability: `https://schema.org/${p.availability}`,
                        url: SITE_URL,
                      },
                    }
                  : {}),
            },
          })),
        },
      ];
    }

    case "services": {
      if (block.data.items.length === 0) return [];
      return [
        {
          "@type": "OfferCatalog",
          "@id": `${SITE_URL}/#services`,
          name: block.data.title || "Layanan",
          itemListElement: block.data.items.map((s, i) => ({
            "@type": "Offer",
            position: i + 1,
            itemOffered: {
              "@type": "Service",
              name: s.title,
              description: toMetaDescription(s.description, 300) || undefined,
              provider: { "@id": `${SITE_URL}/#business` },
            },
          })),
        },
      ];
    }

    case "menu": {
      if (block.data.categories.length === 0) return [];
      return [
        {
          "@type": "Menu",
          "@id": `${SITE_URL}/#menu`,
          name: block.data.title || "Menu",
          hasMenuSection: block.data.categories.map((c) => ({
            "@type": "MenuSection",
            name: c.name,
            hasMenuItem: c.items.map((item) => ({
              "@type": "MenuItem",
              name: item.name,
              description: item.description || undefined,
              ...(item.price !== undefined
                ? { offers: { "@type": "Offer", price: item.price, priceCurrency: item.currency } }
                : {}),
            })),
          })),
        },
      ];
    }

    case "rooms": {
      if (block.data.items.length === 0) return [];
      return block.data.items.map((room) => ({
        "@type": "HotelRoom",
        name: room.name,
        description: toMetaDescription(room.description, 300) || undefined,
        bed: room.bed_type || undefined,
        occupancy: room.max_occupancy
          ? { "@type": "QuantitativeValue", maxValue: room.max_occupancy }
          : undefined,
        floorSize: room.size_sqm
          ? { "@type": "QuantitativeValue", value: room.size_sqm, unitCode: "MTK" }
          : undefined,
        amenityFeature: room.amenities.map((a) => ({
          "@type": "LocationFeatureSpecification",
          name: a,
          value: true,
        })),
        image: room.images.map((img) => absoluteUrl(img.url, SITE_URL)).filter(Boolean),
        ...(room.price_from !== undefined
          ? {
              offers: {
                "@type": "Offer",
                price: room.price_from,
                priceCurrency: room.currency,
                url: room.booking_url || SITE_URL,
              },
            }
          : {}),
      }));
    }

    case "testimonials": {
      const rated = block.data.items.filter((t) => typeof t.rating === "number");
      if (rated.length === 0) return [];
      return rated.map((t) => ({
        "@type": "Review",
        itemReviewed: { "@id": `${SITE_URL}/#business` },
        author: { "@type": "Person", name: t.author },
        reviewBody: t.quote,
        reviewRating: { "@type": "Rating", ratingValue: t.rating, bestRating: 5, worstRating: 1 },
      }));
    }

    case "gallery": {
      const images = block.data.images.filter((i) => i.url);
      if (images.length === 0) return [];
      return [
        {
          "@type": "ImageGallery",
          "@id": `${SITE_URL}/#gallery`,
          name: block.data.title || "Galeri",
          image: images.map((i) => absoluteUrl(i.url, SITE_URL)),
        },
      ];
    }

    default:
      return [];
  }
}

/** Bangun satu graph JSON-LD untuk seluruh halaman. */
export function buildJsonLd({
  site,
  blocks,
  pageSlug,
  pageTitle,
}: {
  site: Site;
  blocks: ParsedBlock[];
  pageSlug: string;
  pageTitle: string;
}): string {
  const graph: Json[] = [organizationNode(site), websiteNode(site)];

  const crumb = breadcrumbNode(site, pageSlug, pageTitle);
  if (crumb) graph.push(crumb);

  for (const block of blocks) graph.push(...blockNodes(block, site));

  const payload = { "@context": "https://schema.org", "@graph": graph };

  // `<` di-escape agar tidak bisa memutus tag <script> lewat konten klien.
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}
