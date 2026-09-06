import {
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
  name: varchar("name", { length: 255 }).notNull(),
  username: varchar("username", { length: 100 }).unique(),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 50 }),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("vendor"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Password Reset Tokens ─────────────────────────────────────
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Clients: Kila Hotspot / Router ya Mteja ─────────────────
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  dashboardUsername: varchar("dashboard_username", { length: 100 }),
  portalSlug: varchar("portal_slug", { length: 100 }).unique(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  routerIp: varchar("router_ip", { length: 45 }).notNull(),
  routerUsername: varchar("router_username", { length: 100 })
    .notNull()
    .default("admin"),
  routerPasswordEncrypted: text("router_password_encrypted").notNull(),
  routerPort: integer("router_port").notNull().default(8728),
  vpnIp: varchar("vpn_ip", { length: 45 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  status: clientStatusEnum("status").notNull().default("active"),
  monthlyFee: numeric("monthly_fee", { precision: 10, scale: 2 })
    .notNull()
    .default("50000"),
  subscriptionEnd: timestamp("subscription_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Voucher Profiles: Aina za vocha (1hr, 2hr, etc.) ────────
export const voucherProfiles = pgTable("voucher_profiles", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .references(() => clients.id)
    .notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  duration: varchar("duration", { length: 50 }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  speedLimit: varchar("speed_limit", { length: 50 }),
  mikrotikProfile: varchar("mikrotik_profile", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Vouchers: Vocha zilizozalishwa ──────────────────────────
export const vouchers = pgTable("vouchers", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .references(() => clients.id)
    .notNull(),
  profileId: integer("profile_id")
    .references(() => voucherProfiles.id)
    .notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  password: varchar("password", { length: 20 }).notNull(),
  status: voucherStatusEnum("status").notNull().default("unused"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  usedAt: timestamp("used_at"),
  mikrotikId: varchar("mikrotik_id", { length: 50 }),
  lastSyncedAt: timestamp("last_synced_at"),
});

// ── Payments: Malipo ya kila mwezi ──────────────────────────
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .references(() => clients.id)
    .notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
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
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Audit Log: Rekodi ya matendo yote ───────────────────────
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: auditActionEnum("action").notNull(),
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Oda za Wateja wa Mwisho (Portal ya WiFi) ─────────────────
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
  voucherCode: varchar("voucher_code", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// ── Mipangilio ya Mfumo (Admin anaiweka kutoka UI) ───────────
export const systemSettings = pgTable("system_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Token za Kuunganisha Router (Command ya Mteja) ───────────
export const connectionTokens = pgTable("connection_tokens", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  dashboardUsername: varchar("dashboard_username", { length: 100 }).notNull(),
  dashboardPasswordHash: text("dashboard_password_hash").notNull(),
  assignedVpnIp: varchar("assigned_vpn_ip", { length: 45 }).notNull(),
  status: connectionTokenStatusEnum("status").notNull().default("pending"),
  clientId: integer("client_id").references(() => clients.id),
  detectedRouterIp: varchar("detected_router_ip", { length: 45 }),
  routerPublicKey: varchar("router_public_key", { length: 100 }),
  connectedAt: timestamp("connected_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── M-Pesa Integration Config ───────────────────────────────
export const mpesaConfig = pgTable("mpesa_config", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
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
