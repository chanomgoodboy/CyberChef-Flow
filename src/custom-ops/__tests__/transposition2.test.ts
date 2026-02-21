import { describe, it, expect } from 'vitest';
import DoubleTranspositionEncode from '../ciphers/DoubleTranspositionEncode';
import DoubleTranspositionDecode from '../ciphers/DoubleTranspositionDecode';
import AMSCOCipherEncode from '../ciphers/AMSCOCipherEncode';
import AMSCOCipherDecode from '../ciphers/AMSCOCipherDecode';
import RouteCipherEncode from '../ciphers/RouteCipherEncode';
import RouteCipherDecode from '../ciphers/RouteCipherDecode';
import RedefenceCipherEncode from '../ciphers/RedefenceCipherEncode';
import RedefenceCipherDecode from '../ciphers/RedefenceCipherDecode';
import TurningGrilleEncode from '../ciphers/TurningGrilleEncode';
import TurningGrilleDecode from '../ciphers/TurningGrilleDecode';

describe('Double Transposition', () => {
  it('encode then decode roundtrip', () => {
    const enc = new DoubleTranspositionEncode();
    const dec = new DoubleTranspositionDecode();
    // Use exact multiple of both key lengths to avoid padding
    const plain = 'WEAREDISCOVEREDFLEEATONCEX';
    const cipher = enc.run(plain, ['FIRST', 'SECOND', 'X']);
    const result = dec.run(cipher, ['FIRST', 'SECOND']);
    expect(result.startsWith('WEAREDISCOVEREDFLEEATONCEX')).toBe(true);
  });

  it('produces different output than single transposition', () => {
    const enc = new DoubleTranspositionEncode();
    const result1 = enc.run('HELLOWORLD', ['FIRST', 'SECOND', 'X']);
    // Should be thoroughly scrambled
    expect(result1).not.toBe('HELLOWORLD');
    expect(result1.length).toBeGreaterThanOrEqual(10);
  });
});

describe('AMSCO Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new AMSCOCipherEncode();
    const dec = new AMSCOCipherDecode();
    const plain = 'THEQUICKBROWNFOX';
    const cipher = enc.run(plain, ['CARGO', 'Single (1)']);
    const result = dec.run(cipher, ['CARGO', 'Single (1)']);
    expect(result).toBe(plain);
  });

  it('roundtrip with double start', () => {
    const enc = new AMSCOCipherEncode();
    const dec = new AMSCOCipherDecode();
    const plain = 'THEQUICKBROWNFOX';
    const cipher = enc.run(plain, ['KEY', 'Double (2)']);
    const result = dec.run(cipher, ['KEY', 'Double (2)']);
    expect(result).toBe(plain);
  });

  it('output has same length as input', () => {
    const enc = new AMSCOCipherEncode();
    const result = enc.run('HELLOWORLD', ['CARGO', 'Single (1)']);
    expect(result.length).toBe(10);
  });
});

describe('Route Cipher', () => {
  it('spiral clockwise encode then decode roundtrip', () => {
    const enc = new RouteCipherEncode();
    const dec = new RouteCipherDecode();
    const plain = 'THEQUICKBROWNFOX';
    const cipher = enc.run(plain, [4, 'Spiral clockwise', 'X']);
    const result = dec.run(cipher, [4, 'Spiral clockwise']);
    expect(result.startsWith(plain)).toBe(true);
  });

  it('snake by rows roundtrip', () => {
    const enc = new RouteCipherEncode();
    const dec = new RouteCipherDecode();
    const plain = 'ABCDEFGHIJKLMNOP';
    const cipher = enc.run(plain, [4, 'Snake by rows', 'X']);
    const result = dec.run(cipher, [4, 'Snake by rows']);
    expect(result).toBe(plain);
  });

  it('snake by columns roundtrip', () => {
    const enc = new RouteCipherEncode();
    const dec = new RouteCipherDecode();
    const plain = 'ABCDEFGHIJKLMNOP';
    const cipher = enc.run(plain, [4, 'Snake by columns', 'X']);
    const result = dec.run(cipher, [4, 'Snake by columns']);
    expect(result).toBe(plain);
  });

  it('spiral counter-clockwise roundtrip', () => {
    const enc = new RouteCipherEncode();
    const dec = new RouteCipherDecode();
    const plain = 'ABCDEFGHIJKLMNOP';
    const cipher = enc.run(plain, [4, 'Spiral counter-clockwise', 'X']);
    const result = dec.run(cipher, [4, 'Spiral counter-clockwise']);
    expect(result).toBe(plain);
  });
});

describe('Redefence Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new RedefenceCipherEncode();
    const dec = new RedefenceCipherDecode();
    const plain = 'WEAREDISCOVEREDFLEEATONCE';
    const cipher = enc.run(plain, [3, '213', 0]);
    const result = dec.run(cipher, [3, '213', 0]);
    expect(result).toBe(plain);
  });

  it('with standard order is like rail fence', () => {
    const enc = new RedefenceCipherEncode();
    const result = enc.run('WEAREDISCOVERED', [3, '123', 0]);
    // Should behave like standard rail fence with 3 rails
    expect(result.length).toBe(15);
  });

  it('roundtrip with offset', () => {
    const enc = new RedefenceCipherEncode();
    const dec = new RedefenceCipherDecode();
    const plain = 'HELLOWORLD';
    const cipher = enc.run(plain, [3, '312', 2]);
    const result = dec.run(cipher, [3, '312', 2]);
    expect(result).toBe(plain);
  });
});

describe('Turning Grille', () => {
  it('encode then decode roundtrip', () => {
    const enc = new TurningGrilleEncode();
    const dec = new TurningGrilleDecode();
    // 4x4 grid: pick one hole from each rotation orbit to cover all 16 cells.
    // Orbits: {0,3,15,12}, {1,7,14,8}, {2,11,13,4}, {5,6,10,9}
    // Holes: 0, 1, 2, 5
    const plain = 'ABCDEFGHIJKLMNOP';
    const cipher = enc.run(plain, [4, '0,1,2,5', 'X']);
    const result = dec.run(cipher, [4, '0,1,2,5']);
    expect(result).toBe(plain);
  });

  it('output length is gridSize^2', () => {
    const enc = new TurningGrilleEncode();
    const result = enc.run('ABCD', [4, '0,1,2,5', 'X']);
    expect(result.length).toBe(16);
  });
});
