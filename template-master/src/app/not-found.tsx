import Link from "next/link";
import { NotFoundPath } from "@/components/NotFoundPath";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-3xl">Halaman tidak ditemukan</h1>
      <p className="prose-body mt-3">
        Halaman yang Anda cari mungkin sudah dipindahkan atau dihapus.
      </p>

      {/* Alamat yang dicari ditampilkan hanya saat pengembangan. Peramban
          sering menyembunyikan path di kolom URL, jadi tanpa ini penyebab
          404 di localhost nyaris mustahil ditebak. Pengunjung situs asli
          tidak perlu melihatnya. */}
      {process.env.NODE_ENV === "development" ? <NotFoundPath /> : null}

      <Link href="/" className="btn btn-primary mt-8">Kembali ke beranda</Link>
    </div>
  );
}
