#!/usr/bin/env node
/**
 * Pindahkan gambar dari folder lokal ke Supabase Storage, lalu perbarui
 * alamatnya di seluruh konten situs.
 *
 * Kredensial dibaca otomatis dari template-master/.env.local.
 *
 *   node scripts/upload-media.mjs \
 *     --site-id 7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f \
 *     --dir template-master/public/leuca \
 *     --replace /leuca
 *
 * `--replace` menyebut awalan alamat lama yang harus ditukar. Tanpa itu,
 * berkas tetap diunggah tapi konten tidak disentuh.
 *
 * Tambahkan --dry-run untuk melihat rencananya tanpa mengubah apa pun.
 */

import { createRequire } from "node:module";

/**
 * Dependensi terpasang di template-master/node_modules, sedangkan skrip ini
 * berada di scripts/. Node mencari paket naik dari lokasi berkas, bukan dari
 * folder tempat perintah dijalankan — jadi resolusinya diarahkan manual ke
 * package.json aplikasi. Dengan begini tidak perlu ada node_modules kedua di
 * akar repo hanya demi beberapa skrip.
 */
const require = createRequire(new URL("../template-master/package.json", import.meta.url));
const { createClient } = require("@supabase/supabase-js");
import { readdir, readFile } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { extname, basename, join } from "node:path";

/**
 * Baca template-master/.env.local kalau ada, supaya tidak perlu `export`
 * manual tiap menjalankan skrip. Nilai dari environment tetap menang, dan
 * berkas itu sudah masuk .gitignore sehingga kuncinya tidak ikut ter-commit.
 */
/** Mencatat dari mana tiap nilai berasal, untuk pesan kesalahan. */
const SOURCE = {};

function loadEnvLocal() {
  const root = new URL("../", import.meta.url).pathname;
  const candidates = [
    `${root}template-master/.env.local`,
    `${root}.env.local`,
    "template-master/.env.local",
    ".env.local",
  ];
  const fromFile = {};

  for (const path of candidates) {
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      const value = m[2].trim().replace(/^["']|["']$/g, "");
      // Baris terakhir menang. Setelah kunci dirotasi, orang cenderung
      // menambahkan baris baru alih-alih menyunting yang lama — kalau baris
      // pertama yang dipakai, kunci kedaluwarsa itu yang terus terbaca.
      if (value) fromFile[m[1]] = value;
    }
    break;
  }

  for (const [key, value] of Object.entries(fromFile)) {
    if (!process.env[key]) {
      process.env[key] = value;
      SOURCE[key] = ".env.local";
    } else {
      SOURCE[key] = "variabel shell";
    }
  }
}


loadEnvLocal();

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const has = (name) => argv.includes(`--${name}`);

const siteId = flag("site-id");
const dir = flag("dir");
const replacePrefix = flag("replace");
const dryRun = has("dry-run");

if (!siteId || !dir) {
  console.error("Wajib: --site-id <uuid> --dir <folder>");
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SECRET) {
  console.error(`
Kredensial belum lengkap.

  NEXT_PUBLIC_SUPABASE_URL : ${SUPABASE_URL ? "terbaca" : "KOSONG"}
  SUPABASE_SECRET_KEY      : ${SECRET ? "terbaca" : "KOSONG"}

Cara termudah: tambahkan satu baris ini di template-master/.env.local

  SUPABASE_SECRET_KEY=sb_secret_xxxxx

Ambil nilainya di Supabase → Project Settings → API Keys → Secret key.
Berkas .env.local sudah masuk .gitignore, jadi kunci itu tidak ikut ter-commit.
`);
  process.exit(1);
}

if (SECRET.includes("...") || SECRET.length < 20) {
  const from = SOURCE.SUPABASE_SECRET_KEY ?? "variabel shell";
  console.error(`
SUPABASE_SECRET_KEY masih berupa contoh, bukan kunci asli.

  Nilainya terbaca dari : ${from}
  Yang terbaca          : ${SECRET.slice(0, 14)}…

${from === "variabel shell" ? `Nilai dari variabel shell mengalahkan isi .env.local. Kemungkinan
ia tertinggal dari perintah \`export\` sebelumnya di sesi Terminal ini.

Bersihkan lalu ulangi:

  unset SUPABASE_SECRET_KEY
` : "Perbaiki baris SUPABASE_SECRET_KEY di template-master/.env.local."}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SECRET, { auth: { persistSession: false } });
const BUCKET = "site-media";

const MIME = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".avif": "image/avif", ".svg": "image/svg+xml",
};

const files = (await readdir(dir)).filter((f) => MIME[extname(f).toLowerCase()]);

if (files.length === 0) {
  console.error(`Tidak ada gambar di ${dir}`);
  process.exit(1);
}

console.log(`\n${files.length} gambar ditemukan di ${dir}\n`);

const mapping = new Map();

for (const file of files) {
  const ext = extname(file).toLowerCase();
  const path = `${siteId}/${basename(file)}`;
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;

  if (dryRun) {
    console.log(`  [rencana] ${file} → ${path}`);
    mapping.set(file, publicUrl);
    continue;
  }

  const body = await readFile(join(dir, file));
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: MIME[ext],
    cacheControl: "31536000",
    upsert: true,
  });

  if (error) {
    console.error(`  gagal  ${file}: ${error.message}`);
    continue;
  }

  console.log(`  unggah ${file}`);
  mapping.set(file, publicUrl);
}

if (!replacePrefix) {
  console.log("\nSelesai mengunggah. Tanpa --replace, konten tidak diubah.\n");
  process.exit(0);
}

// ---------------------------------------------------------------------
// Tukar alamat lama di dalam JSONB konten.
//
// Penukaran dilakukan pada bentuk teks JSON lalu diurai kembali. Cara ini
// menjangkau alamat gambar di kedalaman mana pun — di dalam produk, varian,
// atau galeri — tanpa perlu tahu struktur tiap tipe blok.
// ---------------------------------------------------------------------
const { data: blocks, error: readError } = await supabase
  .from("content_blocks")
  .select("id, type, data")
  .eq("site_id", siteId);

if (readError) {
  console.error("Gagal membaca konten:", readError.message);
  process.exit(1);
}

let changed = 0;

for (const block of blocks ?? []) {
  let json = JSON.stringify(block.data ?? {});
  const before = json;

  for (const [file, url] of mapping) {
    json = json.split(`${replacePrefix}/${file}`).join(url);
  }

  if (json === before) continue;

  if (dryRun) {
    console.log(`  [rencana] perbarui blok ${block.type} (${block.id})`);
    changed++;
    continue;
  }

  const { error } = await supabase
    .from("content_blocks")
    .update({ data: JSON.parse(json) })
    .eq("id", block.id)
    .eq("site_id", siteId);

  if (error) console.error(`  gagal memperbarui ${block.id}: ${error.message}`);
  else {
    console.log(`  perbarui blok ${block.type}`);
    changed++;
  }
}

console.log(`\n${changed} blok diperbarui.`);
console.log(
  dryRun
    ? "Ini hanya rencana. Jalankan ulang tanpa --dry-run untuk menerapkannya.\n"
    : "Selesai. Hapus folder lokalnya setelah situs dipastikan tampil benar.\n",
);
