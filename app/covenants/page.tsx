import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { restrictionGuide } from "@/lib/restriction-guide";

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

      <section className="mt-8 flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-emerald-950">
            Restriction Guide
          </h2>
          <p className="mt-1 max-w-xl text-stone-600">
            Not sure which phase your property belongs to? Find your street
            below.
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-emerald-900/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-emerald-50 text-emerald-950">
              <tr>
                <th className="px-4 py-3 font-semibold">Phase</th>
                <th className="px-4 py-3 font-semibold">Streets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/10">
              {restrictionGuide.map((entry) => (
                <tr key={entry.phase}>
                  <td className="whitespace-nowrap px-4 py-3 align-top font-medium text-emerald-900">
                    {entry.phase}
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    <ul className="flex flex-col gap-0.5">
                      {entry.streets.map((street) => (
                        <li key={street}>{street}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
