import { describe, it, expect } from 'vitest';
import FourSquareCipherEncode from '../ciphers/FourSquareCipherEncode';
import FourSquareCipherDecode from '../ciphers/FourSquareCipherDecode';
import TwoSquareCipherEncode from '../ciphers/TwoSquareCipherEncode';
import TwoSquareCipherDecode from '../ciphers/TwoSquareCipherDecode';

describe('Four-Square Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new FourSquareCipherEncode();
    const dec = new FourSquareCipherDecode();
    const plain = 'HELPMEOBIWANKENOBI';
    const cipher = enc.run(plain, ['EXAMPLE', 'KEYWORD']);
    const result = dec.run(cipher, ['EXAMPLE', 'KEYWORD']);
    expect(result).toBe(plain);
  });

  it('roundtrips with known plaintext', () => {
    const enc = new FourSquareCipherEncode();
    const dec = new FourSquareCipherDecode();
    const result = dec.run(enc.run('HELPMEOBIWANKENOBI', ['EXAMPLE', 'KEYWORD']), ['EXAMPLE', 'KEYWORD']);
    expect(result).toBe('HELPMEOBIWANKENOBI');
  });

  it('output has even length', () => {
    const enc = new FourSquareCipherEncode();
    const cipher = enc.run('HELLO', ['KEY1', 'KEY2']);
    expect(cipher.length % 2).toBe(0);
  });
});

describe('Two-Square Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new TwoSquareCipherEncode();
    const dec = new TwoSquareCipherDecode();
    const plain = 'HELLOWORLD';
    const cipher = enc.run(plain, ['EXAMPLE', 'KEYWORD']);
    const result = dec.run(cipher, ['EXAMPLE', 'KEYWORD']);
    expect(result).toBe(plain);
  });

  it('output has even length', () => {
    const enc = new TwoSquareCipherEncode();
    const cipher = enc.run('HELLO', ['KEY1', 'KEY2']);
    expect(cipher.length % 2).toBe(0);
  });

  it('roundtrips with different keywords', () => {
    const enc = new TwoSquareCipherEncode();
    const dec = new TwoSquareCipherDecode();
    const plain = 'TESTTESTTEST';
    const result = dec.run(enc.run(plain, ['ALPHA', 'BRAVO']), ['ALPHA', 'BRAVO']);
    // Input is 12 chars (even), so no padding added
    expect(result).toBe(plain);
  });
});
