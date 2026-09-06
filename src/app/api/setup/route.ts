import { NextResponse } from "next/server";
import { pool } from "@/db";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/encryption";

<<<<<<< HEAD
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
=======
/**
 * NJIA YA KUJISAKINISHA (AUTO-SETUP) — MySQL / MariaDB
 *
 * Inatengeneza jedwali (tables) zote za database kwa kutumia SQL safi —
 * haitumii drizzle-kit (ambalo mara nyingi hushindwa kwenye seva kwa
 * sababu ya hitilafu ya TTY).
 *
 * Matumizi: Baada ya kupakia msimbo kwenye seva, fungua kwenye browser:
 *   http://IP_YA_SEVA:3000/api/setup
 *
 * Inaweza kuitwa mara nyingi kwa usalama (idempotent).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const SETUP_SQL: string[] = [
  // ── Jedwali la watumiaji ────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    password_hash TEXT NOT NULL,
<<<<<<< HEAD
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
=======
    role ENUM('admin','vendor') NOT NULL DEFAULT 'vendor',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── Token za kurejesha nenosiri ─────────────────────────────
  `CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── Wateja / Router ─────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
    dashboard_username VARCHAR(100),
    portal_slug VARCHAR(100) UNIQUE,
    business_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    router_ip VARCHAR(45) NOT NULL,
    router_username VARCHAR(100) NOT NULL DEFAULT 'admin',
    router_password_encrypted TEXT NOT NULL,
<<<<<<< HEAD
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
=======
    router_port INT NOT NULL DEFAULT 8728,
    vpn_ip VARCHAR(45),
    contact_phone VARCHAR(50),
    status ENUM('active','suspended','expired') NOT NULL DEFAULT 'active',
    monthly_fee DECIMAL(10,2) NOT NULL DEFAULT '50000',
    subscription_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_clients_user FOREIGN KEY (user_id) REFERENCES users(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── Aina za vocha ───────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS voucher_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    speed_limit VARCHAR(50),
    mikrotik_profile VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vp_client FOREIGN KEY (client_id) REFERENCES clients(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── Vocha ───────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    profile_id INT NOT NULL,
    code VARCHAR(20) NOT NULL,
    password VARCHAR(20) NOT NULL,
    status ENUM('unused','used','expired') NOT NULL DEFAULT 'unused',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,
    mikrotik_id VARCHAR(50),
    last_synced_at TIMESTAMP NULL,
    INDEX idx_vouchers_client_code (client_id, code),
    CONSTRAINT fk_v_client FOREIGN KEY (client_id) REFERENCES clients(id),
    CONSTRAINT fk_v_profile FOREIGN KEY (profile_id) REFERENCES voucher_profiles(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── Malipo ──────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
    method VARCHAR(50) NOT NULL DEFAULT 'cash',
    reference VARCHAR(100),
    mpesa_receipt_number VARCHAR(50),
    mpesa_transaction_id VARCHAR(100),
    mpesa_phone_number VARCHAR(20),
<<<<<<< HEAD
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
=======
    paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pay_client FOREIGN KEY (client_id) REFERENCES clients(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── Vikao (sessions) ────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sess_user FOREIGN KEY (user_id) REFERENCES users(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── Kumbukumbu ya matendo (audit log) ───────────────────────
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action ENUM('login','logout','generate_voucher','delete_voucher','toggle_router','record_payment','change_password','create_client','update_client','failed_login','password_reset_request','password_reset') NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── Oda za wateja wa mwisho (portal ya WiFi) ────────────────
  `CREATE TABLE IF NOT EXISTS portal_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    profile_id INT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending','paid','failed','cancelled') NOT NULL DEFAULT 'pending',
    checkout_request_id VARCHAR(100),
    mpesa_receipt VARCHAR(50),
    voucher_id INT NULL,
    voucher_code VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    CONSTRAINT fk_po_client FOREIGN KEY (client_id) REFERENCES clients(id),
    CONSTRAINT fk_po_profile FOREIGN KEY (profile_id) REFERENCES voucher_profiles(id),
    CONSTRAINT fk_po_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── Mipangilio ya Mfumo ─────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS system_settings (
    \`key\` VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── Token za kuunganisha router ─────────────────────────────
  `CREATE TABLE IF NOT EXISTS connection_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
    token VARCHAR(255) NOT NULL UNIQUE,
    business_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    contact_phone VARCHAR(50),
    dashboard_username VARCHAR(100) NOT NULL,
    dashboard_password_hash TEXT NOT NULL,
    assigned_vpn_ip VARCHAR(45) NOT NULL,
<<<<<<< HEAD
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
=======
    status ENUM('pending','connected','expired') NOT NULL DEFAULT 'pending',
    client_id INT NULL,
    detected_router_ip VARCHAR(45),
    router_public_key VARCHAR(100),
    connected_at TIMESTAMP NULL,
    expires_at TIMESTAMP NOT NULL,
    created_by INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ct_client FOREIGN KEY (client_id) REFERENCES clients(id),
    CONSTRAINT fk_ct_user FOREIGN KEY (created_by) REFERENCES users(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── Mipangilio ya M-Pesa ────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS mpesa_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT UNIQUE,
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
    consumer_key TEXT NOT NULL,
    consumer_secret TEXT NOT NULL,
    shortcode VARCHAR(20) NOT NULL,
    passkey TEXT NOT NULL,
    callback_url TEXT,
    environment VARCHAR(20) NOT NULL DEFAULT 'sandbox',
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
<<<<<<< HEAD
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
=======
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mp_client FOREIGN KEY (client_id) REFERENCES clients(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

/** Kutekeleza swali na kurudisha safu (mysql2 inarudisha [rows, fields]) */
async function q(sql: string, params: any[] = []): Promise<any[]> {
  const [rows] = await pool.query(sql, params);
  return Array.isArray(rows) ? (rows as any[]) : [];
}

export async function GET(request: Request) {
  const results: { step: string; status: string }[] = [];

  try {
    const setupSecret = process.env.SETUP_SECRET;
    const suppliedSecret =
      request.headers.get("x-setup-secret") ||
      new URL(request.url).searchParams.get("secret");
    const isLocal = ["localhost", "127.0.0.1", "::1"].includes(
      new URL(request.url).hostname
    );

    if (process.env.NODE_ENV === "production" && (!setupSecret || suppliedSecret !== setupSecret)) {
      return NextResponse.json(
        { success: false, error: "Setup imefungwa. Weka SETUP_SECRET na uitume kama x-setup-secret." },
        { status: 403 }
      );
    }

    if (!setupSecret && !isLocal) {
      return NextResponse.json(
        { success: false, error: "SETUP_SECRET inahitajika kwa setup kutoka nje ya server." },
        { status: 403 }
      );
    }

    // ── 1. Tengeneza jedwali zote ─────────────────────────────
    for (let i = 0; i < SETUP_SQL.length; i++) {
      try {
        await pool.query(SETUP_SQL[i]);
        results.push({ step: `Jedwali ${i + 1}`, status: "sawa" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("already exists") || msg.includes("Duplicate")) {
          results.push({ step: `Jedwali ${i + 1}`, status: "tayari lipo" });
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
        } else {
          throw err;
        }
      }
    }

<<<<<<< HEAD
    // Check existing users
    const existing = await pool.query(`SELECT COUNT(*)::int AS count FROM users`);
    const userCount = existing.rows[0]?.count ?? 0;
=======
    // ── 1b. Jaza portal_slug kwa router zilizopo bila slug ────
    const noSlug = await q(
      `SELECT id, COALESCE(dashboard_username, 'hotspot') AS uname
       FROM clients WHERE portal_slug IS NULL ORDER BY id`
    );

    for (const row of noSlug) {
      const base = String(row.uname)
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "_");
      let candidate = base;
      let n = 2;
      for (;;) {
        const taken = await q(
          `SELECT 1 FROM clients WHERE portal_slug = ? AND id <> ? LIMIT 1`,
          [candidate, row.id]
        );
        if (taken.length === 0) break;
        candidate = `${base}-${n}`;
        n += 1;
      }
      await pool.query(`UPDATE clients SET portal_slug = ? WHERE id = ?`, [
        candidate,
        row.id,
      ]);
    }

    if (noSlug.length > 0) {
      results.push({
        step: "Kujaza portal_slug",
        status: `router ${noSlug.length} zimesasishwa`,
      });
    }

    // ── 2. Angalia kama tayari kuna watumiaji ─────────────────
    const existing = await q(`SELECT COUNT(*) AS count FROM users`);
    const userCount = Number(existing[0]?.count ?? 0);
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a

    let seeded = false;
    let credentials = null;

    if (userCount === 0) {
<<<<<<< HEAD
      // Super Admin: Rajabu / Allahakbar*123
      const adminHash = await bcrypt.hash("Allahakbar*123", 10);
=======
      // ── 3. Akaunti za msingi ────────────────────────────────
      const adminHash = await bcrypt.hash("admin123", 10);
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
      const vendorHash = await bcrypt.hash("vendor123", 10);

      await pool.query(
        `INSERT INTO users (name, username, email, phone, password_hash, role)
<<<<<<< HEAD
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          "Rajabu",
          "Rajabu",
          "rajabu@saidzen.co.tz",
          "+255 777 378 300",
=======
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          "Admin SaidZen",
          "admin",
          "admin@saidzen.co.tz",
          "+255 712 345 678",
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
          adminHash,
          "admin",
        ]
      );

<<<<<<< HEAD
      const vendorRes = await pool.query(
        `INSERT INTO users (name, username, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
=======
      const [vendorRes]: any = await pool.query(
        `INSERT INTO users (name, username, email, phone, password_hash, role)
         VALUES (?, ?, ?, ?, ?, ?)`,
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
        [
          "Juma Hassan",
          "juma_wifi",
          "vendor@saidzen.co.tz",
          "+255 755 123 456",
          vendorHash,
          "vendor",
        ]
      );
<<<<<<< HEAD
      const vendorId = vendorRes.rows[0].id;

      const subEnd = new Date();
      subEnd.setDate(subEnd.getDate() + 30);

      const clientRes = await pool.query(
=======
      const vendorId = Number(vendorRes.insertId);

      // ── 4. Router ya mfano ──────────────────────────────────
      const subEnd = new Date();
      subEnd.setDate(subEnd.getDate() + 30);

      const [clientRes]: any = await pool.query(
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
        `INSERT INTO clients (
          user_id, dashboard_username, portal_slug, business_name, location,
          router_ip, router_username, router_password_encrypted,
          router_port, vpn_ip, status, monthly_fee, subscription_end
<<<<<<< HEAD
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
=======
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
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
<<<<<<< HEAD
      const clientId = clientRes.rows[0].id;

      const profiles = [
=======
      const clientId = Number(clientRes.insertId);

      // ── 5. Vifurushi vya vocha ──────────────────────────────
      const profiles: [string, string, string, string, string][] = [
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
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
<<<<<<< HEAD
           VALUES ($1,$2,$3,$4,$5,$6)`,
=======
           VALUES (?,?,?,?,?,?)`,
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
          [clientId, name, duration, price, speed, mikrotikProfile]
        );
      }

      seeded = true;
      credentials = {
<<<<<<< HEAD
        admin: { username: "Rajabu", password: "Allahakbar*123" },
        vendor: { username: "juma_wifi", password: "vendor123" },
      };
      results.push({ step: "Kuweka data za msingi", status: "imekamilika" });
    }

    const tables = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
=======
        admin: { username: "admin", password: "admin123" },
        vendor: { username: "juma_wifi", password: "vendor123" },
      };
      results.push({ step: "Kuweka data za msingi", status: "imekamilika" });
    } else {
      results.push({
        step: "Kuweka data za msingi",
        status: "tayari kuna watumiaji (hukuwekwa tena)",
      });
    }

    // ── 6. Orodha ya jedwali ──────────────────────────────────
    const tables = await q(
      `SELECT table_name AS tname FROM information_schema.tables
       WHERE table_schema = DATABASE() ORDER BY table_name`
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
    );

    return NextResponse.json({
      success: true,
<<<<<<< HEAD
      message: seeded
        ? "USAJILI UMEFANIKIWA! Database imetengenezwa na akaunti ya Rajabu imewekwa."
        : "Database iko tayari (majedwali yote yapo).",
      tablesCreated: tables.rows.map((r: { table_name: string }) => r.table_name),
      seeded,
      credentials,
=======
      database: "MySQL / MariaDB",
      message: seeded
        ? "USAJILI UMEFANIKIWA! Database imetengenezwa na akaunti zimewekwa."
        : "Database iko tayari (majedwali yote yapo).",
      tablesCreated: tables.map((r: any) => r.tname ?? r.TABLE_NAME),
      seeded,
      credentials,
      nextStep: "Fungua tovuti na uingie. Kisha sajili router yako.",
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
      details: results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
<<<<<<< HEAD
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
=======
    return NextResponse.json(
      {
        success: false,
        error: msg,
        hint:
          "Hakikisha DATABASE_URL kwenye .env ni sahihi (mysql://user:pass@host:3306/db) na MySQL inaendesha.",
        details: results,
      },
      { status: 500 }
    );
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
  }
}
