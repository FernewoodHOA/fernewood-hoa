"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { sendMagicLink, type LoginState } from "./actions";
import Turnstile from "@/components/Turnstile";

const initialState: LoginState = { status: "idle" };

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
          : "Email me a sign-in link"}
    </button>
  );
}

export default function LoginForm({
  next,
  siteKey,
}: {
  next: string;
  siteKey?: string;
}) {
  const [state, formAction] = useActionState(sendMagicLink, initialState);

  // Turnstile tokens are single use. Hold the button until one arrives, and
  // re-issue after a rejected submission so a resident who mistypes their
  // address isn't then told they're a robot.
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (state.status === "error") {
      setToken(null);
      setResetKey((n) => n + 1);
    }
  }, [state]);

  const waitingForTurnstile = Boolean(siteKey) && token === null;

  if (state.status === "sent") {
    return (
      <div className="max-w-lg rounded-lg border border-emerald-700/30 bg-emerald-50 p-5">
        <p className="font-medium text-emerald-900">Check your email</p>
        <p className="mt-1 text-sm text-stone-700">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      {/*
        Honeypot. Hidden from people and from screen readers, so anything that
        fills it in is a bot. Kept out of the tab order too.
      */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-emerald-950">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-emerald-900/20 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
        />
        <p className="text-xs text-stone-500">
          Use the address you registered with. No password needed.
        </p>
      </div>

      <Turnstile siteKey={siteKey} onToken={setToken} resetKey={resetKey} />
      <SubmitButton waiting={waitingForTurnstile} />
    </form>
  );
}
