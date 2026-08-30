import { pool } from "../server/db";

const email = process.argv[2];
if (!email) {
  console.error("Usage: tsx script/_grant_admin.ts <email>");
  process.exit(1);
}

async function main() {
  const res = await pool.query("UPDATE users SET is_admin = true WHERE email = $1 RETURNING id, email, is_admin", [email]);
  console.log(res.rows);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
