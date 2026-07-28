"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAuthedClient } from "@/lib/supabase/server";
import { SITE_ID } from "@/lib/env";
import { blockSchemas, isBlockType } from "@/lib/blocks/schemas";
import { businessInfoSchema, seoConfigSchema, isSharedBlockType, PRIMARY_PAGE } from "@/lib/site";

/** Pastikan user yang login memang berhak atas site ini sebelum menulis. */
async function assertAccess() {
  const supabase = await createAuthedClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  // Sama seperti di layout: satu user bisa punya beberapa baris profil,
  // jadi periksa seluruhnya, bukan hanya baris pertama.
  const { data: profiles } = await supabase
    .from("profiles")
    .select("role, site_id")
    .eq("user_id", user.id);

  const allowed = (profiles ?? []).some(
    (p) => p.role === "superadmin" || p.site_id === SITE_ID,
  );

  if (!allowed) {
    throw new Error("Tidak berwenang mengubah situs ini.");
  }

  return supabase;
}

export async function signOut() {
  const supabase = await createAuthedClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export type SaveState = { status: "idle" | "success" | "error"; message?: string };

export async function saveBlock(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const supabase = await assertAccess();

  const id = String(formData.get("__id") ?? "");
  const type = String(formData.get("__type") ?? "");
  if (!id || !isBlockType(type)) {
    return { status: "error", message: "Blok tidak dikenali." };
  }

  // Formulir mengirim seluruh isi blok sebagai satu payload JSON. Merangkai
  // ulang objek dari nama-nama input FormData tidak sanggup menangani daftar
  // bersarang seperti katalog produk beserta varian dan rinciannya.
  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("__data") ?? "{}"));
  } catch {
    return { status: "error", message: "Data formulir rusak. Muat ulang halaman lalu coba lagi." };
  }

  const parsed = blockSchemas[type].safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const where = first.path.length > 0 ? ` pada "${first.path.join(" › ")}"` : "";
    return {
      status: "error",
      message: `Isian belum valid${where}: ${first.message}`,
    };
  }

  const { data: saved, error } = await supabase
    .from("content_blocks")
    .update({ data: parsed.data })
    .eq("id", id)
    .eq("site_id", SITE_ID)
    .select("page_slug")
    .maybeSingle();

  if (error) {
    return { status: "error", message: `Gagal menyimpan: ${error.message}` };
  }

  // Revalidasi menyebut halamannya secara eksplisit. Memakai ("/", "layout")
  // saja tidak selalu menjangkau halaman terjemahan yang punya rute sendiri.
  const pageSlug = saved?.page_slug ?? "home";
  revalidatePath(pageSlug === "home" ? "/" : `/${pageSlug}`);
  revalidatePath("/", "layout");

  // Halaman terjemahan tidak perlu disalin apa pun: blok pembawa foto dan
  // harga hanya ada satu, dan halaman lain membacanya langsung.
  revalidatePath("/", "layout");

  return {
    status: "success",
    message: isSharedBlockType(type)
      ? "Tersimpan. Semua bahasa memakai data ini, jadi tidak ada yang perlu disalin."
      : "Perubahan tersimpan dan situs sudah diperbarui.",
  };
}

const toggleSchema = z.object({ id: z.string().uuid(), published: z.boolean() });

export async function togglePublish(formData: FormData) {
  const supabase = await assertAccess();

  const parsed = toggleSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    published: String(formData.get("published")) === "true",
  });
  if (!parsed.success) return;

  await supabase
    .from("content_blocks")
    .update({ published: parsed.data.published })
    .eq("id", parsed.data.id)
    .eq("site_id", SITE_ID);

  revalidatePath("/", "layout");
  revalidatePath("/admin");
}

/** Tukar posisi dua blok. Hanya aktif untuk tier Current & Trench. */
export async function moveBlock(formData: FormData) {
  const supabase = await assertAccess();

  const { data: site } = await supabase
    .from("sites").select("features").eq("id", SITE_ID).maybeSingle();

  const features = (site?.features ?? {}) as { reorder?: boolean };
  if (!features.reorder) {
    throw new Error("Paket Anda belum termasuk pengaturan urutan section.");
  }

  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  const pageSlug = String(formData.get("page_slug") ?? "home");

  const { data: blocks } = await supabase
    .from("content_blocks")
    .select("id, position")
    .eq("site_id", SITE_ID)
    .eq("page_slug", pageSlug)
    .order("position", { ascending: true });

  if (!blocks) return;

  const index = blocks.findIndex((b) => b.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= blocks.length) return;

  await Promise.all([
    supabase.from("content_blocks").update({ position: blocks[target].position })
      .eq("id", blocks[index].id).eq("site_id", SITE_ID),
    supabase.from("content_blocks").update({ position: blocks[index].position })
      .eq("id", blocks[target].id).eq("site_id", SITE_ID),
  ]);

  revalidatePath("/", "layout");
  revalidatePath("/admin");
}

/* --------------------------------------------------------------------- */

const siteSettingsSchema = z.object({
  name: z.string().trim().min(1, "Nama situs tidak boleh kosong").max(120),
  business_info: businessInfoSchema,
  seo_config: seoConfigSchema,
});

/**
 * Menyimpan pengaturan situs.
 *
 * Hanya tiga kolom yang dikirim — nama, info bisnis, dan konfigurasi SEO.
 * Ketiganya persis kolom yang di-GRANT ke role `authenticated` di migration
 * RLS. Kalau formulir ini nanti mencoba menulis kolom lain, database yang
 * menolaknya, bukan pengecekan di sini.
 */
export async function saveSiteSettings(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const supabase = await assertAccess();

  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("__data") ?? "{}"));
  } catch {
    return { status: "error", message: "Data formulir rusak. Muat ulang halaman lalu coba lagi." };
  }

  const parsed = siteSettingsSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const where = first.path.length > 0 ? ` pada "${first.path.join(" › ")}"` : "";
    return { status: "error", message: `Isian belum valid${where}: ${first.message}` };
  }

  const { error } = await supabase
    .from("sites")
    .update({
      name: parsed.data.name,
      business_info: parsed.data.business_info,
      seo_config: parsed.data.seo_config,
    })
    .eq("id", SITE_ID);

  if (error) {
    return { status: "error", message: `Gagal menyimpan: ${error.message}` };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Pengaturan tersimpan dan situs sudah diperbarui." };
}
