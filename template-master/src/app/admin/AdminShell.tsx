import Link from "next/link";
import { redirect } from "next/navigation";
import { createAuthedClient } from "@/lib/supabase/server";
import { SITE_ID } from "@/lib/env";
import { getSite } from "@/lib/site";
import { signOut } from "./actions";
import "./admin.css";

/**
 * Penjaga akses sekaligus kerangka panel admin.
 *
 * Sengaja berupa komponen, bukan layout. Kalau penjaga ini diletakkan di
 * `app/admin/layout.tsx`, halaman login ikut terkena — dan halaman login
 * yang mewajibkan login menghasilkan pengalihan tak berujung.
 */
export async function AdminShell({
  children,
  title,
  description,
  back,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  back?: { href: string; label: string };
}) {
  const supabase = await createAuthedClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  // Ambil semua baris profil, bukan maybeSingle(). Satu orang bisa memiliki
  // lebih dari satu situs — dan maybeSingle() melempar error begitu barisnya
  // lebih dari satu, sehingga pemilik dua bisnis justru terkunci dari panel.
  const { data: profiles } = await supabase
    .from("profiles")
    .select("role, site_id")
    .eq("user_id", user.id);

  const rows = profiles ?? [];
  const allowed = rows.some((p) => p.role === "superadmin" || p.site_id === SITE_ID);

  if (!allowed) {
    return (
      <div className="admin-ui">
        <div className="container-page flex min-h-dvh flex-col items-center justify-center text-center">
          <h1 className="text-xl">Akses ditolak</h1>
          <p className="mt-2 max-w-sm text-sm text-stone-600">
            Akun ini tidak terdaftar sebagai pengelola situs tersebut.
          </p>
          <form action={signOut} className="mt-6">
            <button className="btn btn-outline">Keluar</button>
          </form>
        </div>
      </div>
    );
  }

  const site = await getSite();
  const isSuperadmin = rows.some((p) => p.role === "superadmin");

  return (
    <div className="admin-ui">
      <header className="sticky top-0 z-40 border-b border-hairline bg-white/85 backdrop-blur">
        <div className="container-page flex h-14 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate text-sm font-semibold">{site?.name ?? "Situs"}</span>
            {isSuperadmin ? (
              <span className="hidden shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600 sm:inline">
                superadmin
              </span>
            ) : null}
          </div>

          <nav aria-label="Navigasi panel" className="flex items-center gap-1 text-sm">
            <Link href="/admin" className="rounded-md px-2.5 py-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900">
              Konten
            </Link>
            <Link href="/admin/leads" className="rounded-md px-2.5 py-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900">
              Pesan
            </Link>
            <Link href="/admin/situs" className="rounded-md px-2.5 py-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900">
              Pengaturan
            </Link>
            <Link
              href="/"
              target="_blank"
              className="hidden rounded-md px-2.5 py-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900 sm:block"
            >
              Lihat situs ↗
            </Link>
            <form action={signOut} className="ml-1">
              <button className="btn btn-outline h-8 px-3 text-[13px]">Keluar</button>
            </form>
          </nav>
        </div>
      </header>

      <main className="container-page max-w-4xl py-8 md:py-10">
        {back ? (
          <Link href={back.href} className="mb-4 inline-block text-sm text-stone-500 hover:text-stone-900">
            ← {back.label}
          </Link>
        ) : null}

        {title ? (
          <div className="mb-8">
            <h1 className="text-2xl">{title}</h1>
            {description ? (
              <p className="mt-1.5 text-sm text-stone-600">{description}</p>
            ) : null}
          </div>
        ) : null}

        {children}
      </main>
    </div>
  );
}
