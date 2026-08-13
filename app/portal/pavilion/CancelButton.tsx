"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cancelReservation, type RequestState } from "./actions";

const initial: RequestState = { status: "idle" };

function Button() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm("Cancel this reservation?")) e.preventDefault();
      }}
      className="text-sm font-medium text-red-700 hover:text-red-800 disabled:opacity-60"
    >
      {pending ? "Cancelling…" : "Cancel"}
    </button>
  );
}

export default function CancelButton({ id }: { id: string }) {
  const [, action] = useActionState(cancelReservation, initial);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <Button />
    </form>
  );
}
