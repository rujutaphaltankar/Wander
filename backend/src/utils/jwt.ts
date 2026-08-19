import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface AccessTokenPayload {
  sub: string; // user id
  role: "USER" | "ADMIN";
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AccessTokenPayload;
}

export function signRefreshToken(payload: { sub: string }): string {
  const options: SignOptions = {
    expiresIn: env.refreshExpiresIn as SignOptions["expiresIn"],
    jwtid: crypto.randomUUID(),
  };
  return jwt.sign(payload, env.refreshSecret, options);
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, env.refreshSecret) as { sub: string };
}
