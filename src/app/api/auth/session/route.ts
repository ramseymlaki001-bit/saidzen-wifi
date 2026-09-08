import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader =
      request.headers.get("authorization") ||
      request.headers.get("x-session-token") ||
      request.headers.get("x-auth-token");

    const explicitToken = authHeader
      ? authHeader.replace(/^Bearer\s+/i, "").trim()
      : undefined;

    const session = await getSession(explicitToken);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      userId: session.userId,
      name: session.name,
      username: session.username,
      email: session.email,
      role: session.role,
      businessName: session.businessName,
      routerIp: session.routerIp,
    });
  } catch (err) {
    console.error("Session GET error:", err);
    return NextResponse.json(
      { error: "Kosa la ndani la seva" },
      { status: 500 }
    );
  }
}
