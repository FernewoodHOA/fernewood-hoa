// Creates portal accounts for the addresses in ADMIN_EMAILS and marks them
// as administrators. Solves the chicken-and-egg problem: approving anyone
// requires an admin, and the first admin can't approve themselves.
//
//   node scripts/bootstrap-admins.mjs
//
// Safe to re-run: existing accounts are reused, not duplicated.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

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

const emails = (env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

if (emails.length === 0) {
  console.error("ADMIN_EMAILS is empty in .env.local — nothing to do.");
  process.exit(1);
}

const { data: existingList } = await supabase.auth.admin.listUsers();

for (const email of emails) {
  const existing = existingList?.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  let userId = existing?.id;
  let action = "reused existing account";

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (error) {
      console.log(`${email}: FAILED — ${error.message}`);
      continue;
    }
    userId = data.user.id;
    action = "created account";
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    full_name: email.split("@")[0],
    is_admin: true,
  });

  console.log(
    profileError
      ? `${email}: ${action}, but profile failed — ${profileError.message}`
      : `${email}: ${action}, admin profile set`
  );
}

const { count } = await supabase
  .from("profiles")
  .select("*", { count: "exact", head: true })
  .eq("is_admin", true);
console.log(`\nAdmins now: ${count}`);
