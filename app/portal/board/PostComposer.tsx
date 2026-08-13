"use client";

import { useActionState, useRef, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { createPost, type BoardState } from "./actions";

const initial: BoardState = { status: "idle" };

function PostButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-fit rounded-full bg-emerald-800 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 disabled:opacity-60"
    >
      {pending ? "Posting…" : "Post"}
    </button>
  );
}

export default function PostComposer({ name }: { name: string }) {
  const [state, action] = useActionState(createPost, initial);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the box after a successful post, so a second click can't repost
  // the same text.
  useEffect(() => {
    if (state.status === "ok") formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-col gap-3 rounded-lg border border-emerald-900/10 bg-white p-5"
    >
      <label htmlFor="body" className="text-sm font-medium text-emerald-950">
        Post to the neighborhood
      </label>

      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {state.message}
        </p>
      )}

      <textarea
        id="body"
        name="body"
        rows={4}
        maxLength={5000}
        placeholder={`What's on your mind, ${name.split(" ")[0]}?`}
        className="w-full rounded-md border border-emerald-900/20 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="photos" className="text-sm font-medium text-emerald-950">
          Photos <span className="font-normal text-stone-500">(optional)</span>
        </label>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/*"
          multiple
          className="text-sm text-stone-700 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-800 hover:file:bg-emerald-100"
        />
        <p className="text-xs text-stone-500">
          Up to 4 photos. They&apos;re resized automatically, and location data
          is removed before anyone sees them.
        </p>
      </div>

      <PostButton />
    </form>
  );
}
