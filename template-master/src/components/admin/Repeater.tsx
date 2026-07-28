"use client";

import type { FieldDescriptor } from "@/lib/blocks/fields";
import { FieldInput } from "./FieldInput";

type Props = {
  field: FieldDescriptor;
  value: Record<string, unknown>[];
  onChange: (next: Record<string, unknown>[]) => void;
};

function blankItem(fields: FieldDescriptor[]): Record<string, unknown> {
  const item: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.kind === "list" || f.kind === "pairs" || f.kind === "variants" || f.kind === "tags") {
      item[f.key] = [];
    } else if (f.kind === "boolean") {
      item[f.key] = false;
    } else if (f.kind === "image" || f.kind === "link") {
      item[f.key] = {};
    } else if (f.kind === "select") {
      item[f.key] = f.options?.[0]?.value ?? "";
    } else if (f.kind !== "number") {
      item[f.key] = "";
    }
  }
  return item;
}

/**
 * Editor daftar berulang — pengganti kotak JSON mentah.
 *
 * Tiap baris memakai <details> supaya daftar panjang tetap terbaca sekilas:
 * yang tertutup hanya menampilkan judul, yang dibuka menampilkan isian
 * lengkap. Bisa bersarang, sehingga menu restoran (kategori berisi item)
 * memakai komponen yang sama dengan katalog produk.
 */
export function Repeater({ field, value, onChange }: Props) {
  const fields = field.itemFields ?? [];
  const itemLabel = field.itemLabel ?? "baris";

  function update(index: number, patch: Record<string, unknown>) {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="admin-label mb-0">{field.label}</span>
        <span className="text-xs text-stone-500">
          {value.length} {itemLabel}
        </span>
      </div>

      {field.help ? <p className="admin-help mb-3 mt-0">{field.help}</p> : null}

      <div className="space-y-2">
        {value.map((item, index) => {
          const title =
            (field.itemTitleKey ? String(item[field.itemTitleKey] ?? "") : "") ||
            `${itemLabel} ${index + 1}`;

          return (
            <details key={index} className="admin-row group">
              <summary className="admin-row-head cursor-pointer list-none">
                <span
                  aria-hidden="true"
                  className="text-stone-400 transition-transform group-open:rotate-90"
                >
                  ›
                </span>

                <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>

                <span className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="admin-icon-btn"
                    aria-label={`Naikkan ${title}`}
                    disabled={index === 0}
                    onClick={(e) => {
                      e.preventDefault();
                      move(index, -1);
                    }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="admin-icon-btn"
                    aria-label={`Turunkan ${title}`}
                    disabled={index === value.length - 1}
                    onClick={(e) => {
                      e.preventDefault();
                      move(index, 1);
                    }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="admin-icon-btn admin-icon-btn-danger"
                    aria-label={`Hapus ${title}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (confirm(`Hapus ${itemLabel} "${title}"?`)) remove(index);
                    }}
                  >
                    ×
                  </button>
                </span>
              </summary>

              <div className="space-y-4 p-4">
                {fields.map((sub) => (
                  <FieldInput
                    key={sub.key}
                    field={sub}
                    value={item[sub.key]}
                    onChange={(next) => update(index, { [sub.key]: next })}
                  />
                ))}
              </div>
            </details>
          );
        })}
      </div>

      <button
        type="button"
        className="btn btn-outline mt-3 w-full border-dashed"
        onClick={() => onChange([...value, blankItem(fields)])}
      >
        + Tambah {itemLabel}
      </button>
    </div>
  );
}
