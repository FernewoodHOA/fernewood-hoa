"use client";

import { useMemo, useState } from "react";

type Entry = {
  id: string;
  full_name: string;
  address: string | null;
  phase: string | null;
  phone: string | null;
  email: string | null;
};

export default function DirectorySearch({ entries }: { entries: Entry[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      [e.full_name, e.address, e.phase]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    );
  }, [entries, query]);

  if (entries.length === 0) {
    return (
      <p className="text-stone-600">
        No residents are listed yet. As neighbors join the portal and choose to
        be listed, they&apos;ll appear here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="q" className="sr-only">
          Search the directory
        </label>
        <input
          id="q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, street, or phase…"
          className="w-full max-w-md rounded-md border border-emerald-900/20 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
        />
        <p className="text-xs text-stone-500">
          {filtered.length} of {entries.length} listed
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-emerald-900/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-emerald-50 text-emerald-950">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Address</th>
              <th className="px-4 py-3 font-semibold">Phase</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-900/10">
            {filtered.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3 font-medium text-emerald-900">
                  {entry.full_name}
                </td>
                <td className="px-4 py-3 text-stone-700">
                  {entry.address ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-stone-700">
                  {entry.phase ?? "—"}
                </td>
                <td className="px-4 py-3 text-stone-700">
                  {entry.phone && (
                    <a
                      href={`tel:${entry.phone.replace(/[^\d+]/g, "")}`}
                      className="block text-emerald-800 hover:text-emerald-900"
                    >
                      {entry.phone}
                    </a>
                  )}
                  {entry.email && (
                    <a
                      href={`mailto:${entry.email}`}
                      className="block break-all text-emerald-800 hover:text-emerald-900"
                    >
                      {entry.email}
                    </a>
                  )}
                  {!entry.phone && !entry.email && "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-stone-600">No residents match &ldquo;{query}&rdquo;.</p>
      )}
    </div>
  );
}
