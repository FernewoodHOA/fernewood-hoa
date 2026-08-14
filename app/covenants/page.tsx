import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { restrictionGuide } from "@/lib/restriction-guide";
import {
  phaseDocuments,
  generalDocuments,
  platDocuments,
  documentUrl,
  platUrl,
  type Document,
} from "@/lib/documents";

export const metadata: Metadata = {
  title: `Covenants & Restrictions | ${siteConfig.shortName}`,
};

function DocumentLink({
  doc,
  href,
}: {
  doc: Document;
  href?: string;
}) {
  return (
    <a
      href={href ?? documentUrl(doc.file)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start justify-between gap-3 rounded-lg border border-emerald-900/10 bg-white px-4 py-3 transition-colors hover:border-emerald-700/40"
    >
      <span>
        <span className="font-medium text-emerald-900">{doc.title}</span>
        {doc.note && (
          <span className="block text-sm text-stone-600">{doc.note}</span>
        )}
      </span>
      <span className="shrink-0 whitespace-nowrap text-xs text-stone-500">
        PDF · {doc.size}
      </span>
    </a>
  );
}

export default function CovenantsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-20">
      <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
        Covenants & Restrictions
      </h1>
      <p className="max-w-2xl text-stone-600">
        The recorded covenants for each phase of Fernewood. Not sure which
        phase you&apos;re in? Check the guide further down this page.
      </p>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold tracking-tight text-emerald-950">
          Covenants by phase
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {phaseDocuments.map((doc) => (
            <DocumentLink key={doc.file} doc={doc} />
          ))}
        </div>
        <p className="text-sm text-stone-500">
          There is no Phase X — the subdivision was platted without one.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold tracking-tight text-emerald-950">
          Other documents
        </h2>
        <div className="flex flex-col gap-2">
          {generalDocuments.map((doc) => (
            <DocumentLink key={doc.file} doc={doc} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold tracking-tight text-emerald-950">
          Survey plats
        </h2>
        <p className="max-w-2xl text-stone-600">
          The recorded plats showing lot lines, street layouts and the original
          house numbers for each phase.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {platDocuments.map((doc) => (
            <DocumentLink
              key={doc.file}
              doc={doc}
              href={platUrl(doc.file)}
            />
          ))}
        </div>
      </section>

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
