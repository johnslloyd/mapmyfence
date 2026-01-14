
import { Router } from "express";
import { passport } from "./auth";
import { db } from "./db";
import { users, projects } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { Scrypt, generateId } from "lucia";

export const authRouter = Router();

authRouter.get("/api/user", (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({ user: req.user });
  }

  return res.json({ user: null });
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  projectId: z.string().optional(),
});

authRouter.post("/api/register", async (req, res, next) => {
  try {
    // Validate input with better error handling
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      const errorMessage = result.error.errors[0]?.message || "Invalid input";
      return res.status(400).json({ message: errorMessage });
    }

    const { email, password, projectId } = result.data;

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

    if (projectId) {
      await db.update(projects).set({ userId }).where(eq(projects.id, parseInt(projectId)));
    }

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
        res.status(201).json({ message: "User created", user });
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

authRouter.post("/api/login", (req, res, next) => {
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
        res.json({ message: "Logged in", user });
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
