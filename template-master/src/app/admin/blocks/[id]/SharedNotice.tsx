/**
 * Keterangan bahwa blok ini dipakai bersama semua bahasa.
 *
 * Menggantikan panel sinkronisasi yang lama. Menyalin data antar halaman
 * sudah tidak diperlukan sejak blok pembawa foto dan harga hanya disimpan
 * sekali — halaman terjemahan membacanya langsung dari sini.
 */
export function SharedNotice({ type, pages }: { type: string; pages: string[] }) {
  const shared = type === "products" || type === "gallery";
  if (!shared) return null;

  const others = pages.filter(Boolean);

  return (
    <section className="admin-panel border-blue-200 bg-blue-50/60">
      <div className="admin-panel-body">
        <h2 className="text-sm font-semibold">Dipakai semua bahasa</h2>
        <p className="mt-1.5 text-sm text-stone-600">
          Foto, harga, dan urutan di sini adalah satu-satunya salinan.
          {others.length > 0
            ? ` Halaman ${others.join(", ")} membacanya langsung, jadi tidak ada yang perlu diunggah dua kali.`
            : ""}{" "}
          Yang berbeda per bahasa hanya teks, lewat kolom bertanda
          &ldquo;(English)&rdquo;.
        </p>
      </div>
    </section>
  );
}
