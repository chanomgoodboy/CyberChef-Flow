import { describe, it, expect } from 'vitest';

import GS8BrailleEncode from '../ciphers/GS8BrailleEncode';
import GS8BrailleDecode from '../ciphers/GS8BrailleDecode';
import WeatherWKSEncode from '../ciphers/WeatherWKSEncode';
import WeatherWKSDecode from '../ciphers/WeatherWKSDecode';
import IndienneCodeEncode from '../ciphers/IndienneCodeEncode';
import IndienneCodeDecode from '../ciphers/IndienneCodeDecode';
import D3CodeEncode from '../ciphers/D3CodeEncode';
import D3CodeDecode from '../ciphers/D3CodeDecode';
import K6CodeEncode from '../ciphers/K6CodeEncode';
import K6CodeDecode from '../ciphers/K6CodeDecode';
import K7CodeEncode from '../ciphers/K7CodeEncode';
import K7CodeDecode from '../ciphers/K7CodeDecode';
import JISKeyboardEncode from '../ciphers/JISKeyboardEncode';
import JISKeyboardDecode from '../ciphers/JISKeyboardDecode';

/* ------------------------------------------------------------------ */
/*  GS8 Braille                                                        */
/* ------------------------------------------------------------------ */
describe('GS8 Braille', () => {
  const enc = new GS8BrailleEncode();
  const dec = new GS8BrailleDecode();

  it('encodes null byte as U+2800', () => {
    expect(enc.run('\x00', [])).toBe('\u2800');
  });

  it('encodes A (0x41) as U+2841', () => {
    expect(enc.run('A', []).codePointAt(0)).toBe(0x2841);
  });

  it('roundtrips ASCII text', () => {
    const ct = enc.run('Hello', []);
    expect(dec.run(ct, [])).toBe('Hello');
  });
});

/* ------------------------------------------------------------------ */
/*  Weather WKS                                                        */
/* ------------------------------------------------------------------ */
describe('Weather WKS', () => {
  const enc = new WeatherWKSEncode();
  const dec = new WeatherWKSDecode();

  it('decodes RA to Rain', () => {
    expect(dec.run('RA', [])).toBe('Rain');
  });

  it('decodes multiple codes', () => {
    expect(dec.run('TS RA FG', [])).toBe('Thunderstorm, Rain, Fog');
  });

  it('encodes Rain to RA', () => {
    expect(enc.run('Rain', [])).toBe('RA');
  });
});

/* ------------------------------------------------------------------ */
/*  Indienne Code                                                      */
/* ------------------------------------------------------------------ */
describe('Indienne Code', () => {
  const enc = new IndienneCodeEncode();
  const dec = new IndienneCodeDecode();

  it('roundtrips with default keyword', () => {
    const ct = enc.run('HELLO', ['INDIENNE', 'Space']);
    expect(dec.run(ct, ['INDIENNE'])).toBe('HELLO');
  });

  it('roundtrips with custom keyword', () => {
    const ct = enc.run('TEST', ['SECRET', 'Space']);
    expect(dec.run(ct, ['SECRET'])).toBe('TEST');
  });
});

/* ------------------------------------------------------------------ */
/*  D3 Code                                                            */
/* ------------------------------------------------------------------ */
describe('D3 Code', () => {
  const enc = new D3CodeEncode();
  const dec = new D3CodeDecode();

  it('roundtrips with default keyword', () => {
    const ct = enc.run('HELLO', ['RESISTANCE', 'Space']);
    expect(dec.run(ct, ['RESISTANCE'])).toBe('HELLO');
  });

  it('produces 3-digit groups', () => {
    const ct = enc.run('A', ['RESISTANCE', 'Space']);
    expect(ct).toMatch(/^\d{3}$/);
  });
});

/* ------------------------------------------------------------------ */
/*  K6 Code                                                            */
/* ------------------------------------------------------------------ */
describe('K6 Code', () => {
  const enc = new K6CodeEncode();
  const dec = new K6CodeDecode();

  it('encodes A as 2-1', () => {
    expect(enc.run('A', ['Key-Position (e.g. 2-1)'])).toBe('2-1');
  });

  it('roundtrips key-position format', () => {
    const ct = enc.run('HELLO', ['Key-Position (e.g. 2-1)']);
    expect(dec.run(ct, ['Key-Position (e.g. 2-1)'])).toBe('HELLO');
  });

  it('multi-tap format', () => {
    const ct = enc.run('AB', ['Multi-tap (e.g. 2)']);
    expect(ct).toBe('2 22');
  });
});

/* ------------------------------------------------------------------ */
/*  K7 Code                                                            */
/* ------------------------------------------------------------------ */
describe('K7 Code', () => {
  const enc = new K7CodeEncode();
  const dec = new K7CodeDecode();

  it('roundtrips C-60', () => {
    const ct = enc.run('HELLO', ['C-60 (000-300)', 'Space']);
    expect(dec.run(ct, ['C-60 (000-300)'])).toBe('HELLO');
  });

  it('A maps to low counter, Z to high counter', () => {
    const aCode = enc.run('A', ['C-60 (000-300)', 'Space']);
    const zCode = enc.run('Z', ['C-60 (000-300)', 'Space']);
    expect(parseInt(aCode, 10)).toBeLessThan(parseInt(zCode, 10));
  });
});

/* ------------------------------------------------------------------ */
/*  JIS Keyboard                                                       */
/* ------------------------------------------------------------------ */
describe('JIS Keyboard', () => {
  const enc = new JISKeyboardEncode();
  const dec = new JISKeyboardDecode();

  it('Q maps to た', () => {
    expect(enc.run('Q', [])).toBe('た');
  });

  it('roundtrips QWERTY', () => {
    const ct = enc.run('QWERTY', []);
    expect(dec.run(ct, [])).toBe('QWERTY');
  });

  it('preserves spaces', () => {
    const ct = enc.run('Q W', []);
    expect(ct).toContain(' ');
    expect(dec.run(ct, [])).toBe('Q W');
  });
});
