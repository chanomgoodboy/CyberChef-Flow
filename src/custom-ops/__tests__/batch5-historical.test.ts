import { describe, it, expect } from 'vitest';

// Historical & Complex Ciphers — Batch 5
import RozierCipherEncode from '../ciphers/RozierCipherEncode';
import RozierCipherDecode from '../ciphers/RozierCipherDecode';
import PeriodicTableEncode from '../ciphers/PeriodicTableEncode';
import PeriodicTableDecode from '../ciphers/PeriodicTableDecode';
import PrimeNumbersCipherEncode from '../ciphers/PrimeNumbersCipherEncode';
import PrimeNumbersCipherDecode from '../ciphers/PrimeNumbersCipherDecode';
import VICCipherEncode from '../ciphers/VICCipherEncode';
import VICCipherDecode from '../ciphers/VICCipherDecode';
import TrithemiusAveMariaEncode from '../ciphers/TrithemiusAveMariaEncode';
import TrithemiusAveMariaDecode from '../ciphers/TrithemiusAveMariaDecode';
import PGPWordListEncode from '../ciphers/PGPWordListEncode';
import PGPWordListDecode from '../ciphers/PGPWordListDecode';
import WabunCodeEncode from '../ciphers/WabunCodeEncode';
import WabunCodeDecode from '../ciphers/WabunCodeDecode';

/* ------------------------------------------------------------------ */
/*  Rozier Cipher                                                      */
/* ------------------------------------------------------------------ */
describe('Rozier Cipher', () => {
  const enc = new RozierCipherEncode();
  const dec = new RozierCipherDecode();

  it('encodes with numeric key', () => {
    // Key 31415: H(+3)=K, E(+1)=F, L(+4)=P, L(+1)=M, O(+5)=T
    expect(enc.run('HELLO', ['31415'])).toBe('KFPMT');
  });

  it('roundtrips', () => {
    const ct = enc.run('ATTACKATDAWN', ['271828']);
    expect(dec.run(ct, ['271828'])).toBe('ATTACKATDAWN');
  });

  it('preserves case', () => {
    const ct = enc.run('Hello World', ['12']);
    expect(dec.run(ct, ['12'])).toBe('Hello World');
  });
});

/* ------------------------------------------------------------------ */
/*  Periodic Table Cipher                                              */
/* ------------------------------------------------------------------ */
describe('Periodic Table Cipher', () => {
  const enc = new PeriodicTableEncode();
  const dec = new PeriodicTableDecode();

  it('decomposes BACON into element symbols', () => {
    const result = enc.run('BACON', ['None']);
    // Should decompose: Ba-C-O-N
    expect(result.toUpperCase()).toContain('BA');
    expect(result.toUpperCase()).toContain('C');
    expect(result.toUpperCase()).toContain('O');
    expect(result.toUpperCase()).toContain('N');
  });

  it('encodes with dash separator', () => {
    const result = enc.run('BACON', ['Dash']);
    expect(result).toContain('-');
  });

  it('decodes numbers to letters', () => {
    expect(dec.run('1 2 3', ['Numbers to letters'])).toBe('ABC');
  });

  it('decodes number 26 to Z', () => {
    expect(dec.run('26', ['Numbers to letters'])).toBe('Z');
  });
});

/* ------------------------------------------------------------------ */
/*  Prime Numbers Cipher                                               */
/* ------------------------------------------------------------------ */
describe('Prime Numbers Cipher', () => {
  const enc = new PrimeNumbersCipherEncode();
  const dec = new PrimeNumbersCipherDecode();

  it('A=2, Z=101', () => {
    const result = enc.run('AZ', ['Space']);
    expect(result).toBe('2 101');
  });

  it('roundtrips ABC', () => {
    const encoded = enc.run('ABC', ['Space']);
    expect(encoded).toBe('2 3 5');
    expect(dec.run(encoded, ['Space'])).toBe('ABC');
  });

  it('handles word separator', () => {
    const encoded = enc.run('HI THERE', ['Space']);
    expect(encoded).toContain('/');
    expect(dec.run(encoded, ['Auto'])).toBe('HI THERE');
  });
});

/* ------------------------------------------------------------------ */
/*  VIC Cipher                                                         */
/* ------------------------------------------------------------------ */
describe('VIC Cipher', () => {
  const enc = new VICCipherEncode();
  const dec = new VICCipherDecode();

  it('roundtrips with default parameters', () => {
    const ct = enc.run('HELLO', ['ASINTOER', '26', 'SECRET']);
    const pt = dec.run(ct, ['ASINTOER', '26', 'SECRET']);
    expect(pt).toBe('HELLO');
  });

  it('roundtrips longer text', () => {
    const ct = enc.run('ATTACKATDAWN', ['KEYWORD', '37', 'CIPHER']);
    const pt = dec.run(ct, ['KEYWORD', '37', 'CIPHER']);
    expect(pt).toBe('ATTACKATDAWN');
  });

  it('works without transposition key', () => {
    const ct = enc.run('TEST', ['ASINTOER', '26', '']);
    // Without transposition, output should be pure digits
    expect(/^\d+$/.test(ct)).toBe(true);
    const pt = dec.run(ct, ['ASINTOER', '26', '']);
    expect(pt).toBe('TEST');
  });
});

/* ------------------------------------------------------------------ */
/*  Trithemius Ave Maria                                               */
/* ------------------------------------------------------------------ */
describe('Trithemius Ave Maria', () => {
  const enc = new TrithemiusAveMariaEncode();
  const dec = new TrithemiusAveMariaDecode();

  it('encodes A as Deus', () => {
    expect(enc.run('A', [])).toBe('Deus');
  });

  it('encodes ABC', () => {
    expect(enc.run('ABC', [])).toBe('Deus clemens creator');
  });

  it('roundtrips', () => {
    const ct = enc.run('HELLO', []);
    const pt = dec.run(ct, []);
    expect(pt).toBe('HELLO');
  });

  it('handles spaces as word separator', () => {
    const ct = enc.run('HI THERE', []);
    expect(ct).toContain('/');
    const pt = dec.run(ct, []);
    expect(pt).toBe('HI THERE');
  });
});

/* ------------------------------------------------------------------ */
/*  PGP Word List                                                      */
/* ------------------------------------------------------------------ */
describe('PGP Word List', () => {
  const enc = new PGPWordListEncode();
  const dec = new PGPWordListDecode();

  it('encodes hex byte 00 as aardvark (even position)', () => {
    expect(enc.run('00', ['Hex'])).toBe('aardvark');
  });

  it('encodes hex bytes E5 82', () => {
    // E5 = 229 (even pos) → PGP_EVEN[229] = 'vacancy'
    // 82 = 130 (odd pos) → PGP_ODD[130] = 'matchmaker'
    const result = enc.run('E582', ['Hex']);
    const words = result.split(' ');
    expect(words.length).toBe(2);
  });

  it('roundtrips hex', () => {
    const words = enc.run('DEADBEEF', ['Hex']);
    const hex = dec.run(words, ['Hex']);
    expect(hex).toBe('DE AD BE EF');
  });

  it('roundtrips single byte', () => {
    const words = enc.run('FF', ['Hex']);
    const hex = dec.run(words, ['Hex']);
    expect(hex).toBe('FF');
  });
});

/* ------------------------------------------------------------------ */
/*  Wabun Code                                                         */
/* ------------------------------------------------------------------ */
describe('Wabun Code', () => {
  const enc = new WabunCodeEncode();
  const dec = new WabunCodeDecode();

  it('encodes kana イ as .-', () => {
    expect(enc.run('イ', ['Kana'])).toBe('.-');
  });

  it('encodes multiple kana', () => {
    const result = enc.run('イロハ', ['Kana']);
    expect(result).toBe('.- .-.- -...');
  });

  it('roundtrips kana', () => {
    const ct = enc.run('イロハ', ['Kana']);
    const pt = dec.run(ct, ['Kana']);
    expect(pt).toBe('イロハ');
  });

  it('encodes romaji', () => {
    const result = enc.run('A I U', ['Romaji']);
    // A→ア, I→イ, U→ウ with spaces as /
    expect(result).toContain('/');
  });
});
