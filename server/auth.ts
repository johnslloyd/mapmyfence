import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { db } from "./db";
import { users, organizationMembers } from "@shared/schema";
import { eq } from "drizzle-orm";
import { Scrypt } from "lucia";

// Strip fields that should never leave the server (password hash, reset
// token hash/expiry) before a user record goes into a JSON response or
// req.session. resetTokenHash is a hash, not the raw token, but there's
// no reason to hand a client its own internal reset state either.
export function toSafeUser(user: typeof users.$inferSelect) {
  const { hashedPassword, resetTokenHash, resetTokenExpiresAt, ...safeUser } = user;
  return safeUser;
}

// Whether a user currently has Pro-tier capability — personally
// (users.plan === "pro") OR by being an active member of ANY business
// (2026-09-10: joining/being added to an organization grants Pro
// automatically for as long as membership lasts — see shared/schema.ts's
// organizationMembers comment). Computed fresh on every call rather than
// cached on the user row, so being removed from a business's last
// organization takes effect immediately, with no separate sync step.
//
// Kept as its own raw-`db` query here rather than reusing
// storage.isUserPro — this file and authRoutes.ts already read the DB
// directly everywhere else (see e.g. POST /api/account/upgrade), never
// through the storage abstraction; server/routes.ts's own call site uses
// storage.isUserPro instead, matching THAT file's own established
// convention. Two small implementations of the same check, each
// following the data-access pattern already established in its own
// file, not accidental duplication.
export async function isEffectivelyPro(user: typeof users.$inferSelect): Promise<boolean> {
  if (user.plan === "pro") return true;
  const [membership] = await db
    .select({ id: organizationMembers.id })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, user.id))
    .limit(1);
  return !!membership;
}

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user) {
          return done(null, false, { message: "Incorrect email." });
        }

        const scrypt = new Scrypt();
        const isValid = await scrypt.verify(user.hashedPassword, password);

        if (!isValid) {
          return done(null, false, { message: "Incorrect password." });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    // done(null, undefined) is NOT the same as done(null, false) to
    // Passport's core — it treats a missing user as an error condition
    // ("Failed to deserialize user out of session") rather than a
    // graceful logout. This bites anyone whose session cookie outlives
    // their account row (e.g. the account was deleted elsewhere) —
    // every request with that cookie 500s instead of just treating them
    // as logged out.
    done(null, user ?? false);
  } catch (err) {
    done(err);
  }
});

export { passport };
