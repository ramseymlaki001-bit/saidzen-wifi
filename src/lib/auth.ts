import { db } from "@/db";
import { users, sessions, clients } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
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

  const cookieStore = await cookies();
  cookieStore.set("session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
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
  if (new Date() > session.expiresAt) {
    await db.delete(sessions).where(eq(sessions.token, token));
    return null;
  }

  return session;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
    cookieStore.delete("session_token");
  }
}

export async function requireAuth(role?: "admin" | "vendor") {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (role && session.role !== role) throw new Error("Forbidden");
  return session;
}
