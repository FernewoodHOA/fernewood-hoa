"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/server";

export type InquiryState = { status: "idle" | "ok" | "error"; message?: string };

export async function markHandled(
  _prev: InquiryState,
  formData: FormData
): Promise<InquiryState> {
  const admin = await getCurrentProfile();
  if (!admin?.is_admin) return { status: "error", message: "Not authorized." };

  const id = String(formData.get("id") ?? "");
  const handled = formData.get("handled") === "true";

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("board_inquiries")
    .update({
      handled,
      handled_by: handled ? admin.id : null,
      handled_at: handled ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) return { status: "error", message: "Couldn't update that." };

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
  return { status: "ok" };
}
