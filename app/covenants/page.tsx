import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Covenants & Restrictions | ${siteConfig.shortName}`,
};

export default function CovenantsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-20">
      <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
        Covenants & Restrictions
      </h1>
      <p className="max-w-xl text-stone-600">
        The restrictive covenants, phase documents, and related filings for
        Fernewood are available in the folder below.
      </p>
      <a
        href={siteConfig.covenantsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block w-fit rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-900"
      >
        Open Covenants Folder
      </a>
    </div>
  );
}
