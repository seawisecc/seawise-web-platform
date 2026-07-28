import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
};

/**
 * Pembungkus next/image yang tahan terhadap data klien yang belum lengkap.
 * Kalau URL kosong (klien belum upload foto), tampilkan placeholder netral
 * alih-alih membuat halaman error.
 */
export function SafeImage({
  url, alt, width, height, className, fill, sizes, priority,
}: Props) {
  if (!url) {
    return (
      <div
        aria-hidden="true"
        className={cn("bg-muted", className)}
        style={{ aspectRatio: width && height ? `${width}/${height}` : "4/3" }}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={url}
        alt={alt}
        fill
        sizes={sizes ?? "(max-width: 768px) 100vw, 50vw"}
        priority={priority}
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <Image
      src={url}
      alt={alt}
      width={width ?? 1200}
      height={height ?? 900}
      sizes={sizes ?? "(max-width: 768px) 100vw, 50vw"}
      priority={priority}
      className={className}
    />
  );
}
