"use client";

import { useId } from "react";
import type { FieldDescriptor } from "@/lib/blocks/fields";
import { Repeater } from "./Repeater";
import { ImageField } from "./ImageField";
import { ImagesField } from "./ImagesField";
import { PairList } from "./PairList";
import { VariantList } from "./VariantList";

type Props = {
  field: FieldDescriptor;
  value: unknown;
  onChange: (next: unknown) => void;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Satu isian formulir, dipilih berdasarkan `kind` di deskriptor.
 * Seluruh nilai dikelola sebagai state di BlockForm, jadi komponen ini
 * murni terkendali — tidak ada nama input yang perlu dicocokkan manual,
 * dan tidak ada JSON yang perlu diketik pemakai.
 */
export function FieldInput({ field, value, onChange }: Props) {
  const id = useId();

  const label = (
    <label htmlFor={id} className="admin-label">
      {field.label}
    </label>
  );

  const help = field.help ? <p className="admin-help">{field.help}</p> : null;

  switch (field.kind) {
    case "textarea":
      return (
        <div>
          {label}
          <textarea
            id={id}
            rows={5}
            className="admin-field"
            placeholder={field.placeholder}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
          />
          {help}
        </div>
      );

    case "number":
      return (
        <div>
          {label}
          <input
            id={id}
            type="number"
            inputMode="numeric"
            className="admin-field"
            placeholder={field.placeholder}
            value={value === undefined || value === null ? "" : String(value)}
            onChange={(e) =>
              onChange(e.target.value === "" ? undefined : Number(e.target.value))
            }
          />
          {help}
        </div>
      );

    case "select":
      return (
        <div>
          {label}
          <select
            id={id}
            className="admin-field"
            value={String(value ?? field.options?.[0]?.value ?? "")}
            onChange={(e) => onChange(e.target.value)}
          >
            {field.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {help}
        </div>
      );

    case "boolean":
      return (
        <div>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              id={id}
              type="checkbox"
              className="size-4 accent-stone-800"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span className="font-medium text-stone-700">{field.label}</span>
          </label>
          {help}
        </div>
      );

    case "image":
      return (
        <ImageField
          label={field.label}
          help={field.help}
          value={asRecord(value) as { url?: string; alt?: string }}
          onChange={onChange}
        />
      );

    case "imageUrl": {
      // Kolom ini menyimpan alamat gambar sebagai teks biasa, bukan objek.
      // Pemetaan dilakukan di sini supaya skema tetap sederhana dan kode
      // metadata tidak perlu tahu bentuk yang dipakai formulir.
      const url = typeof value === "string" ? value : "";
      return (
        <ImageField
          label={field.label}
          help={field.help}
          showAlt={false}
          value={{ url }}
          onChange={(next) => onChange((next as { url?: string }).url || null)}
        />
      );
    }

    case "link": {
      const link = asRecord(value);
      return (
        <div>
          <span className="admin-label">{field.label}</span>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              id={id}
              className="admin-field"
              placeholder="Tulisan tombol"
              value={String(link.label ?? "")}
              onChange={(e) => onChange({ ...link, label: e.target.value })}
            />
            <input
              className="admin-field"
              placeholder="Tujuan, mis. #produk"
              value={String(link.href ?? "")}
              onChange={(e) => onChange({ ...link, href: e.target.value })}
            />
          </div>
          {help}
        </div>
      );
    }

    case "tags": {
      const list = asArray(value).map(String);
      return (
        <div>
          {label}
          <input
            id={id}
            className="admin-field"
            placeholder={field.placeholder}
            value={list.join(", ")}
            onChange={(e) =>
              onChange(
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
          {help}
        </div>
      );
    }

    case "pairs":
      return (
        <PairList
          label={field.label}
          help={field.help}
          value={asArray(value) as { label?: string; value?: string }[]}
          onChange={onChange}
        />
      );

    case "variants":
      return (
        <VariantList
          label={field.label}
          help={field.help}
          value={asArray(value) as { label?: string; price?: number; sku?: string }[]}
          onChange={onChange}
        />
      );

    case "images":
      return (
        <ImagesField
          label={field.label}
          help={field.help}
          value={asArray(value) as { url?: string; alt?: string }[]}
          onChange={onChange}
        />
      );

    case "list":
      return (
        <Repeater
          field={field}
          value={asArray(value) as Record<string, unknown>[]}
          onChange={onChange}
        />
      );

    default:
      return (
        <div>
          {label}
          <input
            id={id}
            className="admin-field"
            placeholder={field.placeholder}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
          />
          {help}
        </div>
      );
  }
}
