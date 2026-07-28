import type { BlockDataMap } from "@/lib/blocks/schemas";
import { Section, SectionHeading } from "@/components/ui/Section";

export function Faq({ data }: { data: BlockDataMap["faq"] }) {
  if (data.items.length === 0) return null;

  return (
    <Section id="faq">
      <div className="mx-auto max-w-3xl">
        <SectionHeading title={data.title} />

        {/* <details> dipilih daripada state React: konten tetap ada di HTML
            awal, sehingga terbaca crawler tanpa JavaScript. */}
        <div className="reveal divide-y divide-hairline border-y border-hairline">
          {data.items.map((item, i) => (
            <details key={i} name="faq" className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {item.question}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-brand transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="prose-body mt-3 text-sm">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}
