import type { BlockDataMap } from "@/lib/blocks/schemas";
import { Section, SectionHeading } from "@/components/ui/Section";
import { cn } from "@/lib/utils";

export function Services({ data }: { data: BlockDataMap["services"] }) {
  if (data.items.length === 0) return null;

  return (
    <Section id="layanan">
      <SectionHeading title={data.title} subtitle={data.subtitle} align="center" />

      <ul
        className={cn(
          "reveal-group grid gap-6",
          data.layout === "grid" ? "sm:grid-cols-2 lg:grid-cols-4" : "max-w-3xl mx-auto",
        )}
      >
        {data.items.map((item) => (
          <li key={item.title} className="card flex flex-col p-7">
            <h3 className="text-lg">{item.title}</h3>
            {item.description ? (
              <p className="prose-body mt-3 text-sm">{item.description}</p>
            ) : null}
            {item.price ? (
              <p className="mt-auto pt-6 font-heading text-lg text-brand">{item.price}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}
