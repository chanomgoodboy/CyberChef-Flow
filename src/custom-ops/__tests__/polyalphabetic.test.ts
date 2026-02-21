import { describe, it, expect } from 'vitest';
import BeaufortCipher from '../ciphers/BeaufortCipher';
import GronsfeldCipherEncode from '../ciphers/GronsfeldCipherEncode';
import GronsfeldCipherDecode from '../ciphers/GronsfeldCipherDecode';
import TrithemiusCipherEncode from '../ciphers/TrithemiusCipherEncode';
import TrithemiusCipherDecode from '../ciphers/TrithemiusCipherDecode';
import PortaCipher from '../ciphers/PortaCipher';

describe('Beaufort Cipher', () => {
  it('encrypts correctly', () => {
    const op = new BeaufortCipher();
    // Beaufort with key "FORTIFICATION"
    // "DEFENDTHEEASTWALLOFTHECASTLE" → known ciphertext
    const result = op.run('DEFENDTHEEASTWALLOFTHECASTLE', ['FORTIFICATION']);
    expect(result).toBe('CKMPVCPVWPIWUJOGIUAPVWRIWUUK');
  });

  it('is reciprocal (decrypt = encrypt)', () => {
    const op = new BeaufortCipher();
    const plain = 'HELLOWORLD';
    const cipher = op.run(plain, ['SECRET']);
    const decrypted = op.run(cipher, ['SECRET']);
    expect(decrypted).toBe(plain);
  });

  it('preserves case and non-alpha characters', () => {
    const op = new BeaufortCipher();
    const result = op.run('Hello, World!', ['KEY']);
    // Should preserve comma, space, exclamation, and case pattern
    expect(result).toMatch(/^[A-Z][a-z]+, [A-Z][a-z]+!$/);
  });
});

describe('Gronsfeld Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new GronsfeldCipherEncode();
    const dec = new GronsfeldCipherDecode();
    const plain = 'ATTACKATDAWN';
    const cipher = enc.run(plain, ['31415']);
    const result = dec.run(cipher, ['31415']);
    expect(result).toBe(plain);
  });

  it('encodes with numeric key', () => {
    const enc = new GronsfeldCipherEncode();
    // Key "31415": A+3=D, T+1=U, T+4=X, A+1=B, C+5=H, K+3=N
    const result = enc.run('ATTACK', ['31415']);
    expect(result).toBe('DUXBHN');
  });
});

describe('Trithemius Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new TrithemiusCipherEncode();
    const dec = new TrithemiusCipherDecode();
    const plain = 'HELLOWORLD';
    const cipher = enc.run(plain, []);
    const result = dec.run(cipher, []);
    expect(result).toBe(plain);
  });

  it('encodes correctly (progressive shift)', () => {
    const enc = new TrithemiusCipherEncode();
    // H+0=H, E+1=F, L+2=N, L+3=O, O+4=S
    const result = enc.run('HELLO', []);
    expect(result).toBe('HFNOS');
  });
});

describe('Porta Cipher', () => {
  it('is reciprocal', () => {
    const op = new PortaCipher();
    const plain = 'DEFENDTHEEASTWALLOFTHECASTLE';
    const cipher = op.run(plain, ['FORTIFICATION']);
    const decrypted = op.run(cipher, ['FORTIFICATION']);
    expect(decrypted).toBe(plain);
  });

  it('only swaps between halves', () => {
    const op = new PortaCipher();
    const result = op.run('A', ['A']);
    // A (first half) should map to second half (N-Z range)
    expect(result.charCodeAt(0)).toBeGreaterThanOrEqual('N'.charCodeAt(0));
    expect(result.charCodeAt(0)).toBeLessThanOrEqual('Z'.charCodeAt(0));
  });
});
