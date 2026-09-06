import { db } from "@/db";
import { users, sessions, clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import crypto from "crypto";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(sessions).values({ userId, token, expiresAt });

  try {
    const cookieStore = await cookies();
    // Standard cookie: httpOnly false allows JS fallback in iframe
    cookieStore.set("session_token", token, {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
      expires: expiresAt,
    });
  } catch {
    // If cookies() cannot be set in current context, token is still returned for localStorage/headers
  }

  return token;
}

export async function getSession(explicitToken?: string) {
  let token = explicitToken?.trim();

  // 1. Check Authorization or x-session-token headers
  if (!token) {
    try {
      const headerList = await headers();
      const authHeader =
        headerList.get("authorization") ||
        headerList.get("x-session-token") ||
        headerList.get("x-auth-token");
      if (authHeader) {
        token = authHeader.replace(/^Bearer\s+/i, "").trim();
      }
    } catch {
      // ignore
    }
  }

  // 2. Check cookies
  if (!token) {
    try {
      const cookieStore = await cookies();
      token =
        cookieStore.get("session_token")?.value ||
        cookieStore.get("session_token_sec")?.value;
    } catch {
      // ignore
    }
  }

  if (!token) return null;

  const result = await db
    .select({
      sessionId: sessions.id,
      userId: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      role: users.role,
      expiresAt: sessions.expiresAt,
      clientId: clients.id,
      businessName: clients.businessName,
      routerIp: clients.routerIp,
      routerPort: clients.routerPort,
      clientStatus: clients.status,
      subscriptionEnd: clients.subscriptionEnd,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .leftJoin(clients, eq(users.id, clients.userId))
    .where(eq(sessions.token, token))
    .limit(1);

  if (result.length === 0) return null;

  const session = result[0];
  const exp = new Date(session.expiresAt).getTime();
  if (!Number.isNaN(exp) && Date.now() > exp) {
    await db.delete(sessions).where(eq(sessions.token, token));
    return null;
  }

  return { ...session, token };
}

export async function destroySession(explicitToken?: string) {
  let token = explicitToken?.trim();

  try {
    const cookieStore = await cookies();
    if (!token) {
      token = cookieStore.get("session_token")?.value;
    }
    cookieStore.delete("session_token");
  } catch {
    // ignore
  }

  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
}

export async function requireAuth(role?: "admin" | "vendor") {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (role && session.role !== role) throw new Error("Forbidden");
  return session;
}
