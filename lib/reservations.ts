export type ReservationStatus =
  | "pending"
  | "approved"
  | "declined"
  | "cancelled";

export type Reservation = {
  id: string;
  profile_id: string;
  requester_name: string;
  event_date: string;
  starts_at: string;
  ends_at: string;
  purpose: string;
  headcount: number | null;
  status: ReservationStatus;
  review_note: string | null;
};

/** "14:00:00" -> "2:00 PM" */
export function formatTime(value: string): string {
  const [h, m] = value.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

/** "2026-08-15" -> "Saturday, August 15" — parsed as local, not UTC. */
export function formatDate(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** Today in YYYY-MM-DD, local time — for min= on the date input. */
export function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}
