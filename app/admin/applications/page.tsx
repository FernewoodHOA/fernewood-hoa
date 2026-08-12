import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { createServerSupabase } from "@/lib/supabase/server";
import ReviewButtons from "./ReviewButtons";

export const metadata: Metadata = {
  title: `Access Requests | ${siteConfig.shortName}`,
};

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const supabase = await createServerSupabase();

  // RLS restricts these rows to admins, so this returns nothing for anyone
  // else even if they reach the page.
  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, full_name, address, email, phone, note, status, matched_resident_id, created_at, review_note"
    )
    .order("created_at", { ascending: false });

  const pending = (applications ?? []).filter((a) => a.status === "pending");
  const decided = (applications ?? []).filter((a) => a.status !== "pending");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
          Portal Access Requests
        </h1>
        <p className="mt-2 max-w-xl text-stone-600">
          Approving a request creates the resident&apos;s account and emails
          them a sign-in link.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight text-emerald-950">
          Pending ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <p className="text-stone-600">No requests waiting for review.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {pending.map((app) => (
              <li
                key={app.id}
                className="rounded-lg border border-emerald-900/10 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-emerald-950">
                      {app.full_name}
                    </p>
                    <p className="text-sm text-stone-600">{app.address}</p>
                    <p className="text-sm text-stone-600">{app.email}</p>
                    {app.phone && (
                      <p className="text-sm text-stone-600">{app.phone}</p>
                    )}
                  </div>
                  {app.matched_resident_id ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                      Matches roster
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                      No roster match
                    </span>
                  )}
                </div>

                {app.note && (
                  <p className="mt-3 rounded bg-stone-50 p-3 text-sm text-stone-700">
                    {app.note}
                  </p>
                )}

                <p className="mt-3 text-xs text-stone-500">
                  Submitted {new Date(app.created_at).toLocaleString()}
                </p>

                <div className="mt-4">
                  <ReviewButtons id={app.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {decided.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold tracking-tight text-emerald-950">
            Already decided
          </h2>
          <div className="overflow-x-auto rounded-lg border border-emerald-900/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-emerald-50 text-emerald-950">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Address</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/10">
                {decided.map((app) => (
                  <tr key={app.id}>
                    <td className="px-4 py-3 text-emerald-900">
                      {app.full_name}
                    </td>
                    <td className="px-4 py-3 text-stone-700">{app.address}</td>
                    <td className="px-4 py-3 text-stone-700 capitalize">
                      {app.status}
                      {app.review_note ? ` — ${app.review_note}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
