/**
 * Association documents, stored in the Fernewood Supabase project rather than
 * on anyone's personal cloud drive.
 *
 * To add or replace one: upload the PDF to the `documents` bucket under
 * `covenants/` in the Supabase dashboard, then add an entry here. No code
 * change is needed to REPLACE a file — overwrite it with the same name and
 * the link keeps working.
 */
const BUCKET =
  "https://cxdhpkbxmofjlpgockac.supabase.co/storage/v1/object/public/documents";
const BASE = `${BUCKET}/covenants`;

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

/**
 * Recorded survey plats — the authoritative source for lot lines, street
 * names and municipal numbers. These are what resolved the phase gaps in the
 * restriction guide, including Blenheim Drive's rename to Fernewood Drive.
 *
 * Converted from the original TIF scans to PDF (~100 MB down to ~7 MB) at a
 * resolution where every municipal number stays legible.
 */
export const platDocuments: Document[] = [
  {
    title: "Master Plat",
    file: "fernewood-master-plat.pdf",
    size: "577 KB",
    note: "The whole subdivision with phase boundaries.",
  },
  { title: "Phase I", file: "fernewood-phase-1-final-plat.pdf", size: "539 KB" },
  { title: "Phase II", file: "fernewood-phase-2-final-plat.pdf", size: "566 KB" },
  { title: "Phase III", file: "fernewood-phase-3-final-plat.pdf", size: "582 KB" },
  { title: "Phase IV", file: "fernewood-phase-4-final-plat.pdf", size: "654 KB" },
  { title: "Phase V", file: "fernewood-phase-5-final-plat.pdf", size: "578 KB" },
  { title: "Phase VI", file: "fernewood-phase-6-final-plat.pdf", size: "568 KB" },
  { title: "Phase VII", file: "fernewood-phase-7-final-plat.pdf", size: "514 KB" },
  { title: "Phase VIII", file: "fernewood-phase-8-final-plat.pdf", size: "505 KB" },
  { title: "Phase IX", file: "fernewood-phase-9-final-plat.pdf", size: "546 KB" },
  { title: "Phase XI", file: "fernewood-phase-11-final-plat.pdf", size: "525 KB" },
  { title: "Phase XII", file: "fernewood-phase-12-final-plat.pdf", size: "606 KB" },
];

export function platUrl(file: string): string {
  return `${BUCKET}/plats/${file}`;
}

export function documentUrl(file: string): string {
  return `${BASE}/${file}`;
}
