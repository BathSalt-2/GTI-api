import jwt from "jsonwebtoken";
import { Request } from "express";

export interface AuthContext {
  userId: number | null;
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export function signToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch {
    return null;
  }
}

export function getAuthContext(req: Request): AuthContext {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return { userId: null };
  }

  const token = header.slice(7);
  const payload = verifyToken(token);
  return { userId: payload?.userId ?? null };
}

export function requireAuth(userId: number | null): number {
  if (!userId) {
    throw new Error("Authentication required");
  }
  return userId;
}
