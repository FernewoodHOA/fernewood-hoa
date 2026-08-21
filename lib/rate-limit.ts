import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Salted hash of the caller's IP.
 *
 * Hashed rather than stored raw so throttling doesn't turn the database into
 * a log of who browsed the site from where. The salt is the service-role key,
 * which is already secret and already required for any of this to run — so a
 * leaked database alone can't be reversed into visitor IPs.
 */
export async function callerHash(): Promise<string | null> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    null;
  if (!ip) return null;

  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/**
 * True when this caller has already submitted `max` times in the last hour.
 * Fails open: if the check itself errors, a genuine resident is not blocked.
 */
export async function isRateLimited(
  table: "applications" | "board_inquiries" | "login_attempts",
  hash: string | null,
  max: number
): Promise<boolean> {
  if (!hash) return false;

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  try {
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", hash)
      .gte("created_at", since);

    if (error) return false;
    return (count ?? 0) >= max;
  } catch {
    return false;
  }
}
