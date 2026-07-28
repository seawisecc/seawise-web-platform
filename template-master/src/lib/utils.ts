import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Buang tag HTML dan potong ke panjang aman untuk meta description. */
export function toMetaDescription(input: string | undefined, max = 155): string {
  if (!input) return "";
  const clean = input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/[\s,.;:]+\S*$/, "")}…`;
}

/** Normalisasi nomor telepon Indonesia ke format wa.me (62…). */
export function toWhatsAppNumber(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

export function absoluteUrl(path: string, base: string): string {
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path;
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

/**
 * Format rupiah tanpa Intl.NumberFormat.
 *
 * Intl memakai basis data ICU yang berbeda antara Node dan browser: server
 * menghasilkan "Rp 117.000" dengan spasi tak-terputus, browser "Rp117.000"
 * tanpa spasi. Bedanya tak terlihat mata, tapi cukup untuk membuat React
 * menyatakan hydration gagal. Pemformatan manual memberi hasil yang sama
 * persis di kedua sisi.
 */
export function formatCurrency(value: number, currency = "IDR"): string {
  const grouped = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return currency === "IDR" ? `Rp ${grouped}` : `${currency} ${grouped}`;
}
