import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Anwani ya tovuti (inatumika na router kujiandikisha) */
export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/**
 * MIPANGILIO YA MFUMO
 *
 * Thamani zinaweza kutoka sehemu mbili (DB inashinda env):
 *   1. Jedwali la system_settings — admin anaweka kutoka UI
 *   2. Environment variables (.env)
 *
 * Hii inamruhusu admin kuweka funguo za WireGuard kutoka kwenye dashibodi,
 * bila haja ya kuingia kwenye seva kuhariri .env na kuanzisha upya.
 */

export type SettingKey =
  | "WIREGUARD_SERVER_PUBLIC_KEY"
  | "WIREGUARD_SERVER_ENDPOINT"
  | "WIREGUARD_PORT"
  | "WIREGUARD_SUBNET_PREFIX"
  | "HOTSPOT_LOGIN_URL"
  | "BUSINESS_PHONE"
  | "BUSINESS_NAME";

/** Kusoma thamani moja (DB kwanza, kisha env) */
export async function getSetting(key: SettingKey): Promise<string> {
  try {
    const [row] = await db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    if (row?.value) return row.value;
  } catch {
    // jedwali halipo bado — tumia env
  }

  return (process.env[key] || "").trim();
}

/** Kusoma thamani zote muhimu kwa pamoja */
export async function getWireguardConfig() {
  const [publicKey, endpoint, portStr, subnetPrefix, loginUrl, phone, businessName] =
    await Promise.all([
      getSetting("WIREGUARD_SERVER_PUBLIC_KEY"),
      getSetting("WIREGUARD_SERVER_ENDPOINT"),
      getSetting("WIREGUARD_PORT"),
      getSetting("WIREGUARD_SUBNET_PREFIX"),
      getSetting("HOTSPOT_LOGIN_URL"),
      getSetting("BUSINESS_PHONE"),
      getSetting("BUSINESS_NAME"),
    ]);

  const port = parseInt(portStr || process.env.WIREGUARD_PORT || "51820", 10) || 51820;

  // Thamani halisi (si placeholder)
  const publicKeySet =
    publicKey.length > 20 && !/weka|placeholder|your_|chang/i.test(publicKey);
  const endpointSet =
    endpoint.length > 6 && !/ip_ya|placeholder|your_|chang|127\.0\.0\.1|localhost/i.test(endpoint);

  return {
    publicKey,
    endpoint,
    port,
    subnetPrefix: subnetPrefix || process.env.WIREGUARD_SUBNET_PREFIX || "10.8.0",
    hotspotLoginUrl: loginUrl,
    businessPhone: phone || "0777 378 300",
    businessName: businessName || "SaidZen WiFi",
    // Je, seva imesanidiwa kikamilifu?
    configured: publicKeySet && endpointSet,
    publicKeySet,
    endpointSet,
  };
}

/** Kuandika/kusasisha thamani */
export async function setSetting(key: SettingKey, value: string): Promise<void> {
  await db
    .insert(systemSettings)
    .values({ key, value: value.trim() })
    .onDuplicateKeyUpdate({
      set: { value: value.trim(), updatedAt: new Date() },
    });
}
