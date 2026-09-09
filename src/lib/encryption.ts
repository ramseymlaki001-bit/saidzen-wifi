import CryptoJS from "crypto-js";

function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY?.trim();
  if (!key || key.length < 32) {
    throw new Error("ENCRYPTION_KEY yenye urefu wa angalau herufi 32 inahitajika");
  }
  return key;
}

/**
 * Kuencrypt password ya MikroTik router kabla ya kuiweka kwenye database.
 * Hii inazuia mtu akivunja database asione passwords za router za wateja.
 */
export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, getEncryptionKey()).toString();
}

/**
 * Kudecrypt password ya MikroTik router kutoka database.
 */
export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, getEncryptionKey());
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Kuencrypt data nzima ya object
 */
export function encryptObj(obj: Record<string, unknown>): string {
  return CryptoJS.AES.encrypt(JSON.stringify(obj), getEncryptionKey()).toString();
}

/**
 * Kudecrypt data nzima ya object
 */
export function decryptObj<T>(ciphertext: string): T | null {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, getEncryptionKey());
    const json = bytes.toString(CryptoJS.enc.Utf8);
    if (!json) return null;
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
