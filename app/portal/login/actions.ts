"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBoardEmail } from "@/lib/email";

export type LoginState = {
  status: "idle" | "sent" | "error";
  message?: string;
};

// Deliberately identical whether or not the address belongs to a resident —
// otherwise this form becomes a way to test who lives here.
const NEUTRAL_MESSAGE =
  "If that email belongs to an approved resident, a sign-in link is on its " +
  "way. It expires in one hour and can only be used once.";

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const nextRaw = String(formData.get("next") ?? "/portal/home");
  const next =
    nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : "/portal/home";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  const origin = (await headers()).get("origin") ?? "https://www.fernewood.org";

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return {
      status: "error",
      message: "Sign-in is unavailable right now. Please try again later.",
    };
  }

  // Generate the link ourselves rather than having Supabase email it. Supabase's
  // own mailer is rate limited to a handful of messages an hour on the free
  // tier, which would not survive 269 residents; sending through Resend uses
  // the same delivery path as the rest of the site.
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${origin}${next}`,
    },
  });

  // Fails when there's no account for that address — which is the expected
  // path for anyone who hasn't been approved. Say nothing revealing.
  if (error || !data?.properties?.hashed_token) {
    return { status: "sent", message: NEUTRAL_MESSAGE };
  }

  // Build our own confirmation URL rather than emailing Supabase's
  // action_link: that one hands the session back in a URL fragment, which a
  // server route can never read. /auth/confirm verifies the token server-side
  // and sets the session cookie.
  const confirmUrl =
    `${origin}/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}` +
    `&type=magiclink&next=${encodeURIComponent(next)}`;

  await sendBoardEmail({
    to: [email],
    subject: "Your Fernewood resident portal sign-in link",
    text: [
      "Here's your sign-in link for the Fernewood resident portal:",
      "",
      confirmUrl,
      "",
      "This link expires in one hour and can only be used once.",
      "If you didn't request it, you can ignore this email.",
      "",
      "— Fernewood Homeowners Association",
    ].join("\n"),
  });

  return { status: "sent", message: NEUTRAL_MESSAGE };
}
