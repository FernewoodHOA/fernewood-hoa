// Merges two board_tasks rows that turned out to be the same real-world issue.
//
//   node scripts/merge-board-tasks.mjs "<keep match>" "<absorb match>" [--apply]
//
// Matches are case-insensitive substrings tested against "address — issue", and
// must hit exactly one row each, so a typo can't silently merge the wrong item.
//
// The keeper inherits any field it is missing from the absorbed row (an
// address of "TBD" counts as missing), both sets of notes are concatenated,
// and every event and file attachment is re-pointed at the keeper before the
// duplicate is deleted — so the timeline survives the merge.
//
// Dry run by default; prints exactly what it would write. Pass --apply to commit.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const [, , keepMatch, dropMatch, ...flags] = process.argv;
const apply = flags.includes("--apply");
if (!keepMatch || !dropMatch) {
  console.error('Usage: node scripts/merge-board-tasks.mjs "<keep>" "<absorb>" [--apply]');
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

const { data: tasks, error } = await db
  .from("board_tasks")
  .select("id, address, homeowner, issue, status, todo, notes, created_at");
if (error) {
  console.error("read failed:", error.message);
  process.exit(1);
}

const label = (t) => `${t.address} — ${t.issue}`;
function findOne(needle) {
  const hits = tasks.filter((t) =>
    label(t).toLowerCase().includes(needle.toLowerCase())
  );
  if (hits.length !== 1) {
    console.error(
      `"${needle}" matched ${hits.length} rows${
        hits.length ? ":\n  " + hits.map(label).join("\n  ") : ""
      }`
    );
    process.exit(1);
  }
  return hits[0];
}

const keep = findOne(keepMatch);
const drop = findOne(dropMatch);
if (keep.id === drop.id) {
  console.error("Both matches hit the same row.");
  process.exit(1);
}

// "TBD" placeholders are absent for merge purposes, not real values.
const blank = (v) => !v || !v.trim() || /^tbd\b/i.test(v.trim());
const pick = (a, b) => (blank(a) ? (blank(b) ? a : b) : a);

const notes = [keep.notes, drop.notes]
  .filter((n) => n && n.trim())
  .join("\n\n");

const merged = {
  address: pick(keep.address, drop.address),
  homeowner: pick(keep.homeowner, drop.homeowner),
  todo: pick(keep.todo, drop.todo),
  notes: notes || null,
  // Keep whichever status is further from "done"; a merge should never quietly
  // close an item that one of the two rows still had open.
  status: keep.status === 5 && drop.status !== 5 ? drop.status : keep.status,
};

console.log(`keep:   ${label(keep)}  [${keep.id}]`);
console.log(`absorb: ${label(drop)}  [${drop.id}]\n`);
for (const [k, v] of Object.entries(merged)) {
  const before = keep[k];
  const changed = String(before ?? "") !== String(v ?? "");
  if (changed) console.log(`  ${k}: ${JSON.stringify(before)} -> ${JSON.stringify(v)}`);
}

const { data: events } = await db
  .from("board_task_events")
  .select("id")
  .eq("task_id", drop.id);
console.log(`\n  ${events?.length ?? 0} history entries move to the keeper`);

let files = [];
{
  const { data, error: fileErr } = await db
    .from("board_task_files")
    .select("id")
    .eq("task_id", drop.id);
  // The attachments table may not exist in older environments; not fatal.
  if (!fileErr) {
    files = data ?? [];
    console.log(`  ${files.length} attachments move to the keeper`);
  }
}

if (!apply) {
  console.log("\nDry run. Re-run with --apply to commit.");
  process.exit(0);
}

// Re-point children first: if anything below fails, the duplicate still exists
// and nothing is orphaned.
if (events?.length) {
  const { error: e } = await db
    .from("board_task_events")
    .update({ task_id: keep.id })
    .eq("task_id", drop.id);
  if (e) { console.error("moving history failed:", e.message); process.exit(1); }
}
if (files.length) {
  const { error: e } = await db
    .from("board_task_files")
    .update({ task_id: keep.id })
    .eq("task_id", drop.id);
  if (e) { console.error("moving attachments failed:", e.message); process.exit(1); }
}

const { error: upErr } = await db
  .from("board_tasks")
  .update(merged)
  .eq("id", keep.id);
if (upErr) { console.error("update failed:", upErr.message); process.exit(1); }

const { error: delErr } = await db.from("board_tasks").delete().eq("id", drop.id);
if (delErr) { console.error("delete failed:", delErr.message); process.exit(1); }

// Anything the absorbed row said that the keeper didn't take goes into the
// history note rather than disappearing — it was a real board decision once.
const discarded = ["homeowner", "todo", "notes"]
  .filter((k) => !blank(drop[k]) && String(merged[k] ?? "") !== String(drop[k]))
  .map((k) => `${k}: ${drop[k]}`);

await db.from("board_task_events").insert({
  task_id: keep.id,
  from_status: keep.status,
  to_status: merged.status,
  note:
    `Merged with duplicate item "${label(drop)}" — same issue logged twice.` +
    (discarded.length ? ` Superseded from that entry — ${discarded.join("; ")}` : ""),
  changed_by_name: "Merge",
});

console.log("\nmerged.");
