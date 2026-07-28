import type { BlockDataMap } from "@/lib/blocks/schemas";
import { Section, SectionHeading } from "@/components/ui/Section";
import { ProductMedia } from "./ProductMedia";

import { formatCurrency } from "@/lib/utils";

/** Pilih teks sesuai bahasa halaman, jatuh ke bahasa utama bila kosong. */
const t = (base: string, en: string, lang: string) =>
  lang === "en" && en.trim() ? en : base;

export function Products({
  data,
  lang = "id",
}: {
  data: BlockDataMap["products"];
  lang?: string;
}) {
  if (data.items.length === 0) return null;

  return (
    <Section id="produk">
      <SectionHeading
        title={t(data.title, data.title_en, lang)}
        subtitle={t(data.subtitle, data.subtitle_en, lang)}
      />

      <ul className="reveal-group grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {data.items.map((p) => (
          <li key={p.sku ?? p.name} className="card flex flex-col overflow-hidden">
            <ProductMedia
              images={p.images.length > 0 ? p.images : p.image?.url ? [p.image] : []}
              name={t(p.name, p.name_en, lang)}
            />

            <div className="flex flex-1 flex-col p-6">
              <h3 className="font-heading text-2xl">{t(p.name, p.name_en, lang)}</h3>

              {t(p.description, p.description_en, lang) ? (
                <p className="prose-body mt-2 text-sm">
                  {t(p.description, p.description_en, lang)}
                </p>
              ) : null}

              {/* Daftar rincian generik — untuk parfum berisi notes, untuk
                  vertical lain bisa kandungan, ukuran, atau bahan. */}
              {p.details.length > 0 ? (
                <dl className="mt-4 space-y-1.5 text-sm">
                  {p.details.map((d) => (
                    <div key={`${d.label}-${d.value}`} className="flex gap-2">
                      <dt className="shrink-0 opacity-55">{t(d.label, d.label_en, lang)}</dt>
                      <dd className="opacity-85">{d.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              <div className="mt-auto pt-6">
                {p.variants.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {p.variants.map((v) => (
                      <li
                        key={v.label}
                        className="rounded-[var(--brand-radius)] border border-hairline px-3 py-1.5 text-sm"
                      >
                        <span className="opacity-60">{v.label}</span>{" "}
                        <span className="font-medium">{formatCurrency(v.price, p.currency)}</span>
                      </li>
                    ))}
                  </ul>
                ) : p.price !== undefined ? (
                  <span className="font-heading text-lg">
                    {formatCurrency(p.price, p.currency)}
                  </span>
                ) : null}

                {p.availability === "OutOfStock" ? (
                  <p className="mt-3 text-xs opacity-60">Stok habis</p>
                ) : null}

                {/* Nilai tambah vertical kosmetik: nomor izin edar tampil eksplisit. */}
                {p.bpom_number ? (
                  <p className="mt-3 text-xs opacity-60">BPOM {p.bpom_number}</p>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
