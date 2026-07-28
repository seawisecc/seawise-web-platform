import type { BlockDataMap } from "@/lib/blocks/schemas";
import { Section, SectionHeading } from "@/components/ui/Section";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";

export function Gallery({
  data,
  lang = "id",
}: {
  data: BlockDataMap["gallery"];
  lang?: string;
}) {
  const images = data.images.filter((i) => i.url);
  if (images.length === 0) return null;

  return (
    <Section id="galeri" tone="muted">
      <SectionHeading
        title={lang === "en" && data.title_en.trim() ? data.title_en : data.title}
      />

      <div
        className={cn(
          "reveal-group",
        data.layout === "masonry"
            ? "columns-2 gap-4 md:columns-3 [&>*]:mb-4"
            : "grid grid-cols-2 gap-4 md:grid-cols-3",
        )}
      >
        {images.map((img, i) => (
          <figure
            key={`${img.url}-${i}`}
            className="media-frame break-inside-avoid"
          >
            <SafeImage
              url={img.url}
              alt={img.alt}
              width={img.width ?? 800}
              height={img.height ?? 600}
              sizes="(max-width: 768px) 50vw, 33vw"
              className="h-auto w-full object-cover"
            />
          </figure>
        ))}
      </div>
    </Section>
  );
}
