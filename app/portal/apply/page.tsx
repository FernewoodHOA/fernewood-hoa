import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import ApplyForm from "./ApplyForm";

export const metadata: Metadata = {
  title: `Request Portal Access | ${siteConfig.shortName}`,
};

// Applications need the database. Until it's configured, show a notice
// rather than a form that only fails once someone has filled it in.
const portalReady = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default function ApplyPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-20">
      <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
        Request Portal Access
      </h1>

      {portalReady ? (
        <>
          <p className="max-w-xl text-stone-600">
            The resident portal is limited to Fernewood homeowners. Fill out
            the form below and a board member will review your request.
          </p>
          <ApplyForm siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
        </>
      ) : (
        <div className="max-w-xl rounded-lg border border-emerald-700/30 bg-emerald-50 p-5">
          <p className="font-medium text-emerald-900">
            Applications aren&apos;t open yet
          </p>
          <p className="mt-1 text-sm text-stone-700">
            The resident portal is still being set up. Check back shortly —
            once it&apos;s ready, you&apos;ll be able to request access here.
          </p>
        </div>
      )}
    </div>
  );
}
