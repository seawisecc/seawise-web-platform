"use client";

type Pair = { label?: string; label_en?: string; value?: string };

/**
 * Daftar pasangan label–nilai. Untuk parfum berisi Atas/Tengah/Dasar,
 * untuk vertical lain bisa kandungan, ukuran, atau bahan. Sengaja tidak
 * dibuat khusus parfum supaya tidak perlu komponen baru tiap klien.
 */
export function PairList({
  label, help, value, onChange,
}: {
  label: string;
  help?: string;
  value: Pair[];
  onChange: (next: Pair[]) => void;
}) {
  function update(i: number, patch: Pair) {
    onChange(value.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  return (
    <div>
      <span className="admin-label">{label}</span>

      <div className="space-y-2">
        {value.map((pair, i) => (
          <div key={i} className="admin-pair-row">
            <input
              className="admin-field"
              placeholder="Label"
              value={pair.label ?? ""}
              onChange={(e) => update(i, { label: e.target.value })}
            />
            <input
              className="admin-field"
              placeholder="Label (English)"
              value={pair.label_en ?? ""}
              onChange={(e) => update(i, { label_en: e.target.value })}
            />
            <input
              className="admin-field"
              placeholder="Isi"
              value={pair.value ?? ""}
              onChange={(e) => update(i, { value: e.target.value })}
            />
            <button
              type="button"
              className="admin-icon-btn admin-icon-btn-danger mt-1"
              aria-label="Hapus rincian"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="btn btn-outline mt-2 h-9 w-full border-dashed text-sm"
        onClick={() => onChange([...value, { label: "", value: "" }])}
      >
        + Tambah rincian
      </button>

      {help ? <p className="admin-help">{help}</p> : null}
    </div>
  );
}
