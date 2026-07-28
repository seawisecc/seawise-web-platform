import type { FieldDescriptor } from "@/lib/blocks/fields";

/**
 * Isian halaman Pengaturan.
 *
 * Hanya memuat kolom yang boleh disentuh klien. Tema, paket, domain, dan
 * status tayang tidak ada di sini — bukan karena disembunyikan, tapi karena
 * GRANT di database memang menolaknya. Formulir ini hanya mencerminkan
 * batas yang sudah ditegakkan lebih dulu.
 */
export const CONTACT_FIELDS: FieldDescriptor[] = [
  { key: "legal_name", label: "Nama bisnis (resmi)", kind: "text" },
  { key: "email", label: "Email", kind: "text", placeholder: "nama@domain.com" },
  {
    key: "phone",
    label: "Telepon",
    kind: "text",
    placeholder: "+62 812-3456-7890",
    help: "Ditampilkan apa adanya di situs.",
  },
  {
    key: "whatsapp",
    label: "Nomor WhatsApp",
    kind: "text",
    placeholder: "081234567890",
    help: "Boleh diawali 0 atau 62 — keduanya diterima dan diperbaiki otomatis.",
  },
  { key: "street", label: "Alamat jalan", kind: "text" },
  { key: "city", label: "Kota", kind: "text" },
  { key: "region", label: "Provinsi", kind: "text" },
  { key: "postal_code", label: "Kode pos", kind: "text" },
  {
    key: "price_range",
    label: "Kisaran harga",
    kind: "text",
    placeholder: "Rp 45.000 - Rp 117.000",
    help: "Muncul di data terstruktur yang dibaca Google.",
  },
  {
    key: "social",
    label: "Media sosial",
    kind: "pairs",
    help: "Kiri nama platform (instagram, tiktok, facebook), kanan alamat lengkapnya.",
  },
];

export const SEO_FIELDS: FieldDescriptor[] = [
  {
    key: "default_title",
    label: "Judul situs",
    kind: "text",
    help: "Tampil di tab browser dan sebagai judul di hasil pencarian Google.",
  },
  {
    key: "default_description",
    label: "Deskripsi situs",
    kind: "textarea",
    help: "Paling baik 120–155 karakter. Ini kalimat yang dibaca orang di hasil pencarian sebelum memutuskan mengklik.",
  },
  {
    key: "favicon",
    label: "Favicon",
    kind: "imageUrl",
    help: "Ikon kecil di tab browser. Persegi, minimal 512×512. Kosongkan untuk memakai bawaan.",
  },
  {
    key: "default_og_image",
    label: "Gambar pratinjau berbagi",
    kind: "imageUrl",
    help: "Yang muncul saat tautan dikirim di WhatsApp, Instagram, atau Facebook. Ukuran ideal 1200×630 (mendatar). Kosongkan untuk memakai gambar yang dibuat otomatis dari nama dan warna situs.",
  },
];
