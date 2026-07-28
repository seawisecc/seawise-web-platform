"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLanguage, NavSection } from "@/lib/nav";

type Props = {
  sections: NavSection[];
  pages: { href: string; label: string }[];
  languages: NavLanguage[];
};

/**
 * Menu perlu tahu halaman mana yang sedang dibuka karena dua hal: memilih
 * label berbahasa Indonesia atau Inggris, dan menempelkan tautan bagian ke
 * halaman yang benar — dari /en, "Products" harus menuju /en#produk, bukan
 * kembali ke halaman Indonesia.
 */
function useNavLinks({ sections, pages, languages }: Props) {
  const pathname = usePathname();

  const english = languages.find((l) => l.code.toLowerCase() === "en");
  const isEnglish = Boolean(
    english && (pathname === english.href || pathname.startsWith(`${english.href}/`)),
  );
  const base = isEnglish && english ? english.href : "/";

  const links = [
    ...sections.map((s) => ({
      href: base === "/" ? `/#${s.anchor}` : `${base}#${s.anchor}`,
      label: isEnglish ? s.labels.en : s.labels.id,
    })),
    ...pages,
  ];

  return { links, base };
}

/** Menu mendatar untuk layar lebar. */
export function MainNav(props: Props) {
  const { links } = useNavLinks(props);

  if (links.length === 0) return null;

  return (
    <nav aria-label="Navigasi utama" className="flex items-center gap-1">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="nav-link">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Menu ponsel.
 *
 * Memakai <details>/<summary> sehingga terbuka tanpa JavaScript sama
 * sekali, tetap bisa dioperasikan lewat keyboard, dan tidak menambah
 * state yang perlu disinkronkan saat hydration.
 */
export function MobileNav(props: Props) {
  const { links, base } = useNavLinks(props);
  const { languages } = props;

  if (links.length === 0 && languages.length < 2) return null;

  return (
    <details className="group relative">
      <summary
        aria-label="Buka menu"
        className="flex size-11 cursor-pointer list-none items-center justify-center rounded-[var(--brand-radius)] border border-hairline"
      >
        <span aria-hidden="true" className="relative block h-3 w-4">
          <span className="absolute inset-x-0 top-0 h-px bg-current transition-all duration-300 group-open:top-1.5 group-open:rotate-45" />
          <span className="absolute inset-x-0 top-1.5 h-px bg-current transition-opacity duration-200 group-open:opacity-0" />
          <span className="absolute inset-x-0 top-3 h-px bg-current transition-all duration-300 group-open:top-1.5 group-open:-rotate-45" />
        </span>
      </summary>

      <nav
        aria-label="Navigasi ponsel"
        className="absolute right-0 top-[calc(100%+0.6rem)] min-w-52 rounded-[var(--brand-radius)] border border-hairline bg-surface p-2 shadow-xl"
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="block rounded-[var(--brand-radius)] px-3 py-2.5 text-sm hover:bg-muted"
          >
            {l.label}
          </Link>
        ))}

        {languages.length > 1 ? (
          <div className="mt-2 border-t border-hairline pt-2">
            {languages.map((l) => {
              const active = l.href === base;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  hrefLang={l.code.toLowerCase()}
                  aria-current={active ? "true" : undefined}
                  className={`flex items-center justify-between rounded-[var(--brand-radius)] px-3 py-2.5 text-sm hover:bg-muted ${
                    active ? "font-medium" : "opacity-70"
                  }`}
                >
                  {l.name}
                  {active ? <span aria-hidden="true">✓</span> : null}
                </Link>
              );
            })}
          </div>
        ) : null}
      </nav>
    </details>
  );
}
