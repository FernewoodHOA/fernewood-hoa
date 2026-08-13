import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatTime, todayIso } from "@/lib/reservations";
import DecisionButtons from "./DecisionButtons";

export const metadata: Metadata = {
  title: `Pavilion Requests | ${siteConfig.shortName}`,
};

export const dynamic = "force-dynamic";

export default async function AdminReservationsPage() {
  const supabase = await createServerSupabase();
  const today = todayIso();

  const { data: reservations } = await supabase
    .from("reservations")
    .select(
      "id, requester_name, event_date, starts_at, ends_at, purpose, headcount, status, review_note"
    )
    .order("event_date")
    .order("starts_at");

  const pending = (reservations ?? []).filter((r) => r.status === "pending");
  const upcoming = (reservations ?? []).filter(
    (r) => r.status === "approved" && r.event_date >= today
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-14">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
          Pavilion Requests
        </h1>
        <p className="mt-2 max-w-2xl text-stone-600">
          Approving a request puts it on the resident calendar and emails the
          requester. The database refuses overlapping approvals, so two
          bookings can&apos;t collide.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight text-emerald-950">
          Waiting for review ({pending.length})
        </h2>

        {pending.length === 0 && (
          <p className="text-stone-600">Nothing waiting.</p>
        )}

        <ul className="flex flex-col gap-4">
          {pending.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-emerald-900/10 bg-white p-5"
            >
              <p className="font-semibold text-emerald-950">
                {formatDate(r.event_date)}
              </p>
              <p className="text-sm text-stone-700">
                {formatTime(r.starts_at)} – {formatTime(r.ends_at)} &middot;{" "}
                {r.requester_name}
              </p>
              <p className="mt-1 text-sm text-stone-600">
                {r.purpose}
                {r.headcount ? ` · about ${r.headcount} people` : ""}
              </p>
              <div className="mt-4">
                <DecisionButtons id={r.id} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold tracking-tight text-emerald-950">
          Upcoming approved ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-stone-600">Nothing booked.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-emerald-900/10 bg-stone-50 p-4 text-sm"
              >
                <span className="font-medium text-emerald-900">
                  {formatDate(r.event_date)}
                </span>{" "}
                <span className="text-stone-700">
                  {formatTime(r.starts_at)} – {formatTime(r.ends_at)} &middot;{" "}
                  {r.requester_name} &middot; {r.purpose}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        href="/admin"
        className="text-sm font-medium text-emerald-800 hover:text-emerald-900"
      >
        &larr; Board tools
      </Link>
    </div>
  );
}
