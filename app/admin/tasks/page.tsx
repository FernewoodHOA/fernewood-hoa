import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { createServerSupabase } from "@/lib/supabase/server";
import { TASK_STATUSES, isOpen, daysSince, sortKey } from "@/lib/tasks";
import TaskRow from "./TaskRow";
import NewTaskForm from "./NewTaskForm";

export const metadata: Metadata = {
  title: `Action Items | ${siteConfig.shortName}`,
};

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const supabase = await createServerSupabase();

  const [{ data: tasks }, { data: events }] = await Promise.all([
    supabase
      .from("board_tasks")
      .select(
        "id, address, homeowner, issue, status, todo, notes, opened_at, closed_at, updated_at"
      )
      .order("opened_at"),
    supabase
      .from("board_task_events")
      .select("id, task_id, from_status, to_status, note, changed_by_name, created_at")
      .order("created_at"),
  ]);

  // Sorted by workflow position, not by the raw status number — see sortKey.
  const all = [...(tasks ?? [])].sort(
    (a, b) =>
      sortKey(a.status) - sortKey(b.status) ||
      new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime()
  );
  const open = all.filter((t) => isOpen(t.status));
  const closed = all.filter((t) => !isOpen(t.status));

  const eventsByTask = new Map<string, typeof events>();
  for (const e of events ?? []) {
    const list = eventsByTask.get(e.task_id) ?? [];
    list.push(e);
    eventsByTask.set(e.task_id, list);
  }

  // Which issues come up most — tells the board where a global letter would
  // do more than another one-off conversation.
  const byIssue = new Map<string, number>();
  for (const t of open) {
    byIssue.set(t.issue, (byIssue.get(t.issue) ?? 0) + 1);
  }
  const topIssues = [...byIssue.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const oldest = [...open].sort(
    (a, b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime()
  )[0];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-14">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
          Action Items
        </h1>
        <p className="mt-2 max-w-2xl text-stone-600">
          Issues the board is tracking. Visible to board members only.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TASK_STATUSES.map((s) => {
          const count = all.filter((t) => t.status === s.value).length;
          return (
            <div
              key={s.value}
              className={`rounded-lg border p-4 ${s.tone}`}
              title={s.help}
            >
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm font-medium">{s.label}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-emerald-900/10 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Most common open issues
          </h2>
          {topIssues.length === 0 ? (
            <p className="mt-2 text-sm text-stone-600">Nothing open.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {topIssues.map(([issue, count]) => (
                <li key={issue} className="flex justify-between gap-4">
                  <span className="text-stone-700">{issue}</span>
                  <span className="font-semibold text-emerald-900">
                    {count}
                    {count > 1 && (
                      <span className="ml-1 font-normal text-stone-500">
                        — a global letter may fit
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-emerald-900/10 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Ageing
          </h2>
          <p className="mt-2 text-sm text-stone-700">
            {open.length} open item{open.length === 1 ? "" : "s"}
            {oldest
              ? `, the oldest raised ${daysSince(oldest.opened_at)} days ago (${oldest.issue}, ${oldest.address})`
              : ""}
            .
          </p>
          <p className="mt-2 text-sm text-stone-700">
            {closed.length} resolved to date.
          </p>
        </div>
      </section>

      <NewTaskForm />

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight text-emerald-950">
          Open ({open.length})
        </h2>
        <ul className="flex flex-col gap-3">
          {open.map((t) => (
            <TaskRow key={t.id} task={t} events={eventsByTask.get(t.id) ?? []} />
          ))}
        </ul>
        {open.length === 0 && (
          <p className="text-stone-600">Nothing open. Rare and excellent.</p>
        )}
      </section>

      {closed.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold tracking-tight text-emerald-950">
            Resolved ({closed.length})
          </h2>
          <ul className="flex flex-col gap-3">
            {closed.map((t) => (
              <TaskRow key={t.id} task={t} events={eventsByTask.get(t.id) ?? []} />
            ))}
          </ul>
        </section>
      )}

      <Link
        href="/admin"
        className="text-sm font-medium text-emerald-800 hover:text-emerald-900"
      >
        &larr; Board tools
      </Link>
    </div>
  );
}
