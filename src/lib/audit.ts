import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import type { InferInsertModel } from "drizzle-orm";

export type AuditAction = InferInsertModel<typeof auditLogs>["action"];

export interface AuditLogEntry {
  userId?: number;
  action: AuditAction;
  details?: string;
  ipAddress?: string;
}

/**
 * Kurekodi tendo kwenye audit log
 * Inatumika kila API call muhimu
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: entry.userId || null,
      action: entry.action,
      details: entry.details || null,
      ipAddress: entry.ipAddress || null,
    });
  } catch (err) {
    // Fail silently - audit logging should never break the main flow
    console.error("Audit log error:", err);
  }
}
