/**
 * Layout ini sengaja tidak melakukan pengecekan login.
 *
 * Halaman /admin/login berada di bawah folder yang sama, jadi apa pun yang
 * ditaruh di sini juga berlaku untuk halaman login. Penjaga akses ada di
 * komponen AdminShell, dipanggil per halaman yang memang perlu dilindungi.
 */

// Panel admin selalu dinamis — tidak boleh ada cache lintas pengguna.
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
