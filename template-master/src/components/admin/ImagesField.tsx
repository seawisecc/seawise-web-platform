"use client";

import { useRef, useState } from "react";
import { uploadImage, removeImage, isManagedUrl, ACCEPTED } from "./upload";

type Image = { url?: string; alt?: string };

/**
 * Galeri banyak gambar — menerima beberapa berkas sekaligus dalam satu
 * lepasan. Untuk klien vertical foto (villa, restoran) mengunggah satu per
 * satu adalah pekerjaan yang paling melelahkan, dan itu yang biasanya
 * berakhir jadi permintaan bantuan ke penyedia jasa.
 */
export function ImagesField({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: Image[];
  onChange: (next: Image[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    const list = Array.from(files);
    setProgress({ done: 0, total: list.length });
    setErrors([]);

    const added: Image[] = [];
    const failed: string[] = [];

    for (const [i, file] of list.entries()) {
      const result = await uploadImage(file);
      if (result.ok) added.push({ url: result.url, alt: "" });
      else failed.push(`${file.name}: ${result.message}`);
      setProgress({ done: i + 1, total: list.length });
    }

    if (added.length) onChange([...value, ...added]);
    setErrors(failed);
    setProgress(null);
  }

  function update(index: number, patch: Image) {
    onChange(value.map((img, i) => (i === index ? { ...img, ...patch } : img)));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  const missingAlt = value.filter((i) => i.url && !(i.alt ?? "").trim()).length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="admin-label mb-0">{label}</span>
        <span className="text-xs text-stone-500">{value.length} foto</span>
      </div>

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
        className={`admin-dropzone admin-dropzone-wide ${dragging ? "is-dragging" : ""}`}
      >
        <span className="px-4 text-center text-xs text-stone-500">
          {progress
            ? `Mengunggah ${progress.done} dari ${progress.total}…`
            : "Seret beberapa foto sekaligus ke sini, atau klik untuk memilih"}
        </span>
        <button
          type="button"
          aria-label="Pilih foto"
          className="absolute inset-0 cursor-pointer"
          onClick={() => inputRef.current?.click()}
          disabled={Boolean(progress)}
        />
      </div>

      {errors.length ? (
        <ul className="mt-2 space-y-1">
          {errors.map((e) => (
            <li key={e} className="text-xs text-red-700">{e}</li>
          ))}
        </ul>
      ) : null}

      {missingAlt > 0 ? (
        <p className="mt-2 text-xs text-amber-700">
          {missingAlt} foto belum punya teks alternatif.
        </p>
      ) : null}

      {value.length > 0 ? (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {value.map((img, i) => (
            <li key={`${img.url}-${i}`} className="admin-row overflow-hidden">
              <div className="flex gap-3 p-2">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-stone-100">
                  {img.url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <input
                    className="admin-field"
                    placeholder="Teks alternatif"
                    value={img.alt ?? ""}
                    onChange={(e) => update(i, { alt: e.target.value })}
                  />
                  <div className="mt-1.5 flex gap-1">
                    <button
                      type="button" className="admin-icon-btn" aria-label="Geser ke kiri"
                      disabled={i === 0} onClick={() => move(i, -1)}
                    >
                      ←
                    </button>
                    <button
                      type="button" className="admin-icon-btn" aria-label="Geser ke kanan"
                      disabled={i === value.length - 1} onClick={() => move(i, 1)}
                    >
                      →
                    </button>
                    <button
                      type="button"
                      className="admin-icon-btn admin-icon-btn-danger ml-auto"
                      aria-label="Hapus foto"
                      onClick={async () => {
                        if (!confirm("Hapus foto ini?")) return;
                        if (img.url && isManagedUrl(img.url)) await removeImage(img.url);
                        onChange(value.filter((_, idx) => idx !== i));
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        multiple
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
