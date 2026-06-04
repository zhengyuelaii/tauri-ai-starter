import * as crypto from 'node:crypto';

const SEED = 'nativai-template-settings-key-v1';
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const ITERATIONS = 100_000;

function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(SEED, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

export function generateSalt(): string {
  return crypto.randomBytes(SALT_LENGTH).toString('hex');
}

export function encrypt(
  plaintext: string,
  saltHex: string,
): { encrypted: string; iv: string; tag: string } {
  const salt = Buffer.from(saltHex, 'hex');
  const key = deriveKey(salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return { encrypted, iv: iv.toString('hex'), tag };
}

export function decrypt(
  encrypted: string,
  ivHex: string,
  saltHex: string,
  tagHex: string,
): string {
  const salt = Buffer.from(saltHex, 'hex');
  const key = deriveKey(salt);
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
