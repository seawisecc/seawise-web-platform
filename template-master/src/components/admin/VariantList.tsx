"use client";

type Variant = { label?: string; price?: number; sku?: string };

import { formatCurrency } from "@/lib/utils";

/**
 * Daftar ukuran beserta harganya. Harga ditampilkan terformat di bawah
 * kolom isian supaya salah ketik nol langsung terlihat — kesalahan yang
 * paling mahal dan paling mudah terjadi saat mengetik angka panjang.
 */
export function VariantList({
  label, help, value, onChange,
}: {
  label: string;
  help?: string;
  value: Variant[];
  onChange: (next: Variant[]) => void;
}) {
  function update(i: number, patch: Variant) {
    onChange(value.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }

  return (
    <div>
      <span className="admin-label">{label}</span>

      <div className="space-y-2">
        {value.map((variant, i) => (
          <div key={i}>
            <div className="admin-variant-row">
              <input
                className="admin-field"
                placeholder="30 ml"
                value={variant.label ?? ""}
                onChange={(e) => update(i, { label: e.target.value })}
              />
              <input
                className="admin-field"
                type="number"
                inputMode="numeric"
                placeholder="117000"
                value={variant.price === undefined ? "" : String(variant.price)}
                onChange={(e) =>
                  update(i, { price: e.target.value === "" ? undefined : Number(e.target.value) })
                }
              />
              <input
                className="admin-field"
                placeholder="Kode (opsional)"
                value={variant.sku ?? ""}
                onChange={(e) => update(i, { sku: e.target.value })}
              />
              <button
                type="button"
                className="admin-icon-btn admin-icon-btn-danger mt-1"
                aria-label="Hapus ukuran"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              >
                ×
              </button>
            </div>

            {typeof variant.price === "number" && variant.price > 0 ? (
              <p className="mt-1 text-xs text-stone-500">
                tampil sebagai {formatCurrency(variant.price)}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <button
        type="button"
        className="btn btn-outline mt-2 h-9 w-full border-dashed text-sm"
        onClick={() => onChange([...value, { label: "", price: undefined }])}
      >
        + Tambah ukuran
      </button>

      {help ? <p className="admin-help">{help}</p> : null}
    </div>
  );
}
