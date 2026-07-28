import { createAuthedClient } from "@/lib/supabase/server";
import { SITE_ID } from "@/lib/env";
import { AdminShell } from "../AdminShell";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Makassar",
});

export default async function LeadsPage() {
  const supabase = await createAuthedClient();

  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, email, phone, message, created_at, handled")
    .eq("site_id", SITE_ID)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AdminShell
      title="Pesan masuk"
      description="Kiriman formulir kontak dari situs, terbaru di atas."
    >
      {!leads?.length ? (
        <div className="rounded-[var(--brand-radius)] border border-dashed border-hairline p-10 text-center">
          <p className="text-sm font-medium">Belum ada pesan masuk</p>
          <p className="mt-1 text-sm text-stone-500">
            Pesan dari formulir kontak akan muncul di sini.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {leads.map((lead) => (
            <li key={lead.id} className="card p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{lead.name}</p>
                <time className="text-xs text-stone-500" dateTime={lead.created_at}>
                  {dateFmt.format(new Date(lead.created_at))}
                </time>
              </div>

              <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-stone-600">
                {lead.email ? <a href={`mailto:${lead.email}`} className="underline underline-offset-2">{lead.email}</a> : null}
                {lead.phone ? <a href={`tel:${lead.phone}`} className="underline underline-offset-2">{lead.phone}</a> : null}
              </p>

              {lead.message ? (
                <p className="mt-3 whitespace-pre-line border-l-2 border-hairline pl-3 text-sm text-stone-700">
                  {lead.message}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
