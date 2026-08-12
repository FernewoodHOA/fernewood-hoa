import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Resident Portal | ${siteConfig.shortName}`,
  description:
    "The Fernewood resident portal — announcements, financials, the resident directory, and a community board for Fernewood homeowners.",
};

const features = [
  {
    title: "Announcements",
    body: "Notices from the board, in one place instead of scattered across flyers and word of mouth.",
  },
  {
    title: "Financials",
    body: "Association financial documents, available to residents whenever you want to review them.",
  },
  {
    title: "Resident Directory",
    body: "Look up your neighbors, kept current by the board as residents change.",
  },
  {
    title: "Community Board",
    body: "Ask questions, share photos, and raise concerns with the rest of the neighborhood.",
  },
];

export default function PortalPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-12 px-6 py-20">
      <section className="flex flex-col items-start gap-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
          Coming soon
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl">
          The Fernewood Resident Portal
        </h1>
        <p className="max-w-xl text-lg text-stone-600">
          We&apos;re building a private space for Fernewood homeowners. Access
          is limited to residents, so every request is reviewed by a board
          member before an account is activated.
        </p>
        <Link
          href="/portal/apply"
          className="rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-900"
        >
          Request Access
        </Link>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-lg border border-emerald-900/10 bg-white p-5"
          >
            <h2 className="font-semibold text-emerald-950">{feature.title}</h2>
            <p className="mt-1 text-sm text-stone-600">{feature.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
