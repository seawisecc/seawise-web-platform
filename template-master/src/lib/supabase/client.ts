"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env, SUPABASE_KEY } from "@/lib/env";

export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_KEY,
  );
}
