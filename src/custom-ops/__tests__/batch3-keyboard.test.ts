import { describe, it, expect } from 'vitest';
import KeyboardCoordinatesEncode from '../ciphers/KeyboardCoordinatesEncode';
import KeyboardCoordinatesDecode from '../ciphers/KeyboardCoordinatesDecode';
import LSPK90Encode from '../ciphers/LSPK90Encode';
import LSPK90Decode from '../ciphers/LSPK90Decode';
import DTMFCodeEncode from '../ciphers/DTMFCodeEncode';
import DTMFCodeDecode from '../ciphers/DTMFCodeDecode';
import T9Encode from '../ciphers/T9Encode';
import T9Decode from '../ciphers/T9Decode';
import ALTCodesEncode from '../ciphers/ALTCodesEncode';
import ALTCodesDecode from '../ciphers/ALTCodesDecode';
import ASCIIControlEncode from '../ciphers/ASCIIControlEncode';
import ASCIIControlDecode from '../ciphers/ASCIIControlDecode';
import NumpadDrawEncode from '../ciphers/NumpadDrawEncode';
import NumpadDrawDecode from '../ciphers/NumpadDrawDecode';

describe('Keyboard Coordinates', () => {
  it('Q is at (1,1) 1-based', () => {
    const enc = new KeyboardCoordinatesEncode();
    expect(enc.run('Q', ['1-based', 'Space'])).toBe('(1,1)');
  });

  it('roundtrip', () => {
    const enc = new KeyboardCoordinatesEncode();
    const dec = new KeyboardCoordinatesDecode();
    const encoded = enc.run('HELLO', ['1-based', 'Space']);
    expect(dec.run(encoded, ['1-based'])).toBe('HELLO');
  });
});

describe('LSPK90', () => {
  it('encode then decode roundtrip (spaced)', () => {
    const enc = new LSPK90Encode();
    const dec = new LSPK90Decode();
    const encoded = enc.run('HELLO', ['Space']);
    expect(encoded).toBe('][ \\|/ _| _| ()');
    const decoded = dec.run(encoded, ['Space']);
    expect(decoded).toBe('HELLO');
  });

  it('encodes digits correctly', () => {
    const enc = new LSPK90Encode();
    const encoded = enc.run('42', ['Space']);
    expect(encoded).toBe('_+ (V');
  });

  it('passes through non-encodable chars', () => {
    const enc = new LSPK90Encode();
    const encoded = enc.run('A!B', ['Space']);
    expect(encoded).toBe('<{ ! ^^');
  });
});

describe('DTMF Code', () => {
  it('encodes 1 as 697+1209', () => {
    const enc = new DTMFCodeEncode();
    expect(enc.run('1', ['Frequency pairs'])).toBe('697+1209');
  });

  it('roundtrip', () => {
    const enc = new DTMFCodeEncode();
    const dec = new DTMFCodeDecode();
    const encoded = enc.run('123', ['Frequency pairs']);
    expect(dec.run(encoded, [])).toBe('123');
  });
});

describe('T9', () => {
  it('encodes ABC as 222', () => {
    const enc = new T9Encode();
    expect(enc.run('ABC', ['None'])).toBe('222');
  });

  it('encodes HELLO as 43556', () => {
    const enc = new T9Encode();
    expect(enc.run('HELLO', ['None'])).toBe('43556');
  });

  it('decode gives first letter per digit', () => {
    const dec = new T9Decode();
    expect(dec.run('43556', ['First letter'])).toBe('GDJJM');
  });
});

describe('ALT Codes', () => {
  it('A = 65', () => {
    const enc = new ALTCodesEncode();
    expect(enc.run('A', ['Decimal', 'Space'])).toBe('65');
  });

  it('ALT+ prefix format', () => {
    const enc = new ALTCodesEncode();
    expect(enc.run('A', ['ALT+ prefix', 'Space'])).toBe('ALT+65');
  });

  it('roundtrip', () => {
    const enc = new ALTCodesEncode();
    const dec = new ALTCodesDecode();
    const encoded = enc.run('Hello', ['Decimal', 'Space']);
    expect(dec.run(encoded, [])).toBe('Hello');
  });

  it('decodes ALT+ prefix', () => {
    const dec = new ALTCodesDecode();
    expect(dec.run('ALT+65 ALT+66', [])).toBe('AB');
  });
});

describe('ASCII Control Characters', () => {
  it('encodes control chars as abbreviations', () => {
    const enc = new ASCIIControlEncode();
    const result = enc.run('\x01\x02\x03', ['Abbreviation']);
    expect(result).toContain('SOH');
    expect(result).toContain('STX');
    expect(result).toContain('ETX');
  });

  it('encodes as caret notation', () => {
    const enc = new ASCIIControlEncode();
    expect(enc.run('\x01', ['Caret notation'])).toBe('^A');
  });

  it('roundtrip with abbreviations', () => {
    const enc = new ASCIIControlEncode();
    const dec = new ASCIIControlDecode();
    const input = '\x01\x02\x03';
    const encoded = enc.run(input, ['Abbreviation']);
    expect(dec.run(encoded, [])).toBe(input);
  });
});

describe('Numpad Draw', () => {
  it('encode and decode roundtrip', () => {
    const enc = new NumpadDrawEncode();
    const dec = new NumpadDrawDecode();
    const encoded = enc.run('HELLO', ['Phone', 'Space']);
    expect(dec.run(encoded, ['Phone'])).toBe('HELLO');
  });

  it('L on phone is 1-4-7-8-9', () => {
    const enc = new NumpadDrawEncode();
    expect(enc.run('L', ['Phone', 'Space'])).toBe('1-4-7-8-9');
  });
});
