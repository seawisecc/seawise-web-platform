"use client";

import { createClient } from "@/lib/supabase/client";
import { SITE_ID, env } from "@/lib/env";

export const BUCKET = "site-media";
export const MAX_BYTES = 10 * 1024 * 1024;
export const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"];

export type UploadResult =
  | { ok: true; url: string; path: string }
  | { ok: false; message: string };

/** Nama berkas dijadikan aman untuk URL sekaligus tetap terbaca manusia. */
function safeName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "gambar";
  const ext = (dot > 0 ? name.slice(dot + 1) : "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${base}-${Date.now().toString(36)}.${ext || "jpg"}`;
}

/**
 * Unggah satu berkas ke Supabase Storage.
 *
 * Berkas selalu masuk ke folder bernama site_id. Itu bukan sekadar rapi:
 * policy storage memeriksa folder pertama untuk menentukan hak akses, jadi
 * struktur inilah yang mencegah satu klien menimpa gambar klien lain.
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  if (!ACCEPTED.includes(file.type)) {
    return { ok: false, message: "Format tidak didukung. Pakai JPG, PNG, WebP, atau AVIF." };
  }
  if (file.size > MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return { ok: false, message: `Ukuran ${mb} MB melebihi batas 10 MB. Kecilkan dulu gambarnya.` };
  }

  const supabase = createClient();
  const path = `${SITE_ID}/${safeName(file.name)}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });

  if (error) {
    return {
      ok: false,
      message:
        error.message.includes("row-level security") || error.message.includes("Unauthorized")
          ? "Tidak berwenang mengunggah ke situs ini. Coba keluar lalu masuk kembali."
          : `Gagal mengunggah: ${error.message}`,
    };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl, path };
}

/** Hanya berkas dari bucket kita sendiri yang boleh dihapus dari panel. */
export function isManagedUrl(url: string): boolean {
  return url.startsWith(`${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`);
}

export async function removeImage(url: string): Promise<void> {
  if (!isManagedUrl(url)) return;
  const prefix = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
  const path = decodeURIComponent(url.slice(prefix.length));
  await createClient().storage.from(BUCKET).remove([path]);
}
