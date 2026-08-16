"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase, getCurrentProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeAddress } from "@/lib/address";

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
  const address = String(formData.get("address") ?? "").trim();
  const inDirectory = formData.get("in_directory") === "on";
  const showPhone = formData.get("show_phone") === "on";
  const showEmail = formData.get("show_email") === "on";
  const showAddress = formData.get("show_address") === "on";

  if (!fullName) {
    return { status: "error", message: "Please enter your name." };
  }

  // Accounts created by the bootstrap script (the board's own) have no roster
  // link, so they can supply their address here once. Matching is done
  // server-side against the roster — the browser can't assert a link to an
  // arbitrary household.
  let linked: { resident_id: number; address: string } | null = null;
  let addressNote = "";
  if (address && !profile.resident_id) {
    const admin = createAdminClient();
    const { data: roster } = await admin.from("residents").select("id, address");
    const target = normalizeAddress(address);
    const match = (roster ?? []).find(
      (r) => normalizeAddress(r.address ?? "") === target
    );
    if (match) {
      linked = { resident_id: match.id, address: match.address };
    } else {
      addressNote =
        " We couldn't match that address to the association roster, so it's " +
        "saved but not linked yet — a board member can sort it out.";
    }
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
      show_address: showAddress,
      ...(address && !profile.resident_id
        ? { address: linked?.address ?? address }
        : {}),
      ...(linked ? { resident_id: linked.resident_id } : {}),
    })
    .eq("id", profile.id);

  if (error) {
    return { status: "error", message: "Couldn't save your changes." };
  }

  revalidatePath("/portal/profile");
  revalidatePath("/portal/directory");
  return {
    status: "saved",
    message: "Your listing has been updated." + addressNote,
  };
}
