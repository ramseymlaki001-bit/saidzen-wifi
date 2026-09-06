import { NextResponse } from "next/server";
import { pool } from "@/db";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/encryption";

const SETUP_SQL: string[] = [
  `CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, username VARCHAR(100) UNIQUE, email VARCHAR(255) UNIQUE, phone VARCHAR(50), password_hash TEXT NOT NULL, role ENUM('admin','vendor') NOT NULL DEFAULT 'vendor', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB;`,
  `CREATE TABLE IF NOT EXISTS password_reset_tokens (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, token VARCHAR(255) NOT NULL UNIQUE, expires_at TIMESTAMP NOT NULL, used BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id)) ENGINE=InnoDB;`,
  `CREATE TABLE IF NOT EXISTS clients (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, dashboard_username VARCHAR(100), portal_slug VARCHAR(100) UNIQUE, business_name VARCHAR(255) NOT NULL, location VARCHAR(255), router_ip VARCHAR(45) NOT NULL, router_username VARCHAR(100) NOT NULL DEFAULT 'admin', router_password_encrypted TEXT NOT NULL, router_port INT NOT NULL DEFAULT 8728, vpn_ip VARCHAR(45), contact_phone VARCHAR(50), status ENUM('active','suspended','expired') NOT NULL DEFAULT 'active', monthly_fee DECIMAL(10,2) NOT NULL DEFAULT 50000, subscription_end TIMESTAMP NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id)) ENGINE=InnoDB;`,
  `CREATE TABLE IF NOT EXISTS voucher_profiles (id INT AUTO_INCREMENT PRIMARY KEY, client_id INT NOT NULL, name VARCHAR(100) NOT NULL, duration VARCHAR(50) NOT NULL, price DECIMAL(10,2) NOT NULL, speed_limit VARCHAR(50), mikrotik_profile VARCHAR(100) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (client_id) REFERENCES clients(id)) ENGINE=InnoDB;`,
  `CREATE TABLE IF NOT EXISTS vouchers (id INT AUTO_INCREMENT PRIMARY KEY, client_id INT NOT NULL, profile_id INT NOT NULL, code VARCHAR(20) NOT NULL, password VARCHAR(20) NOT NULL, status ENUM('unused','used','expired') NOT NULL DEFAULT 'unused', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, used_at TIMESTAMP NULL, mikrotik_id VARCHAR(50), last_synced_at TIMESTAMP NULL, FOREIGN KEY (client_id) REFERENCES clients(id), FOREIGN KEY (profile_id) REFERENCES voucher_profiles(id)) ENGINE=InnoDB;`,
  `CREATE TABLE IF NOT EXISTS payments (id INT AUTO_INCREMENT PRIMARY KEY, client_id INT NOT NULL, amount DECIMAL(10,2) NOT NULL, method VARCHAR(50) NOT NULL DEFAULT 'cash', reference VARCHAR(100), mpesa_receipt_number VARCHAR(50), mpesa_transaction_id VARCHAR(100), mpesa_phone_number VARCHAR(20), paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, period_start TIMESTAMP NOT NULL, period_end TIMESTAMP NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (client_id) REFERENCES clients(id)) ENGINE=InnoDB;`,
  `CREATE TABLE IF NOT EXISTS sessions (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, token VARCHAR(255) NOT NULL UNIQUE, expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id)) ENGINE=InnoDB;`,
  `CREATE TABLE IF NOT EXISTS audit_logs (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NULL, action ENUM('login','logout','generate_voucher','delete_voucher','toggle_router','record_payment','change_password','create_client','update_client','failed_login','password_reset_request','password_reset') NOT NULL, details TEXT, ip_address VARCHAR(45), user_agent TEXT, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id)) ENGINE=InnoDB;`,
  `CREATE TABLE IF NOT EXISTS portal_orders (id INT AUTO_INCREMENT PRIMARY KEY, client_id INT NOT NULL, profile_id INT NOT NULL, phone VARCHAR(20) NOT NULL, amount DECIMAL(10,2) NOT NULL, status ENUM('pending','paid','failed','cancelled') NOT NULL DEFAULT 'pending', checkout_request_id VARCHAR(100), mpesa_receipt VARCHAR(50), voucher_id INT NULL, voucher_code VARCHAR(20), created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TIMESTAMP NULL, FOREIGN KEY (client_id) REFERENCES clients(id), FOREIGN KEY (profile_id) REFERENCES voucher_profiles(id), FOREIGN KEY (voucher_id) REFERENCES vouchers(id)) ENGINE=InnoDB;`,
  "CREATE TABLE IF NOT EXISTS system_settings (`key` VARCHAR(100) PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB;",
  `CREATE TABLE IF NOT EXISTS connection_tokens (id INT AUTO_INCREMENT PRIMARY KEY, token VARCHAR(255) NOT NULL UNIQUE, business_name VARCHAR(255) NOT NULL, location VARCHAR(255), contact_phone VARCHAR(50), dashboard_username VARCHAR(100) NOT NULL, dashboard_password_hash TEXT NOT NULL, assigned_vpn_ip VARCHAR(45) NOT NULL, status ENUM('pending','connected','expired') NOT NULL DEFAULT 'pending', client_id INT NULL, detected_router_ip VARCHAR(45), router_public_key VARCHAR(100), connected_at TIMESTAMP NULL, expires_at TIMESTAMP NOT NULL, created_by INT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (client_id) REFERENCES clients(id), FOREIGN KEY (created_by) REFERENCES users(id)) ENGINE=InnoDB;`,
  `CREATE TABLE IF NOT EXISTS mpesa_config (id INT AUTO_INCREMENT PRIMARY KEY, client_id INT UNIQUE NULL, consumer_key TEXT NOT NULL, consumer_secret TEXT NOT NULL, shortcode VARCHAR(20) NOT NULL, passkey TEXT NOT NULL, callback_url TEXT, environment VARCHAR(20) NOT NULL DEFAULT 'sandbox', enabled BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (client_id) REFERENCES clients(id)) ENGINE=InnoDB;`,
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
    const [existingRows] = await pool.query(`SELECT COUNT(*) AS count FROM users`);
    const userCount = Number(
      (existingRows as Array<{ count: number | string }>)[0]?.count ?? 0
    );

    let seeded = false;
    let credentials = null;

    if (userCount === 0) {
      // Super Admin: Rajabu / Allahakbar*123
      const adminHash = await bcrypt.hash("Allahakbar*123", 10);
      const vendorHash = await bcrypt.hash("vendor123", 10);

      await pool.query(
        `INSERT INTO users (name, username, email, phone, password_hash, role)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          "Rajabu",
          "Rajabu",
          "rajabu@saidzen.co.tz",
          "+255 777 378 300",
          adminHash,
          "admin",
        ]
      );

      const [vendorResult] = await pool.query(
        `INSERT INTO users (name, username, email, phone, password_hash, role)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          "Juma Hassan",
          "juma_wifi",
          "vendor@saidzen.co.tz",
          "+255 755 123 456",
          vendorHash,
          "vendor",
        ]
      );
      const vendorId = Number(
        (vendorResult as unknown as { insertId: number }).insertId
      );

      const subEnd = new Date();
      subEnd.setDate(subEnd.getDate() + 30);

      const [clientResult] = await pool.query(
        `INSERT INTO clients (
          user_id, dashboard_username, portal_slug, business_name, location,
          router_ip, router_username, router_password_encrypted,
          router_port, vpn_ip, status, monthly_fee, subscription_end
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
      const clientId = Number(
        (clientResult as unknown as { insertId: number }).insertId
      );

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
           VALUES (?,?,?,?,?,?)`,
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

    const [tableRows] = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name`
    );

    return NextResponse.json({
      success: true,
      message: seeded
        ? "USAJILI UMEFANIKIWA! Database imetengenezwa na akaunti ya Rajabu imewekwa."
        : "Database iko tayari (majedwali yote yapo).",
      tablesCreated: (tableRows as Array<{ TABLE_NAME: string }>).map(
        (r) => r.TABLE_NAME
      ),
      seeded,
      credentials,
      details: results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
