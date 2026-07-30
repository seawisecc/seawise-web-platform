import { ImageResponse } from "next/og";
import { getSite, getBlocks, findBlock } from "@/lib/site";
import { contrastText } from "@/lib/theme";
import { toMetaDescription } from "@/lib/utils";

export const alt = "Pratinjau situs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

/**
 * Gambar pratinjau tautan — yang muncul saat alamat situs dikirim di
 * WhatsApp, Instagram, atau Facebook.
 *
 * Dibuat otomatis dari data klien: warna tema, nama, kalimat pembuka, dan
 * foto pertama yang ada di halaman. Artinya setiap klien langsung punya
 * pratinjau yang terlihat dirancang, tanpa satu pun langkah desain tambahan
 * per klien — dan tanpa risiko tautan tampil telanjang saat dibagikan.
 *
 * Klien tetap bisa menggantinya kapan saja lewat Pengaturan; nilai di
 * seo_config.default_og_image selalu menang atas gambar ini.
 */
export default async function OpengraphImage() {
  const site = await getSite();

  const primary = site?.theme.colors.primary ?? "#0f5c73";
  const background = site?.theme.colors.background ?? "#fbfaf7";
  const foreground = site?.theme.colors.foreground ?? "#12222a";
  const muted = site?.theme.colors.muted ?? "#eef2f3";

  const name = site?.name ?? "Seawise";
  const title = site?.seo.default_title || name;
  const tagline = toMetaDescription(site?.seo.default_description, 110);

  // Foto diambil dari konten yang sudah ada — hero dulu, lalu produk
  // pertama. Tidak ada aset khusus yang perlu disiapkan per klien.
  let photo = "";
  try {
    const blocks = await getBlocks("home");
    const hero = findBlock(blocks, "hero");
    const products = findBlock(blocks, "products");
    photo =
      hero?.data.image?.url ||
      products?.data.items.find((p) => p.images[0]?.url || p.image?.url)?.images[0]?.url ||
      products?.data.items.find((p) => p.image?.url)?.image?.url ||
      "";
    if (photo.startsWith("/")) photo = "";
  } catch {
    photo = "";
  }

  // Fotonya diambil sendiri lebih dulu, bukan diserahkan ke <img>.
  //
  // Kalau pengambilan itu dilakukan di dalam ImageResponse dan gagal — server
  // gambar lambat, berkasnya terhapus — seluruh rute ikut gagal dan tautan
  // tampil tanpa gambar sama sekali. Diambil di sini, kegagalannya cukup
  // membuat kartu tampil tanpa foto: tetap rapi, tetap terbaca.
  let photoData = "";
  if (photo) {
    try {
      const res = await fetch(photo, { signal: AbortSignal.timeout(4000) });
      const mime = res.headers.get("content-type") ?? "";
      if (res.ok && mime.startsWith("image/")) {
        const buffer = Buffer.from(await res.arrayBuffer());
        photoData = `data:${mime};base64,${buffer.toString("base64")}`;
      }
    } catch {
      photoData = "";
    }
  }

  const onPrimary = contrastText(primary);
  const hasPhoto = Boolean(photoData);

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: hasPhoto ? 720 : 1200,
            height: "100%",
            padding: 72,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 10, height: 34, background: primary, borderRadius: 999 }} />
            <span
              style={{
                fontSize: 22,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: primary,
              }}
            >
              {name}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <span
              style={{
                fontSize: hasPhoto ? 60 : 76,
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                color: foreground,
                maxWidth: hasPhoto ? 560 : 900,
              }}
            >
              {title}
            </span>

            {tagline ? (
              <span
                style={{
                  fontSize: hasPhoto ? 26 : 30,
                  lineHeight: 1.45,
                  color: foreground,
                  opacity: 0.68,
                  maxWidth: hasPhoto ? 540 : 860,
                }}
              >
                {tagline}
              </span>
            ) : null}
          </div>

          {site?.business.city ? (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                padding: "10px 20px",
                borderRadius: 999,
                background: primary,
                color: onPrimary,
                fontSize: 20,
              }}
            >
              {site.business.city}
              {site.business.region ? `, ${site.business.region}` : ""}
            </div>
          ) : (
            <div style={{ display: "flex", height: 8, width: 180, background: primary, borderRadius: 999 }} />
          )}
        </div>

        {hasPhoto ? (
          <div style={{ display: "flex", width: 480, height: "100%", background: muted }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoData} alt="" width={480} height={630} style={{ objectFit: "cover" }} />
          </div>
        ) : null}
      </div>
    ),
    size,
  );
}
