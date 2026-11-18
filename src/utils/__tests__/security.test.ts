import { describe, it, expect } from 'vitest';
import { hashPin, verifyPin, INITIAL_PIN_HASH } from '../security';

describe('PIN Security Utility', () => {
  it('computes consistent 64-character salted SHA-256 hash', async () => {
    const hash = await hashPin('1234');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(64);
  });

  it('generates different hashes for different inputs', async () => {
    const hashA = await hashPin('1111');
    const hashB = await hashPin('2222');
    expect(hashA).not.toBe(hashB);
  });

  it('rejects incorrect dummy PINs', async () => {
    const wrong1 = await verifyPin('0000');
    const wrong2 = await verifyPin('1234');
    const wrong3 = await verifyPin('7777');
    expect(wrong1).toBe(false);
    expect(wrong2).toBe(false);
    expect(wrong3).toBe(false);
  });
});
