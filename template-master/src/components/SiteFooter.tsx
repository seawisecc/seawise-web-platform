import Link from "next/link";
import type { Site } from "@/lib/site";

export function SiteFooter({ site }: { site: Site }) {
  const b = site.business;
  const socials = Object.entries(b.social).filter(([, url]) => Boolean(url));
  const address = [b.street, b.city, b.region, b.postal_code].filter(Boolean).join(", ");

  return (
    <footer className="border-t border-hairline">
      <div className="container-page flex flex-col gap-8 py-12 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <p className="font-heading text-lg">{b.legal_name || site.name}</p>
          {address ? <p className="prose-body mt-2 text-sm">{address}</p> : null}
          {b.email ? (
            <a href={`mailto:${b.email}`} className="mt-2 inline-block text-sm underline underline-offset-4">
              {b.email}
            </a>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 text-sm md:items-end">
          {socials.length > 0 ? (
            <ul className="flex gap-4">
              {socials.map(([name, url]) => (
                <li key={name}>
                  <Link
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="capitalize opacity-75 transition-opacity hover:opacity-100"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          <p className="opacity-60">
            © {new Date().getFullYear()} {b.legal_name || site.name}. Seluruh hak cipta dilindungi.
          </p>
          <p className="text-xs opacity-45">
            Dibuat oleh{" "}
            <Link href="https://seawise.cc" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              Seawise Studio
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
