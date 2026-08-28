import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { db } from "./db";
import { users } from "@shared/schema";
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
