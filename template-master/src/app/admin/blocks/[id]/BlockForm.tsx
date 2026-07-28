"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { FieldDescriptor } from "@/lib/blocks/fields";
import { FieldInput } from "@/components/admin/FieldInput";
import { saveBlock, type SaveState } from "@/app/admin/actions";

const initialState: SaveState = { status: "idle" };

/** Isian yang tampil sebagai daftar panjang layak dapat panelnya sendiri. */
const STANDALONE = new Set(["list", "images", "pairs", "variants"]);

function SaveButton({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending || !dirty}>
      {pending ? "Menyimpan…" : "Simpan perubahan"}
    </button>
  );
}

/**
 * Formulir blok.
 *
 * Seluruh isi blok disimpan sebagai satu objek di state React, lalu dikirim
 * sebagai satu payload JSON. Pendekatan sebelumnya merangkai ulang objek
 * dari nama-nama input FormData — rapuh, dan tidak mungkin dipakai untuk
 * daftar bersarang seperti katalog produk.
 */
export function BlockForm({
  id, type, label, fields, data,
}: {
  id: string;
  type: string;
  label: string;
  fields: FieldDescriptor[];
  data: Record<string, unknown>;
}) {
  const [state, formAction] = useActionState(saveBlock, initialState);
  const [values, setValues] = useState<Record<string, unknown>>(data);
  const [dirty, setDirty] = useState(false);

  function set(key: string, next: unknown) {
    setValues((prev) => ({ ...prev, [key]: next }));
    setDirty(true);
  }

  const basics = fields.filter((f) => !STANDALONE.has(f.kind));
  const panels = fields.filter((f) => STANDALONE.has(f.kind));

  return (
    <form action={formAction}>
      <input type="hidden" name="__id" value={id} />
      <input type="hidden" name="__type" value={type} />
      <input type="hidden" name="__data" value={JSON.stringify(values)} />

      <div className="space-y-5">
        {basics.length > 0 ? (
          <section className="admin-panel">
            <header className="admin-panel-head">
              <h2 className="text-sm font-semibold">Isi bagian</h2>
            </header>
            <div className="admin-panel-body space-y-5">
              {basics.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={values[field.key]}
                  onChange={(next) => set(field.key, next)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {panels.map((field) => (
          <section key={field.key} className="admin-panel">
            <div className="admin-panel-body">
              <FieldInput
                field={field}
                value={values[field.key]}
                onChange={(next) => set(field.key, next)}
              />
            </div>
          </section>
        ))}
      </div>

      <div className="admin-savebar">
        <p className="text-sm" role={state.status === "error" ? "alert" : "status"}>
          {state.status === "error" ? (
            <span className="text-red-700">{state.message}</span>
          ) : state.status === "success" ? (
            <span className="text-emerald-700">{state.message}</span>
          ) : dirty ? (
            <span className="text-stone-600">Ada perubahan yang belum disimpan.</span>
          ) : (
            <span className="text-stone-500">Bagian {label.toLowerCase()}.</span>
          )}
        </p>

        <div className="flex items-center gap-2">
          <Link href="/admin" className="btn btn-outline">Kembali</Link>
          <SaveButton dirty={dirty} />
        </div>
      </div>
    </form>
  );
}
