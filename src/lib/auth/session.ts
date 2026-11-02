import { cookies } from "next/headers";
import { db } from "../db/prisma";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "OFFICER" | "MANAGER";
  branchId?: string | null;
  phone: string;
}

const COOKIE_NAME = "collectiq_session";

// Base64 JSON session encoding for demo/reproducible environment
export function encodeSession(user: SessionUser): string {
  const payload = {
    ...user,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function decodeSession(token: string): SessionUser | null {
  try {
    const raw = Buffer.from(token, "base64").toString("utf-8");
    const parsed = JSON.parse(raw);
    if (parsed.exp && parsed.exp < Date.now()) {
      return null;
    }
    return {
      id: parsed.id,
      email: parsed.email,
      name: parsed.name,
      role: parsed.role,
      branchId: parsed.branchId,
      phone: parsed.phone,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export async function setSessionCookie(user: SessionUser) {
  const cookieStore = cookies();
  const token = encodeSession(user);
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Access Control Verifier
 */
export async function requireAuth(allowedRoles?: Array<"OFFICER" | "MANAGER">) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
