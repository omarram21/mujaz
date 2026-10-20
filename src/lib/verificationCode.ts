/**
 * Ijazah verification codes: MJZ-XXXX-XXXC. 32-symbol alphabet without look-alikes
 * (no 0/O, 1/I); the last character is a checksum so typos are caught before a lookup.
 * Mirrors public.generate_verification_code / public.verification_checksum in SQL.
 */
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PREFIX = 'MJZ';

export function checksum(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i++) sum += (i + 1) * CODE_ALPHABET.indexOf(body[i] ?? '');
  return CODE_ALPHABET[sum % 32] ?? 'A';
}

export function generateVerificationCode(
  random: (n: number) => Uint8Array = defaultRandom,
): string {
  const bytes = random(7);
  let body = '';
  for (let i = 0; i < 7; i++) body += CODE_ALPHABET[(bytes[i] ?? 0) % 32];
  return `${PREFIX}-${body.slice(0, 4)}-${body.slice(4, 7)}${checksum(body)}`;
}

/** Uppercase, strip spaces and punctuation, add the prefix and dashes. */
export function normalizeVerificationCode(input: string): string {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const body = raw.startsWith(PREFIX) ? raw.slice(PREFIX.length) : raw;
  if (body.length !== 8) return body.length ? `${PREFIX}-${body}` : '';
  return `${PREFIX}-${body.slice(0, 4)}-${body.slice(4)}`;
}

export function isValidVerificationCode(code: string): boolean {
  const m = /^MJZ-([A-Z2-9]{4})-([A-Z2-9]{3})([A-Z2-9])$/.exec(code);
  if (!m) return false;
  const body = `${m[1]}${m[2]}`;
  if ([...body, m[3] ?? ''].some((c) => !CODE_ALPHABET.includes(c))) return false;
  return checksum(body) === m[3];
}

function defaultRandom(n: number): Uint8Array {
  const out = new Uint8Array(n);
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (c?.getRandomValues) return c.getRandomValues(out);
  for (let i = 0; i < n; i++) out[i] = Math.floor(Math.random() * 256);
  return out;
}

export function verificationUrl(code: string): string {
  const base = process.env.EXPO_PUBLIC_VERIFY_BASE_URL ?? 'https://mujaz.app/verify';
  return `${base.replace(/\/$/, '')}/${encodeURIComponent(code)}`;
}
