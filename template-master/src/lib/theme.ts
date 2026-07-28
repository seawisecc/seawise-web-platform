import type { ThemeConfig } from "@/lib/site";

/**
 * theme_config (JSONB) → CSS custom properties.
 * Semua komponen hanya memakai var(--brand-*), tidak pernah warna hardcode.
 * Konsekuensinya: mengganti tema klien = update satu baris JSON, tanpa
 * menyentuh kode komponen.
 */

const RADIUS_SCALE: Record<ThemeConfig["radius"], string> = {
  none: "0px",
  sm: "0.25rem",
  md: "0.75rem",
  lg: "1.5rem",
  full: "9999px",
};

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Tolak nilai non-hex supaya konten klien tidak bisa menyuntik CSS. */
function safeColor(value: string, fallback: string): string {
  return HEX.test(value) ? value : fallback;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** Luminansi relatif (WCAG) — dipakai memilih warna teks di atas tombol. */
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Rasio kontras WCAG antara dua warna hex. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const INK = "#101828";
const PAPER = "#ffffff";

/**
 * Pilih warna teks di atas sebuah latar dengan membandingkan rasio kontras
 * keduanya, bukan memakai ambang luminansi tetap. Warna seperti emas
 * (#C9A227) punya luminansi menengah — ambang tetap akan memilih putih,
 * padahal teks gelap jauh lebih terbaca di atasnya.
 */
export function contrastText(background: string): string {
  return contrastRatio(INK, background) >= contrastRatio(PAPER, background)
    ? INK
    : PAPER;
}

export function themeToCssVars(theme: ThemeConfig): Record<string, string> {
  const c = theme.colors;
  const primary = safeColor(c.primary, "#0f5c73");
  const secondary = safeColor(c.secondary, "#7fb7c4");
  const accent = safeColor(c.accent, "#e8b04b");
  const background = safeColor(c.background, "#fbfaf7");
  const foreground = safeColor(c.foreground, "#12222a");
  const muted = safeColor(c.muted, "#eef2f3");

  return {
    "--brand-primary": primary,
    "--brand-primary-contrast": contrastText(primary),
    "--brand-secondary": secondary,
    "--brand-accent": accent,
    "--brand-accent-contrast": contrastText(accent),
    "--brand-bg": background,
    "--brand-fg": foreground,
    "--brand-muted": muted,
    "--brand-border": `color-mix(in oklab, ${foreground} 12%, transparent)`,
    "--brand-radius": RADIUS_SCALE[theme.radius],

    // Durasi interaksi (hover, tombol) sengaja dipisah dari durasi reveal.
    // Interaksi harus terasa instan; reveal justru butuh waktu lebih panjang
    // supaya kurva pelambatannya terbaca sebagai gerakan yang tenang.
    "--brand-motion-duration":
      theme.motion === "none" ? "0ms" : theme.motion === "subtle" ? "220ms" : "300ms",
    "--brand-reveal-duration":
      theme.motion === "none" ? "0ms" : theme.motion === "subtle" ? "700ms" : "950ms",
    "--brand-motion-lift": theme.motion === "expressive" ? "28px" : "14px",
  };
}

/** Peringatan build-time kalau kombinasi warna klien gagal WCAG AA. */
export function auditThemeContrast(theme: ThemeConfig): string[] {
  const warnings: string[] = [];
  const { foreground, background, primary } = theme.colors;

  const bodyRatio = contrastRatio(foreground, background);
  if (bodyRatio < 4.5) {
    warnings.push(
      `Kontras teks utama hanya ${bodyRatio.toFixed(2)}:1 (minimal 4.5:1 untuk WCAG AA).`,
    );
  }

  const linkRatio = contrastRatio(primary, background);
  if (linkRatio < 3) {
    warnings.push(
      `Kontras warna primary terhadap latar hanya ${linkRatio.toFixed(2)}:1 — tombol dan tautan sulit dilihat.`,
    );
  }

  return warnings;
}
