import { describe, it, expect } from 'vitest';

import PrimeMultiplicationEncode from '../ciphers/PrimeMultiplicationEncode';
import PrimeMultiplicationDecode from '../ciphers/PrimeMultiplicationDecode';
import GridCoordinatesEncode from '../ciphers/GridCoordinatesEncode';
import GridCoordinatesDecode from '../ciphers/GridCoordinatesDecode';
import TwinHexEncode from '../ciphers/TwinHexEncode';
import TwinHexDecode from '../ciphers/TwinHexDecode';
import BinaryCharacterShapesEncode from '../ciphers/BinaryCharacterShapesEncode';
import BinaryCharacterShapesDecode from '../ciphers/BinaryCharacterShapesDecode';
import ShankarSpeechDefectEncode from '../ciphers/ShankarSpeechDefectEncode';
import ShankarSpeechDefectDecode from '../ciphers/ShankarSpeechDefectDecode';
import NakNakEncode from '../ciphers/NakNakEncode';
import NakNakDecode from '../ciphers/NakNakDecode';
import GenshinImpactEncode from '../ciphers/GenshinImpactEncode';
import GenshinImpactDecode from '../ciphers/GenshinImpactDecode';

/* ------------------------------------------------------------------ */
/*  Prime Multiplication                                               */
/* ------------------------------------------------------------------ */
describe('Prime Multiplication', () => {
  const enc = new PrimeMultiplicationEncode();
  const dec = new PrimeMultiplicationDecode();

  it('A=1×7=7, B=2×7=14', () => {
    expect(enc.run('AB', [7, 'Space'])).toBe('7 14');
  });

  it('roundtrips', () => {
    const ct = enc.run('HELLO', [7, 'Space']);
    expect(dec.run(ct, [7, 'Auto'])).toBe('HELLO');
  });

  it('handles word spaces', () => {
    const ct = enc.run('HI THERE', [7, 'Space']);
    expect(ct).toContain('/');
    expect(dec.run(ct, [7, 'Auto'])).toBe('HI THERE');
  });
});

/* ------------------------------------------------------------------ */
/*  Grid Coordinates                                                   */
/* ------------------------------------------------------------------ */
describe('Grid Coordinates', () => {
  const enc = new GridCoordinatesEncode();
  const dec = new GridCoordinatesDecode();

  it('encodes A at position A1 in 5x5 grid', () => {
    const result = enc.run('A', [5, 'Letters (A,B,...)', 'Numbers (1,2,...)']);
    expect(result).toBe('A1');
  });

  it('encodes ABCDEF, F lands at B1 in 5x5 grid', () => {
    // Grid: ABCDE / F.... → F is at row B, col 1
    const result = enc.run('ABCDEF', [5, 'Letters (A,B,...)', 'Numbers (1,2,...)']);
    expect(result).toBe('A1 A2 A3 A4 A5 B1');
  });

  it('decodes coordinates', () => {
    const result = dec.run('A1 B1', ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 5, 'Letters (A,B,...)', 'Numbers (1,2,...)']);
    expect(result).toBe('AF');
  });
});

/* ------------------------------------------------------------------ */
/*  Twin Hex                                                           */
/* ------------------------------------------------------------------ */
describe('Twin Hex Cipher', () => {
  const enc = new TwinHexEncode();
  const dec = new TwinHexDecode();

  it('splits A (0x41) into 4.1', () => {
    expect(enc.run('A', ['Dot', 'Space'])).toBe('4.1');
  });

  it('roundtrips', () => {
    const ct = enc.run('Hello', ['Dot', 'Space']);
    expect(dec.run(ct, ['Dot'])).toBe('Hello');
  });

  it('uses dash separator', () => {
    const ct = enc.run('AB', ['Dash', 'Space']);
    expect(ct).toBe('4-1 4-2');
  });
});

/* ------------------------------------------------------------------ */
/*  Binary Character Shapes                                            */
/* ------------------------------------------------------------------ */
describe('Binary Character Shapes', () => {
  const enc = new BinaryCharacterShapesEncode();
  const dec = new BinaryCharacterShapesDecode();

  it('encodes A as 5 numbers', () => {
    const result = enc.run('A', ['Numbers']);
    expect(result).toBe('4 10 31 17 17');
  });

  it('roundtrips A', () => {
    const encoded = enc.run('A', ['Numbers']);
    expect(dec.run(encoded, [])).toBe('A');
  });

  it('roundtrips multiple letters', () => {
    const encoded = enc.run('HI', ['Numbers']);
    expect(dec.run(encoded, [])).toBe('HI');
  });

  it('visual format contains binary', () => {
    const result = enc.run('T', ['Visual']);
    expect(result).toContain('11111'); // top row of T
    expect(result).toContain('00100'); // middle column
  });
});

/* ------------------------------------------------------------------ */
/*  Shankar Speech Defect                                              */
/* ------------------------------------------------------------------ */
describe('Shankar Speech Defect', () => {
  const enc = new ShankarSpeechDefectEncode();
  const dec = new ShankarSpeechDefectDecode();

  it('replaces vowels with q', () => {
    expect(enc.run('HELLO', ['Replace vowels', 'q'])).toBe('HQLLQ');
  });

  it('inserts syllable after vowel', () => {
    // H (consonant) → H, I (vowel) → I + "pi" = "Ipi"
    expect(enc.run('HI', ['Insert syllable', 'p'])).toBe('HIpi');
  });

  it('roundtrips insert mode', () => {
    const ct = enc.run('HELLO', ['Insert syllable', 'p']);
    expect(dec.run(ct, ['Insert syllable', 'p', 'Auto'])).toBe('HELLO');
  });
});

/* ------------------------------------------------------------------ */
/*  Nak Nak (Duckspeak)                                                */
/* ------------------------------------------------------------------ */
describe('Nak Nak', () => {
  const enc = new NakNakEncode();
  const dec = new NakNakDecode();

  it('A = 1×nak, C = 3×nak', () => {
    const result = enc.run('AC', ['nak', 'Space']);
    expect(result).toBe('nak | nak nak nak');
  });

  it('roundtrips', () => {
    const ct = enc.run('ABC', ['nak', 'Space']);
    expect(dec.run(ct, ['nak'])).toBe('ABC');
  });
});

/* ------------------------------------------------------------------ */
/*  Genshin Impact Cipher                                              */
/* ------------------------------------------------------------------ */
describe('Genshin Impact Cipher', () => {
  const enc = new GenshinImpactEncode();
  const dec = new GenshinImpactDecode();

  it('Mondstadt swaps B↔D', () => {
    expect(enc.run('B', ['Mondstadt'])).toBe('D');
    expect(enc.run('D', ['Mondstadt'])).toBe('B');
  });

  it('Liyue is Atbash-like (A↔Z)', () => {
    expect(enc.run('A', ['Liyue'])).toBe('Z');
    expect(enc.run('Z', ['Liyue'])).toBe('A');
  });

  it('roundtrips Mondstadt', () => {
    const ct = enc.run('Hello World', ['Mondstadt']);
    expect(dec.run(ct, ['Mondstadt'])).toBe('Hello World');
  });

  it('roundtrips Sumeru', () => {
    const ct = enc.run('ATTACK', ['Sumeru']);
    expect(dec.run(ct, ['Sumeru'])).toBe('ATTACK');
  });

  it('preserves case', () => {
    const ct = enc.run('Hello', ['Fontaine']);
    expect(dec.run(ct, ['Fontaine'])).toBe('Hello');
  });
});
