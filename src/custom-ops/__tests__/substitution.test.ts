import { describe, it, expect } from 'vitest';
import KeywordCipherEncode from '../ciphers/KeywordCipherEncode';
import KeywordCipherDecode from '../ciphers/KeywordCipherDecode';
import MultiplicativeCipherEncode from '../ciphers/MultiplicativeCipherEncode';
import MultiplicativeCipherDecode from '../ciphers/MultiplicativeCipherDecode';
import PigpenCipherEncode from '../ciphers/PigpenCipherEncode';
import PigpenCipherDecode from '../ciphers/PigpenCipherDecode';
import TapCodeEncode from '../ciphers/TapCodeEncode';
import TapCodeDecode from '../ciphers/TapCodeDecode';

describe('Keyword Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new KeywordCipherEncode();
    const dec = new KeywordCipherDecode();
    const plain = 'HELLOWORLD';
    const cipher = enc.run(plain, ['KRYPTOS']);
    const result = dec.run(cipher, ['KRYPTOS']);
    expect(result).toBe(plain);
  });

  it('KRYPTOS keyword produces correct substitution', () => {
    const enc = new KeywordCipherEncode();
    // Keyword KRYPTOS → alphabet: K R Y P T O S A B C D E F G H I J L M N Q U V W X Z
    // A→K, B→R, C→Y, D→P, ...
    const result = enc.run('ABC', ['KRYPTOS']);
    expect(result).toBe('KRY');
  });

  it('preserves case', () => {
    const enc = new KeywordCipherEncode();
    const result = enc.run('Hello', ['KEY']);
    expect(result[0]).toMatch(/[A-Z]/);
    expect(result[1]).toMatch(/[a-z]/);
  });
});

describe('Multiplicative Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new MultiplicativeCipherEncode();
    const dec = new MultiplicativeCipherDecode();
    const plain = 'HELLOWORLD';
    const cipher = enc.run(plain, [7]);
    const result = dec.run(cipher, [7]);
    expect(result).toBe(plain);
  });

  it('multiplier 1 is identity', () => {
    const enc = new MultiplicativeCipherEncode();
    const result = enc.run('ABCXYZ', [1]);
    expect(result).toBe('ABCXYZ');
  });

  it('throws on non-coprime key', () => {
    const dec = new MultiplicativeCipherDecode();
    expect(() => dec.run('TEST', [13])).toThrow(/coprime/);
  });
});

describe('Pigpen Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new PigpenCipherEncode();
    const dec = new PigpenCipherDecode();
    const plain = 'HELLO';
    const cipher = enc.run(plain, []);
    const result = dec.run(cipher, []);
    expect(result).toBe(plain);
  });

  it('encodes all 26 letters', () => {
    const enc = new PigpenCipherEncode();
    const dec = new PigpenCipherDecode();
    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const cipher = enc.run(alpha, []);
    const result = dec.run(cipher, []);
    expect(result).toBe(alpha);
  });
});

describe('Tap Code', () => {
  it('encode then decode roundtrip', () => {
    const enc = new TapCodeEncode();
    const dec = new TapCodeDecode();
    const plain = 'WATER'; // no K or J
    const cipher = enc.run(plain, ['.', ' ', '  ']);
    const result = dec.run(cipher, ['.', ' ', '  ']);
    expect(result).toBe(plain);
  });

  it('K maps to C', () => {
    const enc = new TapCodeEncode();
    const cipherK = enc.run('K', ['.', ' ', '  ']);
    const cipherC = enc.run('C', ['.', ' ', '  ']);
    expect(cipherK).toBe(cipherC);
  });

  it('encodes A as 1,1 taps', () => {
    const enc = new TapCodeEncode();
    const result = enc.run('A', ['.', ' ', '  ']);
    expect(result).toBe('. .');
  });
});
