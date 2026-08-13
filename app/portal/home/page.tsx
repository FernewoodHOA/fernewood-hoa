import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { siteConfig } from "@/lib/site-config";
import { getCurrentProfile } from "@/lib/supabase/server";
import { signOut } from "./actions";

export const metadata: Metadata = {
  title: `Resident Home | ${siteConfig.shortName}`,
};

export const dynamic = "force-dynamic";

export default async function PortalHome() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/portal/login");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
            Welcome, {profile.full_name}
          </h1>
          {profile.address && (
            <p className="mt-1 text-stone-600">{profile.address}</p>
          )}
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
          >
            Sign out
          </button>
        </form>
      </div>

      {profile.is_admin && (
        <div className="rounded-lg border border-emerald-700/30 bg-emerald-50 p-5">
          <p className="font-medium text-emerald-900">Board tools</p>
          <p className="mt-1 text-sm text-stone-700">
            You have administrator access.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/admin/applications"
              className="font-medium text-emerald-800 hover:text-emerald-900"
            >
              Review access requests &rarr;
            </Link>
            <Link
              href="/admin/announcements"
              className="font-medium text-emerald-800 hover:text-emerald-900"
            >
              Post an announcement &rarr;
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/portal/announcements"
          className="rounded-lg border border-emerald-900/10 bg-white p-6 transition-colors hover:border-emerald-700/40"
        >
          <h2 className="font-semibold text-emerald-950">Announcements</h2>
          <p className="mt-1 text-sm text-stone-600">Notices from the Board.</p>
        </Link>

        <Link
          href="/portal/directory"
          className="rounded-lg border border-emerald-900/10 bg-white p-6 transition-colors hover:border-emerald-700/40"
        >
          <h2 className="font-semibold text-emerald-950">Resident Directory</h2>
          <p className="mt-1 text-sm text-stone-600">
            Look up neighbors who have chosen to be listed.
          </p>
        </Link>

        <Link
          href="/portal/pavilion"
          className="rounded-lg border border-emerald-900/10 bg-white p-6 transition-colors hover:border-emerald-700/40"
        >
          <h2 className="font-semibold text-emerald-950">Park Pavilion</h2>
          <p className="mt-1 text-sm text-stone-600">
            See what&apos;s booked and request it for your own gathering.
          </p>
        </Link>

        <Link
          href="/portal/profile"
          className="rounded-lg border border-emerald-900/10 bg-white p-6 transition-colors hover:border-emerald-700/40"
        >
          <h2 className="font-semibold text-emerald-950">My Listing</h2>
          <p className="mt-1 text-sm text-stone-600">
            {profile.in_directory
              ? "You're listed in the directory. Edit what neighbors see."
              : "You're not listed yet. Choose whether to appear."}
          </p>
        </Link>
      </div>

      <div className="rounded-lg border border-emerald-900/10 bg-white p-6">
        <h2 className="font-semibold text-emerald-950">More coming soon</h2>
        <p className="mt-1 text-stone-600">
          Announcements, the community board, and park pavilion reservations
          are still being built. You&apos;ll see them here as they&apos;re
          added.
        </p>
      </div>
    </div>
  );
}
