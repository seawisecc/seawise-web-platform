"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Tombol WhatsApp di header.
 *
 * Labelnya ikut bahasa halaman. Tombol ini yang paling sering ditekan di
 * seluruh situs, jadi membiarkannya berbahasa Indonesia di halaman Inggris
 * merusak kesan justru pada elemen yang paling diperhatikan.
 */
export function ContactButton({ href, enPrefix }: { href: string; enPrefix?: string }) {
  const pathname = usePathname();

  const isEnglish = Boolean(
    enPrefix && (pathname === enPrefix || pathname.startsWith(`${enPrefix}/`)),
  );

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-primary h-10 px-4 text-sm"
    >
      {isEnglish ? "Contact" : "Hubungi"}
    </Link>
  );
}
