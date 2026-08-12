import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="relative flex h-[70vh] min-h-[420px] items-end overflow-hidden">
        <Image
          src="/hero-sign-wide.jpg"
          alt="Fernewood neighborhood entrance sign"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-emerald-950/50" />
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-start gap-3 px-6 pb-14 text-white">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-100">
            {siteConfig.location}
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {siteConfig.name}
          </h1>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-4xl flex-col items-start gap-6 px-6 py-16">
        <p className="max-w-xl text-lg text-stone-600">
          Welcome to the official website for the Fernewood community. Here
          you&apos;ll find neighborhood information and access to our
          governing documents.
        </p>
        <Link
          href="/covenants"
          className="rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-900"
        >
          View Covenants & Restrictions
        </Link>
      </section>
    </div>
  );
}
