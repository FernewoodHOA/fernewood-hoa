// Imports the board's action-item spreadsheet into board_tasks, mapping the
// old 1–4 colour scale onto the five workflow statuses.
//
//   node scripts/import-board-tasks.mjs "C:\path\to\tasks.csv" [--force]
//
// The CSV holds homeowner names against delinquent dues and legal action, so
// it is never copied into the repo — pass the path, don't move the file.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const [, , csvPath, ...flags] = process.argv;
const force = flags.includes("--force");
if (!csvPath) {
  console.error('Usage: node scripts/import-board-tasks.mjs "<file.csv>" [--force]');
  process.exit(1);
}

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
const db = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/** Minimal CSV parser — handles the quoted commas in the To-Do column. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (ch !== "\r") field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/**
 * Old scale -> new workflow status, decided by what the To-Do actually says.
 * The old numbers mixed severity with progress, so the action text is the
 * better signal: "write a letter" is the board's move, "build within
 * restrictions" is the homeowner's.
 */
function mapStatus(oldStatus, todo) {
  const t = (todo || "").toLowerCase();

  if (/lawsuit|legal|attorney|cert mail/.test(t)) return 4; // escalated
  if (/completed|complete\b/.test(t)) return 5; // resolved
  if (/quote|contractor|vendor/.test(t)) return 3; // waiting on vendor
  // Something the resident must do before the board can act.
  if (/pre-approved|build within|subject to/.test(t)) return 2; // waiting on homeowner
  if (/write|knock|deliver|letter|pending hoa approval|evaluat/.test(t)) return 1;

  return oldStatus === "1" ? 5 : 1;
}

const rows = parseCsv(readFileSync(csvPath, "utf8"));
const [header, ...body] = rows;
console.log(`columns: ${header.join(" | ")}`);

const records = body.map((r) => {
  const [address, homeowner, issue, status, todo, notes] = r.map((c) => c.trim());
  return {
    address: address || "Unspecified",
    homeowner: homeowner || null,
    issue,
    status: mapStatus(status, todo),
    todo: todo || null,
    notes: notes || null,
  };
});

const { count } = await db
  .from("board_tasks")
  .select("*", { count: "exact", head: true });

if (count > 0 && !force) {
  console.error(`\nboard_tasks already has ${count} rows. Re-run with --force to replace.`);
  process.exit(1);
}
if (count > 0) {
  await db.from("board_tasks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log(`cleared ${count} existing rows`);
}

const { data: inserted, error } = await db
  .from("board_tasks")
  .insert(records)
  .select("id, status, issue, address");

if (error) {
  console.error("insert failed:", error.message);
  process.exit(1);
}

// Seed the history so every item has an origin entry to build a timeline on.
await db.from("board_task_events").insert(
  inserted.map((t) => ({
    task_id: t.id,
    from_status: null,
    to_status: t.status,
    note: "Imported from the board's spreadsheet",
    changed_by_name: "Import",
  }))
);

const LABELS = {
  1: "Needs board action",
  2: "Waiting on homeowner",
  3: "Waiting on vendor/attorney",
  4: "Escalated — legal",
  5: "Resolved",
};

console.log(`\nimported ${inserted.length} items:\n`);
for (const s of [1, 2, 3, 4, 5]) {
  const items = inserted.filter((t) => t.status === s);
  if (!items.length) continue;
  console.log(`  ${LABELS[s]} (${items.length})`);
  for (const t of items) console.log(`     ${t.address} — ${t.issue}`);
}
