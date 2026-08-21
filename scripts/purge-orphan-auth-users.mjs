// Removes auth accounts that were never real residents.
//
//   node scripts/purge-orphan-auth-users.mjs [--apply]
//
// Until Aug 2026 the sign-in form called supabase.auth.admin.generateLink()
// for whatever address was typed into it, on the assumption that an unknown
// address would error. It does not — it creates the account. So the auth table
// filled with addresses harvested for an email-bombing list.
//
// An account is legitimate exactly when it has a profiles row: that row is
// written when a board member approves an application, or by the bootstrap
// script. Anything without one was never approved by anybody.
//
// Two extra guards beyond "has no profile", so this can never quietly delete a
// real resident:
//   * anyone who has ever signed in is kept and reported
//   * anyone whose address is in ADMIN_EMAILS or BOARD_EMAIL_TO is kept
//
// Dry run by default. Pass --apply to delete.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const apply = process.argv.includes("--apply");

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

const protectedAddresses = new Set(
  [env.ADMIN_EMAILS, env.BOARD_EMAIL_TO]
    .filter(Boolean)
    .flatMap((v) => v.split(","))
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
);

const { data: profileRows, error: profileError } = await db
  .from("profiles")
  .select("id, email");
if (profileError) {
  console.error("could not read profiles:", profileError.message);
  process.exit(1);
}
const profileIds = new Set(profileRows.map((p) => p.id));

// listUsers is paginated; walk it rather than assuming one page holds them all.
const users = [];
for (let page = 1; ; page++) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
  if (error) {
    console.error("could not list users:", error.message);
    process.exit(1);
  }
  users.push(...data.users);
  if (data.users.length < 200) break;
}

const keep = [];
const remove = [];
for (const u of users) {
  const address = (u.email ?? "").toLowerCase();
  if (profileIds.has(u.id)) keep.push([u, "has a profile — approved resident"]);
  else if (u.last_sign_in_at) keep.push([u, "HAS SIGNED IN — review by hand"]);
  else if (protectedAddresses.has(address)) keep.push([u, "board address"]);
  else remove.push(u);
}

console.log(`auth users : ${users.length}`);
console.log(`keeping    : ${keep.length}`);
console.log(`deleting   : ${remove.length}\n`);

for (const [u, why] of keep) {
  console.log(`  KEEP  ${(u.email ?? "(none)").padEnd(34)} ${why}`);
}

if (remove.length) {
  const oldest = remove.reduce((a, b) => (a.created_at < b.created_at ? a : b));
  const newest = remove.reduce((a, b) => (a.created_at > b.created_at ? a : b));
  console.log(
    `\n  ${remove.length} orphans, created between ${oldest.created_at.slice(0, 10)}` +
      ` and ${newest.created_at.slice(0, 10)}`
  );
  console.log(`  e.g. ${remove.slice(0, 5).map((u) => u.email).join(", ")}`);
}

if (!apply) {
  console.log("\nDry run. Re-run with --apply to delete.");
  process.exit(0);
}

let done = 0;
let failed = 0;
for (const u of remove) {
  const { error } = await db.auth.admin.deleteUser(u.id);
  if (error) {
    failed++;
    console.error(`  failed ${u.email}: ${error.message}`);
  } else done++;
}
console.log(`\ndeleted ${done}${failed ? `, ${failed} failed` : ""}.`);
