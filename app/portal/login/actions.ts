"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBoardEmail } from "@/lib/email";
import { callerHash, isRateLimited } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

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
  // Honeypot: hidden field only a bot fills in. Report the same neutral
  // message so it doesn't learn to try something else.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { status: "sent", message: NEUTRAL_MESSAGE };
  }

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

  const passed = await verifyTurnstile(
    String(formData.get("cf-turnstile-response") ?? "") || null
  );
  if (!passed) {
    return {
      status: "error",
      message:
        "We couldn't verify that you're a person. Please reload the page and " +
        "try again.",
    };
  }

  // Throttle per caller. Without this, someone who knows a resident's address
  // could bury them in sign-in links even though every one is legitimate.
  // Recorded before the account check so hammering unknown addresses counts
  // too. Five an hour is far above what a real resident needs.
  const ipHash = await callerHash();
  if (await isRateLimited("login_attempts", ipHash, 5)) {
    return {
      status: "error",
      message:
        "Too many sign-in attempts from this connection. Please wait a little " +
        "while and try again.",
    };
  }
  await supabase.from("login_attempts").insert({ ip_hash: ipHash });

  // ---------------------------------------------------------------------
  // Only approved residents get past this point.
  //
  // supabase.auth.admin.generateLink() does NOT fail for an unknown address —
  // it CREATES the account and returns a token. This code previously assumed
  // the opposite, so anyone could type any address into the sign-in form and
  // the association would email a stranger a link and open an account for
  // them. By 20 Aug 2026 that had produced 111 auth users against 11 real
  // ones, most of them addresses harvested for an email-bombing list.
  //
  // The profiles table is the authoritative list of approved residents: a row
  // is written only when a board member approves an application (see
  // app/admin/applications/actions.ts) or by the bootstrap script.
  //
  // The comparison is done here rather than with .ilike() because an email may
  // legitimately contain % or _, which PostgREST would read as wildcards.
  // ---------------------------------------------------------------------
  const { data: approved, error: lookupError } = await supabase
    .from("profiles")
    .select("email");

  if (lookupError) {
    return {
      status: "error",
      message: "Sign-in is unavailable right now. Please try again later.",
    };
  }

  const target = email.toLowerCase();
  const isApproved = (approved ?? []).some(
    (p) => (p.email ?? "").trim().toLowerCase() === target
  );

  // Not a resident. Say exactly what we say to a resident, send nothing, and
  // create nothing.
  if (!isApproved) {
    return { status: "sent", message: NEUTRAL_MESSAGE };
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
