"use client";

import { useId, useRef, useState } from "react";
import { uploadImage, removeImage, isManagedUrl, ACCEPTED } from "./upload";

type Value = { url?: string; alt?: string };

/**
 * Kolom gambar dengan seret-dan-lepas.
 *
 * Teks alternatif sengaja diletakkan sejajar pratinjau dan diberi peringatan
 * saat kosong. Alt text adalah satu-satunya bagian gambar yang terbaca Google
 * dan pembaca layar, dan ia paling sering terlupa kalau hanya jadi kolom
 * kecil di bawah tombol unggah.
 */
export function ImageField({
  label,
  help,
  value,
  onChange,
  /** Favicon dan gambar berbagi tidak punya teks alternatif sendiri —
      keduanya memakai judul situs, jadi kolomnya hanya menambah kebingungan. */
  showAlt = true,
}: {
  label: string;
  help?: string;
  value: Value;
  onChange: (next: Value) => void;
  showAlt?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = value.url ?? "";

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);

    const result = await uploadImage(file);

    if (!result.ok) {
      setError(result.message);
    } else {
      // Gambar lama yang kita kelola dibersihkan supaya kuota tidak terisi
      // berkas yatim setiap kali klien mengganti foto.
      if (url && isManagedUrl(url)) await removeImage(url);
      onChange({ ...value, url: result.url });
    }

    setBusy(false);
  }

  return (
    <div>
      <span className="admin-label">{label}</span>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,10rem)_1fr]">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFiles(e.dataTransfer.files);
          }}
          className={`admin-dropzone ${dragging ? "is-dragging" : ""} ${url ? "has-image" : ""}`}
        >
          {url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="px-3 text-center text-xs leading-relaxed text-stone-500">
              Seret gambar ke sini
              <br />
              atau klik untuk memilih
            </span>
          )}

          <button
            type="button"
            aria-label={url ? "Ganti gambar" : "Pilih gambar"}
            className="absolute inset-0 cursor-pointer"
            onClick={() => inputRef.current?.click()}
          />

          {busy ? (
            <span className="absolute inset-0 grid place-items-center bg-white/80 text-xs font-medium">
              Mengunggah…
            </span>
          ) : null}
        </div>

        <div className="space-y-2">
          {showAlt ? (
            <>
              <div>
                <label htmlFor={inputId} className="mb-1 block text-xs text-stone-500">
                  Teks alternatif
                </label>
                <input
                  id={inputId}
                  className="admin-field"
                  placeholder="mis. Botol parfum Amber Saint di atas nampan"
                  value={value.alt ?? ""}
                  onChange={(e) => onChange({ ...value, alt: e.target.value })}
                />
              </div>

              {url && !(value.alt ?? "").trim() ? (
                <p className="text-xs text-amber-700">
                  Teks alternatif masih kosong — gambar ini tidak akan terbaca Google.
                </p>
              ) : null}
            </>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-outline h-8 px-3 text-[13px]"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {url ? "Ganti gambar" : "Pilih gambar"}
            </button>

            {url ? (
              <button
                type="button"
                className="btn btn-outline h-8 px-3 text-[13px] text-red-700"
                disabled={busy}
                onClick={async () => {
                  if (!confirm("Hapus gambar ini?")) return;
                  setBusy(true);
                  if (isManagedUrl(url)) await removeImage(url);
                  onChange({ ...value, url: "" });
                  setBusy(false);
                }}
              >
                Hapus
              </button>
            ) : null}
          </div>

          {error ? <p className="text-xs text-red-700">{error}</p> : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {help ? <p className="admin-help">{help}</p> : null}
    </div>
  );
}
