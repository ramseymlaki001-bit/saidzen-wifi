/**
 * MikroTik API Integration Module
 *
 * Inajaribu kuongea na router halisi za MikroTik.
 * Ikiwa router haiko, inarudi kwenye simulation mode.
 */
import { decrypt } from "@/lib/encryption";

export interface MikroTikConnection {
  host: string;
  username: string;
  /** Encrypted password (kwenye database imehifadhiwa encrypted) */
  encryptedPassword: string;
  port: number;
}

export interface VoucherResult {
  code: string;
  password: string;
  profile: string;
  success: boolean;
  mikrotikId?: string;
}

// ── Helper functions ──────────────────────────────────────────
function generateCode(length: number = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Kuconnect kwenye router halisi.
 * Inarudi null ikiwa connection inashindwa.
 */
async function connectToRouter(
  conn: MikroTikConnection
): Promise<unknown | null> {
  try {
    // Load routeros dynamically (avoid breaking build if not installed)
    const mod = await import("routeros");
    const Client = (mod as any).default || mod;
    const password = decrypt(conn.encryptedPassword);

    const client = new Client({
      host: conn.host,
      user: conn.username,
      password,
      port: conn.port,
      timeout: 5000,
    });

    await client.connect();
    return client;
  } catch {
    return null;
  }
}

/**
 * Kuzalisha vocha kwenye MikroTik Router
 *
 * Inatumia amri: /ip/hotspot/user/add name=CODE password=PASS profile=PROFILE
 * Ikiwa router haipo, simulation mode inarudi vocha za mfano.
 */
export async function generateVouchers(
  conn: MikroTikConnection,
  profileName: string,
  count: number
): Promise<VoucherResult[]> {
  const results: VoucherResult[] = [];

  // Try real MikroTik API first
  const client = await connectToRouter(conn);

  if (client) {
    try {
      const api = (client as any);
      for (let i = 0; i < count; i++) {
        const code = generateCode(6);
        const password = generateCode(6);

        const response = await api.write("/ip/hotspot/user/add", [
          `=name=${code}`,
          `=password=${password}`,
          `=profile=${profileName}`,
          "=disabled=no",
        ]);

        const mikrotikId = response?.[0]?.ret || undefined;

        results.push({
          code,
          password,
          profile: profileName,
          success: true,
          mikrotikId,
        });
      }
    } catch (err) {
      console.error("MikroTik API error during voucher generation:", err);
      throw new Error(
        `MikroTik imekataa kutengeneza vocha: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      try {
        (client as any).close();
      } catch {}
    }
  } else {
    throw new Error(
      `Imeshindikana kuunganisha MikroTik ${conn.host}:${conn.port}. Hakuna vocha iliyotengenezwa.`
    );
  }

  return results;
}

/**
 * Kupima muunganisho na router
 */
export async function testConnection(
  conn: MikroTikConnection
): Promise<{ success: boolean; message: string }> {
  const client = await connectToRouter(conn);

  if (client) {
    try {
      const api = client as any;
      const identity = await api.write("/system/identity/print");
      const routerName = identity?.[0]?.name || "MikroTik Router";
      api.close();
      return {
        success: true,
        message: `Imeunganishwa na "${routerName}" (${conn.host}:${conn.port})`,
      };
    } catch (err) {
      try {
        (client as any).close();
      } catch {}
      return {
        success: false,
        message: `Connection imepatikana lakini amri ilishindwa: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  return {
    success: false,
    message: `Imeshindikana kuunganisha MikroTik ${conn.host}:${conn.port}. Kagua IP, port 8728, username, password na firewall.`,
  };
}

/**
 * Kuzima huduma ya hotspot kwa mteja
 */
export async function disableHotspot(
  conn: MikroTikConnection
): Promise<{ success: boolean; message: string }> {
  const client = await connectToRouter(conn);

  if (client) {
    try {
      const api = client as any;
      const servers = await api.write("/ip/hotspot/print");
      for (const server of servers) {
        await api.write("/ip/hotspot/disable", [`=.id=${server[".id"]}`]);
      }
      api.close();
      return {
        success: true,
        message: `Hotspot imezimwa kwenye ${conn.host}`,
      };
    } catch (err) {
      try {
        (client as any).close();
      } catch {}
      return {
        success: false,
        message: `Imeshindikana kuzima hotspot: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  return {
    success: false,
    message: `Imeshindikana kuunganisha MikroTik ${conn.host}:${conn.port}. Hotspot haijazimwa.`,
  };
}

/**
 * Kuwasha huduma ya hotspot kwa mteja
 */
export async function enableHotspot(
  conn: MikroTikConnection
): Promise<{ success: boolean; message: string }> {
  const client = await connectToRouter(conn);

  if (client) {
    try {
      const api = client as any;
      const servers = await api.write("/ip/hotspot/print");
      for (const server of servers) {
        await api.write("/ip/hotspot/enable", [`=.id=${server[".id"]}`]);
      }
      api.close();
      return {
        success: true,
        message: `Hotspot imewashwa kwenye ${conn.host}`,
      };
    } catch (err) {
      try {
        (client as any).close();
      } catch {}
      return {
        success: false,
        message: `Imeshindikana kuwasha hotspot: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  return {
    success: false,
    message: `Imeshindikana kuunganisha MikroTik ${conn.host}:${conn.port}. Hotspot haijawashwa.`,
  };
}

/**
 * Kupata orodha ya watumiaji wanaotumia hotspot sasa hivi
 */
export async function getHotspotUsers(
  conn: MikroTikConnection
): Promise<
  { name: string; profile: string; uptime: string; address: string }[]
> {
  const client = await connectToRouter(conn);

  if (client) {
    try {
      const api = client as any;
      const users = await api.write("/ip/hotspot/active/print");
      api.close();
      return (users || []).map((u: Record<string, string>) => ({
        name: u.name || "unknown",
        profile: u.profile || "default",
        uptime: u["uptime"] || "00:00:00",
        address: u.address || "unknown",
      }));
    } catch (err) {
      try {
        (client as any).close();
      } catch {}
      throw new Error(
        `Imeshindikana kusoma watumiaji wa MikroTik: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  throw new Error(
    `Imeshindikana kuunganisha MikroTik ${conn.host}:${conn.port}.`
  );
}

/**
 * Kusawazisha (Sync) hali za vocha kutoka kwenye router
 */
export async function syncVoucherStatus(
  conn: MikroTikConnection,
  voucherCodes: string[]
): Promise<{
  active: string[];
  inactive: string[];
}> {
  const active: string[] = [];
  const inactive: string[] = [...voucherCodes];

  const client = await connectToRouter(conn);
  if (client) {
    try {
      const api = client as any;
      const users = await api.write("/ip/hotspot/user/print");
      api.close();

      const routerUserNames = new Set(
        (users || []).map((u: Record<string, string>) => u.name)
      );

      for (const code of voucherCodes) {
        if (routerUserNames.has(code)) {
          active.push(code);
          const idx = inactive.indexOf(code);
          if (idx > -1) inactive.splice(idx, 1);
        }
      }
    } catch (err) {
      try {
        (client as any).close();
      } catch {}
      throw new Error(
        `Imeshindikana kusawazisha vocha kutoka MikroTik: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  throw new Error(`Imeshindikana kuunganisha MikroTik ${conn.host}:${conn.port}.`);
}
