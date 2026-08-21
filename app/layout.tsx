import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { siteConfig } from "@/lib/site-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      {/*
        suppressHydrationWarning: browser extensions (Grammarly and similar)
        add attributes to <body> before React hydrates, which otherwise logs a
        hydration mismatch on every page. Scoped to this element only, so real
        mismatches elsewhere still surface.
      */}
      <body
        suppressHydrationWarning
        className="flex min-h-full flex-col bg-stone-50 font-sans text-stone-900"
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        {/*
          Vercel Web Analytics: page views and referrers, no cookies and no
          cross-site tracking, so it needs no consent banner. Counts only from
          the deploy that introduces it — there is no backfill. Removing it is
          deleting this line and the import.
        */}
        <Analytics />
      </body>
    </html>
  );
}
