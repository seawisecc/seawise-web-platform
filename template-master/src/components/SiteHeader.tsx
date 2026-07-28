import Link from "next/link";
import type { Site } from "@/lib/site";
import type { NavLanguage, NavSection } from "@/lib/nav";
import { toWhatsAppNumber } from "@/lib/utils";
import { MainNav, MobileNav } from "@/components/MainNav";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { ContactButton } from "@/components/ContactButton";

/**
 * Header situs.
 *
 * Menu isinya bagian-bagian halaman (Tentang, Produk, FAQ, Kontak) yang
 * diturunkan dari blok yang benar-benar ada. Pemilih bahasa dipisah ke
 * sakelar tersendiri: bahasa bukan tujuan navigasi, jadi menaruhnya
 * sebaris dengan menu membuat keduanya sama-sama sulit dibaca.
 */
export function SiteHeader({
  site,
  sections,
  pages,
  languages,
}: {
  site: Site;
  sections: NavSection[];
  pages: { href: string; label: string }[];
  languages: NavLanguage[];
}) {
  const wa = toWhatsAppNumber(site.business.whatsapp || site.business.phone);

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-surface/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="font-heading text-lg tracking-tight">
          {site.name}
        </Link>

        {/* Menu diletakkan di tengah lewat margin otomatis, bukan
            justify-between, supaya posisinya tidak bergeser mengikuti
            panjang nama bisnis. */}
        <div className="mx-auto hidden md:block">
          <MainNav sections={sections} pages={pages} languages={languages} />
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {/* Di layar sempit sakelar bahasa mengalah pada tombol WhatsApp:
              memilih bahasa bisa menunggu, menghubungi penjual tidak.
              Pilihan bahasanya tetap tersedia di dalam menu ponsel. */}
          <div className="hidden sm:block">
            <LanguageSwitch languages={languages} />
          </div>

          {wa ? (
            <ContactButton
              href={`https://wa.me/${wa}`}
              enPrefix={languages.find((l) => l.code.toLowerCase() === "en")?.href}
            />
          ) : null}

          <div className="md:hidden">
            <MobileNav sections={sections} pages={pages} languages={languages} />
          </div>
        </div>
      </div>
    </header>
  );
}
