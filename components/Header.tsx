import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

const links = [
  { href: "/", label: "Home" },
  { href: "/covenants", label: "Covenants & Restrictions" },
  { href: "/board", label: "Board of Directors" },
  { href: "/portal", label: "Resident Portal" },
];

export default function Header() {
  return (
    <header className="border-b border-emerald-900/10 bg-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight text-emerald-950">
          {siteConfig.shortName}
        </Link>
        <nav className="flex gap-6 text-sm font-medium text-emerald-900/80">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-emerald-950">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
