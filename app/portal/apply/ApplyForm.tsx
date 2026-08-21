"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitApplication, type ApplyState } from "./actions";
import Turnstile from "@/components/Turnstile";

const initialState: ApplyState = { status: "idle" };

function SubmitButton({ waiting }: { waiting: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || waiting}
      className="w-fit rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 disabled:opacity-60"
    >
      {pending
        ? "Submitting…"
        : waiting
          ? "Checking you're not a robot…"
          : "Submit Request"}
    </button>
  );
}

const fieldClass =
  "w-full rounded-md border border-emerald-900/20 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700";

export default function ApplyForm({ siteKey }: { siteKey?: string }) {
  const [state, formAction] = useActionState(submitApplication, initialState);

  // Turnstile tokens are single use, and this form re-renders in place on a
  // validation error — so without re-issuing, an applicant who mistypes their
  // address is then told they're a robot and has to reload to escape.
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (state.status === "error") {
      setToken(null);
      setResetKey((n) => n + 1);
    }
  }, [state]);

  const waitingForTurnstile = Boolean(siteKey) && token === null;

  if (state.status === "success") {
    return (
      <div className="rounded-lg border border-emerald-700/30 bg-emerald-50 p-5">
        <p className="font-medium text-emerald-900">Request received</p>
        <p className="mt-1 text-sm text-stone-700">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {state.message}
        </p>
      )}

      {/* Honeypot — invisible to people, irresistible to bots. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="fullName" className="text-sm font-medium text-emerald-950">
          Full name
        </label>
        <input id="fullName" name="fullName" required className={fieldClass} />
        {state.fieldErrors?.fullName && (
          <p className="text-sm text-red-700">{state.fieldErrors.fullName}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="address" className="text-sm font-medium text-emerald-950">
          Fernewood property address
        </label>
        <input
          id="address"
          name="address"
          required
          placeholder="e.g. 123 Farmington"
          className={fieldClass}
        />
        <p className="text-xs text-stone-500">
          Used to confirm you&apos;re a Fernewood resident.
        </p>
        {state.fieldErrors?.address && (
          <p className="text-sm text-red-700">{state.fieldErrors.address}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-emerald-950">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className={fieldClass}
        />
        <p className="text-xs text-stone-500">
          This is how you&apos;ll sign in, so use an address you check.
        </p>
        {state.fieldErrors?.email && (
          <p className="text-sm text-red-700">{state.fieldErrors.email}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium text-emerald-950">
          Phone number <span className="font-normal text-stone-500">(optional)</span>
        </label>
        <input id="phone" name="phone" type="tel" className={fieldClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="note" className="text-sm font-medium text-emerald-950">
          Anything the board should know?{" "}
          <span className="font-normal text-stone-500">(optional)</span>
        </label>
        <textarea id="note" name="note" rows={3} className={fieldClass} />
      </div>

      <Turnstile siteKey={siteKey} onToken={setToken} resetKey={resetKey} />
      <SubmitButton waiting={waitingForTurnstile} />
    </form>
  );
}
