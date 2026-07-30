"use client";

import { useRef, useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";

type Image = { url?: string; alt?: string };

/**
 * Galeri foto produk.
 *
 * Dibangun di atas scroll-snap, bukan transform yang dikendalikan state.
 * Konsekuensinya: seluruh foto ada di HTML sejak awal sehingga terbaca
 * Google, bisa digeser dengan jari tanpa JavaScript, dan tombol panah
 * hanyalah pelengkap — bukan syarat agar galeri berfungsi.
 */
export function ProductMedia({
  images,
  name,
  priority = false,
}: {
  images: Image[];
  name: string;
  priority?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const slides = images.filter((i) => i.url);

  if (slides.length === 0) {
    return (
      <div className="relative aspect-4/5">
        <SafeImage url="" alt={name} fill />
      </div>
    );
  }

  if (slides.length === 1) {
    return (
      <div className="relative aspect-4/5">
        <SafeImage
          url={slides[0].url!}
          alt={slides[0].alt || name}
          fill
          priority={priority}
          className="media-zoom"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
    );
  }

  function goTo(next: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(next, slides.length - 1));
    track.scrollTo({ left: track.clientWidth * clamped, behavior: "smooth" });
    setIndex(clamped);
  }

  return (
    <div className="group/media relative aspect-4/5 overflow-hidden">
      <div
        ref={trackRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((img, i) => (
          <div key={`${img.url}-${i}`} className="relative h-full w-full shrink-0 snap-center">
            <SafeImage
              url={img.url!}
              alt={img.alt || `${name}, foto ${i + 1}`}
              fill
              priority={priority && i === 0}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Foto sebelumnya"
        onClick={() => goTo(index - 1)}
        disabled={index === 0}
        className="media-nav left-3"
      >
        ‹
      </button>

      <button
        type="button"
        aria-label="Foto berikutnya"
        onClick={() => goTo(index + 1)}
        disabled={index === slides.length - 1}
        className="media-nav right-3"
      >
        ›
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
        <span className="media-dots">
          {slides.map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/60"
              }`}
            />
          ))}
        </span>
      </div>

      <span className="sr-only" aria-live="polite">
        Foto {index + 1} dari {slides.length}
      </span>
    </div>
  );
}
