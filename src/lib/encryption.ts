import CryptoJS from "crypto-js";

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "saidzen-default-secret-key-2026";

/**
 * Kuencrypt password ya MikroTik router kabla ya kuiweka kwenye database.
 * Hii inazuia mtu akivunja database asione passwords za router za wateja.
 */
export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

/**
 * Kudecrypt password ya MikroTik router kutoka database.
 */
export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Kuencrypt data nzima ya object
 */
export function encryptObj(obj: Record<string, unknown>): string {
  return CryptoJS.AES.encrypt(JSON.stringify(obj), ENCRYPTION_KEY).toString();
}

/**
 * Kudecrypt data nzima ya object
 */
export function decryptObj<T>(ciphertext: string): T | null {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    const json = bytes.toString(CryptoJS.enc.Utf8);
    if (!json) return null;
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
