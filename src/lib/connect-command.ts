import { db } from "@/db";
import { clients, connectionTokens } from "@/db/schema";
import { sql, isNotNull, eq } from "drizzle-orm";
import { getWireguardConfig, getAppUrl } from "@/lib/settings";

export { getAppUrl };

/**
 * MSINGI WA COMMAND YA KUUNGANISHA ROUTER
 *
 * Hapa ndipo tunapozalisha "command moja ya kunakili-na-kubandika" ambayo
 * mteja anaiweka kwenye WinBox → New Terminal.
 */

/**
 * Kutafuta IP ya VPN ambayo bado haijatumiwa.
 * Inaangalia: jedwali la clients (vpn_ip) na token zinazosubiri.
 */
export async function allocateVpnIp(subnetPrefix?: string): Promise<string> {
  const cfg = await getWireguardConfig();
  const prefix = subnetPrefix || cfg.subnetPrefix;

  const used = new Set<string>();

  // IP zilizotumika na router zilizosajiliwa
  const existing = await db
    .select({ vpnIp: clients.vpnIp })
    .from(clients)
    .where(isNotNull(clients.vpnIp));
  for (const row of existing) {
    if (row.vpnIp) used.add(row.vpnIp);
  }

  // IP zilizotengwa kwa token zinazosubiri
  const pending = await db
    .select({ ip: connectionTokens.assignedVpnIp })
    .from(connectionTokens)
    .where(eq(connectionTokens.status, "pending"));
  for (const row of pending) {
    used.add(row.ip);
  }

  // Tafuta namba huru kuanzia .2 hadi .254
  for (let i = 2; i <= 254; i++) {
    const candidate = `${prefix}.${i}`;
    if (!used.has(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `IP zote za VPN zimetumika (${prefix}.2 - ${prefix}.254). Ongeza mtandao mwingine.`
  );
}

/**
 * Kuzalisha command ya MikroTik ambayo mteja atanakili.
 * Inapata funguo za seva kutoka mipangilio (DB au env).
 */
export async function buildMikrotikCommand(opts: {
  token: string;
  vpnIp: string;
}): Promise<{ command: string; cfg: Awaited<ReturnType<typeof getWireguardConfig>> }> {
  const { token, vpnIp } = opts;
  const cfg = await getWireguardConfig();
  const appUrl = getAppUrl();
  const callback = `${appUrl}/api/connect/activate`;
  const fetchMode = appUrl.startsWith("https://") ? "https" : "http";

  const command = `# ============================================================
#  ${cfg.businessName.toUpperCase()} — Command ya Kuunganisha Router
#  NAKILI MISTARI YOTE, kisha bandika kwenye WinBox → New Terminal
# ============================================================

# 1. Tengeneza interface ya WireGuard
/interface wireguard add name=wg-saidzen listen-port=${cfg.port}

# 2. Weka anwani yako ya VPN (imetengwa na seva — USIIBADILISHE)
/ip address add address=${vpnIp}/24 interface=wg-saidzen

# 3. Unganisha na seva ya SaidZen
/interface wireguard peers add interface=wg-saidzen \\
  public-key="${cfg.publicKey}" \\
  endpoint-address=${cfg.endpoint} \\
  endpoint-port=${cfg.port} \\
  allowed-address=${cfg.subnetPrefix}.0/24 \\
  persistent-keepalive=25

# 4. Washa API ya MikroTik kupitia VPN pekee
/ip service set api disabled=no port=8728 address=${cfg.subnetPrefix}.0/24

# 5. Jisajili kwenye tovuti (inajifanya yenyewe)
/tool fetch url="${callback}" http-method=post \\
  http-data="token=${token}&vpnIp=${vpnIp}" \\
  mode=${fetchMode} as-value output=user

# ============================================================
#  IMEKAMILIKA! Rudi kwenye tovuti kuona hali ya muunganisho.
#  Ukiona hitilafu ya DNS kwenye hatua ya 5, subiri sekunde 10.
# ============================================================`;

  return { command, cfg };
}

/**
 * Command kwa router yenye IP ya umma (bila VPN)
 */
export async function buildDirectApiCommand(opts: {
  token: string;
  routerIp: string;
  autoDetect?: boolean;
}): Promise<{ command: string; cfg: Awaited<ReturnType<typeof getWireguardConfig>> }> {
  const cfg = await getWireguardConfig();
  const appUrl = getAppUrl();
  const callback = `${appUrl}/api/connect/activate`;
  const fetchMode = appUrl.startsWith("https://") ? "https" : "http";

  const detection = opts.autoDetect
    ? `:local rosVersion [/system resource get version]
:local rosBoard [/system resource get board-name]
:local rosIdentity [/system identity get name]`
    : "";
  const payload = opts.autoDetect
    ? `token=${opts.token}&mode=auto&routerIp=${opts.routerIp}&routerOsVersion=$rosVersion&routerBoard=$rosBoard&routerIdentity=$rosIdentity`
    : `token=${opts.token}&mode=direct&routerIp=${opts.routerIp}`;

  const command = `# ============================================================
#  ${cfg.businessName.toUpperCase()} — Kuunganisha kwa IP ya Umma
#  NAKILI MISTARI YOTE, kisha bandika kwenye WinBox → New Terminal
# ============================================================

# 1. Tambua aina ya MikroTik na washa API
${detection}
/ip service set api disabled=no port=8728

# 2. Ruhusu API kwa muda wa usajili (ifunge baada ya kuunganishwa)
/ip firewall filter add chain=input protocol=tcp dst-port=8728 action=accept comment="SaidZen API - temporary" disabled=no

# 3. Jisajili kwenye tovuti
/tool fetch url="${callback}" http-method=post \\
  http-data="${payload}" \\
  mode=${fetchMode} as-value output=user

# ============================================================
#  KUMBUKA: RouterOS 6 haina WireGuard.
#  IP ya ndani inafanya kazi ikiwa website iko kwenye LAN hiyo.
#  Kwa Vercel, tumia Public IP/port-forward au VPN kwa API ya 8728.
#  Baada ya kuunganishwa, zima rule ya muda:
#  /ip firewall filter disable [find comment="SaidZen API - temporary"]
# ============================================================`;

  return { command, cfg };
}

/**
 * Kuunda token ya kipekee ya usajili
 */
export function generateConnectToken(): string {
  const crypto = require("crypto") as typeof import("crypto");
  return `sz_${crypto.randomBytes(24).toString("hex")}`;
}
