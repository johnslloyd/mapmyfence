import { pool } from "../../server/db";

// "Use my location" when adding a property — two nullable columns on the
// EXISTING `properties` table holding the yard's confirmed lat/lng. The
// standard additive raw-SQL-via-`pool` escape hatch (see CLAUDE.md's
// "Database migrations"). Must run BEFORE the code that reads these
// columns deploys: Drizzle's select() names every schema column, so
// shipping first would break every property query.

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE properties
        ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
    `);
    console.log("properties.latitude / .longitude ready.");
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
