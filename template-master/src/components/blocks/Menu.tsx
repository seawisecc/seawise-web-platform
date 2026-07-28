import type { BlockDataMap } from "@/lib/blocks/schemas";
import { Section, SectionHeading } from "@/components/ui/Section";

import { formatCurrency } from "@/lib/utils";

/** Vertical: restaurant. Terhubung ke JSON-LD tipe Menu. */
export function Menu({ data }: { data: BlockDataMap["menu"] }) {
  if (data.categories.length === 0) return null;

  return (
    <Section id="menu" tone="muted">
      <SectionHeading title={data.title} />

      <div className="grid gap-12 md:grid-cols-2">
        {data.categories.map((cat) => (
          <div key={cat.name} className="reveal">
            <h3 className="eyebrow mb-5">{cat.name}</h3>
            <ul className="space-y-5">
              {cat.items.map((item) => (
                <li key={item.name} className="flex justify-between gap-6">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.description ? (
                      <p className="prose-body text-sm">{item.description}</p>
                    ) : null}
                    {item.tags.length > 0 ? (
                      <p className="mt-1 text-xs uppercase tracking-wide opacity-60">
                        {item.tags.join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  {item.price !== undefined ? (
                    <span className="shrink-0 font-heading">{formatCurrency(item.price)}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
