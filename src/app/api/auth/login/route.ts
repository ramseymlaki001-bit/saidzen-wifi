import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, clients } from "@/db/schema";
<<<<<<< HEAD
import { eq, or, sql } from "drizzle-orm";
import { verifyPassword, createSession } from "@/lib/auth";
import {
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginRateLimit,
} from "@/lib/rate-limit";
=======
import { eq, or } from "drizzle-orm";
import { verifyPassword, createSession } from "@/lib/auth";
import { checkLoginRateLimit } from "@/lib/rate-limit";
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = (
      body.identifier || body.username || body.email || ""
    ).trim();
    const password = body.password || "";

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Tafadhali weka Jina la mtumiaji (au IP ya Router) na Nenosiri" },
        { status: 400 }
      );
    }

    // Get client IP for rate limiting
    const ip =
<<<<<<< HEAD
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Check rate limit (does not consume point yet)
=======
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Check rate limit
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
    const rateLimit = await checkLoginRateLimit(ip, identifier);
    if (!rateLimit.allowed) {
      await logAudit({
        action: "failed_login",
        details: `Rate limited: ${identifier}`,
        ipAddress: ip,
      });
      return NextResponse.json(
        { error: rateLimit.message, retryAfter: rateLimit.retryAfter },
        { status: 429 }
      );
    }

    // Find user by username, email, or via router_ip/dashboard_username
    let matchedUser = null;

    const directUser = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.username, identifier),
<<<<<<< HEAD
          eq(users.email, identifier.toLowerCase()),
          sql`LOWER(${users.username}) = LOWER(${identifier})`,
          identifier.toLowerCase() === "admin" ? eq(users.role, "admin") : sql`FALSE`
=======
          eq(users.email, identifier.toLowerCase())
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
        )
      )
      .limit(1);

    if (directUser.length > 0) {
      matchedUser = directUser[0];
    } else {
      const matchedClient = await db
        .select({
          userId: clients.userId,
          user: users,
        })
        .from(clients)
        .innerJoin(users, eq(clients.userId, users.id))
        .where(
          or(
            eq(clients.routerIp, identifier),
            eq(clients.vpnIp, identifier),
            eq(clients.dashboardUsername, identifier)
          )
        )
        .limit(1);

      if (matchedClient.length > 0) {
        matchedUser = matchedClient[0].user;
      }
    }

    if (!matchedUser) {
<<<<<<< HEAD
      await recordFailedLogin(ip, identifier);
=======
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
      await logAudit({
        action: "failed_login",
        details: `User not found: ${identifier}`,
        ipAddress: ip,
      });
      return NextResponse.json(
<<<<<<< HEAD
        { error: "Hatujapata akaunti inayolingana na taarifa ulizoweka" },
=======
        { error: "Hatujapata akaunti inayolingana" },
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, matchedUser.passwordHash);

    if (!isValid) {
<<<<<<< HEAD
      await recordFailedLogin(ip, identifier);
=======
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
      await logAudit({
        action: "failed_login",
        details: `Wrong password for ${identifier}`,
        ipAddress: ip,
      });
      return NextResponse.json(
<<<<<<< HEAD
        { error: "Nenosiri si sahihi. Hakiki nenosiri lako." },
=======
        { error: "Nenosiri si sahihi" },
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
        { status: 401 }
      );
    }

<<<<<<< HEAD
    // Success - reset rate limiter and create session
    await resetLoginRateLimit(ip, identifier);
    const token = await createSession(matchedUser.id);
=======
    // Success - reset rate limiter
    await createSession(matchedUser.id);
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a

    await logAudit({
      userId: matchedUser.id,
      action: "login",
      details: `Successful login as ${matchedUser.username || matchedUser.email}`,
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      role: matchedUser.role,
      name: matchedUser.name,
      username: matchedUser.username,
<<<<<<< HEAD
      token, // Return token for client storage
=======
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Kosa la ndani la seva" },
      { status: 500 }
    );
  }
}
