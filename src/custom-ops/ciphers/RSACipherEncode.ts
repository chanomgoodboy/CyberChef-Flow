import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { modPow, parseBigIntInput, formatBigIntOutput, type BigIntFormat } from '../_lib/rsa';

const NAME = 'RSA Cipher Encode';

/**
 * Textbook RSA encryption: c = m^e mod n (no padding).
 */
class RSACipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Textbook RSA encryption: c = m^e mod n.\n\n' +
      'No padding (PKCS#1, OAEP, etc.) is applied — this is raw/educational RSA ' +
      'as used on dcode.fr and in CTF challenges.\n\n' +
      'Enter n and e as decimal or 0x-prefixed hex.';
    this.infoURL = 'https://en.wikipedia.org/wiki/RSA_(cryptosystem)';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Modulus (n)', type: 'string', value: '' },
      { name: 'Public exponent (e)', type: 'string', value: '65537' },
      { name: 'Input format', type: 'option', value: ['Text', 'Decimal', 'Hex'] },
      { name: 'Output format', type: 'option', value: ['Decimal', 'Hex', 'Text'] },
    ];
  }

  run(input: string, args: any[]): string {
    const nStr = (args[0] as string).trim();
    const eStr = (args[1] as string).trim();
    const inputFmt = args[2] as BigIntFormat;
    const outputFmt = args[3] as BigIntFormat;

    if (!nStr) throw new Error('Modulus (n) is required');
    if (!eStr) throw new Error('Public exponent (e) is required');

    const n = parseBigInt(nStr);
    const e = parseBigInt(eStr);

    if (n <= 0n) throw new Error('Modulus (n) must be positive');
    if (e <= 0n) throw new Error('Public exponent (e) must be positive');

    const m = parseBigIntInput(input, inputFmt);

    if (m < 0n) throw new Error('Plaintext must be non-negative');
    if (m >= n) throw new Error(`Plaintext m (${m.toString().length} digits) must be less than n (${n.toString().length} digits)`);

    const c = modPow(m, e, n);
    return formatBigIntOutput(c, outputFmt);
  }
}

/** Parse a decimal or 0x-hex string to BigInt. */
function parseBigInt(s: string): bigint {
  if (s.startsWith('0x') || s.startsWith('0X')) {
    return BigInt(s);
  }
  return BigInt(s);
}

registerCustomOp(RSACipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Textbook RSA encrypt — c = m^e mod n (no padding, CTF/educational).',
  infoURL: 'https://en.wikipedia.org/wiki/RSA_(cryptosystem)',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Modulus (n)', type: 'string', value: '' },
    { name: 'Public exponent (e)', type: 'string', value: '65537' },
    { name: 'Input format', type: 'option', value: ['Text', 'Decimal', 'Hex'] },
    { name: 'Output format', type: 'option', value: ['Decimal', 'Hex', 'Text'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default RSACipherEncode;
