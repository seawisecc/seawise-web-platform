import type { BlockDataMap } from "@/lib/blocks/schemas";
import { Section, SectionHeading } from "@/components/ui/Section";

export function Testimonials({ data }: { data: BlockDataMap["testimonials"] }) {
  if (data.items.length === 0) return null;

  return (
    <Section id="testimoni" tone="contrast">
      <SectionHeading title={data.title} align="center" />

      <ul className="reveal-group grid gap-6 md:grid-cols-3">
        {data.items.map((t, i) => (
          <li key={`${t.author}-${i}`} className="rounded-[var(--brand-radius)] border border-current/15 p-7">
            <blockquote className="prose-body text-lg italic">&ldquo;{t.quote}&rdquo;</blockquote>
            <footer className="mt-4 text-sm">
              <span className="font-semibold">{t.author}</span>
              {t.role ? <span className="opacity-60">, {t.role}</span> : null}
            </footer>
          </li>
        ))}
      </ul>
    </Section>
  );
}
