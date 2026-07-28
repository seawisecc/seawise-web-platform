import type { BlockDataMap } from "@/lib/blocks/schemas";
import { Section } from "@/components/ui/Section";
import { SafeImage } from "@/components/ui/SafeImage";

/**
 * Dua tata letak, dipilih otomatis dari kelengkapan data:
 *
 *  - Ada gambar   → dua kolom, gambar mengimbangi teks.
 *  - Tanpa gambar → tata letak pernyataan: judul besar di kiri, uraian di
 *    kanan. Tanpa ini, blok tanpa gambar jatuh jadi satu balok teks panjang
 *    yang membuat halaman terasa seperti template mentah.
 */
export function About({ data }: { data: BlockDataMap["about"] }) {
  const hasImage = Boolean(data.image?.url);

  const stats =
    data.stats.length > 0 ? (
      <dl className="reveal-group mt-14 grid grid-cols-2 gap-8 border-t border-hairline pt-10 sm:grid-cols-3">
        {data.stats.map((s) => (
          <div key={s.label}>
            <dt className="sr-only">{s.label}</dt>
            <dd className="font-heading text-3xl leading-none md:text-4xl">{s.value}</dd>
            <p className="mt-2 text-sm opacity-60">{s.label}</p>
          </div>
        ))}
      </dl>
    ) : null;

  if (hasImage) {
    return (
      <Section id="tentang" tone="muted">
        <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
          <div className="reveal">
            {data.title ? <h2 className="heading-section">{data.title}</h2> : null}
            {data.body ? (
              <p className="prose-body mt-6 whitespace-pre-line">{data.body}</p>
            ) : null}
          </div>

          <div className="media-frame reveal relative aspect-4/3">
            <SafeImage
              url={data.image!.url}
              alt={data.image!.alt}
              fill
              className="media-zoom"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
        {stats}
      </Section>
    );
  }

  return (
    <Section id="tentang" tone="muted">
      <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
        {data.title ? <h2 className="statement reveal">{data.title}</h2> : <div />}
        {data.body ? (
          <p className="prose-body reveal whitespace-pre-line text-lg">{data.body}</p>
        ) : null}
      </div>
      {stats}
    </Section>
  );
}
