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

function buildHotspotSetupCommand(appUrl: string): string {
  const appHost = new URL(appUrl).hostname;
  return `# 3. Sanidi Hotspot ili mteja asitumie internet bure
:local hsInterface "";
:foreach bridgeId in=[/interface bridge find] do={ :set hsInterface [/interface bridge get $bridgeId name] };
:if ([:len $hsInterface] = 0) do={ :set hsInterface "bridge" };

:if ([:len [/ip hotspot profile find name="saidzen-profile"]] = 0) do={
  /ip hotspot profile add name=saidzen-profile login-by=http-chap,http-pap
};
:if ([:len [/ip hotspot user profile find name="Saa_1"]] = 0) do={
  /ip hotspot user profile add name=Saa_1 rate-limit=2M/2M session-timeout=1h
};
:if ([:len [/ip hotspot user profile find name="Saa_2"]] = 0) do={
  /ip hotspot user profile add name=Saa_2 rate-limit=3M/3M session-timeout=2h
};
:if ([:len [/ip hotspot user profile find name="Saa_6"]] = 0) do={
  /ip hotspot user profile add name=Saa_6 rate-limit=4M/4M session-timeout=6h
};
:if ([:len [/ip hotspot user profile find name="Saa_24"]] = 0) do={
  /ip hotspot user profile add name=Saa_24 rate-limit=5M/5M session-timeout=24h
};
:if ([:len [/ip hotspot user profile find name="Wiki_1"]] = 0) do={
  /ip hotspot user profile add name=Wiki_1 rate-limit=5M/5M session-timeout=7d
};
:if ([:len [/ip hotspot find name="saidzen-hotspot"]] = 0) do={
  /ip hotspot add name=saidzen-hotspot interface=$hsInterface profile=saidzen-profile address-pool=none disabled=no
} else={
  /ip hotspot enable [find name="saidzen-hotspot"]
};
:if ([:len [/ip hotspot walled-garden find dst-host="${appHost}"]] = 0) do={
  /ip hotspot walled-garden add dst-host="${appHost}" action=allow
};`;
}

function buildPushSetupCommand(appUrl: string, token: string, fetchMode: string): string {
  const endpoint = `${appUrl}/api/router/push`;
  const syncEndpoint = `${appUrl}/api/router/sync`;
  return `# 7. Weka outbound push na local offline queue
/system script remove [find name="saidzen-queue-sync"]
/system script add name="saidzen-queue-sync" policy=read,write,test source={
  :local queuePrefix "saidzen-q-"
  :local identity [/system identity get name]
  :local users [/ip hotspot active print count-only]
  :local eventId ("evt-" . [:pick "${token}" 4 12] . "-" . [/system resource get uptime])
  :local fileName ($queuePrefix . $eventId . ".txt")
  :local queued 0
  :foreach existingId in=[/file find] do={
    :local existingName [/file get $existingId name]
    :if ([:pick $existingName 0 [:len $queuePrefix]] = $queuePrefix) do={ :set queued ($queued + 1) }
  }
  :if (($queued < 100) and ([:len [/file find name=$fileName]] = 0)) do={
    /file add name=$fileName contents=("eventId=" . $eventId . "&type=heartbeat&payload=" . $users . "|" . $identity)
  }
  :foreach fileId in=[/file find] do={
    :local name [/file get $fileId name]
    :if ([:pick $name 0 [:len $queuePrefix]] = $queuePrefix) do={
      :local data [/file get $fileId contents]
      :do {
        :local response [/tool fetch url="${syncEndpoint}" http-method=post http-data=("token=${token}&" . $data) mode=${fetchMode} as-value output=user]
        :if (($response->"status") = "finished") do={ /file remove $fileId }
      } on-error={}
    }
  }
}
/system scheduler remove [find name="saidzen-queue-sync"]
/system scheduler add name="saidzen-queue-sync" interval=00:00:30 on-event="/system script run saidzen-queue-sync"
/system script run saidzen-queue-sync

# 8. Weka outbound push: router ndiyo huanzisha mawasiliano
/system script remove [find name="saidzen-push"]
/system script add name="saidzen-push" policy=read,write,test source={
  :local response [/tool fetch url="${endpoint}" http-method=post http-data="token=${token}" mode=${fetchMode} as-value output=user]
  :local script ($response->"data")
  :if ([:len $script] > 0) do={ :execute [:parse $script] }
}
/system scheduler remove [find name="saidzen-push"]
/system scheduler add name="saidzen-push" interval=00:00:30 on-event="/system script run saidzen-push"
/system script run saidzen-push`;
}

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

${buildHotspotSetupCommand(appUrl)}

# 6. Jisajili kwenye tovuti (inajifanya yenyewe)
/tool fetch url="${callback}" http-method=post \\
  http-data="token=${token}&vpnIp=${vpnIp}" \\
  mode=${fetchMode} as-value output=user

${buildPushSetupCommand(appUrl, token, fetchMode)}

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

# 1. Tambua taarifa za MikroTik (hakuna inbound API inayofunguliwa)
${detection}

${buildHotspotSetupCommand(appUrl)}

# 3. Jisajili kwenye tovuti
/tool fetch url="${callback}" http-method=post \\
  http-data="${payload}" \\
  mode=${fetchMode} as-value output=user

${buildPushSetupCommand(appUrl, opts.token, fetchMode)}

# ============================================================
#  KUMBUKA: RouterOS 6 haina WireGuard; outbound push bado inafanya kazi.
#  Hakuna API ya MikroTik inayohitaji kufunguliwa kwenye internet.
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
