import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { siteConfig } from "@/lib/site-config";
import { createServerSupabase, getCurrentProfile } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `Board Tools | ${siteConfig.shortName}`,
};

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/portal/login?next=/admin");
  if (!profile.is_admin) redirect("/portal/home");

  const supabase = await createServerSupabase();

  const [{ count: pending }, { count: announcements }, { count: inquiries }] =
    await Promise.all([
      supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase.from("announcements").select("*", { count: "exact", head: true }),
      supabase
        .from("board_inquiries")
        .select("*", { count: "exact", head: true })
        .eq("handled", false),
    ]);

  const tools = [
    {
      href: "/admin/applications",
      title: "Access Requests",
      body:
        pending && pending > 0
          ? `${pending} waiting for review`
          : "No requests waiting",
      urgent: Boolean(pending && pending > 0),
    },
    {
      href: "/admin/announcements",
      title: "Announcements",
      body: `${announcements ?? 0} posted`,
      urgent: false,
    },
    {
      href: "/admin/inquiries",
      title: "Contact Messages",
      body:
        inquiries && inquiries > 0
          ? `${inquiries} unhandled`
          : "Nothing unhandled",
      urgent: Boolean(inquiries && inquiries > 0),
    },
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-14">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
          Board Tools
        </h1>
        <p className="mt-2 text-stone-600">
          Signed in as {profile.full_name}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="rounded-lg border border-emerald-900/10 bg-white p-6 transition-colors hover:border-emerald-700/40"
          >
            <h2 className="font-semibold text-emerald-950">{tool.title}</h2>
            <p
              className={
                tool.urgent
                  ? "mt-1 text-sm font-medium text-emerald-800"
                  : "mt-1 text-sm text-stone-600"
              }
            >
              {tool.body}
            </p>
          </Link>
        ))}
      </div>

      <Link
        href="/portal/home"
        className="text-sm font-medium text-emerald-800 hover:text-emerald-900"
      >
        &larr; Back to the resident portal
      </Link>
    </div>
  );
}
