/**
 * Supabase Edge Function — notifikasi terpusat.
 *
 * Satu Database Webhook memanggil satu function ini; function inilah yang
 * memutuskan kirim WhatsApp, email, atau keduanya. Logika notifikasi sengaja
 * tidak disebar ke banyak tempat supaya saat penyedia WA diganti, hanya satu
 * berkas yang berubah.
 *
 * Pasang webhook:
 *   Database → Webhooks → Create
 *   Table: leads (dan orders bila add-on payment aktif)
 *   Events: INSERT
 *   Type: Supabase Edge Function → notify
 *
 * Secret yang dibutuhkan:
 *   supabase secrets set RESEND_API_KEY=... FONNTE_TOKEN=... WEBHOOK_SECRET=...
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Record<string, unknown>;
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

async function sendEmail(to: string, subject: string, html: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key || !to) return;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Seawise <notifikasi@seawise.cc>", to, subject, html }),
  });

  if (!res.ok) console.error("[notify] email gagal:", await res.text());
}

async function sendWhatsApp(target: string, message: string) {
  const token = Deno.env.get("FONNTE_TOKEN");
  if (!token || !target) return;

  const res = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json" },
    body: JSON.stringify({ target, message }),
  });

  if (!res.ok) console.error("[notify] whatsapp gagal:", await res.text());
}

Deno.serve(async (req) => {
  // Webhook harus dianggap endpoint publik — verifikasi sebelum memproses.
  const secret = Deno.env.get("WEBHOOK_SECRET");
  if (secret && req.headers.get("x-webhook-secret") !== secret) {
    return new Response("unauthorized", { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }

  if (payload.type !== "INSERT") {
    return new Response("ignored", { status: 200 });
  }

  const siteId = payload.record.site_id as string | undefined;
  if (!siteId) return new Response("no site_id", { status: 400 });

  const { data: site } = await supabase
    .from("sites")
    .select("name, business_info, features")
    .eq("id", siteId)
    .maybeSingle();

  if (!site) return new Response("site not found", { status: 404 });

  const business = (site.business_info ?? {}) as Record<string, string>;
  const features = (site.features ?? {}) as Record<string, boolean>;

  if (payload.table === "leads") {
    const r = payload.record as Record<string, string>;
    const lines = [
      `Pesan baru di ${site.name}`,
      "",
      `Nama    : ${r.name}`,
      r.email ? `Email   : ${r.email}` : "",
      r.phone ? `WhatsApp: ${r.phone}` : "",
      "",
      r.message ?? "",
    ].filter(Boolean);

    await sendEmail(
      business.email ?? "",
      `Pesan baru dari ${r.name}`,
      lines.map((l) => `<p>${l}</p>`).join(""),
    );

    // Notifikasi WA otomatis hanya untuk klien yang membeli add-on.
    if (features.wa_auto) {
      await sendWhatsApp(business.whatsapp ?? "", lines.join("\n"));
    }
  }

  if (payload.table === "orders") {
    const r = payload.record as Record<string, string | number>;
    const text = `Pesanan baru di ${site.name}\nNo. ${r.order_number}\nTotal: Rp ${r.total}`;

    await sendEmail(business.email ?? "", `Pesanan baru #${r.order_number}`, `<p>${text}</p>`);
    if (features.wa_auto) await sendWhatsApp(business.whatsapp ?? "", text);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
