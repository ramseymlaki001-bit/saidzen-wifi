import { NextResponse } from "next/server";
import { pool } from "@/db";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/encryption";

const SETUP_SQL: string[] = [
  // ── Types ───────────────────────────────────────────────────
  `DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin', 'vendor'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE TYPE client_status AS ENUM ('active', 'suspended', 'expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE TYPE voucher_status AS ENUM ('unused', 'used', 'expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE TYPE audit_action AS ENUM ('login','logout','generate_voucher','delete_voucher','toggle_router','record_payment','change_password','create_client','update_client','failed_login','password_reset_request','password_reset'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE TYPE portal_order_status AS ENUM ('pending','paid','failed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE TYPE connection_token_status AS ENUM ('pending','connected','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,

  // ── Users ───────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'vendor',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // ── Password Reset Tokens ─────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // ── Clients ─────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    dashboard_username VARCHAR(100),
    portal_slug VARCHAR(100) UNIQUE,
    business_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    router_ip VARCHAR(45) NOT NULL,
    router_username VARCHAR(100) NOT NULL DEFAULT 'admin',
    router_password_encrypted TEXT NOT NULL,
    router_port INTEGER NOT NULL DEFAULT 8728,
    vpn_ip VARCHAR(45),
    contact_phone VARCHAR(50),
    status client_status NOT NULL DEFAULT 'active',
    monthly_fee NUMERIC(10,2) NOT NULL DEFAULT '50000',
    subscription_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // ── Voucher Profiles ────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS voucher_profiles (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    name VARCHAR(100) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    speed_limit VARCHAR(50),
    mikrotik_profile VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // ── Vouchers ────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS vouchers (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    profile_id INTEGER NOT NULL REFERENCES voucher_profiles(id),
    code VARCHAR(20) NOT NULL,
    password VARCHAR(20) NOT NULL,
    status voucher_status NOT NULL DEFAULT 'unused',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    used_at TIMESTAMP,
    mikrotik_id VARCHAR(50),
    last_synced_at TIMESTAMP
  );`,

  // ── Payments ────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    amount NUMERIC(10,2) NOT NULL,
    method VARCHAR(50) NOT NULL DEFAULT 'cash',
    reference VARCHAR(100),
    mpesa_receipt_number VARCHAR(50),
    mpesa_transaction_id VARCHAR(100),
    mpesa_phone_number VARCHAR(20),
    paid_at TIMESTAMP NOT NULL DEFAULT NOW(),
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // ── Sessions ────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // ── Audit Logs ──────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action audit_action NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // ── Portal Orders ───────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS portal_orders (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    profile_id INTEGER NOT NULL REFERENCES voucher_profiles(id),
    phone VARCHAR(20) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    status portal_order_status NOT NULL DEFAULT 'pending',
    checkout_request_id VARCHAR(100),
    mpesa_receipt VARCHAR(50),
    voucher_id INTEGER REFERENCES vouchers(id),
    voucher_code VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP
  );`,

  // ── System Settings ─────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // ── Connection Tokens ───────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS connection_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    business_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    contact_phone VARCHAR(50),
    dashboard_username VARCHAR(100) NOT NULL,
    dashboard_password_hash TEXT NOT NULL,
    assigned_vpn_ip VARCHAR(45) NOT NULL,
    status connection_token_status NOT NULL DEFAULT 'pending',
    client_id INTEGER REFERENCES clients(id),
    detected_router_ip VARCHAR(45),
    router_public_key VARCHAR(100),
    connected_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // ── M-Pesa Config ───────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS mpesa_config (
    id SERIAL PRIMARY KEY,
    client_id INTEGER UNIQUE REFERENCES clients(id),
    consumer_key TEXT NOT NULL,
    consumer_secret TEXT NOT NULL,
    shortcode VARCHAR(20) NOT NULL,
    passkey TEXT NOT NULL,
    callback_url TEXT,
    environment VARCHAR(20) NOT NULL DEFAULT 'sandbox',
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,
];

export async function GET() {
  const results: { step: string; status: string }[] = [];

  try {
    for (let i = 0; i < SETUP_SQL.length; i++) {
      try {
        await pool.query(SETUP_SQL[i]);
        results.push({ step: `SQL ${i + 1}`, status: "sawa" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("already exists") || msg.includes("duplicate")) {
          results.push({ step: `SQL ${i + 1}`, status: "tayari lipo" });
        } else {
          throw err;
        }
      }
    }

    // Check existing users
    const existing = await pool.query(`SELECT COUNT(*)::int AS count FROM users`);
    const userCount = existing.rows[0]?.count ?? 0;

    let seeded = false;
    let credentials = null;

    if (userCount === 0) {
      // Super Admin: Rajabu / Allahakbar*123
      const adminHash = await bcrypt.hash("Allahakbar*123", 10);
      const vendorHash = await bcrypt.hash("vendor123", 10);

      await pool.query(
        `INSERT INTO users (name, username, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          "Rajabu",
          "Rajabu",
          "rajabu@saidzen.co.tz",
          "+255 777 378 300",
          adminHash,
          "admin",
        ]
      );

      const vendorRes = await pool.query(
        `INSERT INTO users (name, username, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          "Juma Hassan",
          "juma_wifi",
          "vendor@saidzen.co.tz",
          "+255 755 123 456",
          vendorHash,
          "vendor",
        ]
      );
      const vendorId = vendorRes.rows[0].id;

      const subEnd = new Date();
      subEnd.setDate(subEnd.getDate() + 30);

      const clientRes = await pool.query(
        `INSERT INTO clients (
          user_id, dashboard_username, portal_slug, business_name, location,
          router_ip, router_username, router_password_encrypted,
          router_port, vpn_ip, status, monthly_fee, subscription_end
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
        [
          vendorId,
          "juma_wifi",
          "juma_wifi",
          "Duka la Juma WiFi",
          "Kariakoo, Dar es Salaam",
          "192.168.1.1",
          "admin",
          encrypt("router123"),
          8728,
          "10.8.0.2",
          "active",
          "50000",
          subEnd,
        ]
      );
      const clientId = clientRes.rows[0].id;

      const profiles = [
        ["Saa 1", "1h", "500", "2M/2M", "Saa_1"],
        ["Saa 2", "2h", "800", "3M/3M", "Saa_2"],
        ["Saa 6", "6h", "1500", "3M/3M", "Saa_6"],
        ["Siku 1 (Saa 24)", "24h", "2000", "5M/5M", "Saa_24"],
        ["Wiki 1", "7d", "8000", "5M/5M", "Wiki_1"],
      ];

      for (const [name, duration, price, speed, mikrotikProfile] of profiles) {
        await pool.query(
          `INSERT INTO voucher_profiles
           (client_id, name, duration, price, speed_limit, mikrotik_profile)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [clientId, name, duration, price, speed, mikrotikProfile]
        );
      }

      seeded = true;
      credentials = {
        admin: { username: "Rajabu", password: "Allahakbar*123" },
        vendor: { username: "juma_wifi", password: "vendor123" },
      };
      results.push({ step: "Kuweka data za msingi", status: "imekamilika" });
    }

    const tables = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );

    return NextResponse.json({
      success: true,
      message: seeded
        ? "USAJILI UMEFANIKIWA! Database imetengenezwa na akaunti ya Rajabu imewekwa."
        : "Database iko tayari (majedwali yote yapo).",
      tablesCreated: tables.rows.map((r: { table_name: string }) => r.table_name),
      seeded,
      credentials,
      details: results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
