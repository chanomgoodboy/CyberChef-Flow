import { describe, it, expect } from 'vitest';
import CollonCipherEncode from '../ciphers/CollonCipherEncode';
import CollonCipherDecode from '../ciphers/CollonCipherDecode';
import DigrafidCipherEncode from '../ciphers/DigrafidCipherEncode';
import DigrafidCipherDecode from '../ciphers/DigrafidCipherDecode';
import ThreeSquareCipherEncode from '../ciphers/ThreeSquareCipherEncode';
import ThreeSquareCipherDecode from '../ciphers/ThreeSquareCipherDecode';

describe('Collon Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new CollonCipherEncode();
    const dec = new CollonCipherDecode();
    const plain = 'HELLO';
    const cipher = enc.run(plain, ['CIPHER', 5]);
    const result = dec.run(cipher, ['CIPHER', 5]);
    expect(result).toBe(plain);
  });

  it('roundtrip with different group size', () => {
    const enc = new CollonCipherEncode();
    const dec = new CollonCipherDecode();
    const plain = 'ATTACK';
    const cipher = enc.run(plain, ['KEY', 3]);
    const result = dec.run(cipher, ['KEY', 3]);
    expect(result).toBe(plain);
  });

  it('output length matches input', () => {
    const enc = new CollonCipherEncode();
    const result = enc.run('HELLO', ['CIPHER', 5]);
    expect(result.length).toBe(5);
  });

  it('produces different output than input', () => {
    const enc = new CollonCipherEncode();
    const result = enc.run('HELLOWORLD', ['SECRET', 5]);
    expect(result).not.toBe('HELLOWORLD');
  });
});

describe('Digrafid Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new DigrafidCipherEncode();
    const dec = new DigrafidCipherDecode();
    const plain = 'HELLOWORLD';
    const cipher = enc.run(plain, ['FIRST', 'SECOND', 3]);
    const result = dec.run(cipher, ['FIRST', 'SECOND', 3]);
    expect(result).toBe(plain);
  });

  it('pads odd-length input', () => {
    const enc = new DigrafidCipherEncode();
    const result = enc.run('HELLO', ['FIRST', 'SECOND', 3]);
    // 5 chars → padded to 6 → 3 pairs → 3 output pairs = 6 chars
    expect(result.length).toBe(6);
  });

  it('produces alphabetic output', () => {
    const enc = new DigrafidCipherEncode();
    const result = enc.run('ATTACK', ['KEY', 'WORD', 3]);
    expect(result).toMatch(/^[A-Z]+$/);
  });
});

describe('Three-Square Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new ThreeSquareCipherEncode();
    const dec = new ThreeSquareCipherDecode();
    const plain = 'HELLOWORLD';
    const cipher = enc.run(plain, ['FIRST', 'SECOND', 'THIRD']);
    const result = dec.run(cipher, ['FIRST', 'SECOND', 'THIRD']);
    expect(result).toBe(plain);
  });

  it('pads odd-length input', () => {
    const enc = new ThreeSquareCipherEncode();
    const result = enc.run('HELLO', ['A', 'B', 'C']);
    // 5 chars → padded to 6 → produces 6 chars
    expect(result.length).toBe(6);
  });

  it('output is all uppercase alpha', () => {
    const enc = new ThreeSquareCipherEncode();
    const result = enc.run('TESTMESSAGE', ['KEY', 'WORD', 'PHRASE']);
    expect(result).toMatch(/^[A-Z]+$/);
  });

  it('roundtrip preserves content', () => {
    const enc = new ThreeSquareCipherEncode();
    const dec = new ThreeSquareCipherDecode();
    const plain = 'THEQUICKBROWNFOX';
    const cipher = enc.run(plain, ['ALPHA', 'BRAVO', 'CHARLIE']);
    const result = dec.run(cipher, ['ALPHA', 'BRAVO', 'CHARLIE']);
    expect(result).toBe(plain);
  });
});
