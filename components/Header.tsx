import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { getCurrentProfile } from "@/lib/supabase/server";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/covenants", label: "Covenants & Restrictions" },
  { href: "/board", label: "Board of Directors" },
  { href: "/contact", label: "Contact" },
];

export default async function Header() {
  // Reading the session here makes every page render per-request rather than
  // being prerendered. At this site's traffic that costs nothing, and it's
  // what lets board members reach their tools from anywhere on the site.
  let profile = null;
  try {
    profile = await getCurrentProfile();
  } catch {
    // Supabase not configured yet — fall back to the signed-out header.
  }

  return (
    <header className="border-b border-emerald-900/10 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-emerald-950"
        >
          {siteConfig.shortName}
        </Link>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-medium text-emerald-900/80">
          {publicLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-emerald-950">
              {link.label}
            </Link>
          ))}

          {profile ? (
            <>
              <Link href="/portal/home" className="hover:text-emerald-950">
                My Portal
              </Link>
              {profile.is_admin && (
                <Link
                  href="/admin"
                  className="rounded-full bg-emerald-800 px-3 py-1 font-semibold text-white transition-colors hover:bg-emerald-900"
                >
                  Board Tools
                </Link>
              )}
            </>
          ) : (
            <Link href="/portal" className="hover:text-emerald-950">
              Resident Portal
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
