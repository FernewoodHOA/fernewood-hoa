"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestReservation, type RequestState } from "./actions";

const initial: RequestState = { status: "idle" };

const field =
  "w-full rounded-md border border-emerald-900/20 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-fit rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 disabled:opacity-60"
    >
      {pending ? "Submitting…" : "Request the pavilion"}
    </button>
  );
}

export default function RequestForm({ today }: { today: string }) {
  const [state, formAction] = useActionState(requestReservation, initial);

  if (state.status === "ok") {
    return (
      <div className="rounded-lg border border-emerald-700/30 bg-emerald-50 p-5">
        <p className="font-medium text-emerald-900">Request submitted</p>
        <p className="mt-1 text-sm text-stone-700">{state.message}</p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-emerald-900/10 bg-white p-6"
    >
      <h2 className="font-semibold text-emerald-950">Request the pavilion</h2>

      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="event_date" className="text-sm font-medium text-emerald-950">
          Date
        </label>
        <input
          id="event_date"
          name="event_date"
          type="date"
          required
          min={today}
          className={field}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="starts_at" className="text-sm font-medium text-emerald-950">
            From
          </label>
          <input
            id="starts_at"
            name="starts_at"
            type="time"
            required
            className={field}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ends_at" className="text-sm font-medium text-emerald-950">
            Until
          </label>
          <input
            id="ends_at"
            name="ends_at"
            type="time"
            required
            className={field}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="purpose" className="text-sm font-medium text-emerald-950">
          What&apos;s the occasion?
        </label>
        <input
          id="purpose"
          name="purpose"
          required
          placeholder="Birthday party, soccer practice, family gathering…"
          className={field}
        />
        <p className="text-xs text-stone-500">
          Shown to other residents on the calendar.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="headcount" className="text-sm font-medium text-emerald-950">
          Roughly how many people?{" "}
          <span className="font-normal text-stone-500">(optional)</span>
        </label>
        <input
          id="headcount"
          name="headcount"
          type="number"
          min={1}
          className={`${field} sm:max-w-[10rem]`}
        />
      </div>

      <SubmitButton />
    </form>
  );
}
