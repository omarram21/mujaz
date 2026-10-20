import {
  CODE_ALPHABET,
  checksum,
  generateVerificationCode,
  isValidVerificationCode,
  normalizeVerificationCode,
} from '../verificationCode';

describe('verification codes', () => {
  it('generates well-formed codes with a valid checksum', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateVerificationCode();
      expect(code).toMatch(/^MJZ-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
      expect(isValidVerificationCode(code)).toBe(true);
    }
  });

  it('never uses look-alike characters', () => {
    expect(CODE_ALPHABET).not.toMatch(/[01OI]/);
    expect(CODE_ALPHABET).toHaveLength(32);
  });

  it('is deterministic for given random bytes', () => {
    const bytes = () => new Uint8Array([8, 6, 15, 3, 22, 14, 25]);
    expect(generateVerificationCode(bytes)).toBe(generateVerificationCode(bytes));
  });

  it('matches the code seeded in the database (same checksum as SQL)', () => {
    expect(checksum('K7QDXP2')).toBe('2');
    expect(isValidVerificationCode('MJZ-K7QD-XP22')).toBe(true);
  });

  it('detects single-character typos and swaps', () => {
    expect(isValidVerificationCode('MJZ-K7QD-XP23')).toBe(false);
    expect(isValidVerificationCode('MJZ-K7DQ-XP22')).toBe(false);
  });

  it('normalizes user input for lookup', () => {
    expect(normalizeVerificationCode(' mjz k7qd xp22 ')).toBe('MJZ-K7QD-XP22');
    expect(normalizeVerificationCode('k7qdxp22')).toBe('MJZ-K7QD-XP22');
    expect(normalizeVerificationCode('MJZ-K7QD-XP22')).toBe('MJZ-K7QD-XP22');
    expect(normalizeVerificationCode('')).toBe('');
  });

  it('rejects malformed codes', () => {
    expect(isValidVerificationCode('MJZ-K7QD-XP2')).toBe(false);
    expect(isValidVerificationCode('ABC-K7QD-XP22')).toBe(false);
    expect(isValidVerificationCode('MJZ-K0QD-XP22')).toBe(false);
  });
});
