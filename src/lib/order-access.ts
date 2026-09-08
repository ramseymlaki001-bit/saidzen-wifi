import crypto from "crypto";

function getOrderAccessSecret(): string {
  const secret = process.env.ORDER_ACCESS_SECRET || process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("ORDER_ACCESS_SECRET haijawekwa");
  }
  return secret;
}

export function createOrderAccessToken(orderId: number): string {
  const value = String(orderId);
  const signature = crypto
    .createHmac("sha256", getOrderAccessSecret())
    .update(value)
    .digest("hex");
  return `${value}.${signature}`;
}

export function verifyOrderAccessToken(token: string, orderId: number): boolean {
  const [value, signature] = token.split(".");
  if (value !== String(orderId) || !/^[a-f0-9]{64}$/.test(signature || "")) {
    return false;
  }

  const expected = createOrderAccessToken(orderId).split(".")[1];
  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expected, "hex")
  );
}