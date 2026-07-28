import { z } from "zod";

/**
 * Validasi environment variable saat build/boot, bukan saat request.
 * Kalau ada yang salah, build gagal lebih awal — bukan situs klien yang
 * blank di produksi.
 *
 * Catatan kunci Supabase: sejak 2025 Supabase mengganti `anon key` dengan
 * `publishable key` (sb_publishable_…), dan kunci lama dihentikan akhir
 * 2026. Project baru sebaiknya langsung memakai publishable key; kunci
 * lama tetap diterima sebagai cadangan supaya project lama tidak rusak.
 */
/**
 * Nilai env sering terbawa spasi, tanda kutip, atau newline Windows saat
 * disalin-tempel ke Vercel atau .env.local. Dibersihkan di sini supaya
 * kesalahan sepele itu tidak menghentikan deploy.
 */
function clean(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return value.trim().replace(/\r/g, "").replace(/^["']|["']$/g, "");
}

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_ID: z.string().uuid(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: clean(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  NEXT_PUBLIC_SITE_ID: clean(process.env.NEXT_PUBLIC_SITE_ID),
  NEXT_PUBLIC_SITE_URL: clean(process.env.NEXT_PUBLIC_SITE_URL),
});

if (!parsed.success) {
  // Tampilkan nilai yang terbaca (kunci disamarkan) supaya jelas apakah
  // masalahnya salah ketik, kosong, atau variabelnya tidak terbaca sama sekali.
  const detail = parsed.error.issues
    .map((i) => {
      const key = String(i.path[0]);
      const raw = clean(process.env[key]);
      const shown =
        raw === undefined || raw === ""
          ? "(kosong)"
          : key.includes("KEY")
            ? `"${raw.slice(0, 8)}…" (${raw.length} karakter)`
            : `"${raw}"`;
      return `  - ${key}: ${i.message} — terbaca: ${shown}`;
    })
    .join("\n");

  throw new Error(
    `Environment variable belum benar. Periksa .env.local:\n${detail}`,
  );
}

export const env = parsed.data;
export const SITE_ID = env.NEXT_PUBLIC_SITE_ID;
export const SITE_URL = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

/** Kunci publik untuk browser & render server. Aman ikut ke bundle. */
export const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
