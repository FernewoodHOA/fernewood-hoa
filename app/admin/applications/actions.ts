"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/server";
import { sendBoardEmail } from "@/lib/email";

export type ReviewState = { status: "idle" | "ok" | "error"; message?: string };

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function approveApplication(
  _prev: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  const id = String(formData.get("id") ?? "");

  // Re-check admin status server-side. Middleware redirects the UI, but a
  // server action is a public endpoint — it must verify on its own.
  const reviewer = await getCurrentProfile();
  if (!reviewer?.is_admin) {
    return { status: "error", message: "Not authorized." };
  }

  const supabase = createAdminClient();

  const { data: application, error: loadError } = await supabase
    .from("applications")
    .select("id, full_name, address, email, status, matched_resident_id")
    .eq("id", id)
    .single();

  if (loadError || !application) {
    return { status: "error", message: "Application not found." };
  }
  if (application.status !== "pending") {
    return { status: "error", message: "That application was already decided." };
  }

  // Create the auth account. email_confirm skips a separate confirmation
  // step: the board approving them is the confirmation.
  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      email: application.email,
      email_confirm: true,
    });

  let userId = created?.user?.id;

  // If they already have an account (e.g. a re-application), reuse it rather
  // than failing the approval.
  if (createError) {
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list?.users.find(
      (u) => u.email?.toLowerCase() === application.email.toLowerCase()
    );
    if (!existing) {
      return {
        status: "error",
        message: `Could not create the account: ${createError.message}`,
      };
    }
    userId = existing.id;
  }

  if (!userId) {
    return { status: "error", message: "Could not create the account." };
  }

  const isAdmin = adminEmails().includes(application.email.toLowerCase());

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    full_name: application.full_name,
    address: application.address,
    resident_id: application.matched_resident_id,
    is_admin: isAdmin,
  });

  if (profileError) {
    return {
      status: "error",
      message: `Account created but the profile failed: ${profileError.message}`,
    };
  }

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      status: "approved",
      reviewed_by: reviewer.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return { status: "error", message: "Could not update the application." };
  }

  // Best-effort: tell them they're in. Approval already succeeded, so a
  // failed email must not roll it back.
  await sendBoardEmail({
    subject: "Your Fernewood resident portal access is approved",
    text: [
      `Hello ${application.full_name},`,
      "",
      "Your request for access to the Fernewood resident portal has been approved.",
      "",
      "To sign in, visit https://www.fernewood.org/portal/login and enter this",
      "email address. You'll receive a sign-in link — no password required.",
      "",
      "— Fernewood Homeowners Association",
    ].join("\n"),
    to: [application.email],
  });

  revalidatePath("/admin/applications");
  return { status: "ok", message: `Approved ${application.full_name}.` };
}

export async function rejectApplication(
  _prev: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("review_note") ?? "").trim();

  const reviewer = await getCurrentProfile();
  if (!reviewer?.is_admin) {
    return { status: "error", message: "Not authorized." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("applications")
    .update({
      status: "rejected",
      reviewed_by: reviewer.id,
      reviewed_at: new Date().toISOString(),
      review_note: note || null,
    })
    .eq("id", id)
    .eq("status", "pending");

  if (error) {
    return { status: "error", message: "Could not update the application." };
  }

  revalidatePath("/admin/applications");
  return { status: "ok", message: "Application declined." };
}
