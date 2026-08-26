import { createCipheriv, createDecipheriv, createHmac, createHash, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';

export function normalizeCpf(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function isValidCpf(value) {
  const cpf = normalizeCpf(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (length) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) sum += Number(cpf[index]) * (length + 1 - index);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

export function hashCpf(value) {
  return createHmac('sha256', env.CPF_HASH_SECRET).update(normalizeCpf(value)).digest('hex');
}

const encryptionKey = createHash('sha256').update(`cpf-encryption:${env.CPF_HASH_SECRET}`).digest();

export function encryptCpf(value) {
  const cpf = normalizeCpf(value);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(cpf, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join(':');
}

export function decryptCpf(value) {
  if (!value) return null;
  try {
    const [version, iv, tag, encrypted] = value.split(':');
    if (version !== 'v1' || !iv || !tag || !encrypted) return null;
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey, Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64url')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

export function formatCpf(value) {
  const cpf = normalizeCpf(value);
  return cpf.length === 11 ? cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4') : null;
}
