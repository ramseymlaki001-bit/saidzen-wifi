export type RouterPayload = Record<string, unknown>;

function parseJson(raw: string): RouterPayload | undefined {
  try {
    const value: unknown = JSON.parse(raw);
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as RouterPayload;
    }
  } catch {
    // Fall through to form and raw-text parsing.
  }
  return undefined;
}

export function parseRouterPayload(raw: string, contentType: string | null): RouterPayload {
  const trimmed = raw.trim();
  if (!trimmed) return {};

  if (contentType?.toLowerCase().includes("application/json") || trimmed.startsWith("{")) {
    const json = parseJson(trimmed);
    if (json) return json;
  }

  const form = Object.fromEntries(new URLSearchParams(raw).entries());
  if (Object.keys(form).length > 0) return form;

  return { raw: trimmed };
}

export function readRouterString(payload: RouterPayload, key: string): string {
  const value = payload[key];
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

export function readRouterBoolean(payload: RouterPayload, key: string): boolean {
  const value = payload[key];
  return value === true || ["true", "1", "yes", "ok"].includes(String(value).toLowerCase());
}
