import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { createServerSupabase, getCurrentProfile } from "@/lib/supabase/server";
import AnnouncementForm from "./AnnouncementForm";
import DeleteButton from "./DeleteButton";

export const metadata: Metadata = {
  title: `Announcements | ${siteConfig.shortName}`,
};

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const canEdit = Boolean((await getCurrentProfile())?.is_admin);
  const supabase = await createServerSupabase();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, pinned, author_name, emailed_at, recipients, created_at")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .not("email", "is", null);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-14">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
          Announcements
        </h1>
        <p className="mt-2 max-w-xl text-stone-600">
          Posted announcements appear in the resident portal. Emailing is
          optional and decided per announcement.
        </p>
      </div>

      {canEdit && <AnnouncementForm residentCount={count ?? 0} />}

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight text-emerald-950">
          Posted ({announcements?.length ?? 0})
        </h2>

        {(!announcements || announcements.length === 0) && (
          <p className="text-stone-600">Nothing posted yet.</p>
        )}

        <ul className="flex flex-col gap-4">
          {(announcements ?? []).map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-emerald-900/10 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-emerald-950">
                    {a.pinned && (
                      <span className="mr-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
                        Pinned
                      </span>
                    )}
                    {a.title}
                  </h3>
                  <p className="mt-1 text-xs text-stone-500">
                    {a.author_name} · {new Date(a.created_at).toLocaleString()}
                    {a.emailed_at
                      ? ` · emailed to ${a.recipients ?? 0}`
                      : " · portal only"}
                  </p>
                </div>
                {canEdit && <DeleteButton id={a.id} />}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-stone-700">
                {a.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <Link
        href="/portal/home"
        className="text-sm font-medium text-emerald-800 hover:text-emerald-900"
      >
        &larr; Back to the portal
      </Link>
    </div>
  );
}
