"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { markHandled, type InquiryState } from "./actions";

const initial: InquiryState = { status: "idle" };

function Button({ handled }: { handled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        handled
          ? "rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-60"
          : "rounded-full bg-emerald-800 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
      }
    >
      {pending ? "Saving…" : handled ? "Reopen" : "Mark handled"}
    </button>
  );
}

export default function HandledToggle({
  id,
  handled,
}: {
  id: string;
  handled: boolean;
}) {
  const [, action] = useActionState(markHandled, initial);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="handled" value={handled ? "false" : "true"} />
      <Button handled={handled} />
    </form>
  );
}
