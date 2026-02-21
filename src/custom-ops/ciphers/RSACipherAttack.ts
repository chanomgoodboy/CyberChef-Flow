import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import {
  modPow,
  derivePrivateKey,
  parseBigIntInput,
  formatBigIntOutput,
  smallEAttack,
  wienerAttack,
  fermatFactor,
  pollardPm1,
  pollardRho,
  commonModulusAttack,
  hastadAttack,
  factorDBAttack,
  type BigIntFormat,
  type AttackResult,
} from '../_lib/rsa';

const NAME = 'RSA Cipher Attack';

const ATTACKS = [
  'Auto',
  'FactorDB',
  'Small e',
  "Wiener's",
  'Fermat',
  'Pollard p-1',
  'Pollard rho',
  'Common Modulus',
  'Hastad Broadcast',
] as const;

type AttackMode = (typeof ATTACKS)[number];

/**
 * Textbook RSA attack tool — tries common CTF attacks to recover plaintext.
 */
class RSACipherAttack extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Automatic RSA attack tool for CTF challenges.\n\n' +
      'Attacks available:\n' +
      '• Auto — tries all applicable attacks in sequence\n' +
      '• FactorDB — looks up n in factordb.com to get p, q\n' +
      '• Small e — when e is small (3, 5, ...) and m^e < n\n' +
      "• Wiener's — when d is small (d < n^{1/4}/3)\n" +
      '• Fermat — when p and q are close together\n' +
      '• Pollard p-1 — when p-1 is B-smooth\n' +
      '• Pollard rho — general-purpose probabilistic factoring\n' +
      '• Common Modulus — same n, different e1/e2, two ciphertexts\n' +
      '• Hastad Broadcast — same small e, different n, e ciphertexts\n\n' +
      'Input is the ciphertext. All numeric params accept decimal or 0x hex.';
    this.infoURL = 'https://en.wikipedia.org/wiki/RSA_(cryptosystem)';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Attack', type: 'option', value: [...ATTACKS] },
      { name: 'Modulus (n)', type: 'string', value: '' },
      { name: 'Public exponent (e)', type: 'string', value: '65537' },
      { name: 'Second ciphertext (c2)', type: 'string', value: '' },
      { name: 'Second exponent (e2)', type: 'string', value: '' },
      { name: 'n,c pairs JSON', type: 'string', value: '' },
      { name: 'Input format', type: 'option', value: ['Decimal', 'Hex', 'Text'] },
      { name: 'Output format', type: 'option', value: ['Text', 'Decimal', 'Hex'] },
      { name: 'Show details', type: 'boolean', value: true },
    ];
  }

  async run(input: string, args: any[]): Promise<string> {
    const mode = args[0] as AttackMode;
    const nStr = (args[1] as string).trim();
    const eStr = (args[2] as string).trim();
    const c2Str = (args[3] as string).trim();
    const e2Str = (args[4] as string).trim();
    const pairsJson = (args[5] as string).trim();
    const inputFmt = args[6] as BigIntFormat;
    const outputFmt = args[7] as BigIntFormat;
    const showDetails = args[8] as boolean;

    const n = nStr ? parseBigIntParam(nStr) : 0n;
    const e = eStr ? parseBigIntParam(eStr) : 65537n;
    const c = parseBigIntInput(input, inputFmt);

    // Determine which attacks to try
    const attackList: AttackMode[] =
      mode === 'Auto'
        ? ['FactorDB', 'Small e', "Wiener's", 'Fermat', 'Pollard p-1', 'Pollard rho']
        : [mode];

    const errors: string[] = [];

    for (const attack of attackList) {
      try {
        const result = await this.tryAttack(
          attack, c, n, e, c2Str, e2Str, pairsJson,
        );
        if (result) {
          const plaintext = formatBigIntOutput(result.m, outputFmt);
          if (showDetails) {
            const lines = [`[${result.attack}]`];
            for (const [k, v] of Object.entries(result.details)) {
              lines.push(`${k}: ${v}`);
            }
            lines.push('', plaintext);
            return lines.join('\n');
          }
          return plaintext;
        }
      } catch (err: any) {
        errors.push(`${attack}: ${err.message}`);
      }
    }

    const tried = attackList.join(', ');
    const errDetail = errors.length ? '\n\nErrors:\n' + errors.join('\n') : '';
    throw new Error(`No attack succeeded (tried: ${tried}).${errDetail}`);
  }

  private async tryAttack(
    attack: AttackMode,
    c: bigint,
    n: bigint,
    e: bigint,
    c2Str: string,
    e2Str: string,
    pairsJson: string,
  ): Promise<AttackResult | null> {
    switch (attack) {
      case 'FactorDB': {
        if (!n) return null;
        return factorDBAttack(n, e, c);
      }

      case 'Small e': {
        if (!n) return null;
        return smallEAttack(c, e, n);
      }

      case "Wiener's": {
        if (!n) return null;
        return wienerAttack(e, n, c);
      }

      case 'Fermat': {
        if (!n) return null;
        const factors = fermatFactor(n);
        if (!factors) return null;
        return factorsToResult('Fermat', factors.p, factors.q, e, c, n);
      }

      case 'Pollard p-1': {
        if (!n) return null;
        const factors = pollardPm1(n);
        if (!factors) return null;
        return factorsToResult('Pollard p-1', factors.p, factors.q, e, c, n);
      }

      case 'Pollard rho': {
        if (!n) return null;
        const factors = pollardRho(n);
        if (!factors) return null;
        return factorsToResult('Pollard rho', factors.p, factors.q, e, c, n);
      }

      case 'Common Modulus': {
        if (!n || !c2Str || !e2Str) {
          throw new Error('Common Modulus requires n, e, c2, e2');
        }
        const c2 = parseBigIntParam(c2Str);
        const e2 = parseBigIntParam(e2Str);
        return commonModulusAttack(n, e, c, e2, c2);
      }

      case 'Hastad Broadcast': {
        if (!pairsJson) {
          throw new Error('Hastad requires n,c pairs JSON: [[n2,c2],[n3,c3],...]');
        }
        const rawPairs = JSON.parse(pairsJson) as [string, string][];
        const allPairs = [
          { n, c },
          ...rawPairs.map(([ni, ci]) => ({
            n: parseBigIntParam(String(ni)),
            c: parseBigIntParam(String(ci)),
          })),
        ];
        return hastadAttack(allPairs, e);
      }

      default:
        return null;
    }
  }
}

function factorsToResult(
  name: string,
  p: bigint,
  q: bigint,
  e: bigint,
  c: bigint,
  n: bigint,
): AttackResult {
  const { d, phi } = derivePrivateKey(p, q, e);
  const m = modPow(c, d, n);
  return {
    attack: name,
    m,
    details: {
      p: p.toString(),
      q: q.toString(),
      d: d.toString(),
      phi: phi.toString(),
    },
  };
}

function parseBigIntParam(s: string): bigint {
  if (s.startsWith('0x') || s.startsWith('0X')) return BigInt(s);
  return BigInt(s);
}

registerCustomOp(RSACipherAttack, {
  name: NAME,
  module: 'Custom',
  description: 'RSA attack tool — auto-try FactorDB, small e, Wiener, Fermat, Pollard, etc.',
  infoURL: 'https://en.wikipedia.org/wiki/RSA_(cryptosystem)',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Attack', type: 'option', value: [...ATTACKS] },
    { name: 'Modulus (n)', type: 'string', value: '' },
    { name: 'Public exponent (e)', type: 'string', value: '65537' },
    { name: 'Second ciphertext (c2)', type: 'string', value: '' },
    { name: 'Second exponent (e2)', type: 'string', value: '' },
    { name: 'n,c pairs JSON', type: 'string', value: '' },
    { name: 'Input format', type: 'option', value: ['Decimal', 'Hex', 'Text'] },
    { name: 'Output format', type: 'option', value: ['Text', 'Decimal', 'Hex'] },
    { name: 'Show details', type: 'boolean', value: true },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default RSACipherAttack;
