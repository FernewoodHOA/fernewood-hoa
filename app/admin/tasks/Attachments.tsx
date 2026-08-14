"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { removeTaskFile, type TaskState } from "./actions";

const initial: TaskState = { status: "idle" };

export type Attachment = {
  id: string;
  file_name: string;
  mime_type: string | null;
  sizeLabel: string;
  uploaded_by_name: string | null;
  created_at: string;
  url: string;
  isImage: boolean;
};

function RemoveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm("Remove this file? This can't be undone.")) e.preventDefault();
      }}
      className="text-xs font-medium text-stone-500 hover:text-red-700 disabled:opacity-60"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}

export default function Attachments({
  files,
  canEdit,
}: {
  files: Attachment[];
  canEdit: boolean;
}) {
  const [, remove] = useActionState(removeTaskFile, initial);

  if (files.length === 0) return null;

  const images = files.filter((f) => f.isImage);
  const docs = files.filter((f) => !f.isImage);

  return (
    <div className="mt-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        Attachments ({files.length})
      </p>

      {images.length > 0 && (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {images.map((f) => (
            <div key={f.id} className="overflow-hidden rounded-lg border border-emerald-900/10">
              <a href={f.url} target="_blank" rel="noopener noreferrer">
                {/* Signed URLs expire, so Next's optimizer would cache a link
                    that later 403s. Plain img avoids that. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.url}
                  alt={f.file_name}
                  loading="lazy"
                  className="h-40 w-full object-cover"
                />
              </a>
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm text-stone-700">
                    {f.file_name}
                  </span>
                  <span className="text-xs text-stone-500">
                    {f.sizeLabel}
                    {f.uploaded_by_name ? ` · ${f.uploaded_by_name}` : ""}
                  </span>
                </span>
                {canEdit && (
                  <form action={remove}>
                    <input type="hidden" name="file_id" value={f.id} />
                    <RemoveButton />
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {docs.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {docs.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-3 rounded border border-emerald-900/10 px-3 py-2"
            >
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 text-sm font-medium text-emerald-800 hover:text-emerald-900"
              >
                <span className="block truncate">{f.file_name}</span>
                <span className="text-xs font-normal text-stone-500">
                  {f.sizeLabel}
                  {f.uploaded_by_name ? ` · ${f.uploaded_by_name}` : ""}
                </span>
              </a>
              {canEdit && (
                <form action={remove}>
                  <input type="hidden" name="file_id" value={f.id} />
                  <RemoveButton />
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
