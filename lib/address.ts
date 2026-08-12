/**
 * Normalizes a street address for roster matching: lowercase, collapsed
 * whitespace, no punctuation, common suffixes expanded to a single form.
 * Mirrors the `address_key` column generated in the residents table, plus
 * the suffix handling that Postgres expression deliberately leaves out.
 */
const SUFFIXES: Record<string, string> = {
  dr: "drive",
  ave: "avenue",
  av: "avenue",
  st: "street",
  rd: "road",
  ln: "lane",
  ct: "court",
  cir: "circle",
  blvd: "boulevard",
  pl: "place",
  trl: "trail",
};

export function normalizeAddress(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[.,#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return base
    .split(" ")
    .map((word) => SUFFIXES[word] ?? word)
    .join(" ");
}
