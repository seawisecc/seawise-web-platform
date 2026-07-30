import type { BlockType } from "@/lib/blocks/schemas";

/**
 * Deskriptor formulir admin.
 *
 * Satu berkas ini menentukan seluruh tampilan editor: label berbahasa
 * Indonesia, urutan isian, teks bantuan, dan bentuk kontrolnya. Ditulis
 * manual — bukan hasil introspeksi Zod — supaya kalimat bantuan bisa
 * ditujukan ke pemilik bisnis, bukan ke programmer.
 *
 * Zod tetap menjadi penjaga terakhir: apa pun yang dikirim formulir
 * divalidasi ulang di server sebelum masuk database.
 */
export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "boolean"
  | "image"
  | "imageUrl"
  | "link"
  | "tags"
  | "pairs"
  | "variants"
  | "images"
  | "list";

export type FieldDescriptor = {
  key: string;
  label: string;
  kind: FieldKind;
  help?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** Untuk kind "list": kata benda tunggal, dipakai di tombol "Tambah …". */
  itemLabel?: string;
  /** Untuk kind "list": isian mana yang dipakai sebagai judul baris. */
  itemTitleKey?: string;
  /** Untuk kind "list": susunan isian tiap baris. Boleh bersarang. */
  itemFields?: FieldDescriptor[];
};

const imageField = (key = "image", label = "Gambar"): FieldDescriptor => ({
  key,
  label,
  kind: "image",
  help: "Teks alternatif dibaca Google dan pembaca layar. Jelaskan isi fotonya, bukan sekadar nama produk.",
});

export const BLOCK_FIELDS: Record<BlockType, FieldDescriptor[]> = {
  hero: [
    { key: "eyebrow", label: "Label kecil di atas judul", kind: "text", placeholder: "mis. Koleksi 2026" },
    {
      key: "headline",
      label: "Judul utama",
      kind: "text",
      help: "Menjadi judul terbesar halaman. Paling kuat bila 6–12 kata.",
    },
    {
      key: "subheadline",
      label: "Kalimat pendukung",
      kind: "textarea",
      help: "Dipakai juga sebagai deskripsi di hasil pencarian Google bila kolom SEO dikosongkan.",
    },
    {
      key: "alignment",
      label: "Perataan",
      kind: "select",
      options: [
        { value: "left", label: "Kiri (dengan gambar di samping)" },
        { value: "center", label: "Tengah (tanpa gambar)" },
      ],
    },
    imageField(),
    { key: "primary_cta", label: "Tombol utama", kind: "link" },
    { key: "secondary_cta", label: "Tombol kedua", kind: "link" },
  ],

  about: [
    { key: "title", label: "Judul", kind: "text", help: "Kalimat pernyataan lebih menjual daripada label seperti “Tentang Kami”." },
    { key: "body", label: "Isi", kind: "textarea" },
    imageField(),
    {
      key: "stats",
      label: "Angka sorotan",
      kind: "list",
      itemLabel: "angka",
      itemTitleKey: "label",
      itemFields: [
        { key: "value", label: "Angka", kind: "text", placeholder: "mis. 6-8 jam" },
        { key: "label", label: "Keterangan", kind: "text", placeholder: "mis. Ketahanan rata-rata" },
      ],
    },
  ],

  services: [
    { key: "title", label: "Judul bagian", kind: "text" },
    { key: "subtitle", label: "Subjudul", kind: "text" },
    {
      key: "layout",
      label: "Tata letak",
      kind: "select",
      options: [
        { value: "grid", label: "Kisi" },
        { value: "list", label: "Daftar" },
      ],
    },
    {
      key: "items",
      label: "Daftar layanan",
      kind: "list",
      itemLabel: "layanan",
      itemTitleKey: "title",
      itemFields: [
        { key: "title", label: "Nama layanan", kind: "text" },
        { key: "description", label: "Penjelasan", kind: "textarea" },
        { key: "price", label: "Harga (teks bebas)", kind: "text", placeholder: "mis. Mulai Rp 500.000" },
      ],
    },
  ],

  products: [
    { key: "title", label: "Judul bagian", kind: "text" },
    { key: "subtitle", label: "Subjudul", kind: "text" },
    { key: "title_en", label: "Judul bagian (English)", kind: "text" },
    { key: "subtitle_en", label: "Subjudul (English)", kind: "text" },
    {
      key: "items",
      label: "Produk",
      kind: "list",
      itemLabel: "produk",
      itemTitleKey: "name",
      itemFields: [
        { key: "name", label: "Nama produk", kind: "text" },
        { key: "description", label: "Deskripsi singkat", kind: "textarea" },
        {
          key: "name_en",
          label: "Nama produk (English)",
          kind: "text",
          help: "Kosongkan bila sama dengan bahasa Indonesia.",
        },
        { key: "description_en", label: "Deskripsi singkat (English)", kind: "textarea" },
        {
          key: "images",
          label: "Foto produk",
          kind: "images",
          help: "Bisa lebih dari satu. Foto pertama yang tampil; sisanya bisa digeser pengunjung.",
        },
        {
          key: "variants",
          label: "Ukuran & harga",
          kind: "variants",
          help: "Isi angka tanpa titik: 117000. Kosongkan bila produk hanya punya satu harga.",
        },
        {
          key: "details",
          label: "Rincian",
          kind: "pairs",
          help: "Untuk parfum: Atas / Tengah / Dasar. Kolom ketiga adalah label versi Inggris. Isinya sendiri tidak perlu diterjemahkan.",
        },
        { key: "sku", label: "Kode produk (SKU)", kind: "text", placeholder: "mis. LEU-AMS" },
        {
          key: "availability",
          label: "Ketersediaan",
          kind: "select",
          options: [
            { value: "InStock", label: "Tersedia" },
            { value: "OutOfStock", label: "Stok habis" },
            { value: "PreOrder", label: "Pre-order" },
          ],
        },
        { key: "bpom_number", label: "Nomor BPOM", kind: "text", help: "Khusus kosmetik. Ditampilkan di kartu produk." },
      ],
    },
  ],

  gallery: [
    { key: "title", label: "Judul bagian", kind: "text" },
    { key: "title_en", label: "Judul bagian (English)", kind: "text" },
    {
      key: "layout",
      label: "Tata letak",
      kind: "select",
      options: [
        { value: "grid", label: "Kisi rapi" },
        { value: "masonry", label: "Masonry (tinggi bervariasi)" },
        { value: "carousel", label: "Carousel" },
      ],
    },
    {
      key: "images",
      label: "Foto",
      kind: "images",
      help: "Teks alternatif tiap foto berpengaruh pada pencarian gambar Google.",
    },
  ],

  testimonials: [
    { key: "title", label: "Judul bagian", kind: "text" },
    {
      key: "items",
      label: "Testimoni",
      kind: "list",
      itemLabel: "testimoni",
      itemTitleKey: "author",
      itemFields: [
        { key: "quote", label: "Kutipan", kind: "textarea" },
        { key: "author", label: "Nama", kind: "text" },
        { key: "role", label: "Keterangan", kind: "text", placeholder: "mis. Pelanggan sejak 2024" },
        {
          key: "rating",
          label: "Rating (1–5)",
          kind: "number",
          help: "Diisi hanya bila ratingnya benar. Rating palsu melanggar aturan Google dan bisa membuat situs kena penalti.",
        },
      ],
    },
  ],

  faq: [
    { key: "title", label: "Judul bagian", kind: "text" },
    {
      key: "items",
      label: "Pertanyaan & jawaban",
      kind: "list",
      itemLabel: "pertanyaan",
      itemTitleKey: "question",
      itemFields: [
        { key: "question", label: "Pertanyaan", kind: "text" },
        { key: "answer", label: "Jawaban", kind: "textarea" },
      ],
    },
  ],

  contact: [
    { key: "title", label: "Judul bagian", kind: "text" },
    { key: "subtitle", label: "Subjudul", kind: "text" },
    { key: "show_form", label: "Tampilkan formulir pesan", kind: "boolean" },
    { key: "show_map", label: "Tampilkan peta", kind: "boolean" },
    {
      key: "whatsapp_text",
      label: "Teks awal WhatsApp",
      kind: "text",
      help: "Kalimat yang sudah terisi saat pengunjung menekan tombol WhatsApp.",
    },
  ],

  cta: [
    { key: "headline", label: "Judul ajakan", kind: "text" },
    { key: "body", label: "Penjelasan", kind: "textarea" },
    { key: "cta", label: "Tombol", kind: "link" },
  ],

  richtext: [
    { key: "title", label: "Judul", kind: "text" },
    { key: "body", label: "Isi", kind: "textarea" },
  ],

  menu: [
    { key: "title", label: "Judul bagian", kind: "text" },
    {
      key: "categories",
      label: "Kategori menu",
      kind: "list",
      itemLabel: "kategori",
      itemTitleKey: "name",
      itemFields: [
        { key: "name", label: "Nama kategori", kind: "text", placeholder: "mis. Kopi" },
        {
          key: "items",
          label: "Isi menu",
          kind: "list",
          itemLabel: "item",
          itemTitleKey: "name",
          itemFields: [
            { key: "name", label: "Nama", kind: "text" },
            { key: "description", label: "Keterangan", kind: "textarea" },
            { key: "price", label: "Harga", kind: "number", placeholder: "35000" },
            { key: "tags", label: "Label", kind: "tags", help: "Pisahkan dengan koma. Contoh: pedas, vegetarian" },
          ],
        },
      ],
    },
  ],

  rooms: [
    { key: "title", label: "Judul bagian", kind: "text" },
    {
      key: "items",
      label: "Tipe kamar",
      kind: "list",
      itemLabel: "kamar",
      itemTitleKey: "name",
      itemFields: [
        { key: "name", label: "Nama kamar", kind: "text" },
        { key: "description", label: "Deskripsi", kind: "textarea" },
        { key: "price_from", label: "Harga mulai (per malam)", kind: "number", placeholder: "1450000" },
        { key: "max_occupancy", label: "Kapasitas tamu", kind: "number" },
        { key: "bed_type", label: "Jenis ranjang", kind: "text", placeholder: "mis. King" },
        { key: "size_sqm", label: "Luas (m²)", kind: "number" },
        { key: "amenities", label: "Fasilitas", kind: "tags", help: "Pisahkan dengan koma." },
        { key: "images", label: "Foto kamar", kind: "images" },
        { key: "booking_url", label: "Tautan pemesanan", kind: "text" },
      ],
    },
  ],
};
