"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitApplication, type ApplyState } from "./actions";

const initialState: ApplyState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-fit rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 disabled:opacity-60"
    >
      {pending ? "Submitting…" : "Submit Request"}
    </button>
  );
}

const fieldClass =
  "w-full rounded-md border border-emerald-900/20 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700";

export default function ApplyForm() {
  const [state, formAction] = useActionState(submitApplication, initialState);

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

      <SubmitButton />
    </form>
  );
}
