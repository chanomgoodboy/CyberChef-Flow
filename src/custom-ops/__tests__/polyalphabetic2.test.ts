import { describe, it, expect } from 'vitest';
import AutokeyCipherEncode from '../ciphers/AutokeyCipherEncode';
import AutokeyCipherDecode from '../ciphers/AutokeyCipherDecode';
import VariantBeaufortCipherEncode from '../ciphers/VariantBeaufortCipherEncode';
import VariantBeaufortCipherDecode from '../ciphers/VariantBeaufortCipherDecode';
import AlbertiCipherEncode from '../ciphers/AlbertiCipherEncode';
import AlbertiCipherDecode from '../ciphers/AlbertiCipherDecode';
import ChaocipherEncode from '../ciphers/ChaocipherEncode';
import ChaocipherDecode from '../ciphers/ChaocipherDecode';
import ProgressiveCaesarEncode from '../ciphers/ProgressiveCaesarEncode';
import ProgressiveCaesarDecode from '../ciphers/ProgressiveCaesarDecode';

describe('Autokey Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new AutokeyCipherEncode();
    const dec = new AutokeyCipherDecode();
    const plain = 'ATTACKATDAWN';
    const cipher = enc.run(plain, ['QUEENLY']);
    const result = dec.run(cipher, ['QUEENLY']);
    expect(result).toBe(plain);
  });

  it('encodes with known values', () => {
    const enc = new AutokeyCipherEncode();
    // QUEENLY key, ATTACK plain
    // Q(16)+A(0)=Q, U(20)+T(19)=N, E(4)+T(19)=X, ...
    const result = enc.run('ATTACKATDAWN', ['QUEENLY']);
    expect(result.length).toBe(12);
    expect(result[0]).toBe('Q'); // Q+A=Q
  });

  it('preserves case and non-alpha', () => {
    const enc = new AutokeyCipherEncode();
    const dec = new AutokeyCipherDecode();
    const plain = 'Hello, World!';
    const cipher = enc.run(plain, ['KEY']);
    const result = dec.run(cipher, ['KEY']);
    expect(result).toBe(plain);
  });
});

describe('Variant Beaufort Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new VariantBeaufortCipherEncode();
    const dec = new VariantBeaufortCipherDecode();
    const plain = 'HELLOWORLD';
    const cipher = enc.run(plain, ['SECRET']);
    const result = dec.run(cipher, ['SECRET']);
    expect(result).toBe(plain);
  });

  it('is NOT reciprocal (unlike standard Beaufort)', () => {
    const enc = new VariantBeaufortCipherEncode();
    const plain = 'HELLO';
    const cipher = enc.run(plain, ['KEY']);
    const double = enc.run(cipher, ['KEY']);
    // Variant Beaufort is not reciprocal
    expect(double).not.toBe(plain);
  });

  it('encodes C = (P - K) mod 26', () => {
    const enc = new VariantBeaufortCipherEncode();
    // H(7) - S(18) = -11 mod 26 = 15 = P
    const result = enc.run('H', ['S']);
    expect(result).toBe('P');
  });
});

describe('Alberti Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new AlbertiCipherEncode();
    const dec = new AlbertiCipherDecode();
    const plain = 'THEQUICKBROWNFOX';
    const cipher = enc.run(plain, ['', 3, 2, 4]);
    const result = dec.run(cipher, ['', 3, 2, 4]);
    expect(result).toBe(plain);
  });

  it('with no rotation acts as simple shift', () => {
    const enc = new AlbertiCipherEncode();
    // rotation=1, step=0 → constant shift of 1
    const result = enc.run('ABC', ['', 1, 0, 1]);
    expect(result).toBe('BCD');
  });

  it('rotation increments after period', () => {
    const enc = new AlbertiCipherEncode();
    // period=1, step=1 → rotation increases by 1 after each letter
    // A(0)+0=A, B(1)+1=C, C(2)+2=E
    const result = enc.run('ABC', ['', 0, 1, 1]);
    expect(result).toBe('ACE');
  });
});

describe('Chaocipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new ChaocipherEncode();
    const dec = new ChaocipherDecode();
    const left = 'HXUCZVAMDSLKPEFJRIGTWOBNYQ';
    const right = 'PTLNBQDEOYSFAVZKGJRIHWXUMC';
    const plain = 'WELLDONEISBETTERTHANWELLSAID';
    const cipher = enc.run(plain, [left, right]);
    const result = dec.run(cipher, [left, right]);
    expect(result).toBe(plain);
  });

  it('produces known ciphertext', () => {
    const enc = new ChaocipherEncode();
    // Known test vector from Wikipedia
    const result = enc.run('WELLDONEISBETTERTHANWELLSAID', [
      'HXUCZVAMDSLKPEFJRIGTWOBNYQ',
      'PTLNBQDEOYSFAVZKGJRIHWXUMC',
    ]);
    expect(result).toBe('OAHQHCNYNXTSZJRRHJBYHQKSOUJY');
  });

  it('preserves non-alpha', () => {
    const enc = new ChaocipherEncode();
    const result = enc.run('A B', [
      'HXUCZVAMDSLKPEFJRIGTWOBNYQ',
      'PTLNBQDEOYSFAVZKGJRIHWXUMC',
    ]);
    expect(result[1]).toBe(' ');
  });
});

describe('Progressive Caesar', () => {
  it('encode then decode roundtrip', () => {
    const enc = new ProgressiveCaesarEncode();
    const dec = new ProgressiveCaesarDecode();
    const plain = 'HELLOWORLD';
    const cipher = enc.run(plain, [3, 2]);
    const result = dec.run(cipher, [3, 2]);
    expect(result).toBe(plain);
  });

  it('with step=0 is regular Caesar', () => {
    const enc = new ProgressiveCaesarEncode();
    const result = enc.run('ABC', [3, 0]);
    expect(result).toBe('DEF');
  });

  it('encodes with incrementing shift', () => {
    const enc = new ProgressiveCaesarEncode();
    // shift=1, step=1: A+1=B, B+2=D, C+3=F
    const result = enc.run('ABC', [1, 1]);
    expect(result).toBe('BDF');
  });

  it('preserves case', () => {
    const enc = new ProgressiveCaesarEncode();
    const dec = new ProgressiveCaesarDecode();
    const plain = 'Hello';
    const cipher = enc.run(plain, [1, 1]);
    const result = dec.run(cipher, [1, 1]);
    expect(result).toBe(plain);
  });
});
