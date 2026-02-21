import { describe, it, expect } from 'vitest';
import ROT5Cipher from '../ciphers/ROT5Cipher';
import ROT18Cipher from '../ciphers/ROT18Cipher';
import ROT1Cipher from '../ciphers/ROT1Cipher';
import Base100Encode from '../ciphers/Base100Encode';
import Base100Decode from '../ciphers/Base100Decode';
import Base26Encode from '../ciphers/Base26Encode';
import Base26Decode from '../ciphers/Base26Decode';
import Base36Encode from '../ciphers/Base36Encode';
import Base36Decode from '../ciphers/Base36Decode';
import Base37Encode from '../ciphers/Base37Encode';
import Base37Decode from '../ciphers/Base37Decode';
import LetterPositionEncode from '../ciphers/LetterPositionEncode';
import LetterPositionDecode from '../ciphers/LetterPositionDecode';

describe('ROT5 Cipher', () => {
  it('rotates digits by 5', () => {
    const op = new ROT5Cipher();
    expect(op.run('0123456789', [])).toBe('5678901234');
  });

  it('is self-reciprocal', () => {
    const op = new ROT5Cipher();
    const input = 'Hello 12345!';
    expect(op.run(op.run(input, []), [])).toBe(input);
  });

  it('passes through letters unchanged', () => {
    const op = new ROT5Cipher();
    expect(op.run('ABC', [])).toBe('ABC');
  });
});

describe('ROT18 Cipher', () => {
  it('applies ROT13 + ROT5', () => {
    const op = new ROT18Cipher();
    expect(op.run('A', [])).toBe('N');
    expect(op.run('0', [])).toBe('5');
    expect(op.run('Hello 123', [])).toBe('Uryyb 678');
  });

  it('is self-reciprocal', () => {
    const op = new ROT18Cipher();
    const input = 'Test 42!';
    expect(op.run(op.run(input, []), [])).toBe(input);
  });
});

describe('ROT1 Cipher', () => {
  it('encodes: shifts by +1', () => {
    const op = new ROT1Cipher();
    expect(op.run('ABC', ['Encode'])).toBe('BCD');
    expect(op.run('Z', ['Encode'])).toBe('A');
  });

  it('decodes: shifts by -1', () => {
    const op = new ROT1Cipher();
    expect(op.run('BCD', ['Decode'])).toBe('ABC');
    expect(op.run('A', ['Decode'])).toBe('Z');
  });

  it('roundtrip encode then decode', () => {
    const op = new ROT1Cipher();
    const input = 'Hello World';
    expect(op.run(op.run(input, ['Encode']), ['Decode'])).toBe(input);
  });

  it('preserves case', () => {
    const op = new ROT1Cipher();
    expect(op.run('aZ', ['Encode'])).toBe('bA');
  });
});

describe('Base100 Encode/Decode', () => {
  it('roundtrip ASCII text', () => {
    const enc = new Base100Encode();
    const dec = new Base100Decode();
    const input = 'Hello';
    const encoded = enc.run(input, []);
    expect(encoded.length).toBeGreaterThan(0);
    expect(dec.run(encoded, [])).toBe(input);
  });

  it('encodes to emoji characters', () => {
    const enc = new Base100Encode();
    const encoded = enc.run('A', []);
    const cp = encoded.codePointAt(0)!;
    expect(cp).toBeGreaterThanOrEqual(0x1F000);
  });
});

describe('Base26 Encode/Decode', () => {
  it('encodes DCODE to 1415626', () => {
    const enc = new Base26Encode();
    expect(enc.run('DCODE', ['Space'])).toBe('1415626');
  });

  it('decodes 1415626 to DCODE', () => {
    const dec = new Base26Decode();
    expect(dec.run('1415626', ['Space'])).toBe('DCODE');
  });

  it('roundtrip multi-word', () => {
    const enc = new Base26Encode();
    const dec = new Base26Decode();
    const encoded = enc.run('DCODE BASE TWENTYSIX', ['Space']);
    expect(encoded).toBe('1415626 18048 4145813288575');
    expect(dec.run(encoded, ['Space'])).toBe('DCODE BASE TWENTYSIX');
  });

  it('single letter A=0', () => {
    const enc = new Base26Encode();
    expect(enc.run('A', ['Space'])).toBe('0');
    expect(enc.run('B', ['Space'])).toBe('1');
    expect(enc.run('Z', ['Space'])).toBe('25');
  });
});

describe('Base36 Encode/Decode', () => {
  it('encodes dcode to 22426466', () => {
    const enc = new Base36Encode();
    expect(enc.run('dcode', ['Space'])).toBe('22426466');
  });

  it('decodes 22426466 to dcode', () => {
    const dec = new Base36Decode();
    expect(dec.run('22426466', ['Space'])).toBe('dcode');
  });

  it('roundtrip multi-word', () => {
    const enc = new Base36Encode();
    const dec = new Base36Decode();
    const encoded = enc.run('dcode base 36', ['Space']);
    expect(encoded).toBe('22426466 527198 114');
    expect(dec.run(encoded, ['Space'])).toBe('dcode base 36');
  });
});

describe('Base37 Encode/Decode', () => {
  it('encodes DCODE BASE 37', () => {
    const enc = new Base37Encode();
    expect(enc.run('DCODE BASE 37')).toBe('87830535686058944789');
  });

  it('decodes 87830535686058944789', () => {
    const dec = new Base37Decode();
    expect(dec.run('87830535686058944789')).toBe('DCODE BASE 37');
  });

  it('roundtrip', () => {
    const enc = new Base37Encode();
    const dec = new Base37Decode();
    const input = 'HELLO WORLD';
    const encoded = enc.run(input);
    expect(dec.run(encoded)).toBe(input);
  });
});

describe('Letter Position Encode/Decode', () => {
  it('encodes letters to positions', () => {
    const enc = new LetterPositionEncode();
    expect(enc.run('ABC', ['Space', true])).toBe('1 2 3');
  });

  it('decodes positions to letters', () => {
    const dec = new LetterPositionDecode();
    expect(dec.run('1 2 3', ['Space'])).toBe('ABC');
  });

  it('roundtrip with space separator', () => {
    const enc = new LetterPositionEncode();
    const dec = new LetterPositionDecode();
    const encoded = enc.run('HELLO', ['Space', false]);
    expect(dec.run(encoded, ['Space'])).toBe('HELLO');
  });

  it('handles Z=26', () => {
    const enc = new LetterPositionEncode();
    const dec = new LetterPositionDecode();
    expect(enc.run('Z', ['Space', false])).toBe('26');
    expect(dec.run('26', ['Space'])).toBe('Z');
  });
});
