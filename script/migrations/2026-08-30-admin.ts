import { pool } from "../../server/db";

// Admin panel groundwork:
//   - users.is_admin (boolean, default false) — gates /admin and the
//     api.admin.* routes, checked server-side on every request.
//   - users.created_at — retroactive; existing rows backfill to THIS
//     migration's run time, not their real signup date (never captured
//     before now). Real for every account created from this point on.
//   - The `events` table itself, created here for the first time — it's
//     been defined in shared/schema.ts since early in this project but,
//     per CLAUDE.md, was never actually pushed to the live DB. Every
//     `logEvent()` call since then has been silently failing
//     (`relation "events" does not exist`, confirmed repeatedly in dev
//     server logs this session) and swallowing the error, by design
//     (logEvent is fire-and-forget so a logging failure never breaks a
//     real request) — which is exactly why nobody noticed. The admin
//     panel's "monitor user behavior during beta" job needs this table
//     to actually exist, so this migration finally creates it.
//   - events.target_user_id — the admin panel's own audit log
//     (admin_viewed_users/admin_viewed_user) needs to record which user
//     an admin looked at, separately from `user_id` (which already
//     means "who the event is about" for every other event type, and
//     for admin_* events instead means "which admin took the action").
//
// All additive/new — the same raw-SQL-via-`pool` escape hatch already
// established in CLAUDE.md's "Database migrations" section, not an
// interactive `drizzle-kit push`.

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        property_id INTEGER,
        project_id INTEGER,
        user_id TEXT,
        target_user_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    // In case `events` already existed (a different environment that DID
    // get the earlier db:push) without this new column.
    await client.query(`
      ALTER TABLE events ADD COLUMN IF NOT EXISTS target_user_id TEXT;
    `);

    console.log("users.is_admin, users.created_at, events (+ target_user_id) ready.");
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
