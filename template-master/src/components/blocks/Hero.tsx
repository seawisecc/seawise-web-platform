import Link from "next/link";
import type { BlockDataMap } from "@/lib/blocks/schemas";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";

/**
 * Hero memakai animasi berbasis waktu dengan jeda bertingkat, bukan reveal
 * saat masuk layar — bagian ini sudah terlihat sejak halaman dibuka, jadi
 * yang dibutuhkan satu momen masuk yang tertata, bukan pemicu scroll.
 */
export function Hero({ data }: { data: BlockDataMap["hero"] }) {
  const hasImage = Boolean(data.image?.url);
  const centered = data.alignment === "center" || !hasImage;

  return (
    <section className="relative overflow-hidden">
      <div
        className={cn(
          "container-page grid items-center gap-12 py-24 md:gap-16 md:py-32 lg:py-36",
          hasImage && !centered && "md:grid-cols-[1.05fr_0.95fr]",
        )}
      >
        <div className={cn(centered && "mx-auto max-w-3xl text-center")}>
          {data.eyebrow ? <p className="eyebrow enter mb-5">{data.eyebrow}</p> : null}

          {/* Hero adalah satu-satunya tempat <h1> muncul di halaman. */}
          <h1 className="display enter enter-delay-1">{data.headline}</h1>

          {data.subheadline ? (
            <p
              className={cn(
                "prose-body enter enter-delay-2 mt-7 text-lg md:text-xl",
                centered && "mx-auto",
              )}
            >
              {data.subheadline}
            </p>
          ) : null}

          {data.primary_cta?.label || data.secondary_cta?.label ? (
            <div
              className={cn(
                "enter enter-delay-3 mt-10 flex flex-wrap gap-3",
                centered && "justify-center",
              )}
            >
              {data.primary_cta?.label ? (
                <Link href={data.primary_cta.href} className="btn btn-primary">
                  {data.primary_cta.label}
                </Link>
              ) : null}
              {data.secondary_cta?.label ? (
                <Link href={data.secondary_cta.href} className="btn btn-outline">
                  {data.secondary_cta.label}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        {hasImage && !centered ? (
          <div className="media-frame enter enter-delay-2 relative aspect-4/5 md:aspect-4/5">
            <SafeImage
              url={data.image!.url}
              alt={data.image!.alt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 48vw"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
