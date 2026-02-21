import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import {
  modPow,
  derivePrivateKey,
  parseBigIntInput,
  formatBigIntOutput,
  type BigIntFormat,
} from '../_lib/rsa';

const NAME = 'RSA Cipher Decode';

/**
 * Textbook RSA decryption: m = c^d mod n.
 *
 * Two parameter paths:
 * - Path A: Provide (n, d) directly
 * - Path B: Provide (p, q, e) → auto-derive d and n
 */
class RSACipherDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Textbook RSA decryption: m = c^d mod n.\n\n' +
      'Two modes:\n' +
      '• Provide n and d directly, OR\n' +
      '• Provide p, q, and e to auto-compute d = e⁻¹ mod (p−1)(q−1) and n = p×q.\n\n' +
      'No padding is removed — this is raw/educational RSA. ' +
      'All numeric parameters accept decimal or 0x-prefixed hex.';
    this.infoURL = 'https://en.wikipedia.org/wiki/RSA_(cryptosystem)';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Modulus (n)', type: 'string', value: '' },
      { name: 'Private exponent (d)', type: 'string', value: '' },
      { name: 'Prime p', type: 'string', value: '' },
      { name: 'Prime q', type: 'string', value: '' },
      { name: 'Public exponent (e)', type: 'string', value: '65537' },
      { name: 'Input format', type: 'option', value: ['Decimal', 'Hex', 'Text'] },
      { name: 'Output format', type: 'option', value: ['Text', 'Decimal', 'Hex'] },
    ];
  }

  run(input: string, args: any[]): string {
    const nStr = (args[0] as string).trim();
    const dStr = (args[1] as string).trim();
    const pStr = (args[2] as string).trim();
    const qStr = (args[3] as string).trim();
    const eStr = (args[4] as string).trim();
    const inputFmt = args[5] as BigIntFormat;
    const outputFmt = args[6] as BigIntFormat;

    let n: bigint;
    let d: bigint;

    if (dStr && nStr) {
      // Path A: (n, d) provided directly
      n = parseBigInt(nStr);
      d = parseBigInt(dStr);
    } else if (pStr && qStr && eStr) {
      // Path B: derive from (p, q, e)
      const p = parseBigInt(pStr);
      const q = parseBigInt(qStr);
      const e = parseBigInt(eStr);
      const derived = derivePrivateKey(p, q, e);
      d = derived.d;
      n = nStr ? parseBigInt(nStr) : derived.n;
    } else {
      throw new Error(
        'Provide either (n + d) or (p + q + e). ' +
        'Missing required parameters.',
      );
    }

    if (n <= 0n) throw new Error('Modulus (n) must be positive');
    if (d <= 0n) throw new Error('Private exponent (d) must be positive');

    const c = parseBigIntInput(input, inputFmt);
    if (c < 0n) throw new Error('Ciphertext must be non-negative');

    const m = modPow(c, d, n);
    return formatBigIntOutput(m, outputFmt);
  }
}

/** Parse a decimal or 0x-hex string to BigInt. */
function parseBigInt(s: string): bigint {
  if (s.startsWith('0x') || s.startsWith('0X')) {
    return BigInt(s);
  }
  return BigInt(s);
}

registerCustomOp(RSACipherDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Textbook RSA decrypt — m = c^d mod n (auto-derive d from p,q,e).',
  infoURL: 'https://en.wikipedia.org/wiki/RSA_(cryptosystem)',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Modulus (n)', type: 'string', value: '' },
    { name: 'Private exponent (d)', type: 'string', value: '' },
    { name: 'Prime p', type: 'string', value: '' },
    { name: 'Prime q', type: 'string', value: '' },
    { name: 'Public exponent (e)', type: 'string', value: '65537' },
    { name: 'Input format', type: 'option', value: ['Decimal', 'Hex', 'Text'] },
    { name: 'Output format', type: 'option', value: ['Text', 'Decimal', 'Hex'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default RSACipherDecode;
