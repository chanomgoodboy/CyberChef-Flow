import { describe, it, expect } from 'vitest';
import { resolveArgDefault, buildDefaultArgs } from './argDefaults';

describe('resolveArgDefault', () => {
  it('returns scalar value for simple types', () => {
    expect(resolveArgDefault({ name: 'a', type: 'string', value: 'hello' })).toBe('hello');
    expect(resolveArgDefault({ name: 'b', type: 'number', value: 42 })).toBe(42);
    expect(resolveArgDefault({ name: 'c', type: 'boolean', value: true })).toBe(true);
  });

  it('picks first choice for option types', () => {
    expect(
      resolveArgDefault({ name: 'delim', type: 'option', value: ['Space', 'Comma', 'Tab'] }),
    ).toBe('Space');
  });

  it('picks first choice value for object options', () => {
    expect(
      resolveArgDefault({
        name: 'algo',
        type: 'editableOption',
        value: [{ name: 'SHA-256', value: 'SHA-256' }, { name: 'SHA-512', value: 'SHA-512' }],
      }),
    ).toBe('SHA-256');
  });

  it('handles toggleString type', () => {
    const result = resolveArgDefault({
      name: 'key',
      type: 'toggleString',
      value: 'abc',
      toggleValues: ['Hex', 'UTF8', 'Base64'],
    });
    expect(result).toEqual({ string: 'abc', option: 'Hex' });
  });

  it('handles empty option arrays gracefully', () => {
    expect(resolveArgDefault({ name: 'x', type: 'option', value: [] })).toBe('');
  });
});

describe('buildDefaultArgs', () => {
  it('returns empty object for unknown operation', () => {
    expect(buildDefaultArgs('NonExistentOperation12345')).toEqual({});
  });

  it('builds defaults for a known operation', () => {
    const args = buildDefaultArgs('To Base64');
    expect(args).toBeDefined();
    expect(typeof args).toBe('object');
  });

  it('applies positional overrides', () => {
    const args = buildDefaultArgs('To Base64', ['custom-alphabet']);
    const keys = Object.keys(args);
    if (keys.length > 0) {
      expect(args[keys[0]]).toBe('custom-alphabet');
    }
  });

  it('skips null/undefined overrides, falling back to defaults', () => {
    const defaults = buildDefaultArgs('To Hex');
    const withNulls = buildDefaultArgs('To Hex', [null, undefined]);
    expect(withNulls).toEqual(defaults);
  });
});
