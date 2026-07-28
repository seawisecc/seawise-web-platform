import Link from "next/link";
import type { BlockDataMap } from "@/lib/blocks/schemas";
import { Section, SectionHeading } from "@/components/ui/Section";
import { SafeImage } from "@/components/ui/SafeImage";

import { formatCurrency } from "@/lib/utils";

/** Vertical: lodging (hotel/villa). Terhubung ke JSON-LD tipe HotelRoom. */
export function Rooms({ data }: { data: BlockDataMap["rooms"] }) {
  if (data.items.length === 0) return null;

  return (
    <Section id="kamar">
      <SectionHeading title={data.title} />

      <ul className="space-y-10">
        {data.items.map((room) => (
          <li key={room.name} className="reveal grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div className="media-frame relative aspect-16/10">
              <SafeImage
                url={room.images[0]?.url ?? ""}
                alt={room.images[0]?.alt || room.name}
                fill
                className="media-zoom"
                sizes="(max-width: 768px) 100vw, 55vw"
              />
            </div>

            <div>
              <h3 className="text-2xl">{room.name}</h3>
              {room.description ? <p className="prose-body mt-2">{room.description}</p> : null}

              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm opacity-75">
                {room.max_occupancy ? <li>{room.max_occupancy} tamu</li> : null}
                {room.bed_type ? <li>{room.bed_type}</li> : null}
                {room.size_sqm ? <li>{room.size_sqm} m²</li> : null}
              </ul>

              {room.amenities.length > 0 ? (
                <p className="mt-3 text-sm opacity-70">{room.amenities.join(" · ")}</p>
              ) : null}

              <div className="mt-6 flex items-center gap-4">
                {room.price_from !== undefined ? (
                  <p className="font-heading text-lg">
                    Mulai {formatCurrency(room.price_from)}
                    <span className="text-sm opacity-60"> /malam</span>
                  </p>
                ) : null}
                {room.booking_url ? (
                  <Link href={room.booking_url} className="btn btn-primary">
                    Pesan
                  </Link>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
