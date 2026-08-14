import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { siteConfig } from "@/lib/site-config";
import { getCurrentProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { boardDocuments, BOARD_BUCKET } from "@/lib/documents";

export const metadata: Metadata = {
  title: `Board Documents | ${siteConfig.shortName}`,
};

export const dynamic = "force-dynamic";

export default async function BoardDocumentsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/portal/login?next=/admin/documents");
  if (!profile.is_admin && !profile.is_viewer) redirect("/portal/home");

  // The bucket is private, so each file needs a short-lived signed link.
  const supabase = createAdminClient();
  const { data: signed } = await supabase.storage
    .from(BOARD_BUCKET)
    .createSignedUrls(
      boardDocuments.map((d) => d.file),
      60 * 60
    );

  const urlFor = new Map(
    (signed ?? []).map((s, i) => [boardDocuments[i].file, s.signedUrl])
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-14">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
          Board Documents
        </h1>
        <p className="mt-2 max-w-2xl text-stone-600">
          Records kept for the board rather than published to residents. Links
          expire after an hour, so they can&apos;t be forwarded and left open.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {boardDocuments.map((doc) => {
          const url = urlFor.get(doc.file);
          return (
            <a
              key={doc.file}
              href={url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-3 rounded-lg border border-emerald-900/10 bg-white px-4 py-3 transition-colors hover:border-emerald-700/40"
            >
              <span>
                <span className="font-medium text-emerald-900">{doc.title}</span>
                {doc.note && (
                  <span className="block text-sm text-stone-600">{doc.note}</span>
                )}
              </span>
              <span className="shrink-0 whitespace-nowrap text-xs text-stone-500">
                PDF · {doc.size}
              </span>
            </a>
          );
        })}
      </div>

      <p className="max-w-2xl text-sm text-stone-500">
        To add a document, upload the PDF to the <code>board-documents</code>{" "}
        bucket in Supabase and add an entry to <code>lib/documents.ts</code>.
        Anything placed in that bucket stays private — the public covenants
        live in a separate <code>documents</code> bucket.
      </p>

      <Link
        href="/admin"
        className="text-sm font-medium text-emerald-800 hover:text-emerald-900"
      >
        &larr; Board tools
      </Link>
    </div>
  );
}
