import Link from "next/link";
import { createAuthedClient } from "@/lib/supabase/server";
import { SITE_ID } from "@/lib/env";
import { getSite } from "@/lib/site";
import { BLOCK_META, isBlockType } from "@/lib/blocks/schemas";
import { isSharedBlockType, PRIMARY_PAGE } from "@/lib/site";
import { togglePublish, moveBlock } from "./actions";
import { AdminShell } from "./AdminShell";

export const dynamic = "force-dynamic";

const PAGE_LABEL: Record<string, string> = { home: "Beranda" };

export default async function AdminPage() {
  const supabase = await createAuthedClient();
  const site = await getSite();

  const [{ data: blocks }, { data: pages }, { count: leadCount }] = await Promise.all([
    supabase
      .from("content_blocks")
      .select("id, type, page_slug, position, published")
      .eq("site_id", SITE_ID)
      .order("page_slug", { ascending: true })
      .order("position", { ascending: true }),
    supabase.from("pages").select("slug, title").eq("site_id", SITE_ID),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("site_id", SITE_ID)
      .eq("handled", false),
  ]);

  const canReorder = site?.features.reorder ?? false;
  const pageTitles = new Map((pages ?? []).map((p) => [p.slug, p.title]));

  // Blok pembawa foto dan harga hanya ada satu, dikelola dari halaman utama.
  // Menampilkannya lagi di halaman terjemahan hanya membingungkan: klien
  // melihat dua entri untuk satu hal yang sama.
  const visible = (blocks ?? []).filter(
    (b) => !(isSharedBlockType(b.type) && b.page_slug !== PRIMARY_PAGE),
  );

  const grouped = new Map<string, typeof visible>();
  for (const b of visible) {
    const list = grouped.get(b.page_slug) ?? [];
    list.push(b);
    grouped.set(b.page_slug, list);
  }

  const total = visible.length;
  const live = visible.filter((b) => b.published).length;

  return (
    <AdminShell
      title="Konten situs"
      description={`${total} bagian, ${live} sedang tayang. Perubahan langsung terlihat di situs setelah disimpan.`}
    >
      {leadCount ? (
        <Link
          href="/admin/leads"
          className="mb-8 flex items-center justify-between gap-4 rounded-[var(--brand-radius)] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 hover:bg-blue-100"
        >
          <span>
            <strong>{leadCount}</strong> pesan masuk belum ditangani
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      ) : null}

      <div className="space-y-10">
        {[...grouped.entries()].map(([pageSlug, items]) => (
          <section key={pageSlug}>
            <div className="mb-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-semibold text-stone-900">
                  {pageTitles.get(pageSlug) ?? PAGE_LABEL[pageSlug] ?? pageSlug}
                </h2>
                <span className="text-xs text-stone-500">
                  {pageSlug === PRIMARY_PAGE ? "/" : `/${pageSlug}`}
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                {pageSlug === PRIMARY_PAGE
                  ? "Termasuk produk dan galeri. Foto serta harga di sini dipakai semua bahasa."
                  : "Hanya bagian yang isinya berbeda per bahasa. Produk dan galeri diambil dari Beranda."}
              </p>
            </div>

            <ul className="divide-y divide-hairline overflow-hidden rounded-[var(--brand-radius)] border border-hairline bg-white">
              {items.map((b, i) => {
                const meta = isBlockType(b.type) ? BLOCK_META[b.type] : null;

                return (
                  <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-medium">{meta?.label ?? b.type}</span>
                        <span className={`admin-badge ${b.published ? "admin-badge-live" : "admin-badge-draft"}`}>
                          {b.published ? "Tayang" : "Draf"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-500">
                        {meta?.description ?? "Tipe khusus"}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {canReorder ? (
                        <>
                          <form action={moveBlock}>
                            <input type="hidden" name="id" value={b.id} />
                            <input type="hidden" name="direction" value="up" />
                            <input type="hidden" name="page_slug" value={pageSlug} />
                            <button className="admin-icon-btn" disabled={i === 0} aria-label="Naikkan urutan">↑</button>
                          </form>
                          <form action={moveBlock}>
                            <input type="hidden" name="id" value={b.id} />
                            <input type="hidden" name="direction" value="down" />
                            <input type="hidden" name="page_slug" value={pageSlug} />
                            <button className="admin-icon-btn" disabled={i === items.length - 1} aria-label="Turunkan urutan">↓</button>
                          </form>
                        </>
                      ) : null}

                      <form action={togglePublish}>
                        <input type="hidden" name="id" value={b.id} />
                        <input type="hidden" name="published" value={String(!b.published)} />
                        <button className="btn btn-outline h-8 px-3 text-[13px]">
                          {b.published ? "Sembunyikan" : "Tayangkan"}
                        </button>
                      </form>

                      <Link href={`/admin/blocks/${b.id}`} className="btn btn-primary h-8 px-3.5 text-[13px]">
                        Ubah
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {!blocks?.length ? (
        <p className="text-sm text-stone-600">
          Belum ada bagian. Hubungi Seawise untuk menambahkannya.
        </p>
      ) : null}

      {!canReorder ? (
        <p className="mt-8 text-xs text-stone-500">
          Pengaturan urutan bagian tersedia mulai paket Current.
        </p>
      ) : null}
    </AdminShell>
  );
}
