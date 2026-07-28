"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { FieldDescriptor } from "@/lib/blocks/fields";
import { FieldInput } from "@/components/admin/FieldInput";
import { saveSiteSettings, type SaveState } from "@/app/admin/actions";

const initialState: SaveState = { status: "idle" };

type Pair = { label?: string; value?: string };

function SaveButton({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending || !dirty}>
      {pending ? "Menyimpan…" : "Simpan perubahan"}
    </button>
  );
}

/**
 * `social` disimpan sebagai objek { instagram: "https://…" } di database,
 * tetapi jauh lebih mudah disunting sebagai daftar pasangan. Konversi
 * dilakukan di sini supaya bentuk penyimpanannya tetap rapi untuk dibaca
 * mesin, sementara yang dilihat klien tetap sederhana.
 */
function recordToPairs(value: unknown): Pair[] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, string>).map(([label, v]) => ({
    label,
    value: v,
  }));
}

function pairsToRecord(pairs: Pair[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of pairs) {
    const key = (p.label ?? "").trim().toLowerCase();
    const val = (p.value ?? "").trim();
    if (key && val) out[key] = val;
  }
  return out;
}

export function SiteSettingsForm({
  name,
  business,
  seo,
  contactFields,
  seoFields,
}: {
  name: string;
  business: Record<string, unknown>;
  seo: Record<string, unknown>;
  contactFields: FieldDescriptor[];
  seoFields: FieldDescriptor[];
}) {
  const [state, formAction] = useActionState(saveSiteSettings, initialState);
  const [siteName, setSiteName] = useState(name);
  const [biz, setBiz] = useState<Record<string, unknown>>({
    ...business,
    social: recordToPairs(business.social),
  });
  const [seoValues, setSeo] = useState<Record<string, unknown>>(seo);
  const [dirty, setDirty] = useState(false);

  const payload = {
    name: siteName,
    business_info: { ...biz, social: pairsToRecord((biz.social as Pair[]) ?? []) },
    seo_config: seoValues,
  };

  return (
    <form action={formAction}>
      <input type="hidden" name="__data" value={JSON.stringify(payload)} />

      <div className="space-y-5">
        <section className="admin-panel">
          <header className="admin-panel-head">
            <h2 className="text-sm font-semibold">Identitas & kontak</h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Dipakai di footer, tombol WhatsApp, dan data yang dibaca Google.
            </p>
          </header>
          <div className="admin-panel-body space-y-5">
            <div>
              <label htmlFor="site-name" className="admin-label">Nama tampil</label>
              <input
                id="site-name"
                className="admin-field"
                value={siteName}
                onChange={(e) => { setSiteName(e.target.value); setDirty(true); }}
              />
            </div>

            {contactFields.map((f) => (
              <FieldInput
                key={f.key}
                field={f}
                value={biz[f.key]}
                onChange={(next) => { setBiz((p) => ({ ...p, [f.key]: next })); setDirty(true); }}
              />
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <header className="admin-panel-head">
            <h2 className="text-sm font-semibold">Tampilan di pencarian & saat dibagikan</h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Judul, deskripsi, ikon tab, dan gambar pratinjau tautan.
            </p>
          </header>
          <div className="admin-panel-body space-y-5">
            {seoFields.map((f) => (
              <FieldInput
                key={f.key}
                field={f}
                value={seoValues[f.key]}
                onChange={(next) => { setSeo((p) => ({ ...p, [f.key]: next })); setDirty(true); }}
              />
            ))}
          </div>
        </section>
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
            <span className="text-stone-500">Pengaturan situs.</span>
          )}
        </p>
        <SaveButton dirty={dirty} />
      </div>
    </form>
  );
}
