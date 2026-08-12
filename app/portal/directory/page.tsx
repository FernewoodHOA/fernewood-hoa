import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { siteConfig } from "@/lib/site-config";
import { createServerSupabase, getCurrentProfile } from "@/lib/supabase/server";
import DirectorySearch from "./DirectorySearch";

export const metadata: Metadata = {
  title: `Resident Directory | ${siteConfig.shortName}`,
};

export const dynamic = "force-dynamic";

export default async function DirectoryPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/portal/login");

  const supabase = await createServerSupabase();
  const { data: entries } = await supabase
    .from("directory_entries")
    .select("id, full_name, address, phase, phone, email")
    .order("full_name");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
            Resident Directory
          </h1>
          <p className="mt-2 max-w-xl text-stone-600">
            Neighbors who have chosen to be listed. Only signed-in Fernewood
            residents can see this page.
          </p>
        </div>
        <Link
          href="/portal/profile"
          className="rounded-full border border-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
        >
          Edit my listing
        </Link>
      </div>

      {!profile.in_directory && (
        <div className="rounded-lg border border-emerald-700/30 bg-emerald-50 p-5">
          <p className="font-medium text-emerald-900">
            You&apos;re not listed yet
          </p>
          <p className="mt-1 text-sm text-stone-700">
            Your name won&apos;t appear here until you choose to be listed.{" "}
            <Link
              href="/portal/profile"
              className="font-medium text-emerald-800 underline underline-offset-2"
            >
              Add yourself to the directory
            </Link>
            .
          </p>
        </div>
      )}

      <DirectorySearch entries={entries ?? []} />
    </div>
  );
}
