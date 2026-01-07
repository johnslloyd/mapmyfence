import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// create the drizzle client
const drizzleDb = drizzle(pool, { schema });

// Compatibility shim: some versions of @lucia-auth/adapter-drizzle expect
// a `db` object with methods like `insert`, `select`, and `run` on it.
// Expose a thin wrapper that delegates to the drizzle client.
export const db = {
  // delegate generic query runner
  async run(query: any) {
    // drizzle exposes a `run` function on the client for raw execution
    // but falling back to `execute` or `query` if necessary.
    // Try common method names used by various drizzle versions.
    // @ts-ignore
    if (typeof drizzleDb.run === "function") return await (drizzleDb.run as any)(query);
    // @ts-ignore
    if (typeof drizzleDb.execute === "function") return await (drizzleDb.execute as any)(query);
    // fallback: attempt to use pool.query
    return await pool.query(String(query));
  },

  // insert API used by adapter
  insert(...args: any[]) {
    // @ts-ignore
    if (typeof (drizzleDb as any).insert === "function") return (drizzleDb as any).insert(...args);
    // some versions use `insertInto` or `insert` from query builders
    // delegate to drizzle's prepared insert helper if available
    // otherwise throw a helpful error to surface incompatibility
    throw new Error("drizzle.insert API not available on this drizzle client instance");
  },

  // select API used by adapter
  select(...args: any[]) {
    // @ts-ignore
    if (typeof (drizzleDb as any).select === "function") return (drizzleDb as any).select(...args);
    throw new Error("drizzle.select API not available on this drizzle client instance");
  },

  // expose the underlying drizzle client and pool for advanced usage
  _raw: drizzleDb,
  _pool: pool,
};
