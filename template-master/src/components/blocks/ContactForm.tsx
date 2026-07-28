"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitLead, type LeadState } from "@/app/actions/lead";

const initialState: LeadState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={pending}>
      {pending ? "Mengirim…" : "Kirim Pesan"}
    </button>
  );
}

const field =
  "w-full rounded-[var(--brand-radius)] border border-hairline bg-surface px-4 py-3 text-sm " +
  "outline-none transition-colors focus:border-brand";

export function ContactForm() {
  const [state, formAction] = useActionState(submitLead, initialState);

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="card p-6 text-sm"
      >
        <p className="font-medium">Pesan terkirim.</p>
        <p className="prose-body mt-1">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          Nama <span aria-hidden="true">*</span>
        </label>
        <input
          id="name" name="name" required autoComplete="name" className={field}
          aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
        />
        {state.fieldErrors?.name ? (
          <p id="name-error" className="mt-1 text-xs text-red-600">{state.fieldErrors.name}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" className={field} />
          {state.fieldErrors?.email ? (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">WhatsApp</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className={field} />
        </div>
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium">Pesan</label>
        <textarea id="message" name="message" rows={4} className={field} />
      </div>

      {/* Honeypot — disembunyikan dari manusia dan pembaca layar. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company">Perusahaan</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === "error" && state.message ? (
        <p role="alert" className="text-sm text-red-600">{state.message}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
