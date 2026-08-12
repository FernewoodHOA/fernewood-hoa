import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { boardMembers, mailingAddress, accountingContact } from "@/lib/board";

export const metadata: Metadata = {
  title: `Board of Directors | ${siteConfig.shortName}`,
};

export default function BoardPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-20">
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
          Board of Directors
        </h1>
        <div className="overflow-x-auto rounded-lg border border-emerald-900/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-emerald-50 text-emerald-950">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/10">
              {boardMembers.map((member) => (
                <tr key={member.name}>
                  <td className="px-4 py-3 font-medium text-emerald-900">
                    {member.name}
                  </td>
                  <td className="px-4 py-3 text-stone-700">{member.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-emerald-950">
            Where to Send Your Question
          </h2>
          <p className="mt-1 max-w-2xl text-stone-600">
            Two different places handle different things — sending it to the
            right one will get you an answer faster.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-emerald-700/30 bg-emerald-50 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Neighborhood matters
            </h3>
            <p className="mt-2 text-stone-700">
              Covenant and restriction questions, neighborhood concerns,
              suggestions, or anything else for the Board of Directors.
            </p>
            <Link
              href="/contact"
              className="mt-3 inline-block rounded-full bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-900"
            >
              Message the Board
            </Link>
          </div>

          <div className="rounded-lg border border-emerald-900/10 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Dues &amp; account questions
            </h3>
            <p className="mt-2 text-stone-700">
              Assessments, payments, balances, and statements are handled by
              the association&apos;s accounting office.
            </p>
            <address className="mt-2 not-italic leading-relaxed text-stone-700">
              <span className="font-medium text-emerald-900">
                {accountingContact.name}
              </span>
              <br />
              {accountingContact.title}
              <br />
              {accountingContact.lines.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
              <span className="mt-2 inline-block">
                Office:{" "}
                <a
                  href={accountingContact.officeHref}
                  className="font-medium text-emerald-800 hover:text-emerald-900"
                >
                  {accountingContact.office}
                </a>
              </span>
            </address>
          </div>

          <div className="rounded-lg border border-emerald-900/10 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Mailing Address
            </h3>
            <address className="mt-2 not-italic leading-relaxed text-stone-700">
              <span className="font-medium text-emerald-900">
                {mailingAddress.addressee}
              </span>
              <br />
              {mailingAddress.organization}
              <br />
              {mailingAddress.lines.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </address>
          </div>
        </div>
      </section>
    </div>
  );
}
