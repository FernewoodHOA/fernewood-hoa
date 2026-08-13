import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { siteConfig } from "@/lib/site-config";
import { createServerSupabase, getCurrentProfile } from "@/lib/supabase/server";
import { formatDate, formatTime, todayIso } from "@/lib/reservations";
import PavilionClient from "./PavilionClient";
import CancelButton from "./CancelButton";

export const metadata: Metadata = {
  title: `Park Pavilion | ${siteConfig.shortName}`,
};

export const dynamic = "force-dynamic";

export default async function PavilionPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/portal/login?next=/portal/pavilion");

  const today = todayIso();
  const supabase = await createServerSupabase();

  // Pull a window around today so the calendar can page back a month or two
  // without another round trip.
  const windowStart = `${Number(today.slice(0, 4)) - 1}-01-01`;

  const { data: all } = await supabase
    .from("reservations")
    .select(
      "id, profile_id, requester_name, event_date, starts_at, ends_at, purpose, status"
    )
    .gte("event_date", windowStart)
    .in("status", ["approved", "pending"])
    .order("event_date")
    .order("starts_at");

  const approved = (all ?? []).filter((r) => r.status === "approved");
  const mine = (all ?? []).filter(
    (r) => r.profile_id === profile.id && r.event_date >= today
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-14">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
          Park Pavilion
        </h1>
        <p className="mt-2 max-w-xl text-stone-600">
          See what&apos;s booked and request the pavilion for your own
          gathering. Requests are reviewed by a board member.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight text-emerald-950">
          What&apos;s booked
        </h2>
        <p className="text-sm text-stone-600">
          Tap any day to see the hours laid out and spot a free window.
        </p>
      </section>

      {mine.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold tracking-tight text-emerald-950">
            My requests
          </h2>
          <ul className="flex flex-col gap-3">
            {mine.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-900/10 bg-stone-50 p-4"
              >
                <div>
                  <p className="font-medium text-emerald-950">
                    {formatDate(r.event_date)}
                    <span
                      className={
                        r.status === "approved"
                          ? "ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900"
                          : "ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900"
                      }
                    >
                      {r.status === "approved" ? "Approved" : "Awaiting review"}
                    </span>
                  </p>
                  <p className="text-sm text-stone-700">
                    {formatTime(r.starts_at)} – {formatTime(r.ends_at)} &middot;{" "}
                    {r.purpose}
                  </p>
                </div>
                <CancelButton id={r.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <PavilionClient
        today={today}
        bookings={approved.map((r) => ({
          id: r.id,
          event_date: r.event_date,
          starts_at: r.starts_at,
          ends_at: r.ends_at,
          requester_name: r.requester_name,
          purpose: r.purpose,
        }))}
      />

      <Link
        href="/portal/home"
        className="text-sm font-medium text-emerald-800 hover:text-emerald-900"
      >
        &larr; Back to the portal
      </Link>
    </div>
  );
}
