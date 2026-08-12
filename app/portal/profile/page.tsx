import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { siteConfig } from "@/lib/site-config";
import { createServerSupabase } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";

export const metadata: Metadata = {
  title: `My Listing | ${siteConfig.shortName}`,
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, phone, email, resident_id, in_directory, show_phone, show_email"
    )
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/portal/login");

  // Address comes from the linked roster row — board-controlled.
  let address: string | null = null;
  if (profile.resident_id) {
    const { data: resident } = await supabase
      .from("residents")
      .select("address")
      .eq("id", profile.resident_id)
      .single();
    address = resident?.address ?? null;
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-14">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
          My Directory Listing
        </h1>
        <p className="mt-2 max-w-xl text-stone-600">
          You control what neighbors can see. Nothing here is shown to anyone
          unless you choose to be listed.
        </p>
      </div>

      <ProfileForm
        profile={{
          full_name: profile.full_name,
          phone: profile.phone,
          email: profile.email ?? user.email ?? null,
          address,
          in_directory: profile.in_directory,
          show_phone: profile.show_phone,
          show_email: profile.show_email,
        }}
      />

      <Link
        href="/portal/directory"
        className="text-sm font-medium text-emerald-800 hover:text-emerald-900"
      >
        &larr; Back to the directory
      </Link>
    </div>
  );
}
