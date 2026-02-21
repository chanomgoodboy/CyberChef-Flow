import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Kenny Language Encode';

// A=mmm, B=mmp, C=mmf, D=mpm, E=mpp, F=mpf, G=mfm, H=mfp, I=mff,
// J=pmm, K=pmp, L=pmf, M=ppm, N=ppp, O=ppf, P=pfm, Q=pfp, R=pff,
// S=fmm, T=fmp, U=fmf, V=fpm, W=fpp, X=fpf, Y=ffm, Z=ffp
const KENNY_MAP: Record<string, string> = {};
const KENNY_CHARS = 'mpf';
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
for (let i = 0; i < 26; i++) {
  const a = Math.floor(i / 9);
  const b = Math.floor((i % 9) / 3);
  const c = i % 3;
  KENNY_MAP[ALPHA[i]] = KENNY_CHARS[a] + KENNY_CHARS[b] + KENNY_CHARS[c];
}

class KennyLanguageEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encodes text in Kenny Language (South Park). Each letter becomes a 3-character ' +
      'combination of m, p, and f. A=mmm, B=mmp, C=mmf, etc.';
    this.infoURL = 'https://www.dcode.fr/kenny-language';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    let result = '';
    for (const ch of input) {
      const upper = ch.toUpperCase();
      const code = KENNY_MAP[upper];
      if (code) {
        // Preserve case pattern: first char case matches input
        result += ch === upper ? code.toUpperCase() : code;
      } else {
        result += ch;
      }
    }
    return result;
  }
}

registerCustomOp(KennyLanguageEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Kenny Language encode — letters to mpf trigrams (South Park cipher).',
  infoURL: 'https://www.dcode.fr/kenny-language',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default KennyLanguageEncode;
export { KENNY_MAP };
