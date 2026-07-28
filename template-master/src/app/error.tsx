"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[render error]", error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-3xl">Terjadi kesalahan</h1>
      <p className="prose-body mt-3">
        Halaman gagal dimuat. Coba muat ulang beberapa saat lagi.
      </p>
      <button onClick={reset} className="btn btn-primary mt-8">Muat ulang</button>
    </div>
  );
}
