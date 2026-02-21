import { describe, it, expect } from 'vitest';
import ColumnarTranspositionEncode from '../ciphers/ColumnarTranspositionEncode';
import ColumnarTranspositionDecode from '../ciphers/ColumnarTranspositionDecode';
import ScytaleCipherEncode from '../ciphers/ScytaleCipherEncode';
import ScytaleCipherDecode from '../ciphers/ScytaleCipherDecode';
import SkipCipher from '../ciphers/SkipCipher';

describe('Columnar Transposition', () => {
  it('encode then decode roundtrip (exact fill)', () => {
    const enc = new ColumnarTranspositionEncode();
    const dec = new ColumnarTranspositionDecode();
    // 24 chars / 6 cols = exactly 4 rows, no padding
    const plain = 'WEAREDISCOVEREDFLEEATONC';
    const cipher = enc.run(plain, ['ZEBRAS', 'X']);
    const result = dec.run(cipher, ['ZEBRAS']);
    expect(result).toBe(plain);
  });

  it('encode then decode roundtrip (with padding)', () => {
    const enc = new ColumnarTranspositionEncode();
    const dec = new ColumnarTranspositionDecode();
    // 25 chars / 6 cols → padded to 30 → decode gives 30 chars (includes padding)
    const plain = 'WEAREDISCOVEREDFLEEATONCE';
    const cipher = enc.run(plain, ['ZEBRAS', 'X']);
    const result = dec.run(cipher, ['ZEBRAS']);
    expect(result.startsWith(plain)).toBe(true);
  });

  it('Wikipedia ZEBRAS example (exact 24 chars)', () => {
    const enc = new ColumnarTranspositionEncode();
    // Use exactly 24 chars for clean 4x6 grid
    const result = enc.run('WEAREDISCOVEREDFLEEATONC', ['ZEBRAS', 'X']);
    // Grid (4 rows x 6 cols), read columns in alphabetical key order:
    // A(col4)→EVLN, B(col2)→ACDT, E(col1)→ESEA, R(col3)→ROFO, S(col5)→DEEC, Z(col0)→WIRE
    expect(result).toBe('EVLNACDTESEAROFODEECWIRE');
  });
});

describe('Scytale Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new ScytaleCipherEncode();
    const dec = new ScytaleCipherDecode();
    const plain = 'IAMHURTVERYBADLYHELP';
    const cipher = enc.run(plain, [5]);
    const result = dec.run(cipher, [5]);
    expect(result).toBe(plain);
  });

  it('encodes by reading columns', () => {
    const enc = new ScytaleCipherEncode();
    // "ABCDEFGH" with circ=4:
    // Grid: A B C D
    //        E F G H
    // Read cols: AE BF CG DH
    const result = enc.run('ABCDEFGH', [4]);
    expect(result).toBe('AEBFCGDH');
  });
});

describe('Skip Cipher', () => {
  it('extracts every Nth character', () => {
    const op = new SkipCipher();
    const result = op.run('ABCDEFGHIJ', [3, 0]);
    expect(result).toBe('ADGJ');
  });

  it('with offset', () => {
    const op = new SkipCipher();
    // offset=1, skip=3: indices 1,4,7 → B,E,H
    const result = op.run('ABCDEFGHIJ', [3, 1]);
    expect(result).toBe('BEH');
  });

  it('skip 1 returns full string', () => {
    const op = new SkipCipher();
    const result = op.run('HELLO', [1, 0]);
    expect(result).toBe('HELLO');
  });
});
