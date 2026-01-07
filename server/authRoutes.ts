
import { Router } from "express";
import { lucia } from "./auth";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { Scrypt, generateId } from "lucia";

export const authRouter = Router();

authRouter.get("/api/user", async (req, res, next) => {
  try {
    const user = res.locals.user;
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

authRouter.post("/api/register", async (req, res, next) => {
  try {
    const { email, password } = registerSchema.parse(req.body);

    // ensure email not already registered
    const [existing] = await db.select().from(users).where(eq(users.email, email));
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const scrypt = new Scrypt();
    const hashedPassword = await scrypt.hash(password);
    const userId = generateId(15);

    await db.insert(users).values({
      id: userId,
      email,
      hashedPassword,
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    res.append("Set-Cookie", sessionCookie.serialize());
    const user = { id: userId, email: email };
    res.status(201).json({ message: "User created", user });
  } catch (error) {
    next(error);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post("/api/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const scrypt = new Scrypt();
    const validPassword = await scrypt.verify(user.hashedPassword, password);

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    res.append("Set-Cookie", sessionCookie.serialize());
    res.json({ message: "Logged in", user });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/api/logout", async (req, res, next) => {
  try {
    const sessionCookie = lucia.createBlankSessionCookie();
    res.append("Set-Cookie", sessionCookie.serialize());
    res.json({ message: "Logged out" });
  } catch (error) {
    next(error);
  }
});
