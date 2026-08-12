"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  approveApplication,
  rejectApplication,
  type ReviewState,
} from "./actions";

const initial: ReviewState = { status: "idle" };

function Button({
  label,
  pendingLabel,
  variant,
}: {
  label: string;
  pendingLabel: string;
  variant: "approve" | "reject";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        variant === "approve"
          ? "rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
          : "rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-60"
      }
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export default function ReviewButtons({ id }: { id: string }) {
  const [approveState, approve] = useActionState(approveApplication, initial);
  const [rejectState, reject] = useActionState(rejectApplication, initial);
  const state =
    approveState.status !== "idle" ? approveState : rejectState;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={approve}>
          <input type="hidden" name="id" value={id} />
          <Button label="Approve" pendingLabel="Approving…" variant="approve" />
        </form>
        <form action={reject} className="flex items-center gap-2">
          <input type="hidden" name="id" value={id} />
          <input
            name="review_note"
            placeholder="Reason (optional)"
            className="rounded-md border border-stone-300 px-2 py-1.5 text-sm outline-none focus:border-emerald-700"
          />
          <Button label="Decline" pendingLabel="Declining…" variant="reject" />
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
