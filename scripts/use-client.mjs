#!/usr/bin/env node
/**
 * Berpindah klien yang sedang dikerjakan.
 *
 *   npm run client            → tampilkan daftar dan klien yang aktif
 *   npm run client leuca      → alihkan seluruh perkakas ke Leuca
 *
 * Cara kerjanya: menyusun ulang template-master/.env.local dari tiga
 * potongan — setelan bersama, setelan klien, dan kunci rahasia lokal.
 *
 * Kenapa ini ada. Membedakan klien hanya lewat satu UUID itu rancangan yang
 * bagus untuk server, tapi berbahaya untuk manusia: satu digit tertukar dan
 * kamu mengedit situs klien yang salah tanpa ada satu pun pesan kesalahan.
 * Sebuah nama jauh lebih sulit disalahketik daripada
 * "7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f".
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLIENTS_DIR = join(ROOT, "clients");
const ENV_TARGET = join(ROOT, "template-master", ".env.local");

const SHARED = join(CLIENTS_DIR, "shared.env");
const SECRET = join(CLIENTS_DIR, "secret.env");

/* ----------------------------- pembacaan ----------------------------- */

function readEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

function listClients() {
  if (!existsSync(CLIENTS_DIR)) return [];
  return readdirSync(CLIENTS_DIR)
    .filter((f) => f.endsWith(".env") && !["shared.env", "secret.env"].includes(f))
    .map((f) => f.replace(/\.env$/, ""))
    .sort();
}

/** Cocokkan SITE_ID yang sedang aktif dengan nama kliennya. */
function activeClient() {
  const current = readEnv(ENV_TARGET).NEXT_PUBLIC_SITE_ID;
  if (!current) return null;
  for (const name of listClients()) {
    if (readEnv(join(CLIENTS_DIR, `${name}.env`)).NEXT_PUBLIC_SITE_ID === current) {
      return name;
    }
  }
  return `(tidak dikenal: ${current})`;
}

/* ------------------------------ perintah ------------------------------ */

const clients = listClients();
const target = process.argv[2];

if (clients.length === 0) {
  console.error(`Belum ada berkas klien di ${CLIENTS_DIR}/`);
  console.error("Buat satu berkas per klien, mis. clients/leuca.env");
  process.exit(1);
}

if (!target) {
  const active = activeClient();
  console.log("\nKlien yang tersedia:\n");
  for (const name of clients) {
    console.log(`  ${name === active ? "●" : "○"} ${name}`);
  }
  console.log(`\nSedang aktif: ${active ?? "belum ada"}`);
  console.log("\nGanti dengan:  npm run client <nama>\n");
  process.exit(0);
}

const clientFile = join(CLIENTS_DIR, `${target}.env`);

if (!existsSync(clientFile)) {
  console.error(`\nKlien "${target}" tidak ada.`);
  console.error(`Pilihan: ${clients.join(", ")}\n`);
  process.exit(1);
}

const shared = readEnv(SHARED);
const client = readEnv(clientFile);
const secret = readEnv(SECRET);

// Diperiksa di sini, bukan dibiarkan gagal saat aplikasi berjalan. Pesan
// "Invalid UUID" di tengah `npm run dev` tidak memberi tahu apa pun tentang
// berkas mana yang perlu diperbaiki.
const missing = [];
if (!shared.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL (clients/shared.env)");
if (!shared.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (clients/shared.env)");
if (!client.NEXT_PUBLIC_SITE_ID) missing.push(`NEXT_PUBLIC_SITE_ID (clients/${target}.env)`);

if (missing.length > 0) {
  console.error("\nSetelan berikut belum terisi:\n");
  for (const m of missing) console.error(`  - ${m}`);
  console.error("");
  process.exit(1);
}

const merged = { ...shared, ...client, ...secret };

// Saat pengembangan situs selalu dilayani dari localhost. Alamat produksi di
// berkas klien tetap disimpan karena dipakai Vercel, tapi memakainya di sini
// membuat tautan pratinjau menunjuk ke situs yang sudah tayang.
merged.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";

const body = [
  "# BERKAS INI DIHASILKAN OTOMATIS — jangan diedit langsung.",
  `# Sumber: clients/shared.env + clients/${target}.env + clients/secret.env`,
  "# Ubah salah satu berkas itu, lalu jalankan: npm run client " + target,
  "",
  ...Object.entries(merged).map(([k, v]) => `${k}=${v}`),
  "",
].join("\n");

writeFileSync(ENV_TARGET, body);

console.log(`\n✓ Sekarang mengerjakan: ${target}`);
console.log(`  situs   ${client.NEXT_PUBLIC_SITE_URL ?? "(alamat produksi belum diisi)"}`);
console.log(`  site_id ${client.NEXT_PUBLIC_SITE_ID}`);
console.log("\nJalankan ulang npm run dev agar setelan baru terbaca.\n");
