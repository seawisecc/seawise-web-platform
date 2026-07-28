/**
 * JSON-LD di-render sebagai script statis di HTML awal, bukan disuntik
 * lewat JavaScript, supaya crawler membacanya tanpa perlu eksekusi JS.
 */
export function JsonLd({ json }: { json: string }) {
  return (
    <script
      type="application/ld+json"
      // Konten sudah di-escape di buildJsonLd().
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
