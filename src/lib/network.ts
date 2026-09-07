import { isIP } from "node:net";

export function isPrivateIPv4(value: string): boolean {
  if (isIP(value) !== 4) return false;

  const octets = value.split(".").map(Number);
  return (
    octets[0] === 10 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  );
}

export function isNonHostIPv4(value: string): boolean {
  if (isIP(value) !== 4) return false;
  const lastOctet = Number(value.split(".")[3]);
  return lastOctet === 0 || lastOctet === 255;
}
