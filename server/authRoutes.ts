
import { Router } from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { passport, toSafeUser } from "./auth";
import { db } from "./db";
import { users, properties } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { Scrypt, generateId } from "lucia";
import { logEvent } from "./events";
import { sendEmail } from "./email";
import { api } from "@shared/routes";

export const authRouter = Router();

// Applied to every auth-sensitive route below (register, login, forgot/
// reset password) — previously NONE of these had any rate limiting at
// all, meaning unlimited scripted account creation and unlimited login/
// password-reset guessing. Two tiers: a looser one for register/login
// (real users retrying a typo'd password shouldn't get blocked), a
// tighter one for forgot-password specifically since it's also an
// email-bombing vector against a real inbox, not just a credential-
// guessing target.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please wait a bit and try again." },
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please wait a bit and try again." },
});

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

authRouter.get("/api/user", (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({ user: toSafeUser(req.user as typeof users.$inferSelect) });
  }

  return res.json({ user: null });
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  // .nullable() as well as .optional(): Register.tsx reads propertyId
  // from a URLSearchParams.get(), which returns `null` (not `undefined`)
  // when absent — i.e. every direct signup that didn't arrive via a
  // guest property's "Sign Up" redirect. z.string().optional() alone
  // accepts `undefined` but rejects `null`, so plain top-level
  // registration (the homepage's own "Sign up" link) was failing Zod
  // validation outright. Found live while testing the forgot-password
  // work, unrelated to it — a real, pre-existing bug on the main signup
  // path (this field was "projectId" then; renamed in the Property/
  // Project restructure — ownership lives on properties now).
  propertyId: z.string().nullable().optional(),
});

authRouter.post("/api/register", authLimiter, async (req, res, next) => {
  try {
    // Validate input with better error handling
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      const errorMessage = result.error.errors[0]?.message || "Invalid input";
      return res.status(400).json({ message: errorMessage });
    }

    const { email, password, propertyId } = result.data;

    // ensure email not already registered
    const [existing] = await db.select().from(users).where(eq(users.email, email));
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const scrypt = new Scrypt();
    const hashedPassword = await scrypt.hash(password);
    const userId = generateId(15);

    const [user] = await db.insert(users).values({
      id: userId,
      email,
      hashedPassword,
    }).returning();

    if (propertyId) {
      await db.update(properties).set({ userId }).where(eq(properties.id, parseInt(propertyId)));
    }

    logEvent("account_created", { userId, propertyId: propertyId ? parseInt(propertyId) : undefined });

    req.login(user, (err) => {
      if (err) {
        console.error("Login error after registration:", err);
        return res.status(500).json({ message: "Account created but failed to log in. Please try logging in." });
      }
      req.session.save((err) => {
        if (err) {
          console.error("Session save error after registration:", err);
          return res.status(500).json({ message: "Account created but session failed. Please try logging in." });
        }
        res.status(201).json({ message: "User created", user: toSafeUser(user) });
      });
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
    }
    next(error);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post("/api/login", authLimiter, (req, res, next) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Invalid input" });
  }
  
  passport.authenticate("local", (err: any, user: any, info: any) => {
    if (err) return next(err);
    if (!user) {
      return res.status(400).json({ message: info?.message || "Invalid credentials" });
    }
    req.login(user, (err) => {
      if (err) return next(err);
      req.session.save((err) => {
        if (err) return next(err);
        res.json({ message: "Logged in", user: toSafeUser(user) });
      });
    });
  })(req, res, next);
});

authRouter.post("/api/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out" });
    });
  });
});

const forgotPasswordSchema = z.object({ email: z.string().email() });

authRouter.post("/api/forgot-password", passwordResetLimiter, async (req, res, next) => {
  try {
    const result = forgotPasswordSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }
    const { email } = result.data;

    // Always respond with the same generic message whether or not the
    // email is registered — unlike /api/register's "Email already
    // registered" (a known, accepted minor enumeration tradeoff there),
    // this endpoint is unauthenticated and specifically about proving
    // account existence, so it gets the stricter treatment.
    const genericResponse = {
      message: "If an account exists for that email, we've sent a password reset link.",
    };

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      await db
        .update(users)
        .set({
          resetTokenHash: hashToken(rawToken),
          resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        })
        .where(eq(users.id, user.id));

      const origin = `${req.protocol}://${req.get("host")}`;
      const resetUrl = `${origin}/reset-password?token=${rawToken}`;
      await sendEmail({
        to: email,
        subject: "Reset your MyYardManager password",
        text: `We got a request to reset your MyYardManager password. This link expires in 1 hour and can only be used once:\n\n${resetUrl}\n\nIf you didn't request this, you can ignore this email — your password hasn't been changed.`,
        html: `<p>We got a request to reset your MyYardManager password. This link expires in 1 hour and can only be used once:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can ignore this email — your password hasn't been changed.</p>`,
      });
    }

    res.json(genericResponse);
  } catch (error) {
    next(error);
  }
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

authRouter.post("/api/reset-password", passwordResetLimiter, async (req, res, next) => {
  try {
    const result = resetPasswordSchema.safeParse(req.body);
    if (!result.success) {
      const errorMessage = result.error.errors[0]?.message || "Invalid input";
      return res.status(400).json({ message: errorMessage });
    }
    const { token, password } = result.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.resetTokenHash, hashToken(token)));

    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      return res.status(400).json({ message: "This reset link is invalid or has expired. Request a new one." });
    }

    const scrypt = new Scrypt();
    const hashedPassword = await scrypt.hash(password);
    await db
      .update(users)
      .set({ hashedPassword, resetTokenHash: null, resetTokenExpiresAt: null })
      .where(eq(users.id, user.id));

    res.json({ message: "Password updated. You can now log in with your new password." });
  } catch (error) {
    next(error);
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

authRouter.post("/api/account/change-password", authLimiter, async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to do that." });
    }
    const result = changePasswordSchema.safeParse(req.body);
    if (!result.success) {
      const errorMessage = result.error.errors[0]?.message || "Invalid input";
      return res.status(400).json({ message: errorMessage });
    }
    const { currentPassword, newPassword } = result.data;
    const sessionUser = req.user as typeof users.$inferSelect;

    const [user] = await db.select().from(users).where(eq(users.id, sessionUser.id));
    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }

    const scrypt = new Scrypt();
    const isValid = await scrypt.verify(user.hashedPassword, currentPassword);
    if (!isValid) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    const hashedPassword = await scrypt.hash(newPassword);
    await db.update(users).set({ hashedPassword }).where(eq(users.id, user.id));

    res.json({ message: "Password updated." });
  } catch (error) {
    next(error);
  }
});

// Self-serve, free during beta — no payment, just flips the flag. See
// this table's `plan` column comment in shared/schema.ts for why this
// was chosen over a manual-grant-only flow.
authRouter.post(api.account.upgrade.path, async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to do that." });
    }
    const sessionUser = req.user as typeof users.$inferSelect;
    await db.update(users).set({ plan: "pro" }).where(eq(users.id, sessionUser.id));
    logEvent("account_upgraded", { userId: sessionUser.id });
    res.json({ plan: "pro" });
  } catch (error) {
    next(error);
  }
});
