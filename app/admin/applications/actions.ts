"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
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
    .select("id, full_name, address, email, phone, status, matched_resident_id")
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
    email: application.email,
    // Their submitted phone seeds the profile; they can change or hide it.
    phone: application.phone,
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
  //
  // Include a working sign-in link rather than instructions — telling someone
  // to "go to the login page and enter your email" lands them on a page that
  // also offers "request access", which reads like they need to apply again.
  const origin = (await headers()).get("origin") ?? "https://www.fernewood.org";
  const { data: link } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: application.email,
    options: { redirectTo: `${origin}/portal/home` },
  });

  const signInLink = link?.properties?.hashed_token
    ? `${origin}/auth/confirm?token_hash=${encodeURIComponent(link.properties.hashed_token)}&type=magiclink&next=%2Fportal%2Fhome`
    : null;

  await sendBoardEmail({
    subject: "Your Fernewood resident portal access is approved",
    text: [
      `Hello ${application.full_name},`,
      "",
      "Your request for access to the Fernewood resident portal has been",
      "approved. Welcome!",
      "",
      ...(signInLink
        ? [
            "Click here to sign in now:",
            "",
            signInLink,
            "",
            "That link expires in one hour. After that — and every time you",
            "sign in from now on — go to:",
            "",
            `  ${origin}/portal/login`,
            "",
            "Enter this email address and we'll send you a fresh link. There's",
            "no password to remember.",
          ]
        : [
            `To sign in, go to ${origin}/portal/login and enter this email`,
            "address. We'll send you a sign-in link — no password required.",
          ]),
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

  const { data: application } = await supabase
    .from("applications")
    .select("full_name, email")
    .eq("id", id)
    .single();

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

  // Tell them, and tell them how to appeal. A silent decline leaves a
  // resident with no idea whether their request was seen.
  if (application?.email) {
    await sendBoardEmail({
      to: [application.email],
      subject: "About your Fernewood resident portal request",
      text: [
        `Hello ${application.full_name},`,
        "",
        "Thank you for requesting access to the Fernewood resident portal.",
        "The Board wasn't able to approve this request.",
        ...(note ? ["", `Reason given: ${note}`] : []),
        "",
        "If you believe this was a mistake — for example if your name or",
        "property address didn't match our records — please get in touch and",
        "we'll be glad to sort it out:",
        "",
        "  Contact form: https://www.fernewood.org/contact",
        "  Phone:        (337) 364-7221",
        "",
        "You're also welcome to submit a new request at",
        "https://www.fernewood.org/portal/apply",
        "",
        "— Fernewood Homeowners Association",
      ].join("\n"),
    });
  }

  revalidatePath("/admin/applications");
  return { status: "ok", message: "Application declined and the resident notified." };
}
