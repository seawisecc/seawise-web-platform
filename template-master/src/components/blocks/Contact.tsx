import Link from "next/link";
import type { BlockDataMap } from "@/lib/blocks/schemas";
import type { BusinessInfo } from "@/lib/site";
import { Section, SectionHeading } from "@/components/ui/Section";
import { ContactForm } from "@/components/blocks/ContactForm";
import { toWhatsAppNumber } from "@/lib/utils";

export function Contact({
  data,
  business,
}: {
  data: BlockDataMap["contact"];
  business: BusinessInfo;
}) {
  const wa = toWhatsAppNumber(business.whatsapp || business.phone);
  const waHref = wa
    ? `https://wa.me/${wa}${data.whatsapp_text ? `?text=${encodeURIComponent(data.whatsapp_text)}` : ""}`
    : null;

  const addressLine = [business.street, business.city, business.region, business.postal_code]
    .filter(Boolean)
    .join(", ");

  return (
    <Section id="kontak" tone="muted">
      <div className="reveal grid gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <SectionHeading title={data.title} subtitle={data.subtitle} />

          <dl className="space-y-4 text-sm">
            {business.phone ? (
              <div>
                <dt className="opacity-60">Telepon</dt>
                <dd>
                  <a href={`tel:${business.phone.replace(/\s/g, "")}`} className="underline underline-offset-4">
                    {business.phone}
                  </a>
                </dd>
              </div>
            ) : null}

            {business.email ? (
              <div>
                <dt className="opacity-60">Email</dt>
                <dd>
                  <a href={`mailto:${business.email}`} className="underline underline-offset-4">
                    {business.email}
                  </a>
                </dd>
              </div>
            ) : null}

            {addressLine ? (
              <div>
                <dt className="opacity-60">Alamat</dt>
                <dd>{addressLine}</dd>
              </div>
            ) : null}
          </dl>

          {waHref ? (
            <Link
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary mt-8"
            >
              Chat via WhatsApp
            </Link>
          ) : null}
        </div>

        {data.show_form ? <ContactForm /> : null}
      </div>
    </Section>
  );
}
