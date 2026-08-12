import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Verifies a sign-in link and sets the session cookie.
 *
 * We email a link pointing here (built from generateLink's hashed_token)
 * rather than Supabase's own action_link. The action_link returns the session
 * in a URL fragment, and fragments are never sent to the server, so a server
 * route can't read it.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next");

  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/portal/home";

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/portal/login?error=invalid_link`);
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    // Expired or already used — both land here.
    return NextResponse.redirect(`${origin}/portal/login?error=expired_link`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
