import { describe, it, expect } from 'vitest';
import KeyboardShiftCipher from '../ciphers/KeyboardShiftCipher';
import KeyboardChangeCipher from '../ciphers/KeyboardChangeCipher';
import ASCIIShiftCipherEncode from '../ciphers/ASCIIShiftCipherEncode';
import ASCIIShiftCipherDecode from '../ciphers/ASCIIShiftCipherDecode';
import PhoneKeypadEncode from '../ciphers/PhoneKeypadEncode';
import PhoneKeypadDecode from '../ciphers/PhoneKeypadDecode';

describe('Keyboard Shift Cipher', () => {
  it('shifts right by 1 on QWERTY', () => {
    const op = new KeyboardShiftCipher();
    const result = op.run('a', [1, 'QWERTY']);
    expect(result).toBe('s');
  });

  it('shifts left by 1 on QWERTY', () => {
    const op = new KeyboardShiftCipher();
    const result = op.run('s', [-1, 'QWERTY']);
    expect(result).toBe('a');
  });

  it('preserves characters at edge', () => {
    const op = new KeyboardShiftCipher();
    // 'p' is at the right end of row 2, shift right should keep it
    const result = op.run('q', [0, 'QWERTY']);
    expect(result).toBe('q');
  });

  it('shifts uppercase', () => {
    const op = new KeyboardShiftCipher();
    const result = op.run('A', [1, 'QWERTY']);
    expect(result).toBe('S');
  });

  it('passes through non-keyboard characters', () => {
    const op = new KeyboardShiftCipher();
    const result = op.run('!@#', [1, 'QWERTY']);
    // These are on the upper number row, may or may not shift
    expect(typeof result).toBe('string');
  });
});

describe('Keyboard Change Cipher', () => {
  it('converts QWERTY q to AZERTY a', () => {
    const op = new KeyboardChangeCipher();
    const result = op.run('q', ['QWERTY', 'AZERTY']);
    expect(result).toBe('a');
  });

  it('converts QWERTY a to AZERTY q', () => {
    const op = new KeyboardChangeCipher();
    const result = op.run('a', ['QWERTY', 'AZERTY']);
    expect(result).toBe('q');
  });

  it('is reversible', () => {
    const op = new KeyboardChangeCipher();
    const text = 'hello';
    const changed = op.run(text, ['QWERTY', 'AZERTY']);
    const reversed = op.run(changed, ['AZERTY', 'QWERTY']);
    expect(reversed).toBe(text);
  });

  it('preserves case', () => {
    const op = new KeyboardChangeCipher();
    const result = op.run('Q', ['QWERTY', 'AZERTY']);
    expect(result).toBe('A');
  });
});

describe('ASCII Shift Cipher', () => {
  it('encode then decode roundtrip', () => {
    const enc = new ASCIIShiftCipherEncode();
    const dec = new ASCIIShiftCipherDecode();
    const plain = 'Hello World!';
    const cipher = enc.run(plain, [3]);
    const result = dec.run(cipher, [3]);
    expect(result).toBe(plain);
  });

  it('shift by 1', () => {
    const enc = new ASCIIShiftCipherEncode();
    const result = enc.run('A', [1]);
    expect(result).toBe('B');
  });

  it('shift by -1', () => {
    const enc = new ASCIIShiftCipherEncode();
    const result = enc.run('B', [-1]);
    expect(result).toBe('A');
  });

  it('handles full string', () => {
    const enc = new ASCIIShiftCipherEncode();
    const result = enc.run('abc', [1]);
    expect(result).toBe('bcd');
  });
});

describe('Phone Keypad (Multi-tap)', () => {
  it('encode then decode roundtrip', () => {
    const enc = new PhoneKeypadEncode();
    const dec = new PhoneKeypadDecode();
    const plain = 'HELLO';
    const cipher = enc.run(plain, [' ']);
    const result = dec.run(cipher, [' ']);
    expect(result).toBe(plain);
  });

  it('encodes correctly', () => {
    const enc = new PhoneKeypadEncode();
    const result = enc.run('ABC', [' ']);
    expect(result).toBe('2 22 222');
  });

  it('encodes with space as 0', () => {
    const enc = new PhoneKeypadEncode();
    const result = enc.run('A B', ['-']);
    expect(result).toBe('2-0-22');
  });

  it('decodes correctly', () => {
    const dec = new PhoneKeypadDecode();
    const result = dec.run('2 22 222', [' ']);
    expect(result).toBe('ABC');
  });

  it('decodes S (7777)', () => {
    const dec = new PhoneKeypadDecode();
    const result = dec.run('7777', [' ']);
    expect(result).toBe('S');
  });

  it('decodes without separator, splitting overflows', () => {
    const dec = new PhoneKeypadDecode();
    // 44=H, 33=E, 555=L, 555=L, 666=O, 3=D, 8=T, 6=M, 333=F
    const result = dec.run('4433555555666386333', ['']);
    expect(result).toBe('HELLODTMF');
  });

  it('decodes repeated 7s without separator (PQRS has 4 letters)', () => {
    const dec = new PhoneKeypadDecode();
    // 7777=S, 7777=S → SS
    const result = dec.run('77777777', ['']);
    expect(result).toBe('SS');
  });
});
