// Gives the bootstrapped admin accounts their real names. The bootstrap
// script had only email addresses to work from, so profiles were created with
// the email prefix as the display name.
//
//   node scripts/set-board-names.mjs

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

// Names as published on the public Board of Directors page.
const NAMES = {
  "jaredpolitz@gmail.com": "Jared Politz",
  "henry.mayeriii@raymondjames.com": "Henry Mayer",
  "robertburnell9@gmail.com": "Rob Burnell",
  "tschoeffler@thdlcpa.com": "Ted Schoeffler",
  "jlyons@fnb-la.com": "Jim Lyons",
};

const { data: users } = await supabase.auth.admin.listUsers();

for (const user of users?.users ?? []) {
  const name = NAMES[user.email?.toLowerCase() ?? ""];
  if (!name) continue;

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: name })
    .eq("id", user.id);

  console.log(error ? `${user.email}: FAILED — ${error.message}` : `${user.email}: ${name}`);
}
