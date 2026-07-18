import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/db";
import { env } from "../config/env";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { AppError, ConflictError, UnauthorizedError } from "../utils/AppError";
import { AuthedRequest } from "../middleware/auth";

function publicUser(user: { id: string; email: string; name: string; role: string; avatarUrl: string | null }) {
  return { id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl };
}

async function issueTokens(userId: string, role: "USER" | "ADMIN") {
  const accessToken = signAccessToken({ sub: userId, role });
  const refreshToken = signRefreshToken({ sub: userId });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken };
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ConflictError("An account with that email already exists.");

  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  const tokens = await issueTokens(user.id, user.role as "USER" | "ADMIN");
  res.status(201).json({ success: true, user: publicUser(user), ...tokens });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new UnauthorizedError("Incorrect email or password.");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError("Incorrect email or password.");

  const tokens = await issueTokens(user.id, user.role as "USER" | "ADMIN");
  res.json({ success: true, user: publicUser(user), ...tokens });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) throw new UnauthorizedError("Missing refresh token.");

  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Refresh token is invalid or expired.");
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new UnauthorizedError("Refresh token is invalid or expired.");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new UnauthorizedError("Account no longer exists.");

  const accessToken = signAccessToken({ sub: user.id, role: user.role as "USER" | "ADMIN" });
  res.json({ success: true, accessToken });
}

export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
  res.json({ success: true, message: "Logged out." });
}

export async function me(req: AuthedRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw new AppError("Account no longer exists.", 404);
  res.json({ success: true, user: publicUser(user) });
}

// Stub — wire up with Firebase Admin SDK or Google's OAuth2Client once you have credentials.
// Verify the Google ID token, upsert the user by email, then issue tokens the same way as above.
export async function googleSignIn(_req: Request, res: Response) {
  throw new AppError(
    "Google Sign-In isn't configured yet. Add GOOGLE_CLIENT_ID/SECRET and implement token verification here.",
    501
  );
}

// Stub — wire up with Sign in with Apple's REST API once you have your key/team/client IDs.
export async function appleSignIn(_req: Request, res: Response) {
  throw new AppError(
    "Apple Sign-In isn't configured yet. Add APPLE_* credentials and implement token verification here.",
    501
  );
}
