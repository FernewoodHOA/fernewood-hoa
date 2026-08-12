import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: `Sign In | ${siteConfig.shortName}`,
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/portal/login">) {
  const params = await searchParams;
  const raw = params?.next;
  const candidate = Array.isArray(raw) ? raw[0] : raw;
  // Only allow same-site paths — an attacker-supplied absolute URL here
  // would turn the sign-in link into an open redirect.
  const next =
    candidate && candidate.startsWith("/") && !candidate.startsWith("//")
      ? candidate
      : "/portal/home";

  const errorRaw = params?.error;
  const errorCode = Array.isArray(errorRaw) ? errorRaw[0] : errorRaw;
  const errorMessage =
    errorCode === "expired_link"
      ? "That sign-in link has expired or was already used. Request a new one below."
      : errorCode === "invalid_link"
        ? "That sign-in link wasn't valid. Request a new one below."
        : null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-20">
      <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
        Resident Sign In
      </h1>
      <p className="max-w-xl text-stone-600">
        Enter the email address your account was approved under. We&apos;ll
        send you a link that signs you in — there&apos;s no password to
        remember.
      </p>

      {errorMessage && (
        <p
          role="alert"
          className="max-w-lg rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          {errorMessage}
        </p>
      )}

      <LoginForm next={next} />

      <p className="border-t border-emerald-900/10 pt-5 text-sm text-stone-600">
        <span className="font-medium text-emerald-950">
          Never requested access?
        </span>{" "}
        If the board hasn&apos;t approved an account for you yet, you&apos;ll
        need to{" "}
        <Link
          href="/portal/apply"
          className="font-medium text-emerald-800 underline underline-offset-2 hover:text-emerald-900"
        >
          request access
        </Link>{" "}
        first. If you&apos;ve already been approved, just use the form above.
      </p>
    </div>
  );
}
