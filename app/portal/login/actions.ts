"use server";

import { headers } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";

export type LoginState = {
  status: "idle" | "sent" | "error";
  message?: string;
};

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const next = String(formData.get("next") ?? "/portal/home");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createServerSupabase();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Accounts are created by an admin on approval. Without this, anyone
      // could sign themselves in and bypass the approval process entirely.
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  // Deliberately vague on failure: saying "no account for that email" would
  // let anyone test which addresses belong to residents.
  if (error) {
    return {
      status: "sent",
      message:
        "If that email belongs to an approved resident, a sign-in link is " +
        "on its way. Check your inbox.",
    };
  }

  return {
    status: "sent",
    message:
      "Check your inbox — we've sent you a sign-in link. It expires in one " +
      "hour and can only be used once.",
  };
}
