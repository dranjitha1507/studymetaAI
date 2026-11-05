import crypto from 'node:crypto';

/**
 * Secure password hashing using Node.js crypto scrypt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

export function hashSecurityAnswer(answer: string): string {
  const normalized = answer.trim().toLowerCase();
  return hashPassword(normalized);
}

export function verifySecurityAnswer(answer: string, storedHash: string): boolean {
  const normalized = answer.trim().toLowerCase();
  return verifyPassword(normalized, storedHash);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
