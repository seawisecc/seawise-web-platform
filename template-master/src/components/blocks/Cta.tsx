import Link from "next/link";
import type { BlockDataMap } from "@/lib/blocks/schemas";

export function Cta({ data }: { data: BlockDataMap["cta"] }) {
  if (!data.headline) return null;

  return (
    <section className="section">
      <div className="container-page">
        <div className="reveal rounded-[var(--brand-radius)] bg-brand px-8 py-14 text-center text-brand-contrast">
          <h2 className="text-3xl md:text-4xl">{data.headline}</h2>
          {data.body ? <p className="mx-auto mt-4 max-w-xl opacity-90">{data.body}</p> : null}
          {data.cta?.label ? (
            <Link
              href={data.cta.href}
              className="btn mt-8 bg-surface text-ink hover:opacity-90"
            >
              {data.cta.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
