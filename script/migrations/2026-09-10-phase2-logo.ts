import { pool } from "../../server/db";

// Business tier, Phase 2 — team features. See CLAUDE.md's "PostPlotter
// for Business" Phase 2 section and shared/schema.ts's own comments on
// organizations.logoData / quotes.businessLogoData for the full
// reasoning. Two additive, nullable columns on EXISTING tables — the
// usual raw-SQL-via-`pool` escape hatch, no new table this time (the
// roster/seat-cap/quotes-rollup pieces of Phase 2 are all built on
// tables that already exist from Phase 0/1).

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS logo_data TEXT;
    `);
    await client.query(`
      ALTER TABLE quotes
        ADD COLUMN IF NOT EXISTS business_logo_data TEXT;
    `);
    console.log("organizations.logo_data + quotes.business_logo_data ready.");
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
