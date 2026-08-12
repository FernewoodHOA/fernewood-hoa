// Imports the resident roster from the accounting export into Supabase and
// derives each resident's phase from the restriction guide.
//
//   node scripts/import-residents.mjs "C:\path\to\roster.xlsx" [--force]
//
// Refuses to run against a non-empty residents table unless --force is given,
// in which case the table is replaced. Prints counts and unmatched addresses
// only — never resident contact details.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";

const [, , xlsxPath, ...flags] = process.argv;
const force = flags.includes("--force");

if (!xlsxPath) {
  console.error("Usage: node scripts/import-residents.mjs <roster.xlsx> [--force]");
  process.exit(1);
}

// --- env -------------------------------------------------------------------
function loadEnv(path = ".env.local") {
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq !== -1) env[t.slice(0, eq)] = t.slice(eq + 1);
  }
  return env;
}
const env = loadEnv();
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// --- restriction guide -> street/number -> phase ---------------------------
// Read the same source the website renders so the two can't drift.
const guideSrc = readFileSync("lib/restriction-guide.ts", "utf8");
const guide = eval(
  guideSrc
    .replace(/^export\s+const\s+restrictionGuide\s*=\s*/m, "")
    .replace(/;\s*$/, "")
);

const DASH = /[–—-]/; // the guide uses en dashes

/** Turns one guide line ("202 & 205–216 & 219 Waterford") into a rule. */
function parseEntry(line) {
  let text = line.replace(/\(all\)/gi, "").trim();

  if (/^all of /i.test(text)) {
    return { street: normStreet(text.replace(/^all of /i, "")), whole: true };
  }

  // Leading number spec is everything up to the first word that isn't a
  // number, range, separator, or ampersand.
  const tokens = text.split(/\s+/);
  const numTokens = [];
  let i = 0;
  for (; i < tokens.length; i++) {
    const tok = tokens[i].replace(/,$/, "");
    if (/^\d+$/.test(tok) || new RegExp(`^\\d+${DASH.source}\\d+$`).test(tok) || tok === "&") {
      numTokens.push(tok);
    } else break;
  }
  const street = normStreet(tokens.slice(i).join(" "));
  const ranges = [];
  for (const tok of numTokens) {
    if (tok === "&") continue;
    const parts = tok.split(DASH);
    if (parts.length === 2) ranges.push([Number(parts[0]), Number(parts[1])]);
    else ranges.push([Number(tok), Number(tok)]);
  }
  return { street, ranges, whole: false };
}

// Strips the street-type suffix so "Barrington Cir", "Barrington Cir." and
// "Barrington Circle" all reduce to "barrington".
function normStreet(s) {
  return s
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(
      /\b(circle|cir|drive|dr|street|st|lane|ln|court|ct|road|rd|avenue|ave|boulevard|blvd|place|pl|trail|trl)\b/g,
      " "
    )
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const rules = [];
for (const { phase, streets } of guide) {
  for (const line of streets) rules.push({ phase, ...parseEntry(line) });
}

function phaseFor(address) {
  const m = String(address).trim().match(/^(\d+)\s+(.*)$/);
  if (!m) return null;
  const num = Number(m[1]);
  const street = normStreet(m[2]);
  for (const rule of rules) {
    if (rule.street !== street) continue;
    if (rule.whole) return rule.phase;
    if (rule.ranges.some(([lo, hi]) => num >= lo && num <= hi)) return rule.phase;
  }
  return null;
}

// --- read the roster -------------------------------------------------------
const wb = XLSX.readFile(xlsxPath);
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
  header: 1,
  defval: null,
  blankrows: false,
});

// Row 4 is the header. Despite being labelled "Customer ID", column A is the
// house number (100–808) — the accounting system keys each account by
// property. The full address is column A + column B.
const dataRows = rows.slice(5).filter((r) => r[0] || r[1] || r[2]);

const records = [];
const unmatchedPhase = [];
for (const r of dataRows) {
  const houseNumber = String(r[0] ?? "").trim();
  const street = String(r[1] ?? "").trim();
  const address = [houseNumber, street].filter(Boolean).join(" ");
  const name = String(r[2] ?? "").trim();
  if (!address || !name) continue;

  const phase = phaseFor(address);
  if (!phase) unmatchedPhase.push(address);

  records.push({
    customer_id: houseNumber || null,
    address,
    name,
    phone_1: r[3] ? String(r[3]).trim() : null,
    phone_2: r[4] ? String(r[4]).trim() : null,
    email_1: r[5] ? String(r[5]).trim() : null,
    email_2: r[6] ? String(r[6]).trim() : null,
    phase,
  });
}

console.log(`Parsed ${records.length} residents from the spreadsheet.`);
console.log(
  `Phase derived for ${records.length - unmatchedPhase.length}; ` +
    `${unmatchedPhase.length} need a manual look.`
);
if (unmatchedPhase.length) {
  console.log("\nAddresses with no phase match:");
  for (const a of unmatchedPhase) console.log(`  ${a}`);
}

// --- write -----------------------------------------------------------------
const { count } = await supabase
  .from("residents")
  .select("*", { count: "exact", head: true });

if (count > 0 && !force) {
  console.error(
    `\nresidents already has ${count} rows. Re-run with --force to replace them.`
  );
  process.exit(1);
}

if (count > 0) {
  const { error } = await supabase.from("residents").delete().gt("id", 0);
  if (error) {
    console.error("Failed clearing residents:", error.message);
    process.exit(1);
  }
  console.log(`\nCleared ${count} existing rows.`);
}

for (let i = 0; i < records.length; i += 100) {
  const chunk = records.slice(i, i + 100);
  const { error } = await supabase.from("residents").insert(chunk);
  if (error) {
    console.error(`Insert failed at row ${i}:`, error.message);
    process.exit(1);
  }
}

const { count: finalCount } = await supabase
  .from("residents")
  .select("*", { count: "exact", head: true });
console.log(`\nDone. residents now has ${finalCount} rows.`);
