import { pool } from "../../server/db";

// Business tier, phase 0 — the org/membership foundation. See
// CLAUDE.md's "PostPlotter for Business" section and shared/schema.ts's
// own comments on these two tables for the full reasoning.
//
// A brand new table pair, non-destructive, no renaming — the same
// raw-SQL-via-`pool` escape hatch already established in CLAUDE.md's
// "Database migrations" section, extended to a new table (not just a
// column) the same way yardBoundaries/gates were.

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS organization_members (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT organization_members_org_user_unique UNIQUE (organization_id, user_id)
      );
    `);
    // Row-Level Security: every public table in this app has RLS enabled
    // with zero policies (see CLAUDE.md's Security settings section,
    // 2026-09-09) — this app never uses Supabase's Data API, so a new
    // table starts exposed to PostgREST's anon/authenticated roles by
    // default unless this is run explicitly. The project's default-
    // privilege fix already stops those roles from being auto-granted
    // anything on a brand new table, but RLS itself has no equivalent
    // default — still needs enabling per table, every time.
    await client.query(`ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;`);
    console.log("organizations / organization_members ready.");
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
