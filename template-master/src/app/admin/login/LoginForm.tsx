"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });

    if (signInError) {
      // Pesan disamarkan agar tidak membocorkan email mana yang terdaftar.
      setError("Email atau kata sandi tidak cocok.");
      setPending(false);
      return;
    }

    router.replace(params.get("next") ?? "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="admin-label">Email</label>
        <input
          id="email" name="email" type="email" required
          autoComplete="email" autoFocus className="admin-field"
        />
      </div>

      <div>
        <label htmlFor="password" className="admin-label">Kata sandi</label>
        <input
          id="password" name="password" type="password" required
          autoComplete="current-password" className="admin-field"
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-[var(--brand-radius)] bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}
