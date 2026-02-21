import { describe, it, expect } from 'vitest';
import ScreamCipherEncode from '../ciphers/ScreamCipherEncode';
import ScreamCipherDecode from '../ciphers/ScreamCipherDecode';
import UnicodeShiftEncode from '../ciphers/UnicodeShiftEncode';
import UnicodeShiftDecode from '../ciphers/UnicodeShiftDecode';
import ConsonantsVowelsEncode from '../ciphers/ConsonantsVowelsEncode';
import ConsonantsVowelsDecode from '../ciphers/ConsonantsVowelsDecode';
import TriliteralCipherEncode from '../ciphers/TriliteralCipherEncode';
import TriliteralCipherDecode from '../ciphers/TriliteralCipherDecode';
import CipherDiskEncode from '../ciphers/CipherDiskEncode';
import CipherDiskDecode from '../ciphers/CipherDiskDecode';
import AlphabeticTranscriptionEncode from '../ciphers/AlphabeticTranscriptionEncode';
import AlphabeticTranscriptionDecode from '../ciphers/AlphabeticTranscriptionDecode';
import GravityFallsEncode from '../ciphers/GravityFallsEncode';
import GravityFallsDecode from '../ciphers/GravityFallsDecode';

describe('Scream Cipher', () => {
  it('roundtrip', () => {
    const enc = new ScreamCipherEncode();
    const dec = new ScreamCipherDecode();
    expect(dec.run(enc.run('HELLO', []), [])).toBe('HELLO');
  });

  it('A stays A', () => {
    const enc = new ScreamCipherEncode();
    expect(enc.run('A', [])).toBe('A');
  });
});

describe('Unicode Shift', () => {
  it('roundtrip', () => {
    const enc = new UnicodeShiftEncode();
    const dec = new UnicodeShiftDecode();
    expect(dec.run(enc.run('Hello', [5]), [5])).toBe('Hello');
  });

  it('shift by 1: A becomes B', () => {
    const enc = new UnicodeShiftEncode();
    expect(enc.run('A', [1])).toBe('B');
  });
});

describe('Consonants/Vowels Rank', () => {
  it('encodes A=V1, B=C1, C=C2', () => {
    const enc = new ConsonantsVowelsEncode();
    expect(enc.run('ABC', ['Space'])).toBe('V1 C1 C2');
  });

  it('roundtrip', () => {
    const enc = new ConsonantsVowelsEncode();
    const dec = new ConsonantsVowelsDecode();
    expect(dec.run(enc.run('HELLO', ['Space']), [])).toBe('HELLO');
  });
});

describe('Triliteral Cipher', () => {
  it('A=000, B=001, C=002', () => {
    const enc = new TriliteralCipherEncode();
    expect(enc.run('ABC', ['26 letters', 'Space'])).toBe('000 001 002');
  });

  it('roundtrip 26-letter', () => {
    const enc = new TriliteralCipherEncode();
    const dec = new TriliteralCipherDecode();
    const encoded = enc.run('HELLO', ['26 letters', 'Space']);
    expect(dec.run(encoded, ['26 letters'])).toBe('HELLO');
  });
});

describe('Cipher Disk', () => {
  it('with alignment D, D→A (inner A at outer D)', () => {
    const enc = new CipherDiskEncode();
    // When inner A aligns with outer D: outer D → inner A
    expect(enc.run('D', ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'D'])).toBe('A');
  });

  it('roundtrip', () => {
    const enc = new CipherDiskEncode();
    const dec = new CipherDiskDecode();
    const args = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'D'];
    const encoded = enc.run('HELLO', args);
    expect(dec.run(encoded, args)).toBe('HELLO');
  });
});

describe('Alphabetic Transcription', () => {
  it('French: A=Anatole', () => {
    const enc = new AlphabeticTranscriptionEncode();
    expect(enc.run('A', ['French'])).toBe('Anatole');
  });

  it('roundtrip French', () => {
    const enc = new AlphabeticTranscriptionEncode();
    const dec = new AlphabeticTranscriptionDecode();
    expect(dec.run(enc.run('ABC', ['French']), ['French'])).toBe('ABC');
  });

  it('LAPD: A=Adam', () => {
    const enc = new AlphabeticTranscriptionEncode();
    expect(enc.run('A', ['LAPD'])).toBe('Adam');
  });
});

describe('Gravity Falls Cipher', () => {
  it('Caesar-3 roundtrip', () => {
    const enc = new GravityFallsEncode();
    const dec = new GravityFallsDecode();
    expect(dec.run(enc.run('HELLO', ['Caesar-3 (Season 1)']), ['Caesar-3 (Season 1)'])).toBe('HELLO');
  });

  it('Atbash is self-reciprocal', () => {
    const enc = new GravityFallsEncode();
    const input = 'HELLO';
    const once = enc.run(input, ['Atbash (Season 2)']);
    const twice = enc.run(once, ['Atbash (Season 2)']);
    expect(twice).toBe(input);
  });

  it('Combined roundtrip', () => {
    const enc = new GravityFallsEncode();
    const dec = new GravityFallsDecode();
    expect(dec.run(enc.run('TEST', ['Combined (Author)']), ['Combined (Author)'])).toBe('TEST');
  });

  it('preserves case', () => {
    const enc = new GravityFallsEncode();
    const dec = new GravityFallsDecode();
    expect(dec.run(enc.run('Hello', ['Caesar-3 (Season 1)']), ['Caesar-3 (Season 1)'])).toBe('Hello');
  });
});
