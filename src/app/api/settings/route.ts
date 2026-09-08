import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getWireguardConfig, setSetting, type SettingKey } from "@/lib/settings";
import { isSimulation } from "@/lib/mikrotik";
import { getConnectionInfo } from "@/db";

const ALLOWED_KEYS: SettingKey[] = [
  "WIREGUARD_SERVER_PUBLIC_KEY",
  "WIREGUARD_SERVER_ENDPOINT",
  "WIREGUARD_PORT",
  "WIREGUARD_SUBNET_PREFIX",
  "HOTSPOT_LOGIN_URL",
  "BUSINESS_PHONE",
  "BUSINESS_NAME",
];

/** Kusoma mipangilio ya seva */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cfg = await getWireguardConfig();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return NextResponse.json({
      success: true,
      config: {
        publicKeySet: cfg.publicKeySet,
        endpointSet: cfg.endpointSet,
        configured: cfg.configured,
        endpoint: cfg.endpointSet ? cfg.endpoint : "",
        publicKeyPreview: cfg.publicKeySet
          ? `${cfg.publicKey.slice(0, 8)}...${cfg.publicKey.slice(-4)}`
          : "",
        port: cfg.port,
        subnetPrefix: cfg.subnetPrefix,
        hotspotLoginUrl: cfg.hotspotLoginUrl,
        businessPhone: cfg.businessPhone,
        businessName: cfg.businessName,
        appUrl,
        // Hali ya mfumo — admin aone wazi kama ni majaribio au uzalishaji
        mikrotikSimulation: isSimulation(),
        database: getConnectionInfo(),
        cronSecretSet: Boolean(process.env.CRON_SECRET),
        encryptionKeyConfigured: Boolean(process.env.ENCRYPTION_KEY),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** Kuweka mipangilio ya seva */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Admin pekee anaweza kubadilisha mipangilio" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates = body.updates as Record<string, string> | undefined;

    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        { error: "Tuma 'updates' kama object ya key/value" },
        { status: 400 }
      );
    }

    const saved: string[] = [];
    const rejected: string[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (!ALLOWED_KEYS.includes(key as SettingKey)) {
        rejected.push(key);
        continue;
      }
      await setSetting(key as SettingKey, String(value));
      saved.push(key);
    }

    if (saved.length === 0) {
      return NextResponse.json(
        { error: "Hakuna kigezo halali kilichotumwa", rejected },
        { status: 400 }
      );
    }

    // Soma tena ili kupata hali mpya
    const cfg = await getWireguardConfig();

    return NextResponse.json({
      success: true,
      saved,
      rejected,
      message: `Mipangilio ${saved.length} imehifadhiwa. Command mpya zitatumia thamani hizi.`,
      nowConfigured: cfg.configured,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kosa la ndani";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
