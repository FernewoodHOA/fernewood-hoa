/**
 * Association documents, stored in the Fernewood Supabase project rather than
 * on anyone's personal cloud drive.
 *
 * To add or replace one: upload the PDF to the `documents` bucket under
 * `covenants/` in the Supabase dashboard, then add an entry here. No code
 * change is needed to REPLACE a file — overwrite it with the same name and
 * the link keeps working.
 */
const BASE =
  "https://cxdhpkbxmofjlpgockac.supabase.co/storage/v1/object/public/documents/covenants";

export type Document = {
  title: string;
  file: string;
  size: string;
  note?: string;
};

export const phaseDocuments: Document[] = [
  { title: "Phase I", file: "restrictive-covenants-phase-i.pdf", size: "2.9 MB" },
  { title: "Phase II", file: "restrictive-covenants-phase-ii.pdf", size: "2.0 MB" },
  { title: "Phase III", file: "restrictive-covenants-phase-iii.pdf", size: "2.4 MB" },
  { title: "Phase IV", file: "restrictive-covenants-phase-iv.pdf", size: "2.4 MB" },
  { title: "Phase V", file: "restrictive-covenants-phase-v.pdf", size: "2.4 MB" },
  { title: "Phase VI", file: "restrictive-covenants-phase-vi.pdf", size: "2.7 MB" },
  { title: "Phase VII", file: "restrictive-covenants-phase-vii.pdf", size: "2.0 MB" },
  { title: "Phase VIII", file: "restrictive-covenants-phase-viii.pdf", size: "2.0 MB" },
  { title: "Phase IX", file: "restrictive-covenants-phase-ix.pdf", size: "2.0 MB" },
  { title: "Phase XI", file: "restrictive-covenants-phase-xi.pdf", size: "2.2 MB" },
  { title: "Phase XII", file: "restrictive-covenants-phase-xii.pdf", size: "2.5 MB" },
];

export const generalDocuments: Document[] = [
  {
    title: "Enforcement of Restrictive Covenants",
    file: "enforcement-of-restrictive-covenants.pdf",
    size: "421 KB",
    note: "How the association enforces the covenants.",
  },
  {
    title: "Properties Covered by Each Phase",
    file: "properties-covered-by-each-phase.pdf",
    size: "3 KB",
    note: "Revised 2026 — corrected against the recorded survey plats. Generated from this site's records by scripts/build-phase-list-pdf.mjs.",
  },
];

/**
 * Board-only documents, held in the private `board-documents` bucket and
 * reached through short-lived signed URLs. Not linked from any public page.
 */
export const boardDocuments: Document[] = [
  {
    title: "Zoning — 2006 Bass Property",
    file: "zoning-2006-bass-property-issues.pdf",
    size: "124 KB",
    note: "Zoning dispute records. Board access only.",
  },
];

export const BOARD_BUCKET = "board-documents";

export function documentUrl(file: string): string {
  return `${BASE}/${file}`;
}
