import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { siteConfig } from "@/lib/site-config";
import { createServerSupabase, getCurrentProfile } from "@/lib/supabase/server";
import { signPhotoUrls } from "@/lib/photos";

export const metadata: Metadata = {
  title: `Announcements | ${siteConfig.shortName}`,
};

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/portal/login");

  const supabase = await createServerSupabase();
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, pinned, author_name, photo_paths, created_at")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const allPaths = (announcements ?? []).flatMap((a) => a.photo_paths ?? []);
  const signed = await signPhotoUrls(allPaths);
  const urlByPath = new Map(allPaths.map((path, i) => [path, signed[i]]));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
            Announcements
          </h1>
          <p className="mt-2 text-stone-600">Notices from the Board.</p>
        </div>
        {profile.is_admin && (
          <Link
            href="/admin/announcements"
            className="rounded-full border border-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
          >
            Post an announcement
          </Link>
        )}
      </div>

      {(!announcements || announcements.length === 0) && (
        <p className="text-stone-600">
          No announcements yet. When the Board posts one, it&apos;ll appear
          here.
        </p>
      )}

      <ul className="flex flex-col gap-5">
        {(announcements ?? []).map((a) => (
          <li
            key={a.id}
            className="rounded-lg border border-emerald-900/10 bg-white p-6"
          >
            {a.pinned && (
              <span className="mb-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
                Pinned
              </span>
            )}
            <h2 className="text-xl font-bold tracking-tight text-emerald-950">
              {a.title}
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              {a.author_name} ·{" "}
              {new Date(a.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-stone-700">{a.body}</p>

            {(a.photo_paths ?? []).length > 0 && (
              <div
                className={
                  (a.photo_paths ?? []).length === 1
                    ? "mt-4"
                    : "mt-4 grid grid-cols-2 gap-2"
                }
              >
                {(a.photo_paths ?? []).map((path: string) => {
                  const url = urlByPath.get(path);
                  if (!url) return null;
                  return (
                    <a
                      key={path}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-md border border-emerald-900/10"
                    >
                      {/* Signed URLs expire; Next's optimizer would cache one
                          that later 403s, so use a plain img. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Photo attached to "${a.title}"`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </a>
                  );
                })}
              </div>
            )}
          </li>
        ))}
      </ul>

      <Link
        href="/portal/home"
        className="text-sm font-medium text-emerald-800 hover:text-emerald-900"
      >
        &larr; Back to the portal
      </Link>
    </div>
  );
}
