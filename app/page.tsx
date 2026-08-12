import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="relative flex h-[70vh] min-h-[420px] items-end overflow-hidden">
        <Image
          src="/hero-sign-closeup.jpg"
          alt="Fernewood neighborhood entrance sign"
          fill
          priority
          className="object-cover object-[center_65%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-emerald-950/25 to-emerald-950/10" />
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
