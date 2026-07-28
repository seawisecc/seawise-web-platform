"use client";

import { usePathname } from "next/navigation";

/**
 * Menampilkan alamat yang gagal dibuka.
 *
 * Dibaca di sisi klien lewat usePathname, bukan dari header permintaan,
 * supaya komponen ini tidak memaksa seluruh halaman 404 menjadi dinamis.
 * Hanya dipakai saat `npm run dev`.
 */
export function NotFoundPath() {
  const pathname = usePathname();

  return (
    <p className="mt-6 rounded-[var(--brand-radius)] border border-hairline px-4 py-2 font-mono text-sm opacity-70">
      {pathname}
    </p>
  );
}
