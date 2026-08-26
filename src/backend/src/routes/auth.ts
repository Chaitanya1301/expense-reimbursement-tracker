import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signAuthToken } from "../lib/jwt";
import { AUTH_COOKIE_NAME, requireAuth } from "../middleware/auth";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const COOKIE_MAX_AGE_MS = 8 * 60 * 60 * 1000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// In production, the frontend and backend are on different Render subdomains,
// so the cookie must be sameSite: "none" (which requires secure: true) for the
// browser to send it on cross-origin fetch() calls. Locally, both run on
// localhost so "lax" + non-secure works over plain HTTP.
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: IS_PRODUCTION ? ("none" as const) : ("lax" as const),
  secure: IS_PRODUCTION,
};

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Email and password are required." } });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Same generic message whether the account is missing, wrong password, or
  // inactive, so a caller can't use this endpoint to enumerate valid emails.
  const invalidCredentials = () =>
    res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } });

  if (!user || user.status !== "ACTIVE") {
    return invalidCredentials();
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return invalidCredentials();
  }

  const token = signAuthToken({ sub: user.id, role: user.role });

  res.cookie(AUTH_COOKIE_NAME, token, { ...AUTH_COOKIE_OPTIONS, maxAge: COOKIE_MAX_AGE_MS });

  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS);
  res.status(204).send();
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
