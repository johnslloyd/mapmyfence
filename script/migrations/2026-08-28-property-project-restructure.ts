import { pool } from "../../server/db";

// ALREADY RUN (2026-08-28) — kept as a historical record, not meant to
// be re-run. Re-running is harmless in principle (every ALTER/CREATE
// either targets tables that no longer have their old shape or would
// just no-op), but there's no reason to; this file documents *how* the
// Property/Project restructure was actually done, for the next person
// who needs to understand the schema's history — see CLAUDE.md's
// "Property / Project restructure" section for the full writeup.
//
// One-off, hand-written migration. NOT run through drizzle-kit push
// (that needs a human at an interactive terminal for the unrelated
// session-table rename-ambiguity prompt, see CLAUDE.md's "Database
// migrations" section) — raw SQL directly against `pool`, wrapped in a
// transaction so it's all-or-nothing.
//
// Backed up to .backups/ before running (67 properties-to-be, 56 fence
// lines, 319 coordinates, 0 yard_boundaries rows at backup time).

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Rename the old top-level table. Existing FKs (fence_lines,
    // yard_boundaries) follow the rename automatically in Postgres.
    await client.query(`ALTER TABLE projects RENAME TO properties;`);

    // 2. Create the new typed "projects" table.
    await client.query(`
      CREATE TABLE projects (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'planning',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 3. Backfill: exactly one type='fence' project per existing property,
    // carrying over its name/status/createdAt so nothing about today's
    // single-fence-plan UX changes for existing data.
    await client.query(`
      INSERT INTO projects (property_id, type, name, status, created_at)
      SELECT id, 'fence', name, status, created_at FROM properties;
    `);

    // 4. Repoint fence_lines.project_id at the NEW projects table (it
    // currently points at properties, since the rename in step 1 carried
    // the old FK along with it).
    await client.query(`ALTER TABLE fence_lines DROP CONSTRAINT fence_lines_project_id_projects_id_fk;`);
    await client.query(`ALTER TABLE fence_lines ADD COLUMN new_project_id INTEGER;`);
    await client.query(`
      UPDATE fence_lines fl
      SET new_project_id = p.id
      FROM projects p
      WHERE p.property_id = fl.project_id AND p.type = 'fence';
    `);
    // Sanity check before committing to the swap: every fence_line must
    // have resolved to a new project id.
    const unresolved = await client.query(`SELECT COUNT(*) FROM fence_lines WHERE new_project_id IS NULL;`);
    if (Number(unresolved.rows[0].count) > 0) {
      throw new Error(`${unresolved.rows[0].count} fence_lines rows failed to resolve a new project id — aborting.`);
    }
    await client.query(`ALTER TABLE fence_lines DROP COLUMN project_id;`);
    await client.query(`ALTER TABLE fence_lines RENAME COLUMN new_project_id TO project_id;`);
    await client.query(`ALTER TABLE fence_lines ALTER COLUMN project_id SET NOT NULL;`);
    await client.query(`ALTER TABLE fence_lines ADD CONSTRAINT fence_lines_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;`);

    // 5. status now lives on projects, not properties.
    await client.query(`ALTER TABLE properties DROP COLUMN status;`);

    // 6. yard_boundaries.project_id -> property_id (table is empty today,
    // but do it properly for schema correctness regardless).
    await client.query(`ALTER TABLE yard_boundaries DROP CONSTRAINT yard_boundaries_project_id_fkey;`);
    await client.query(`ALTER TABLE yard_boundaries DROP CONSTRAINT yard_boundaries_project_id_key;`);
    await client.query(`ALTER TABLE yard_boundaries RENAME COLUMN project_id TO property_id;`);
    await client.query(`ALTER TABLE yard_boundaries ADD CONSTRAINT yard_boundaries_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;`);
    await client.query(`ALTER TABLE yard_boundaries ADD CONSTRAINT yard_boundaries_property_id_key UNIQUE (property_id);`);

    // 7. events table doesn't exist in the live DB yet at all (a known
    // pending item — "events" is defined in schema.ts but was never
    // pushed, per CLAUDE.md). Nothing to migrate there; it'll pick up
    // the new property_id column whenever it's actually created.

    await client.query("COMMIT");
    console.log("Migration committed successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed, rolled back:", err);
    throw err;
  } finally {
    client.release();
  }
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
