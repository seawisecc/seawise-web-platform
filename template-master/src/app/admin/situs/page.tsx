import { getSite } from "@/lib/site";
import { CONTACT_FIELDS, SEO_FIELDS } from "@/lib/blocks/site-fields";
import { AdminShell } from "../AdminShell";
import { SiteSettingsForm } from "./SiteSettingsForm";

export const dynamic = "force-dynamic";

export default async function SiteSettingsPage() {
  const site = await getSite();

  if (!site) {
    return (
      <AdminShell title="Pengaturan situs">
        <p className="text-sm text-stone-600">Data situs tidak ditemukan.</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Pengaturan situs"
      description="Kontak, alamat, dan tampilan situs di Google maupun saat tautannya dibagikan."
    >
      <SiteSettingsForm
        name={site.name}
        business={site.business as unknown as Record<string, unknown>}
        seo={site.seo as unknown as Record<string, unknown>}
        contactFields={CONTACT_FIELDS}
        seoFields={SEO_FIELDS}
      />
    </AdminShell>
  );
}
