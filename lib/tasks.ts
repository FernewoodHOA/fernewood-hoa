/**
 * Board action-item statuses.
 *
 * Ordered by "who owes the next move", which is the question a volunteer
 * board needs answered at a glance — not by severity. Change the labels here
 * and every screen follows.
 */
export const TASK_STATUSES = [
  {
    value: 1,
    label: "Needs board action",
    short: "Board",
    help: "The board owes the next step — a letter, a quote, a visit.",
    tone: "bg-amber-100 text-amber-900 border-amber-300",
    dot: "bg-amber-500",
    open: true,
  },
  {
    value: 2,
    label: "Waiting on homeowner",
    short: "Homeowner",
    help: "The resident has to act before this can move.",
    tone: "bg-sky-100 text-sky-900 border-sky-300",
    dot: "bg-sky-500",
    open: true,
  },
  {
    value: 3,
    label: "Waiting on vendor / attorney",
    short: "Vendor",
    help: "Waiting on someone outside the association.",
    tone: "bg-violet-100 text-violet-900 border-violet-300",
    dot: "bg-violet-500",
    open: true,
  },
  {
    value: 4,
    label: "Escalated — legal",
    short: "Escalated",
    help: "Formal enforcement is underway.",
    tone: "bg-red-100 text-red-900 border-red-300",
    dot: "bg-red-500",
    open: true,
  },
  {
    value: 5,
    label: "Resolved",
    short: "Resolved",
    help: "Closed. No further action needed.",
    tone: "bg-emerald-100 text-emerald-900 border-emerald-300",
    dot: "bg-emerald-500",
    open: false,
  },
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number]["value"];

export function statusInfo(value: number) {
  return TASK_STATUSES.find((s) => s.value === value) ?? TASK_STATUSES[0];
}

export function isOpen(value: number) {
  return statusInfo(value).open;
}

/** Whole days since a date — for the "days open" column. */
export function daysSince(iso: string): number {
  const then = new Date(iso).getTime();
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
}
