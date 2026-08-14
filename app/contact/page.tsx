import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { accountingContact, mailingAddress } from "@/lib/board";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: `Contact the Board | ${siteConfig.shortName}`,
  description:
    "Send a message to the Fernewood Homeowners Association Board of Directors.",
};

const formReady = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export default function ContactPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-14">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
          Contact the Board
        </h1>
        <p className="mt-3 max-w-2xl text-stone-600">
          Use the form below for covenant questions, neighborhood concerns,
          suggestions, or anything else for the Board. Your message goes to
          every board member, and whoever is best placed to help will reply to
          the email address you provide.
        </p>
        <p className="mt-2 max-w-2xl text-stone-600">
          <span className="font-medium text-emerald-950">
            Questions about dues, payments, or your account balance
          </span>{" "}
          are handled by the association&apos;s accounting office — call them
          directly at{" "}
          <a
            href={accountingContact.officeHref}
            className="font-medium text-emerald-800 hover:text-emerald-900"
          >
            {accountingContact.office}
          </a>
          .
        </p>
      </div>

      {/* Form and contact details sit side by side on wide screens so the
          phone number and address don't require scrolling past the form. */}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section>
          {formReady ? (
            <ContactForm siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
          ) : (
            <div className="max-w-lg rounded-lg border border-emerald-700/30 bg-emerald-50 p-5">
              <p className="font-medium text-emerald-900">
                The contact form isn&apos;t available yet
              </p>
              <p className="mt-1 text-sm text-stone-700">
                In the meantime, please use the phone number or mailing address
                listed here.
              </p>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold tracking-tight text-emerald-950">
            Other ways to reach us
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-lg border border-emerald-900/10 bg-white p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Association Office
              </h3>
              <address className="mt-2 not-italic leading-relaxed text-stone-700">
                <span className="font-medium text-emerald-900">
                  {accountingContact.name}
                </span>
                <br />
                {accountingContact.title}
                <br />
                Office:{" "}
                <a
                  href={accountingContact.officeHref}
                  className="font-medium text-emerald-800 hover:text-emerald-900"
                >
                  {accountingContact.office}
                </a>
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
    </div>
  );
}
