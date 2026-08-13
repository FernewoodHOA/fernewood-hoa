"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { postAnnouncement, type AnnouncementState } from "./actions";

const initial: AnnouncementState = { status: "idle" };

function PostButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-fit rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 disabled:opacity-60"
    >
      {pending ? "Posting…" : "Post announcement"}
    </button>
  );
}

export default function AnnouncementForm({
  residentCount,
}: {
  residentCount: number;
}) {
  const [state, formAction] = useActionState(postAnnouncement, initial);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-emerald-900/10 bg-white p-6"
    >
      <h2 className="font-semibold text-emerald-950">New announcement</h2>

      {state.status !== "idle" && state.message && (
        <p
          role="alert"
          className={
            state.status === "error"
              ? "rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
              : "rounded-md border border-emerald-700/30 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          }
        >
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium text-emerald-950">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          className="w-full rounded-md border border-emerald-900/20 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="body" className="text-sm font-medium text-emerald-950">
          Announcement
        </label>
        <textarea
          id="body"
          name="body"
          rows={7}
          required
          className="w-full rounded-md border border-emerald-900/20 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
        />
      </div>

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
          Up to 4. Resized automatically, with location data removed.
        </p>
      </div>

      <label className="flex items-start gap-2 text-sm text-stone-700">
        <input type="checkbox" name="pinned" className="mt-0.5" />
        <span>
          Pin to the top
          <span className="block text-xs text-stone-500">
            Stays above other announcements until unpinned.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-stone-800">
        <input type="checkbox" name="notify" className="mt-0.5" />
        <span>
          Also email this to residents
          <span className="block text-xs text-stone-600">
            Sends to {residentCount} resident
            {residentCount === 1 ? "" : "s"} with an email on file. Use for
            things people need to know now — routine notices can just live in
            the portal.
          </span>
        </span>
      </label>

      <PostButton />
    </form>
  );
}
