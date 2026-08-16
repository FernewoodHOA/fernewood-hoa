// Merges an updated roster export into the residents table.
//
//   node scripts/merge-roster-update.mjs "C:/path/to/updated.xlsx" [--apply]
//
// Deliberately NOT a re-import. Several properties carry phases that were
// worked out from the survey plats and local knowledge rather than derived
// from the restriction guide (the renumbered Farmington 600/601 and the
// Llansfair 200s). Re-running the importer would blank those, so this only
// touches names and contact details, and never writes to `phase`.
//
// It also never deletes. A property missing from a billing export may still
// be owned and occupied — 100 and 101 Barrington were exactly that case.
// Dropped rows are reported for a human to check against the Assessor.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";

const [, , xlsxPath, ...flags] = process.argv;
const apply = flags.includes("--apply");
if (!xlsxPath) {
  console.error('Usage: node scripts/merge-roster-update.mjs "<file.xlsx>" [--apply]');
  process.exit(1);
}

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq !== -1) env[t.slice(0, eq)] = t.slice(eq + 1);
}
const db = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/**
 * Number + street name, with the street TYPE removed entirely, so
 * "101 Thornhill", "101 Thornhill Cir" and "101 Thornhill Circle" all match.
 * Keeping the type would have inserted duplicate rows for the two Thornhill
 * households when the export started spelling them out.
 */
function key(address) {
  return address
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\b(cir|circle|dr|drive|st|street|ln|lane|ct|court|rd|road)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Addresses whose owner we've verified against the Parish Assessor and which
 * the billing export is known to have stale. The export lags behind sales, so
 * merging it blindly would undo the correction.
 */
const ASSESSOR_VERIFIED = new Set([
  key("106 Glenleven Drive"), // sold to the Blanchards; export still shows Hebert
]);

const wb = XLSX.readFile(xlsxPath);
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
  header: 1,
  defval: null,
  blankrows: false,
});
const incoming = new Map();
for (const r of rows.slice(5)) {
  const addr = [String(r[0] ?? "").trim(), String(r[1] ?? "").trim()]
    .filter(Boolean)
    .join(" ");
  if (!addr || !String(r[2] ?? "").trim()) continue;
  incoming.set(key(addr), {
    address: addr,
    name: String(r[2]).trim(),
    phone_1: r[3] ? String(r[3]).trim() : null,
    phone_2: r[4] ? String(r[4]).trim() : null,
    email_1: r[5] ? String(r[5]).trim() : null,
    email_2: r[6] ? String(r[6]).trim() : null,
  });
}

const { data: existing } = await db
  .from("residents")
  .select("id, address, name, phone_1, phone_2, email_1, email_2, phase");
const byKey = new Map((existing ?? []).map((r) => [key(r.address), r]));

const updates = [];
const inserts = [];
const missing = [];
const skipped = [];

for (const [k, inc] of incoming) {
  const cur = byKey.get(k);
  if (!cur) {
    inserts.push(inc);
    continue;
  }
  if (ASSESSOR_VERIFIED.has(k)) {
    skipped.push({ address: cur.address, ours: cur.name, export: inc.name });
    continue;
  }
  const changes = {};
  for (const f of ["name", "phone_1", "phone_2", "email_1", "email_2"]) {
    if ((cur[f] ?? "") !== (inc[f] ?? "")) changes[f] = inc[f];
  }
  // Adopt the fuller street spelling ("Thornhill" -> "Thornhill Circle").
  if (inc.address.length > cur.address.length && key(inc.address) === k) {
    changes.address = inc.address;
  }
  if (Object.keys(changes).length) {
    updates.push({ id: cur.id, address: cur.address, changes });
  }
}
for (const [k, cur] of byKey) {
  if (!incoming.has(k)) missing.push(cur);
}

console.log(`incoming rows: ${incoming.size}`);
console.log(`existing rows: ${byKey.size}\n`);

console.log(`=== would UPDATE (${updates.length}) ===`);
for (const u of updates) {
  console.log(`  ${u.address}`);
  for (const [f, v] of Object.entries(u.changes)) console.log(`      ${f} -> ${v ?? "—"}`);
}
console.log(`\n=== would INSERT (${inserts.length}) ===`);
for (const i of inserts) console.log(`  ${i.address} — ${i.name}`);
console.log(`\n=== in our roster but NOT in this export (${missing.length}) — kept, not deleted ===`);
for (const m of missing) console.log(`  ${m.address} — ${m.name} (${m.phase})`);
console.log(`\n=== SKIPPED, Assessor-verified (${skipped.length}) ===`);
for (const s of skipped) {
  console.log(`  ${s.address}`);
  console.log(`      ours (Assessor): ${s.ours}`);
  console.log(`      export (stale):  ${s.export}`);
}

if (!apply) {
  console.log("\nDry run. Re-run with --apply to write these changes.");
  process.exit(0);
}

for (const u of updates) {
  const { error } = await db.from("residents").update(u.changes).eq("id", u.id);
  if (error) console.log(`  FAILED ${u.address}: ${error.message}`);
}
if (inserts.length) {
  // No phase: it isn't derivable here, and guessing would be worse than blank.
  const { error } = await db.from("residents").insert(inserts);
  if (error) console.log(`  INSERT FAILED: ${error.message}`);
}

const { count } = await db.from("residents").select("*", { count: "exact", head: true });
const { count: noPhase } = await db
  .from("residents")
  .select("*", { count: "exact", head: true })
  .is("phase", null);
console.log(`\napplied. roster: ${count} residents, ${noPhase} without a phase.`);
