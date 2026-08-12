// Verifies the Supabase connection and that the portal schema is in place.
// Prints only counts and status — never key values.
//
//   node scripts/check-supabase.mjs

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path = ".env.local") {
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

for (const [name, value] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: url,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
})) {
  console.log(`${name}: ${value ? "set" : "MISSING"}`);
}
if (!url || !serviceKey || !anonKey) process.exit(1);

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

console.log("\nTables (via service role):");
for (const table of ["residents", "applications", "profiles"]) {
  const { count, error } = await admin
    .from(table)
    .select("*", { count: "exact", head: true });
  console.log(
    error ? `  ${table}: ERROR — ${error.message}` : `  ${table}: ${count} rows`
  );
}

// The anon key must NOT be able to read the roster. If this returns rows,
// row level security is not doing its job.
const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const { data: leaked, error: anonError } = await anon
  .from("residents")
  .select("id")
  .limit(1);

console.log("\nRLS check — anonymous read of residents:");
if (anonError) {
  console.log(`  blocked (${anonError.code ?? "error"}) — correct`);
} else if (!leaked || leaked.length === 0) {
  console.log("  returned no rows — correct");
} else {
  console.log("  *** LEAK: anonymous client could read the roster ***");
  process.exit(1);
}
