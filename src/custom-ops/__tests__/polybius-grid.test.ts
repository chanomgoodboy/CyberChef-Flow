import { describe, it, expect } from 'vitest';
import PolybiusCipherEncode from '../ciphers/PolybiusCipherEncode';
import PolybiusCipherDecode from '../ciphers/PolybiusCipherDecode';
import ADFGXCipherEncode from '../ciphers/ADFGXCipherEncode';
import ADFGXCipherDecode from '../ciphers/ADFGXCipherDecode';
import ADFGVXCipherEncode from '../ciphers/ADFGVXCipherEncode';
import ADFGVXCipherDecode from '../ciphers/ADFGVXCipherDecode';
import NihilistCipherEncode from '../ciphers/NihilistCipherEncode';
import NihilistCipherDecode from '../ciphers/NihilistCipherDecode';

describe('Polybius Square', () => {
  it('encode then decode roundtrip', () => {
    const enc = new PolybiusCipherEncode();
    const dec = new PolybiusCipherDecode();
    // Note: J→I during encode, so we test with text that has no J
    const plain = 'HELLOWORLD';
    const cipher = enc.run(plain, ['', ' ']);
    const result = dec.run(cipher, ['', ' ']);
    expect(result).toBe(plain);
  });

  it('encodes to digit pairs', () => {
    const enc = new PolybiusCipherEncode();
    // Default grid (no keyword): ABCDE/FGHIK/LMNOP/QRSTU/VWXYZ
    // A → row 1, col 1 → "11"
    const result = enc.run('A', ['', ' ']);
    expect(result).toBe('11');
  });

  it('handles keyword', () => {
    const enc = new PolybiusCipherEncode();
    const dec = new PolybiusCipherDecode();
    const plain = 'TEST';
    const cipher = enc.run(plain, ['KEYWORD', ' ']);
    const result = dec.run(cipher, ['KEYWORD', ' ']);
    expect(result).toBe(plain);
  });
});

describe('ADFGX Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new ADFGXCipherEncode();
    const dec = new ADFGXCipherDecode();
    const plain = 'ATTACK';
    const cipher = enc.run(plain, ['', 'CARGO']);
    const result = dec.run(cipher, ['', 'CARGO']);
    expect(result).toBe(plain);
  });

  it('output contains only ADFGX characters', () => {
    const enc = new ADFGXCipherEncode();
    const cipher = enc.run('HELLO', ['', 'KEY']);
    // After columnar transposition, output + any padding should only have ADFGX
    expect(cipher).toMatch(/^[ADFGX]+$/);
  });
});

describe('ADFGVX Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new ADFGVXCipherEncode();
    const dec = new ADFGVXCipherDecode();
    const plain = 'ATTACK123';
    const cipher = enc.run(plain, ['', 'PRIVACY']);
    const result = dec.run(cipher, ['', 'PRIVACY']);
    expect(result).toBe(plain);
  });

  it('handles digits', () => {
    const enc = new ADFGVXCipherEncode();
    const cipher = enc.run('TEST42', ['', 'KEY']);
    expect(cipher).toMatch(/^[ADFGVX]+$/);
  });
});

describe('Nihilist Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new NihilistCipherEncode();
    const dec = new NihilistCipherDecode();
    const plain = 'ATTACKATDAWN';
    const cipher = enc.run(plain, ['', 'RUSSIAN', ' ']);
    const result = dec.run(cipher, ['', 'RUSSIAN', ' ']);
    expect(result).toBe(plain);
  });

  it('output is space-separated numbers', () => {
    const enc = new NihilistCipherEncode();
    const cipher = enc.run('HELLO', ['', 'KEY', ' ']);
    const nums = cipher.split(' ').map(Number);
    expect(nums.every((n) => !isNaN(n) && n > 10)).toBe(true);
  });
});
