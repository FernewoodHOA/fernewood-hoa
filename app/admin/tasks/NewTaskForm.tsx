"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { TASK_STATUSES } from "@/lib/tasks";
import { createTask, type TaskState } from "./actions";

const initial: TaskState = { status: "idle" };
const field =
  "w-full rounded-md border border-emerald-900/20 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700";

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-fit rounded-full bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
    >
      {pending ? "Adding…" : "Add item"}
    </button>
  );
}

export default function NewTaskForm() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createTask, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "ok") formRef.current?.reset();
  }, [state]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-fit rounded-full bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
      >
        + Add an item
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-col gap-3 rounded-lg border border-emerald-900/10 bg-white p-5"
    >
      <h2 className="font-semibold text-emerald-950">New action item</h2>

      {state.status !== "idle" && state.message && (
        <p
          className={
            state.status === "error"
              ? "rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
              : "rounded-md border border-emerald-700/30 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          }
        >
          {state.message}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-emerald-950">Address</span>
          <input name="address" required placeholder="102 Barington, or Multiple" className={field} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-emerald-950">
            Homeowner <span className="font-normal text-stone-500">(optional)</span>
          </span>
          <input name="homeowner" className={field} />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-emerald-950">Issue</span>
        <input name="issue" required placeholder="Fence, Delinquent Dues, Yards/Trees…" className={field} />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-emerald-950">Status</span>
          <select name="status" defaultValue={1} className={field}>
            {TASK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-emerald-950">Next step</span>
          <input name="todo" placeholder="Write letter, knock on door…" className={field} />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-emerald-950">
          Notes <span className="font-normal text-stone-500">(optional)</span>
        </span>
        <textarea name="notes" rows={2} className={field} />
      </label>

      <div className="flex items-center gap-3">
        <AddButton />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm font-medium text-stone-600 hover:text-stone-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
