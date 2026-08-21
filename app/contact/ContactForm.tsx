"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitInquiry, type ContactState } from "./actions";
import Turnstile from "@/components/Turnstile";

const initialState: ContactState = { status: "idle" };

const fieldClass =
  "w-full rounded-md border border-emerald-900/20 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700";

function SubmitButton({ waiting }: { waiting: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || waiting}
      className="w-fit rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 disabled:opacity-60"
    >
      {pending
        ? "Sending…"
        : waiting
          ? "Checking you're not a robot…"
          : "Send Message"}
    </button>
  );
}

export default function ContactForm({ siteKey }: { siteKey?: string }) {
  const [state, formAction] = useActionState(submitInquiry, initialState);

  // Turnstile tokens are single use; re-issue after a rejected submission so a
  // visitor who trips validation isn't then told they're a robot.
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
      <div className="max-w-lg rounded-lg border border-emerald-700/30 bg-emerald-50 p-5">
        <p className="font-medium text-emerald-900">Message sent</p>
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

      {/* Honeypot — hidden from people, tempting to bots. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-emerald-950">
          Your name
        </label>
        <input id="name" name="name" required className={fieldClass} />
        {state.fieldErrors?.name && (
          <p className="text-sm text-red-700">{state.fieldErrors.name}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-emerald-950">
          Your email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className={fieldClass}
        />
        <p className="text-xs text-stone-500">So the board can reply to you.</p>
        {state.fieldErrors?.email && (
          <p className="text-sm text-red-700">{state.fieldErrors.email}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="subject" className="text-sm font-medium text-emerald-950">
          Subject <span className="font-normal text-stone-500">(optional)</span>
        </label>
        <input id="subject" name="subject" className={fieldClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="message" className="text-sm font-medium text-emerald-950">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          maxLength={5000}
          className={fieldClass}
        />
        {state.fieldErrors?.message && (
          <p className="text-sm text-red-700">{state.fieldErrors.message}</p>
        )}
      </div>

      <Turnstile siteKey={siteKey} onToken={setToken} resetKey={resetKey} />
      <SubmitButton waiting={waitingForTurnstile} />
    </form>
  );
}
