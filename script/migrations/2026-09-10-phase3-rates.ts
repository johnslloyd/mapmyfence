import { pool } from "../../server/db";

// Business tier, Phase 3 — the business's own per-foot sell rate,
// by material and height, plus a flat teardown add-on. See
// CLAUDE.md's "PostPlotter for Business" Phase 3 section and
// shared/schema.ts's own comments on organizationRates /
// organizations.teardownRatePerFoot / quotes.includesTeardown for the
// full reasoning. A new table (rate-per-material-per-height, the same
// row-dimension shape `products` already uses) plus two additive
// nullable/defaulted columns on existing tables — the usual raw-SQL-
// via-`pool` escape hatch.

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS teardown_rate_per_foot DOUBLE PRECISION;
    `);
    await client.query(`
      ALTER TABLE quotes
        ADD COLUMN IF NOT EXISTS includes_teardown BOOLEAN NOT NULL DEFAULT false;
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS organization_rates (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        material TEXT NOT NULL,
        height INTEGER NOT NULL,
        rate_per_foot DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT organization_rates_org_material_height_unique UNIQUE (organization_id, material, height)
      );
    `);
    await client.query(`ALTER TABLE organization_rates ENABLE ROW LEVEL SECURITY;`);
    console.log("organizations.teardown_rate_per_foot + quotes.includes_teardown + organization_rates ready.");
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
