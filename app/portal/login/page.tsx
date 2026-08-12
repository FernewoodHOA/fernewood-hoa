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

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-20">
      <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
        Resident Sign In
      </h1>
      <p className="max-w-xl text-stone-600">
        Enter your email and we&apos;ll send you a sign-in link. Accounts are
        created once the board approves your access request.
      </p>

      <LoginForm next={next} />

      <p className="text-sm text-stone-600">
        Don&apos;t have access yet?{" "}
        <Link
          href="/portal/apply"
          className="font-medium text-emerald-800 hover:text-emerald-900"
        >
          Request access
        </Link>
        .
      </p>
    </div>
  );
}
