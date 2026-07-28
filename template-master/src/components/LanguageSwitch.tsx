"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLanguage } from "@/lib/nav";

/**
 * Pemilih bahasa berbentuk sakelar tersegmen.
 *
 * Dua tautan teks berdampingan ("Indonesia English") mudah disangka menu
 * biasa dan tidak menunjukkan bahasa mana yang sedang aktif. Bentuk
 * tersegmen menyelesaikan keduanya: pilihan aktif terlihat, dan bentuknya
 * langsung dikenali sebagai pilihan yang saling meniadakan.
 *
 * Kode dua huruf dipakai di layar, nama lengkap tetap ada untuk pembaca
 * layar — "ID" saja tidak berarti apa-apa bila dibacakan.
 */
export function LanguageSwitch({ languages }: { languages: NavLanguage[] }) {
  const pathname = usePathname();

  if (languages.length < 2) return null;

  // Cocokkan dari yang terpanjang supaya "/en" tidak kalah oleh "/".
  const active =
    [...languages]
      .sort((a, b) => b.href.length - a.href.length)
      .find((l) => pathname === l.href || pathname.startsWith(`${l.href}/`)) ??
    languages[0];

  return (
    <div className="lang-switch" role="group" aria-label="Pilih bahasa">
      {languages.map((l) => {
        const isActive = l.href === active.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            hrefLang={l.code.toLowerCase()}
            aria-current={isActive ? "true" : undefined}
            className={`lang-option ${isActive ? "is-active" : ""}`}
          >
            <span aria-hidden="true">{l.code}</span>
            <span className="sr-only">{l.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
