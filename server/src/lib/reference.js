import { randomBytes } from 'node:crypto';

// Human-friendly short codes using an unambiguous alphabet (no 0/O/1/I).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Build a reference like "1FI-8K2P4Q" or "PAY-8K2P4Q".
 * @param {string} prefix  e.g. "1FI" or "PAY"
 * @param {number} length  number of random chars after the dash
 */
export function makeReference(prefix, length = 6) {
  const bytes = randomBytes(length);
  let code = '';
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  return `${prefix}-${code}`;
}
