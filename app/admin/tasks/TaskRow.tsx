"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { TASK_STATUSES, statusInfo, daysSince } from "@/lib/tasks";
import { updateTask, deleteTask, type TaskState } from "./actions";
import Attachments, { type Attachment } from "./Attachments";

const initial: TaskState = { status: "idle" };

type Task = {
  id: string;
  address: string;
  homeowner: string | null;
  issue: string;
  status: number;
  todo: string | null;
  notes: string | null;
  opened_at: string;
  updated_at: string;
};

type Event = {
  id: string;
  from_status: number | null;
  to_status: number;
  note: string | null;
  changed_by_name: string | null;
  created_at: string;
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-emerald-800 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm("Delete this item and its history? This can't be undone."))
          e.preventDefault();
      }}
      className="text-sm font-medium text-red-700 hover:text-red-800 disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

export default function TaskRow({
  task,
  events,
  files = [],
  canEdit = true,
}: {
  task: Task;
  events: Event[];
  files?: Attachment[];
  canEdit?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [saveState, save] = useActionState(updateTask, initial);
  const [, remove] = useActionState(deleteTask, initial);
  const info = statusInfo(task.status);
  const age = daysSince(task.opened_at);
  const stale = daysSince(task.updated_at);

  return (
    <li className="rounded-lg border border-emerald-900/10 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full flex-wrap items-start justify-between gap-3 p-4 text-left hover:bg-stone-50"
      >
        <div className="min-w-0">
          <p className="font-semibold text-emerald-950">
            {task.issue}
            <span className="ml-2 font-normal text-stone-600">
              · {task.address}
            </span>
          </p>
          <p className="mt-0.5 text-sm text-stone-600">
            {task.homeowner ? `${task.homeowner} · ` : ""}
            {task.todo || "No action noted"}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Open {age} day{age === 1 ? "" : "s"}
            {stale > 30 ? ` · no update in ${stale} days` : ""}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-3">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${info.tone}`}
          >
            {info.label}
          </span>
          {/* Without this the row gives no sign it opens an editor. */}
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-800">
            {open ? "Close" : canEdit ? "Edit" : "Details"}
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
              className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </span>
      </button>

      {open && (
        <div className="border-t border-emerald-900/10 p-4">
          {!canEdit && (
            <div className="mb-4 text-sm text-stone-700">
              {task.notes ? (
                <p className="whitespace-pre-wrap">{task.notes}</p>
              ) : (
                <p className="text-stone-500">No notes recorded.</p>
              )}
            </div>
          )}

          {canEdit && (
          <form
            action={save}
            encType="multipart/form-data"
            className="flex flex-col gap-3"
          >
            <input type="hidden" name="id" value={task.id} />

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-emerald-950">Status</span>
                <select
                  name="status"
                  defaultValue={task.status}
                  className="rounded-md border border-emerald-900/20 px-2 py-1.5 text-sm"
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-emerald-950">Next step</span>
                <input
                  name="todo"
                  defaultValue={task.todo ?? ""}
                  className="rounded-md border border-emerald-900/20 px-2 py-1.5 text-sm"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-emerald-950">Notes</span>
              <textarea
                name="notes"
                rows={2}
                defaultValue={task.notes ?? ""}
                className="rounded-md border border-emerald-900/20 px-2 py-1.5 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-emerald-950">
                Add to the history{" "}
                <span className="font-normal text-stone-500">(optional)</span>
              </span>
              <input
                name="note"
                placeholder="e.g. Spoke with owner, agreed to remove by Friday"
                className="rounded-md border border-emerald-900/20 px-2 py-1.5 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-emerald-950">
                Attach files{" "}
                <span className="font-normal text-stone-500">(optional)</span>
              </span>
              <input
                type="file"
                name="files"
                multiple
                accept="application/pdf,image/*"
                className="text-sm text-stone-700 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-50 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-emerald-800 hover:file:bg-emerald-100"
              />
              <span className="text-xs text-stone-500">
                Renderings, plans, quotes, photos. PDFs are kept as-is; images
                are resized and stripped of location data. Up to 6 files, 15 MB
                each.
              </span>
            </label>

            <div className="flex items-center gap-4">
              <SaveButton />
              {saveState.status !== "idle" && saveState.message && (
                <span
                  className={
                    saveState.status === "error"
                      ? "text-sm text-red-700"
                      : "text-sm text-emerald-800"
                  }
                >
                  {saveState.message}
                </span>
              )}
            </div>
          </form>
          )}

          <Attachments files={files} canEdit={canEdit} />

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              History
            </p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {events.length === 0 && (
                <li className="text-sm text-stone-500">No changes recorded.</li>
              )}
              {events.map((e) => (
                <li key={e.id} className="flex gap-2 text-sm">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${statusInfo(e.to_status).dot}`}
                  />
                  <span className="text-stone-700">
                    <span className="font-medium">
                      {e.from_status
                        ? `${statusInfo(e.from_status).short} → ${statusInfo(e.to_status).short}`
                        : statusInfo(e.to_status).short}
                    </span>
                    {e.note ? ` — ${e.note}` : ""}
                    <span className="text-stone-500">
                      {" · "}
                      {new Date(e.created_at).toLocaleDateString()}
                      {e.changed_by_name ? ` · ${e.changed_by_name}` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {canEdit && (
            <form action={remove} className="mt-4">
              <input type="hidden" name="id" value={task.id} />
              <DeleteButton />
            </form>
          )}
        </div>
      )}
    </li>
  );
}
