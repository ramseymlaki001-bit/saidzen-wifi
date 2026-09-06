/**
 * MikroTik API Integration Module
 *
<<<<<<< HEAD
 * HALI MBILI:
 *   1. UZALISHAJI (chaguo-msingi): inaongea na router HALISI. Router ikiwa
 *      haipo, inarudisha success=false na SABABU HALISI — haidanganyi.
 *   2. SIMULATION (MIKROTIK_SIMULATION=true kwenye .env): kwa majaribio
 *      bila router. Kila jibu linaandikwa wazi "simulation: true".
 *
 * KWA NINI HII NI MUHIMU: Awali "testConnection" ilirudisha success=true
 * HATA ROUTER HAIPO — admin angesajili router isiyofanya kazi, mteja
 * angepata vocha zisizofanya kazi, na kila "Pima Router" ingesema "sawa".
 */
import { decrypt } from "@/lib/encryption";

/* eslint-disable @typescript-eslint/no-explicit-any */

=======
 * Inajaribu kuongea na router halisi za MikroTik.
 * Ikiwa router haiko, inarudi kwenye simulation mode.
 */
import { decrypt } from "@/lib/encryption";

>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
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

<<<<<<< HEAD
export interface RouterResult {
  success: boolean;
  message: string;
  simulation: boolean;
  /** Kosa halisi kutoka kwa router/mtandao (kwa utatuzi) */
  errorCode?: string;
}

/** Muda wa juu wa kusubiri router (sekunde) */
const CONNECT_TIMEOUT_SEC = 8;

/** Kukata ahadi (promise) ikichukua muda mrefu kuliko inavyotakiwa */
function withTimeout<T>(p: Promise<T>, ms: number, msg: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => {
      const e: any = new Error(msg);
      e.code = "ETIMEDOUT";
      reject(e);
    }, ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (err) => {
        clearTimeout(t);
        reject(err);
      }
    );
  });
}

/** Je, tuko kwenye hali ya simulation (majaribio bila router)? */
export function isSimulation(): boolean {
  return (
    (process.env.MIKROTIK_SIMULATION || "").toLowerCase() === "true" ||
    process.env.MIKROTIK_SIMULATION === "1"
  );
}

=======
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
// ── Helper functions ──────────────────────────────────────────
function generateCode(length: number = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

<<<<<<< HEAD
/** Kutafsiri kosa la mtandao kuwa ujumbe wa Kiswahili unaoeleweka */
function explainError(err: unknown, host: string, port: number): {
  message: string;
  code: string;
} {
  const e = err as { code?: string; message?: string } | undefined;
  const code = e?.code || "";
  const raw = e?.message || String(err);

  if (code === "ECONNREFUSED")
    return {
      code,
      message: `Router ${host}:${port} imekataa muunganisho. API haijawashwa? Endesha kwenye router: /ip service enable api`,
    };
  if (code === "ETIMEDOUT" || /timeout/i.test(raw))
    return {
      code: code || "ETIMEDOUT",
      message: `Router ${host}:${port} haijibu (timeout). Angalia: router iko waka? WireGuard imeunganishwa? Firewall inaruhusu bandari ${port}?`,
    };
  if (code === "EHOSTUNREACH" || code === "ENETUNREACH")
    return {
      code,
      message: `Hakuna njia ya kufikia ${host}. VPN (WireGuard) haijaunganishwa au IP si sahihi.`,
    };
  if (code === "ENOTFOUND")
    return { code, message: `Anwani ${host} haipatikani (DNS).` };
  if (/invalid user name or password|login failure|cannot log in/i.test(raw))
    return {
      code: "AUTH_FAILED",
      message: `Jina la mtumiaji au nenosiri la API ya router si sahihi. Rekebisha kwenye Mipangilio.`,
    };
  return { code: code || "UNKNOWN", message: `Hitilafu ya router: ${raw}` };
}

/**
 * Kuconnect kwenye router halisi.
 * Inarudisha {client} au {error} — HAIFICHI kosa.
 */
async function connectToRouter(
  conn: MikroTikConnection
): Promise<{ client: any; error?: undefined } | { client?: undefined; error: unknown }> {
  try {
    const mod: any = await import("routeros");
    // Maktaba ya "routeros" inatoa `RouterOSAPI` (si default export).
    const Client =
      mod.RouterOSAPI || mod.default?.RouterOSAPI || mod.default || mod;
    if (typeof Client !== "function") {
      return {
        error: {
          code: "LIB_ERROR",
          message:
            "Maktaba ya MikroTik (routeros) haijapakiwa vizuri. Endesha: npm install routeros",
        },
      };
    }
    let password = "";
    try {
      password = decrypt(conn.encryptedPassword);
    } catch {
      return {
        error: {
          code: "DECRYPT_FAILED",
          message:
            "Nenosiri la router halisomeki — ENCRYPTION_KEY imebadilika. Weka nenosiri la router upya kwenye Mipangilio.",
        },
      };
    }
=======
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
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a

    const client = new Client({
      host: conn.host,
      user: conn.username,
      password,
      port: conn.port,
<<<<<<< HEAD
      // MUHIMU: maktaba ya "routeros" hutumia SEKUNDE (si milisekunde).
      timeout: CONNECT_TIMEOUT_SEC,
    });

    // Ulinzi wa ziada: kama maktaba haitoi 'timeout' (mfano SYN inaning'inia),
    // tunakata wenyewe ili mtumiaji asisubiri milele.
    await withTimeout(
      client.connect(),
      (CONNECT_TIMEOUT_SEC + 2) * 1000,
      `Router ${conn.host}:${conn.port} haijibu ndani ya sekunde ${CONNECT_TIMEOUT_SEC}`
    );
    return { client };
  } catch (err) {
    return { error: err };
  }
}

function safeClose(client: any) {
  try {
    client?.close?.();
  } catch {
    /* kimya */
=======
      timeout: 5000,
    });

    await client.connect();
    return client;
  } catch {
    return null;
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
  }
}

/**
<<<<<<< HEAD
 * Kupima muunganisho na router — INASEMA UKWELI.
 */
export async function testConnection(
  conn: MikroTikConnection
): Promise<RouterResult> {
  if (isSimulation()) {
    return {
      success: true,
      simulation: true,
      message: `[SIMULATION] Muunganisho wa jaribio na ${conn.host}:${conn.port} — hakuna router halisi.`,
    };
  }

  const res = await connectToRouter(conn);
  if (res.error !== undefined) {
    const ex = explainError(res.error, conn.host, conn.port);
    return { success: false, simulation: false, message: ex.message, errorCode: ex.code };
  }

  try {
    const identity = await res.client.write("/system/identity/print");
    const routerName = identity?.[0]?.name || "MikroTik Router";
    return {
      success: true,
      simulation: false,
      message: `Imeunganishwa na "${routerName}" (${conn.host}:${conn.port})`,
    };
  } catch (err) {
    const ex = explainError(err, conn.host, conn.port);
    return { success: false, simulation: false, message: ex.message, errorCode: ex.code };
  } finally {
    safeClose(res.client);
  }
}

/**
 * Kuzalisha vocha kwenye MikroTik Router.
 * Inarudisha vocha zilizofanikiwa TU. Router ikishindwa → inatupa kosa
 * (isipokuwa kwenye simulation).
=======
 * Kuzalisha vocha kwenye MikroTik Router
 *
 * Inatumia amri: /ip/hotspot/user/add name=CODE password=PASS profile=PROFILE
 * Ikiwa router haipo, simulation mode inarudi vocha za mfano.
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
 */
export async function generateVouchers(
  conn: MikroTikConnection,
  profileName: string,
  count: number
): Promise<VoucherResult[]> {
  const results: VoucherResult[] = [];

<<<<<<< HEAD
  if (isSimulation()) {
    for (let i = 0; i < count; i++) {
      results.push({
        code: generateCode(6),
        password: generateCode(6),
        profile: profileName,
        success: true,
      });
    }
    return results;
  }

  const res = await connectToRouter(conn);
  if (res.error !== undefined) {
    const ex = explainError(res.error, conn.host, conn.port);
    throw new Error(ex.message);
  }

  try {
    for (let i = 0; i < count; i++) {
      const code = generateCode(6);
      const password = generateCode(6);

      const response = await res.client.write("/ip/hotspot/user/add", [
        `=name=${code}`,
        `=password=${password}`,
        `=profile=${profileName}`,
        "=disabled=no",
      ]);

      results.push({
        code,
        password,
        profile: profileName,
        success: true,
        mikrotikId: response?.[0]?.ret || undefined,
      });
    }
    return results;
  } catch (err) {
    // Kama baadhi zilifanikiwa, rudisha hizo; kama hakuna, tupa kosa
    if (results.length > 0) return results;
    const ex = explainError(err, conn.host, conn.port);
    throw new Error(ex.message);
  } finally {
    safeClose(res.client);
  }
=======
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
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
}

/**
 * Kuzima huduma ya hotspot kwa mteja
 */
export async function disableHotspot(
  conn: MikroTikConnection
<<<<<<< HEAD
): Promise<RouterResult> {
  if (isSimulation()) {
    return {
      success: true,
      simulation: true,
      message: `[SIMULATION] Hotspot imezimwa kwenye ${conn.host}`,
    };
  }

  const res = await connectToRouter(conn);
  if (res.error !== undefined) {
    const ex = explainError(res.error, conn.host, conn.port);
    return { success: false, simulation: false, message: ex.message, errorCode: ex.code };
  }

  try {
    const servers = await res.client.write("/ip/hotspot/print");
    for (const server of servers || []) {
      await res.client.write("/ip/hotspot/disable", [`=.id=${server[".id"]}`]);
    }
    return {
      success: true,
      simulation: false,
      message: `Hotspot imezimwa kwenye ${conn.host}`,
    };
  } catch (err) {
    const ex = explainError(err, conn.host, conn.port);
    return { success: false, simulation: false, message: ex.message, errorCode: ex.code };
  } finally {
    safeClose(res.client);
  }
=======
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
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
}

/**
 * Kuwasha huduma ya hotspot kwa mteja
 */
export async function enableHotspot(
  conn: MikroTikConnection
<<<<<<< HEAD
): Promise<RouterResult> {
  if (isSimulation()) {
    return {
      success: true,
      simulation: true,
      message: `[SIMULATION] Hotspot imewashwa kwenye ${conn.host}`,
    };
  }

  const res = await connectToRouter(conn);
  if (res.error !== undefined) {
    const ex = explainError(res.error, conn.host, conn.port);
    return { success: false, simulation: false, message: ex.message, errorCode: ex.code };
  }

  try {
    const servers = await res.client.write("/ip/hotspot/print");
    for (const server of servers || []) {
      await res.client.write("/ip/hotspot/enable", [`=.id=${server[".id"]}`]);
    }
    return {
      success: true,
      simulation: false,
      message: `Hotspot imewashwa kwenye ${conn.host}`,
    };
  } catch (err) {
    const ex = explainError(err, conn.host, conn.port);
    return { success: false, simulation: false, message: ex.message, errorCode: ex.code };
  } finally {
    safeClose(res.client);
  }
}

/**
 * Kupata orodha ya watumiaji wanaotumia hotspot sasa hivi.
 * Router ikishindwa → orodha TUPU (si data ya uongo).
 */
export async function getHotspotUsers(
  conn: MikroTikConnection
): Promise<{ name: string; profile: string; uptime: string; address: string }[]> {
  if (isSimulation()) {
    return [
      { name: "SIM-USER1", profile: "Saa_1", uptime: "00:30:00", address: "192.168.1.50" },
      { name: "SIM-USER2", profile: "Saa_24", uptime: "12:45:00", address: "192.168.1.51" },
    ];
  }

  const res = await connectToRouter(conn);
  if (res.error !== undefined) return [];

  try {
    const users = await res.client.write("/ip/hotspot/active/print");
    return (users || []).map((u: Record<string, string>) => ({
      name: u.name || "unknown",
      profile: u.profile || "default",
      uptime: u["uptime"] || "00:00:00",
      address: u.address || "unknown",
    }));
  } catch {
    return [];
  } finally {
    safeClose(res.client);
  }
=======
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
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
}

/**
 * Kusawazisha (Sync) hali za vocha kutoka kwenye router
 */
export async function syncVoucherStatus(
  conn: MikroTikConnection,
  voucherCodes: string[]
<<<<<<< HEAD
): Promise<{ active: string[]; inactive: string[] }> {
  const active: string[] = [];
  const inactive: string[] = [...voucherCodes];

  if (isSimulation()) return { active, inactive };

  const res = await connectToRouter(conn);
  if (res.error !== undefined) return { active, inactive };

  try {
    const users = await res.client.write("/ip/hotspot/user/print");
    const names = new Set((users || []).map((u: Record<string, string>) => u.name));
    for (const code of voucherCodes) {
      if (names.has(code)) {
        active.push(code);
        const idx = inactive.indexOf(code);
        if (idx > -1) inactive.splice(idx, 1);
      }
    }
  } catch {
    /* rudisha kama zilivyo */
  } finally {
    safeClose(res.client);
  }

  return { active, inactive };
=======
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
>>>>>>> 90914fb4ccbc7e8ddce0f0c51104f3f954fcc41a
}
