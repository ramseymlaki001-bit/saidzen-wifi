import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

/**
 * Kurejesha nenosiri kwa kutumia token
 */
export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token na nenosiri jipya vinahitajika" },
        { status: 400 }
      );
    }

    // Find valid token
    const [resetEntry] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!resetEntry) {
      return NextResponse.json(
        { error: "Token si sahihi au imeisha muda" },
        { status: 400 }
      );
    }

    // Hash new password and update
    const newHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({ passwordHash: newHash })
      .where(eq(users.id, resetEntry.userId));

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, resetEntry.id));

    await logAudit({
      userId: resetEntry.userId,
      action: "password_reset",
      details: "Nenosiri limebadilishwa kwa kutumia reset token",
    });

    return NextResponse.json({
      success: true,
      message: "Nenosiri limebadilishwa kwa mafanikio! Sasa unaweza kuingia.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
