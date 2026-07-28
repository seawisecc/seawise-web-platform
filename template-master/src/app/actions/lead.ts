"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/server";
import { SITE_ID } from "@/lib/env";

const leadSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(120),
  email: z.email("Format email tidak valid").optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  // Field jebakan untuk bot: manusia tidak akan mengisinya.
  company: z.string().max(0).optional(),
});

export type LeadState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const parsed = leadSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    message: formData.get("message") ?? "",
    company: formData.get("company") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", message: "Mohon periksa kembali isian Anda.", fieldErrors };
  }

  // Honeypot terisi → diamkan, jangan beri sinyal ke bot.
  if (parsed.data.company) {
    return { status: "success", message: "Terima kasih, pesan Anda sudah kami terima." };
  }

  if (!parsed.data.email && !parsed.data.phone) {
    return {
      status: "error",
      message: "Isi email atau nomor telepon supaya kami bisa membalas.",
      fieldErrors: { email: "Isi salah satu: email atau telepon." },
    };
  }

  const headerList = await headers();
  const supabase = createPublicClient();

  const { error } = await supabase.from("leads").insert({
    site_id: SITE_ID,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    message: parsed.data.message || null,
    source: "contact_form",
    meta: {
      referer: headerList.get("referer") ?? null,
      user_agent: headerList.get("user-agent")?.slice(0, 200) ?? null,
    },
  });

  if (error) {
    console.error("[lead] gagal menyimpan:", error.message);
    return {
      status: "error",
      message: "Maaf, pesan gagal terkirim. Silakan hubungi kami lewat WhatsApp.",
    };
  }

  // Notifikasi WA/email ditangani Supabase Database Webhook → Edge Function
  // (lihat docs/05-add-ons.md), bukan di sini.
  return { status: "success", message: "Terima kasih, kami akan membalas dalam 1x24 jam." };
}
