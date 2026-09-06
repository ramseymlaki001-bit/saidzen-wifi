<<<<<<< HEAD
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader =
      request.headers.get("authorization") ||
      request.headers.get("x-session-token") ||
      request.headers.get("x-auth-token");

    const queryToken =
      request.nextUrl.searchParams.get("token") ||
      request.nextUrl.searchParams.get("auth");

    const explicitToken = authHeader
      ? authHeader.replace(/^Bearer\s+/i, "").trim()
      : queryToken?.trim() || undefined;

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
      token: session.token || explicitToken,
    });
  } catch (err) {
    console.error("Session GET error:", err);
    return NextResponse.json(
      { error: "Kosa la ndani la seva" },
=======
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        userId: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Kosa la ndani" },
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
      { status: 500 }
    );
  }
}
