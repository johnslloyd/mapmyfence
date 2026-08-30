import { pool } from "../../server/db";

// Adds gate support: a new `gates` table (one row per gate a user places
// on a fence line) and a new nullable `gate_component` column on the
// existing `products` table (distinguishes a gate hardware kit from a
// cane bolt — see shared/schema.ts's `gates`/`products.gateComponent`
// comments and server/estimates.ts for how they're used together).
//
// Both changes are additive and non-destructive — a brand new table plus
// one new nullable column on an existing table — so this uses the same
// raw-SQL-via-`pool` escape hatch already established in CLAUDE.md's
// "Database migrations" section (extended to a new *table* by the
// yardBoundaries migration, and to a new nullable *column* by
// products.material originally) rather than an interactive
// `drizzle-kit push`. No transaction needed: `CREATE TABLE IF NOT
// EXISTS` and `ADD COLUMN IF NOT EXISTS` are each independently safe to
// run, and running this file twice is a harmless no-op either way.

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS gates (
        id SERIAL PRIMARY KEY,
        fence_line_id INTEGER NOT NULL REFERENCES fence_lines(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        segment_index INTEGER NOT NULL,
        position DOUBLE PRECISION NOT NULL DEFAULT 0.5,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS gate_component TEXT;
    `);

    console.log("gates table + products.gate_component ready.");
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
