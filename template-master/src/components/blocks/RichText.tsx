import type { BlockDataMap } from "@/lib/blocks/schemas";
import { Section, SectionHeading } from "@/components/ui/Section";

export function RichText({ data }: { data: BlockDataMap["richtext"] }) {
  if (!data.body && !data.title) return null;

  return (
    <Section>
      <div className="mx-auto max-w-3xl">
        <SectionHeading title={data.title} />
        <div className="reveal prose-body whitespace-pre-line">{data.body}</div>
      </div>
    </Section>
  );
}
