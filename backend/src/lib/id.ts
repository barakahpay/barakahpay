import { randomBytes } from 'node:crypto';

/**
 * Generate a random 32-byte hex id (suitable for BytesN<32> in Soroban).
 */
export function generate32ByteHex(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Generate a short random id (16 hex chars).
 */
export function generateShortId(): string {
  return randomBytes(8).toString('hex');
}

/**
 * Generate a UUID v4 style id.
 */
export function generateUuid(): string {
  const b = randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
