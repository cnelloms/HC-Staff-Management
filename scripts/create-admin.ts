// scripts/create-admin.ts
import { db } from "../server/db.ts"; // path to YOUR db helper
import bcrypt from "bcrypt";

const username = "admin";
const plain = "admin123";

// ────────────────────────────────────────────────────────────────────────────────
const hash = await bcrypt.hash(plain, 10);

await db.query(
  `INSERT INTO credentials (username, passwordhash, is_enabled)
   VALUES ($1, $2, true)
   ON CONFLICT (username)
   DO UPDATE SET passwordhash = EXCLUDED.passwordhash,
                 is_enabled   = true`,
  [username, hash],
);

console.log("✅  Admin user ready (admin / admin123)");
process.exit(0);
