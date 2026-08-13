"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { removePost, type BoardState } from "./actions";

const initial: BoardState = { status: "idle" };

function Button({ isAuthor }: { isAuthor: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        const message = isAuthor
          ? "Delete this? It can't be undone."
          : "Remove this as a board member? The author will no longer see it on the board.";
        if (!confirm(message)) e.preventDefault();
      }}
      className="text-xs font-medium text-stone-500 hover:text-red-700 disabled:opacity-60"
    >
      {pending ? "Removing…" : isAuthor ? "Delete" : "Remove"}
    </button>
  );
}

export default function RemoveButton({
  id,
  kind,
  isAuthor,
}: {
  id: string;
  kind: "post" | "reply";
  isAuthor: boolean;
}) {
  const [, action] = useActionState(removePost, initial);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="kind" value={kind} />
      <Button isAuthor={isAuthor} />
    </form>
  );
}
