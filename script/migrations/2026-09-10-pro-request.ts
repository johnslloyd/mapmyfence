import { pool } from "../../server/db";

// Adds `users.plan_requested_at` (nullable timestamp) — the manual-
// approval Pro upgrade flow replacing the old instant self-serve flip.
// See CLAUDE.md's "Account tiers" section and shared/schema.ts's own
// comment on this column for the full reasoning.
//
// Additive, non-destructive, nullable with no default needed (every
// existing row correctly has no pending request) — the same raw-SQL-
// via-`pool` escape hatch already established in CLAUDE.md's "Database
// migrations" section for exactly this shape of change, not an
// interactive `drizzle-kit push`.
//
// Row-Level Security note: this is a new COLUMN on an existing table
// (`users`), not a new table — RLS is already enabled with zero
// policies on `users` (see CLAUDE.md's Security settings section from
// 2026-09-09) and stays exactly as it was; nothing here needs to touch
// RLS or grants.

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_requested_at TIMESTAMP;
    `);
    console.log("users.plan_requested_at ready.");
  } finally {
    client.release();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
