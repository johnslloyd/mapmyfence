import { pool } from "../../server/db";

// Business tier, Phase 1 — the actual quote-send-accept loop. See
// CLAUDE.md's "PostPlotter for Business" Phase 1 section and
// shared/schema.ts's own comments on `organizations.phone`/`.email` and
// the new `quotes` table for the full reasoning.
//
// Two additive, non-destructive changes — a new nullable column pair on
// an EXISTING table, and a brand new table — both the same raw-SQL-via-
// `pool` escape hatch already established in CLAUDE.md's "Database
// migrations" section.

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS phone TEXT,
        ADD COLUMN IF NOT EXISTS email TEXT;
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS quotes (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        created_by_user_id TEXT NOT NULL,
        customer_name TEXT,
        customer_email TEXT NOT NULL,
        business_name TEXT NOT NULL,
        business_phone TEXT,
        business_email TEXT,
        total_linear_feet DOUBLE PRECISION NOT NULL,
        total_cost DOUBLE PRECISION NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    // Row-Level Security: every public table in this app has RLS enabled
    // with zero policies (see CLAUDE.md's Security settings section) —
    // this app never uses Supabase's Data API, so a new table starts
    // exposed to PostgREST's anon/authenticated roles by default unless
    // this is run explicitly. `organizations` already has RLS enabled
    // from Phase 0 (ALTER COLUMN doesn't touch that), so only the new
    // `quotes` table needs it here.
    await client.query(`ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;`);
    console.log("organizations.phone/.email + quotes ready.");
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
