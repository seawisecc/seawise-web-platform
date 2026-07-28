import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import "../admin.css";

export const metadata: Metadata = {
  title: "Masuk",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="admin-ui">
      <div className="container-page flex min-h-dvh items-center justify-center py-16">
        <div className="w-full max-w-sm">
          <div className="card p-7">
            <h1 className="text-lg">Masuk ke panel</h1>
            <p className="mt-1.5 text-sm text-stone-600">
              Gunakan email yang terdaftar saat serah terima situs.
            </p>

            <div className="mt-7">
              <LoginForm />
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-stone-500">
            Lupa kata sandi? Hubungi Seawise untuk tautan pengaturan ulang.
          </p>
        </div>
      </div>
    </div>
  );
}
