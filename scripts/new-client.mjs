#!/usr/bin/env node
/**
 * Provisioning klien baru.
 *
 *   node scripts/new-client.mjs --slug villa-anandia --name "Villa Anandia" \
 *        --vertical lodging --tier reef --domain villaanandia.com
 *
 * Skrip ini membuat baris `sites`, halaman `home`, dan satu set
 * content_blocks awal sesuai vertical — supaya onboarding klien baru
 * jadi satu perintah, bukan pekerjaan manual berulang di dashboard.
 *
 * Butuh SUPABASE_SECRET_KEY (Dashboard → API Keys → Secret key).
 * Kunci ini melewati RLS sepenuhnya — JANGAN commit dan jangan pasang di Vercel.
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
import { randomUUID } from "node:crypto";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith("--")) acc.push([cur.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);

const required = ["slug", "name"];
for (const key of required) {
  if (!args[key]) {
    console.error(`Argumen --${key} wajib diisi.`);
    process.exit(1);
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SECRET_KEY dulu.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const vertical = args.vertical ?? "generic";
const tier = args.tier ?? "shore";

/** Blok awal per vertical — dasar yang tinggal diisi kontennya. */
const STARTER_BLOCKS = {
  generic: ["hero", "about", "services", "gallery", "faq", "contact"],
  cosmetics: ["hero", "about", "products", "testimonials", "faq", "contact"],
  restaurant: ["hero", "about", "menu", "gallery", "testimonials", "contact"],
  lodging: ["hero", "about", "rooms", "gallery", "testimonials", "faq", "contact"],
  retail: ["hero", "about", "products", "gallery", "contact"],
  service: ["hero", "about", "services", "testimonials", "faq", "contact"],
};

/** Fitur yang aktif per tier — cocokkan dengan tabel paket di dokumen harga. */
const TIER_FEATURES = {
  shore:   { admin_panel: false, reorder: false, payment: false, wa_auto: false },
  reef:    { admin_panel: true,  reorder: false, payment: false, wa_auto: false },
  current: { admin_panel: true,  reorder: true,  payment: false, wa_auto: false },
  trench:  { admin_panel: true,  reorder: true,  payment: true,  wa_auto: true },
};

const siteId = randomUUID();

const { error: siteError } = await supabase.from("sites").insert({
  id: siteId,
  slug: args.slug,
  name: args.name,
  domain: args.domain ?? null,
  vertical,
  tier,
  status: "draft",
  theme_config: {
    preset: "coastal",
    colors: {
      primary: "#0f5c73", secondary: "#7fb7c4", accent: "#e8b04b",
      background: "#fbfaf7", foreground: "#12222a", muted: "#eef2f3",
    },
    fonts: { heading: "fraunces", body: "inter" },
    radius: "md",
    motion: "subtle",
  },
  seo_config: {
    title_template: `%s | ${args.name}`,
    default_title: args.name,
    default_description: "",
    noindex: true, // dibuka setelah klien menyetujui isi situs
  },
  business_info: { legal_name: args.name, country: "ID" },
  features: TIER_FEATURES[tier] ?? TIER_FEATURES.shore,
});

if (siteError) {
  console.error("Gagal membuat site:", siteError.message);
  process.exit(1);
}

await supabase.from("pages").insert({
  site_id: siteId,
  slug: "home",
  title: "Beranda",
  nav_label: "Beranda",
  published: true,
});

const types = STARTER_BLOCKS[vertical] ?? STARTER_BLOCKS.generic;

await supabase.from("content_blocks").insert(
  types.map((type, position) => ({
    site_id: siteId,
    page_slug: "home",
    type,
    position,
    published: false,
    data: {},
  })),
);

console.log(`
Klien "${args.name}" dibuat.

  site_id  : ${siteId}
  vertical : ${vertical}
  tier     : ${tier}
  section  : ${types.join(", ")}

Langkah berikutnya:
  1. Buat Vercel project baru dari repo template-master.
  2. Isi env var:
       NEXT_PUBLIC_SITE_ID=${siteId}
       NEXT_PUBLIC_SITE_URL=https://${args.domain ?? "domain-klien.com"}
  3. Isi konten lewat /admin, lalu ubah sites.status jadi 'active'
     dan seo_config.noindex jadi false saat siap tayang.
`);
