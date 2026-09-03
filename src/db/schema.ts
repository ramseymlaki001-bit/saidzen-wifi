import {
  mysqlTable,
  int,
  text,
  varchar,
  boolean,
  timestamp,
  decimal,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

/**
 * SCHEMA YA MYSQL — SaidZen WiFi
 *
 * Tofauti kuu na PostgreSQL:
 *   - serial()      → int().autoincrement()
 *   - pgEnum()      → mysqlEnum() (imewekwa moja kwa moja kwenye safu)
 *   - numeric()     → decimal()
 *   - integer()     → int()
 */

// ── Users: Admin na Wamiliki wa Router (Vendor) ───────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  username: varchar("username", { length: 100 }).unique(),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 50 }),
  passwordHash: text("password_hash").notNull(),
  role: mysqlEnum("role", ["admin", "vendor"]).notNull().default("vendor"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Password Reset Tokens ─────────────────────────────────────
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .references(() => users.id)
    .notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Clients: Kila Hotspot / Router ya Mteja ─────────────────
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .references(() => users.id)
    .notNull(),
  dashboardUsername: varchar("dashboard_username", { length: 100 }),
  /** Slug ya kipekee kwa portal ya mteja wa mwisho (/wifi/<slug>) */
  portalSlug: varchar("portal_slug", { length: 100 }).unique(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  routerIp: varchar("router_ip", { length: 45 }).notNull(),
  routerUsername: varchar("router_username", { length: 100 })
    .notNull()
    .default("admin"),
  // Router password encrypted at rest
  routerPasswordEncrypted: text("router_password_encrypted").notNull(),
  routerPort: int("router_port").notNull().default(8728),
  vpnIp: varchar("vpn_ip", { length: 45 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  status: mysqlEnum("status", ["active", "suspended", "expired"])
    .notNull()
    .default("active"),
  monthlyFee: decimal("monthly_fee", { precision: 10, scale: 2 })
    .notNull()
    .default("50000"),
  subscriptionEnd: timestamp("subscription_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Voucher Profiles: Aina za vocha (1hr, 2hr, etc.) ────────
export const voucherProfiles = mysqlTable("voucher_profiles", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("client_id")
    .references(() => clients.id)
    .notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  duration: varchar("duration", { length: 50 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  speedLimit: varchar("speed_limit", { length: 50 }),
  mikrotikProfile: varchar("mikrotik_profile", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Vouchers: Vocha zilizozalishwa ──────────────────────────
export const vouchers = mysqlTable("vouchers", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("client_id")
    .references(() => clients.id)
    .notNull(),
  profileId: int("profile_id")
    .references(() => voucherProfiles.id)
    .notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  password: varchar("password", { length: 20 }).notNull(),
  status: mysqlEnum("status", ["unused", "used", "expired"])
    .notNull()
    .default("unused"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  usedAt: timestamp("used_at"),
  mikrotikId: varchar("mikrotik_id", { length: 50 }),
  lastSyncedAt: timestamp("last_synced_at"),
});

// ── Payments: Malipo ya kila mwezi ──────────────────────────
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("client_id")
    .references(() => clients.id)
    .notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: varchar("method", { length: 50 }).notNull().default("cash"),
  reference: varchar("reference", { length: 100 }),
  mpesaReceiptNumber: varchar("mpesa_receipt_number", { length: 50 }),
  mpesaTransactionId: varchar("mpesa_transaction_id", { length: 100 }),
  mpesaPhoneNumber: varchar("mpesa_phone_number", { length: 20 }),
  paidAt: timestamp("paid_at").defaultNow().notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Sessions: Vikao vya watumiaji ───────────────────────────
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .references(() => users.id)
    .notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Audit Log: Rekodi ya matendo yote ───────────────────────
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").references(() => users.id),
  action: mysqlEnum("action", [
    "login",
    "logout",
    "generate_voucher",
    "delete_voucher",
    "toggle_router",
    "record_payment",
    "change_password",
    "create_client",
    "update_client",
    "failed_login",
    "password_reset_request",
    "password_reset",
  ]).notNull(),
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Oda za Wateja wa Mwisho (Portal ya WiFi) ─────────────────
export const portalOrders = mysqlTable("portal_orders", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("client_id")
    .references(() => clients.id)
    .notNull(),
  profileId: int("profile_id")
    .references(() => voucherProfiles.id)
    .notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "paid", "failed", "cancelled"])
    .notNull()
    .default("pending"),
  checkoutRequestId: varchar("checkout_request_id", { length: 100 }),
  mpesaReceipt: varchar("mpesa_receipt", { length: 50 }),
  voucherId: int("voucher_id").references(() => vouchers.id),
  voucherCode: varchar("voucher_code", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// ── Mipangilio ya Mfumo (Admin anaiweka kutoka UI) ───────────
export const systemSettings = mysqlTable("system_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Token za Kuunganisha Router (Command ya Mteja) ───────────
export const connectionTokens = mysqlTable("connection_tokens", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  dashboardUsername: varchar("dashboard_username", { length: 100 }).notNull(),
  dashboardPasswordHash: text("dashboard_password_hash").notNull(),
  assignedVpnIp: varchar("assigned_vpn_ip", { length: 45 }).notNull(),
  status: mysqlEnum("status", ["pending", "connected", "expired"])
    .notNull()
    .default("pending"),
  clientId: int("client_id").references(() => clients.id),
  detectedRouterIp: varchar("detected_router_ip", { length: 45 }),
  routerPublicKey: varchar("router_public_key", { length: 100 }),
  connectedAt: timestamp("connected_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdBy: int("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── M-Pesa Integration Config ───────────────────────────────
export const mpesaConfig = mysqlTable("mpesa_config", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("client_id")
    .unique()
    .references(() => clients.id),
  consumerKey: text("consumer_key").notNull(),
  consumerSecret: text("consumer_secret").notNull(),
  shortcode: varchar("shortcode", { length: 20 }).notNull(),
  passkey: text("passkey").notNull(),
  callbackUrl: text("callback_url"),
  environment: varchar("environment", { length: 20 })
    .notNull()
    .default("sandbox"),
  enabled: boolean("enabled").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
