/**
 * One-time migration: create a Supabase Auth user for every existing
 * employee row, and link it back via employees.auth_user_id.
 *
 * Run this AFTER migration 0001_link_employees_to_auth.sql has been
 * pushed (npx supabase db push --remote), and BEFORE switching the login
 * route over to Supabase Auth.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (service role only —
 * auth.admin.createUser is not available with the anon key).
 *
 * Usage: node scripts/migrate-users-to-auth.js
 * Add --dry-run to see what it would do without creating anything.
 */

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const DEMO_PASSWORDS = {
  akshay: "akshay@123",
  kaarthik: "kaarthik@123",
  treesa: "treesa@123",
  hari: "hari@123",
};

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: employees, error } = await supabase
    .from("employees")
    .select("id, username, name, email, classification, auth_user_id");

  if (error) {
    console.error("Failed to load employees:", error.message);
    process.exit(1);
  }

  console.log(`Found ${employees.length} employee row(s).\n`);

  for (const emp of employees) {
    if (emp.auth_user_id) {
      console.log(`[skip] ${emp.username} (#${emp.id}) already linked to auth user ${emp.auth_user_id}`);
      continue;
    }

    if (!emp.email) {
      console.warn(`[skip] ${emp.username} (#${emp.id}) has no email — cannot create an Auth user without one`);
      continue;
    }

    const password = DEMO_PASSWORDS[emp.username] || DEMO_PASSWORDS[emp.classification];
    if (!password) {
      console.warn(
        `[skip] ${emp.username} (#${emp.id}) — no known demo password for this username. ` +
          `Add it to DEMO_PASSWORDS in this script, or create the Auth user manually and set auth_user_id yourself.`
      );
      continue;
    }

    if (dryRun) {
      console.log(`[dry-run] would create Auth user for ${emp.username} (#${emp.id}) <${emp.email}>`);
      continue;
    }

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: emp.email,
      password,
      email_confirm: true,
      user_metadata: { employee_id: emp.id, name: emp.name },
    });

    if (createError) {
      console.error(`[fail] ${emp.username} (#${emp.id}): ${createError.message}`);
      continue;
    }

    const { error: linkError } = await supabase
      .from("employees")
      .update({ auth_user_id: created.user.id })
      .eq("id", emp.id);

    if (linkError) {
      console.error(`[fail] ${emp.username} (#${emp.id}) created Auth user but failed to link it: ${linkError.message}`);
      continue;
    }

    console.log(`[ok] ${emp.username} (#${emp.id}) -> auth user ${created.user.id}`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
