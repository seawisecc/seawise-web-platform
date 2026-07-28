import { notFound, redirect } from "next/navigation";
import { createAuthedClient } from "@/lib/supabase/server";
import { SITE_ID } from "@/lib/env";
import { BLOCK_META, isBlockType } from "@/lib/blocks/schemas";
import { isSharedBlockType, PRIMARY_PAGE } from "@/lib/site";
import { BLOCK_FIELDS } from "@/lib/blocks/fields";
import { BlockForm } from "./BlockForm";
import { AdminShell } from "../../AdminShell";
import { SharedNotice } from "./SharedNotice";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditBlockPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createAuthedClient();

  const { data: block } = await supabase
    .from("content_blocks")
    .select("id, type, data, page_slug")
    .eq("id", id)
    .eq("site_id", SITE_ID)
    .maybeSingle();

  if (!block) notFound();
  if (!isBlockType(block.type)) redirect("/admin");

  // Menyunting salinan di halaman terjemahan tidak berpengaruh apa-apa,
  // jadi arahkan ke blok aslinya di halaman utama.
  if (isSharedBlockType(block.type) && block.page_slug !== PRIMARY_PAGE) {
    const { data: origin } = await supabase
      .from("content_blocks")
      .select("id")
      .eq("site_id", SITE_ID)
      .eq("page_slug", PRIMARY_PAGE)
      .eq("type", block.type)
      .maybeSingle();

    if (origin) redirect(`/admin/blocks/${origin.id}`);
  }

  const meta = BLOCK_META[block.type];

  // Blok bertipe sama di halaman lain adalah versi terjemahannya. Hanya
  // produk dan galeri yang punya bagian netral-bahasa untuk disamakan.
  const syncable = block.type === "products" || block.type === "gallery";

  const { data: siblings } = syncable
    ? await supabase
        .from("content_blocks")
        .select("id, page_slug")
        .eq("site_id", SITE_ID)
        .eq("type", block.type)
        .neq("id", block.id)
    : { data: null };

  const { data: pages } = syncable
    ? await supabase.from("pages").select("slug, title").eq("site_id", SITE_ID)
    : { data: null };

  const pageTitles = new Map((pages ?? []).map((p) => [p.slug, p.title]));

  const targets = (siblings ?? []).map((b) => ({
    id: b.id,
    pageLabel: pageTitles.get(b.page_slug) ?? b.page_slug,
  }));

  return (
    <AdminShell
      title={meta.label}
      description={meta.description}
      back={{ href: "/admin", label: "Kembali ke daftar konten" }}
    >
      <BlockForm
        id={block.id}
        type={block.type}
        label={meta.label}
        fields={BLOCK_FIELDS[block.type]}
        data={(block.data ?? {}) as Record<string, unknown>}
      />

      <div className="mt-5">
        <SharedNotice type={block.type} pages={targets.map((t) => t.pageLabel)} />
      </div>
    </AdminShell>
  );
}
