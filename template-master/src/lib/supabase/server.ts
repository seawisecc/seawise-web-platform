import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env, SUPABASE_KEY } from "@/lib/env";

/**
 * Client untuk render publik (Server Components). Tidak menyentuh cookie,
 * jadi hasilnya bisa di-cache dan halaman tetap statis.
 */
export function createPublicClient() {
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });
}

/**
 * Client dengan sesi user — dipakai di /admin dan Server Actions.
 * Membaca cookie, jadi route yang memakainya otomatis dinamis.
 */
export async function createAuthedClient() {
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Dipanggil dari Server Component — refresh sesi ditangani proxy.ts.
        }
      },
    },
  });
}
