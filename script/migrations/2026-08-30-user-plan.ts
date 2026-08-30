import { pool } from "../../server/db";

// Adds `users.plan` ('free' | 'pro', default 'free') — the account-tier
// groundwork behind the free/Pro property limit (see CLAUDE.md's
// "Account tiers" section and server/routes.ts's FREE_PROPERTY_LIMIT).
//
// Additive, non-destructive, has a DEFAULT so existing rows backfill
// automatically — the same raw-SQL-via-`pool` escape hatch already
// established in CLAUDE.md's "Database migrations" section for exactly
// this shape of change (a new nullable-or-defaulted column on an
// existing table), not an interactive `drizzle-kit push`.

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
    `);
    console.log("users.plan ready.");
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
