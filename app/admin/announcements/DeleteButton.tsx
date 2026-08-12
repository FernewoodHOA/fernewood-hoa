"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { deleteAnnouncement, type AnnouncementState } from "./actions";

const initial: AnnouncementState = { status: "idle" };

function Button() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm("Delete this announcement? This can't be undone.")) {
          e.preventDefault();
        }
      }}
      className="text-sm font-medium text-red-700 hover:text-red-800 disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

export default function DeleteButton({ id }: { id: string }) {
  const [state, action] = useActionState(deleteAnnouncement, initial);

  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <Button />
      {state.status === "error" && state.message && (
        <span className="text-sm text-red-700">{state.message}</span>
      )}
    </form>
  );
}
