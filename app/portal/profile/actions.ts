"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase, getCurrentProfile } from "@/lib/supabase/server";

export type ProfileState = {
  status: "idle" | "saved" | "error";
  message?: string;
};

export async function saveProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const profile = await getCurrentProfile();
  if (!profile) return { status: "error", message: "You're not signed in." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const inDirectory = formData.get("in_directory") === "on";
  const showPhone = formData.get("show_phone") === "on";
  const showEmail = formData.get("show_email") === "on";

  if (!fullName) {
    return { status: "error", message: "Please enter your name." };
  }

  const supabase = await createServerSupabase();

  // Updates the caller's own row only — RLS (profiles_update_self) enforces
  // that, and a trigger blocks any attempt to grant oneself admin.
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone: phone || null,
      in_directory: inDirectory,
      show_phone: showPhone,
      show_email: showEmail,
    })
    .eq("id", profile.id);

  if (error) {
    return { status: "error", message: "Couldn't save your changes." };
  }

  revalidatePath("/portal/profile");
  revalidatePath("/portal/directory");
  return { status: "saved", message: "Your listing has been updated." };
}
