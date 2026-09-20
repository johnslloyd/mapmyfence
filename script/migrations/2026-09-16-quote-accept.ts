import { pool } from "../../server/db";

// Scheduling MVP, slice 1 — "accept a quote" plus enough contact info to
// let the business actually call the customer afterward. Deliberately NOT
// a calendar/availability feature — see CLAUDE.md for the fuller reasoning
// (a "propose dates, customer picks, business confirms" flow is a real,
// separate future step; this is the smaller "accept, then pick up the
// phone" version).
//
// Two additive, non-destructive columns on the EXISTING `quotes` table —
// the standard raw-SQL-via-`pool` escape hatch from CLAUDE.md's "Database
// migrations" section. `projects.status` also gains a `"scheduled"` value
// in this same pass, but needs no migration at all — `text`'s `enum`
// option is TS-only (see shared/schema.ts).

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE quotes
        ADD COLUMN IF NOT EXISTS customer_phone TEXT,
        ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP;
    `);
    console.log("quotes.customer_phone / .accepted_at ready.");
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
