"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  approveReservation,
  declineReservation,
  type DecisionState,
} from "./actions";

const initial: DecisionState = { status: "idle" };

function Button({
  label,
  pendingLabel,
  primary,
}: {
  label: string;
  pendingLabel: string;
  primary: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        primary
          ? "rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
          : "rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-60"
      }
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export default function DecisionButtons({ id }: { id: string }) {
  const [approveState, approve] = useActionState(approveReservation, initial);
  const [declineState, decline] = useActionState(declineReservation, initial);
  const state = approveState.status !== "idle" ? approveState : declineState;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={approve}>
          <input type="hidden" name="id" value={id} />
          <Button label="Approve" pendingLabel="Approving…" primary />
        </form>
        <form action={decline} className="flex items-center gap-2">
          <input type="hidden" name="id" value={id} />
          <input
            name="review_note"
            placeholder="Reason (optional)"
            className="rounded-md border border-stone-300 px-2 py-1.5 text-sm outline-none focus:border-emerald-700"
          />
          <Button label="Decline" pendingLabel="Declining…" primary={false} />
        </form>
      </div>
      {state.status !== "idle" && state.message && (
        <p
          className={
            state.status === "error"
              ? "text-sm text-red-700"
              : "text-sm text-emerald-800"
          }
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
