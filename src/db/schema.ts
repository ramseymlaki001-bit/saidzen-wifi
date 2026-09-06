import {
<<<<<<< HEAD
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  pgEnum,
  numeric,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "vendor"]);
export const clientStatusEnum = pgEnum("client_status", [
  "active",
  "suspended",
  "expired",
]);
export const voucherStatusEnum = pgEnum("voucher_status", [
  "unused",
  "used",
  "expired",
]);
export const auditActionEnum = pgEnum("audit_action", [
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
]);
export const portalOrderStatusEnum = pgEnum("portal_order_status", [
  "pending",
  "paid",
  "failed",
  "cancelled",
]);
export const connectionTokenStatusEnum = pgEnum("connection_token_status", [
  "pending",
  "connected",
  "expired",
]);

// ── Users: Admin na Wamiliki wa Router (Vendor) ───────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
=======
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
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
  name: varchar("name", { length: 255 }).notNull(),
  username: varchar("username", { length: 100 }).unique(),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 50 }),
  passwordHash: text("password_hash").notNull(),
<<<<<<< HEAD
  role: userRoleEnum("role").notNull().default("vendor"),
=======
  role: mysqlEnum("role", ["admin", "vendor"]).notNull().default("vendor"),
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Password Reset Tokens ─────────────────────────────────────
<<<<<<< HEAD
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
=======
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
    .references(() => users.id)
    .notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Clients: Kila Hotspot / Router ya Mteja ─────────────────
<<<<<<< HEAD
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  dashboardUsername: varchar("dashboard_username", { length: 100 }),
=======
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .references(() => users.id)
    .notNull(),
  dashboardUsername: varchar("dashboard_username", { length: 100 }),
  /** Slug ya kipekee kwa portal ya mteja wa mwisho (/wifi/<slug>) */
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
  portalSlug: varchar("portal_slug", { length: 100 }).unique(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  routerIp: varchar("router_ip", { length: 45 }).notNull(),
  routerUsername: varchar("router_username", { length: 100 })
    .notNull()
    .default("admin"),
<<<<<<< HEAD
  routerPasswordEncrypted: text("router_password_encrypted").notNull(),
  routerPort: integer("router_port").notNull().default(8728),
  vpnIp: varchar("vpn_ip", { length: 45 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  status: clientStatusEnum("status").notNull().default("active"),
  monthlyFee: numeric("monthly_fee", { precision: 10, scale: 2 })
=======
  // Router password encrypted at rest
  routerPasswordEncrypted: text("router_password_encrypted").notNull(),
  routerPort: int("router_port").notNull().default(8728),
  vpnIp: varchar("vpn_ip", { length: 45 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  status: mysqlEnum("status", ["active", "suspended", "expired"])
    .notNull()
    .default("active"),
  monthlyFee: decimal("monthly_fee", { precision: 10, scale: 2 })
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
    .notNull()
    .default("50000"),
  subscriptionEnd: timestamp("subscription_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Voucher Profiles: Aina za vocha (1hr, 2hr, etc.) ────────
<<<<<<< HEAD
export const voucherProfiles = pgTable("voucher_profiles", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
=======
export const voucherProfiles = mysqlTable("voucher_profiles", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("client_id")
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
    .references(() => clients.id)
    .notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  duration: varchar("duration", { length: 50 }).notNull(),
<<<<<<< HEAD
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
=======
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
  speedLimit: varchar("speed_limit", { length: 50 }),
  mikrotikProfile: varchar("mikrotik_profile", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Vouchers: Vocha zilizozalishwa ──────────────────────────
<<<<<<< HEAD
export const vouchers = pgTable("vouchers", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .references(() => clients.id)
    .notNull(),
  profileId: integer("profile_id")
=======
export const vouchers = mysqlTable("vouchers", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("client_id")
    .references(() => clients.id)
    .notNull(),
  profileId: int("profile_id")
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
    .references(() => voucherProfiles.id)
    .notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  password: varchar("password", { length: 20 }).notNull(),
<<<<<<< HEAD
  status: voucherStatusEnum("status").notNull().default("unused"),
=======
  status: mysqlEnum("status", ["unused", "used", "expired"])
    .notNull()
    .default("unused"),
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
  createdAt: timestamp("created_at").defaultNow().notNull(),
  usedAt: timestamp("used_at"),
  mikrotikId: varchar("mikrotik_id", { length: 50 }),
  lastSyncedAt: timestamp("last_synced_at"),
});

// ── Payments: Malipo ya kila mwezi ──────────────────────────
<<<<<<< HEAD
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .references(() => clients.id)
    .notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
=======
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("client_id")
    .references(() => clients.id)
    .notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
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
<<<<<<< HEAD
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
=======
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
    .references(() => users.id)
    .notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Audit Log: Rekodi ya matendo yote ───────────────────────
<<<<<<< HEAD
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: auditActionEnum("action").notNull(),
=======
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
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Oda za Wateja wa Mwisho (Portal ya WiFi) ─────────────────
<<<<<<< HEAD
export const portalOrders = pgTable("portal_orders", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .references(() => clients.id)
    .notNull(),
  profileId: integer("profile_id")
    .references(() => voucherProfiles.id)
    .notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: portalOrderStatusEnum("status").notNull().default("pending"),
  checkoutRequestId: varchar("checkout_request_id", { length: 100 }),
  mpesaReceipt: varchar("mpesa_receipt", { length: 50 }),
  voucherId: integer("voucher_id").references(() => vouchers.id),
=======
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
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
  voucherCode: varchar("voucher_code", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// ── Mipangilio ya Mfumo (Admin anaiweka kutoka UI) ───────────
<<<<<<< HEAD
export const systemSettings = pgTable("system_settings", {
=======
export const systemSettings = mysqlTable("system_settings", {
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Token za Kuunganisha Router (Command ya Mteja) ───────────
<<<<<<< HEAD
export const connectionTokens = pgTable("connection_tokens", {
  id: serial("id").primaryKey(),
=======
export const connectionTokens = mysqlTable("connection_tokens", {
  id: int("id").autoincrement().primaryKey(),
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
  token: varchar("token", { length: 255 }).notNull().unique(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  dashboardUsername: varchar("dashboard_username", { length: 100 }).notNull(),
  dashboardPasswordHash: text("dashboard_password_hash").notNull(),
  assignedVpnIp: varchar("assigned_vpn_ip", { length: 45 }).notNull(),
<<<<<<< HEAD
  status: connectionTokenStatusEnum("status").notNull().default("pending"),
  clientId: integer("client_id").references(() => clients.id),
=======
  status: mysqlEnum("status", ["pending", "connected", "expired"])
    .notNull()
    .default("pending"),
  clientId: int("client_id").references(() => clients.id),
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
  detectedRouterIp: varchar("detected_router_ip", { length: 45 }),
  routerPublicKey: varchar("router_public_key", { length: 100 }),
  connectedAt: timestamp("connected_at"),
  expiresAt: timestamp("expires_at").notNull(),
<<<<<<< HEAD
  createdBy: integer("created_by").references(() => users.id),
=======
  createdBy: int("created_by").references(() => users.id),
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── M-Pesa Integration Config ───────────────────────────────
<<<<<<< HEAD
export const mpesaConfig = pgTable("mpesa_config", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
=======
export const mpesaConfig = mysqlTable("mpesa_config", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("client_id")
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
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
