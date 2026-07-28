import type { ParsedBlock } from "@/lib/blocks/schemas";
import type { PageMeta } from "@/lib/site";

/**
 * Peta blok → tautan navigasi.
 *
 * Menu header diturunkan dari isi halaman, bukan diketik ulang klien.
 * Konsekuensinya menu tidak pernah menunjuk ke bagian yang sudah dihapus,
 * dan bagian baru langsung muncul di menu tanpa ada yang perlu diatur.
 *
 * `anchor` wajib sama dengan `id` pada <Section> di komponen bloknya.
 */
const SECTION_NAV: Record<string, { anchor: string; id: string; en: string }> = {
  about:        { anchor: "tentang",   id: "Tentang",   en: "About" },
  services:     { anchor: "layanan",   id: "Layanan",   en: "Services" },
  products:     { anchor: "produk",    id: "Produk",    en: "Products" },
  menu:         { anchor: "menu",      id: "Menu",      en: "Menu" },
  rooms:        { anchor: "kamar",     id: "Kamar",     en: "Rooms" },
  gallery:      { anchor: "galeri",    id: "Galeri",    en: "Gallery" },
  testimonials: { anchor: "testimoni", id: "Testimoni", en: "Reviews" },
  faq:          { anchor: "faq",       id: "FAQ",       en: "FAQ" },
  contact:      { anchor: "kontak",    id: "Kontak",    en: "Contact" },
};

export type NavSection = {
  anchor: string;
  /** Label per bahasa; header memilih sesuai halaman yang sedang dibuka. */
  labels: { id: string; en: string };
};

export type NavLanguage = {
  /** Kode dua huruf untuk tombol, mis. "ID" atau "EN". */
  code: string;
  href: string;
  /** Nama lengkap, dipakai sebagai label aksesibilitas dan menu ponsel. */
  name: string;
};

/** Bagian halaman yang layak masuk menu, sesuai urutan tampilnya. */
export function sectionLinks(blocks: ParsedBlock[]): NavSection[] {
  const seen = new Set<string>();
  const out: NavSection[] = [];

  for (const b of blocks) {
    const entry = SECTION_NAV[b.type];
    // hero, cta, dan richtext sengaja tidak masuk menu: hero sudah menjadi
    // tujuan tombol logo, dua sisanya bukan tujuan navigasi.
    if (!entry || seen.has(entry.anchor)) continue;
    seen.add(entry.anchor);
    out.push({ anchor: entry.anchor, labels: { id: entry.id, en: entry.en } });
  }

  return out;
}

/**
 * Varian bahasa situs.
 *
 * Halaman utama selalu menjadi bahasa pertama. Halaman lain dianggap
 * terjemahan hanya bila menandai `seo.hreflang` — penanda yang sama yang
 * dipakai Google untuk mengetahui hubungan antar bahasa, jadi tidak ada
 * konfigurasi kedua yang bisa lupa disamakan.
 */
export function languageLinks(pages: PageMeta[], siteLocale: string): NavLanguage[] {
  const out: NavLanguage[] = [];
  const home = pages.find((p) => p.slug === "home");

  if (home) {
    out.push({
      code: (siteLocale.split("-")[0] || "id").toUpperCase(),
      href: "/",
      name: home.navLabel ?? home.title,
    });
  }

  for (const p of pages) {
    if (p.slug === "home" || !p.seo?.hreflang) continue;
    out.push({
      code: p.seo.hreflang.toUpperCase(),
      href: `/${p.slug}`,
      name: p.navLabel ?? p.title,
    });
  }

  // Satu bahasa berarti tidak ada yang perlu dipilih.
  return out.length > 1 ? out : [];
}

/** Halaman biasa di menu — mis. Blog. Varian bahasa tidak ikut. */
export function pageLinks(pages: PageMeta[]): { href: string; label: string }[] {
  return pages
    .filter((p) => p.showInNav && p.slug !== "home" && !p.seo?.hreflang)
    .map((p) => ({ href: `/${p.slug}`, label: p.navLabel ?? p.title }));
}
