import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Resident Portal | ${siteConfig.shortName}`,
  description:
    "The Fernewood resident portal — announcements, the resident directory, a community board, and park pavilion reservations for Fernewood homeowners.",
};

const features = [
  {
    title: "Announcements",
    body: "Notices from the Board.",
  },
  {
    title: "Resident Directory",
    body: "Look up your neighbors, kept current by the board as residents change.",
  },
  {
    title: "Community Board",
    body: "Ask questions, share photos, and discuss neighborhood topics privately.",
  },
  {
    title: "Park / Pavilion Reservations",
    body: "Request the park pavilion for birthdays, practices, and gatherings — and see what's already booked.",
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

        <div className="flex flex-col gap-4 rounded-lg border border-emerald-900/10 bg-white p-6 sm:flex-row sm:gap-8">
          <div className="flex-1">
            <h2 className="font-semibold text-emerald-950">
              New here?
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Request access once. A board member reviews it and you&apos;ll
              get an email when your account is ready.
            </p>
            <Link
              href="/portal/apply"
              className="mt-3 inline-block rounded-full bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-900"
            >
              Request Access
            </Link>
          </div>

          <div className="flex-1 border-t border-emerald-900/10 pt-4 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
            <h2 className="font-semibold text-emerald-950">
              Already approved?
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Sign in with your email. There&apos;s no password — we send you a
              link each time.
            </p>
            <Link
              href="/portal/login"
              className="mt-3 inline-block rounded-full border border-emerald-800 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
            >
              Sign In
            </Link>
          </div>
        </div>
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
