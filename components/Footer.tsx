import { siteConfig } from "@/lib/site-config";

export default function Footer() {
  return (
    <footer className="border-t border-emerald-900/10 py-6 text-center text-sm text-emerald-900/60">
      &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
    </footer>
  );
}
