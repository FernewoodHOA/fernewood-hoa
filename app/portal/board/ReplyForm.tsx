"use client";

import { useActionState, useRef, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { createReply, type BoardState } from "./actions";

const initial: BoardState = { status: "idle" };

function ReplyButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-fit rounded-full border border-emerald-800 px-4 py-1.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 disabled:opacity-60"
    >
      {pending ? "Replying…" : "Reply"}
    </button>
  );
}

export default function ReplyForm({ postId }: { postId: string }) {
  const [state, action] = useActionState(createReply, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "ok") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="post_id" value={postId} />
      <label htmlFor={`reply-${postId}`} className="sr-only">
        Reply
      </label>
      <textarea
        id={`reply-${postId}`}
        name="body"
        rows={2}
        required
        maxLength={5000}
        placeholder="Write a reply…"
        className="w-full rounded-md border border-emerald-900/20 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
      />
      {state.status === "error" && state.message && (
        <p className="text-sm text-red-700">{state.message}</p>
      )}
      <ReplyButton />
    </form>
  );
}
