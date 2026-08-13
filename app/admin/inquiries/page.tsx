import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { createServerSupabase, getCurrentProfile } from "@/lib/supabase/server";
import HandledToggle from "./HandledToggle";

export const metadata: Metadata = {
  title: `Contact Messages | ${siteConfig.shortName}`,
};

export const dynamic = "force-dynamic";

export default async function InquiriesPage() {
  const canEdit = Boolean((await getCurrentProfile())?.is_admin);
  const supabase = await createServerSupabase();
  const { data: inquiries } = await supabase
    .from("board_inquiries")
    .select("id, name, email, subject, message, emailed, handled, created_at")
    .order("handled", { ascending: true })
    .order("created_at", { ascending: false });

  const open = (inquiries ?? []).filter((i) => !i.handled);
  const done = (inquiries ?? []).filter((i) => i.handled);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-14">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
          Contact Messages
        </h1>
        <p className="mt-2 max-w-2xl text-stone-600">
          Everything sent through the Contact page. Messages are stored here
          even if the email notification fails, so nothing gets lost.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight text-emerald-950">
          Open ({open.length})
        </h2>
        {open.length === 0 && (
          <p className="text-stone-600">Nothing waiting.</p>
        )}
        <ul className="flex flex-col gap-4">
          {open.map((i) => (
            <li
              key={i.id}
              className="rounded-lg border border-emerald-900/10 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-emerald-950">
                    {i.subject || "(no subject)"}
                  </p>
                  <p className="text-sm text-stone-600">
                    {i.name} &middot;{" "}
                    <a
                      href={`mailto:${i.email}`}
                      className="text-emerald-800 hover:text-emerald-900"
                    >
                      {i.email}
                    </a>
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {new Date(i.created_at).toLocaleString()}
                    {i.emailed ? "" : " · email notification failed"}
                  </p>
                </div>
                {canEdit && <HandledToggle id={i.id} handled={false} />}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-stone-700">
                {i.message}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {done.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold tracking-tight text-emerald-950">
            Handled ({done.length})
          </h2>
          <ul className="flex flex-col gap-3">
            {done.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-900/10 bg-stone-50 p-4"
              >
                <div>
                  <p className="text-sm font-medium text-emerald-900">
                    {i.subject || "(no subject)"} &mdash; {i.name}
                  </p>
                  <p className="text-xs text-stone-500">
                    {new Date(i.created_at).toLocaleDateString()}
                  </p>
                </div>
                {canEdit && <HandledToggle id={i.id} handled />}
              </li>
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
