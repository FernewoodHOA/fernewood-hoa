import "server-only";

/**
 * Cloudflare Turnstile verification.
 *
 * Deliberately optional: when the keys aren't configured the check passes, so
 * the site keeps working if the account is ever removed or a key rotated. The
 * honeypot and rate limiter still apply in that case.
 */
export async function verifyTurnstile(token: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured — don't block real residents

  if (!token) return false;

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
      }
    );
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    // Cloudflare unreachable. Fail open rather than lock residents out of the
    // form entirely — the other defences still stand.
    return true;
  }
}

/** True when Turnstile is set up, so forms know whether to render the widget. */
export function turnstileEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY
  );
}
