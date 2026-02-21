import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'K7 Code Encode';

/**
 * K7 Code — Cassette tape counter values → letters.
 * The tape counter on a C-60/C-90 cassette increments linearly.
 * Map letter positions (A=1..Z=26) to counter positions.
 * Counter increment per letter = total_range / 26.
 */
class K7CodeEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encodes letters as cassette tape counter positions. ' +
      'A=first position, Z=last position, evenly spaced across the tape range.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Tape Length', type: 'option', value: ['C-60 (000-300)', 'C-90 (000-450)', 'C-120 (000-600)'] },
      { name: 'Separator', type: 'option', value: ['Space', 'Comma'] },
    ];
  }

  run(input: string, args: any[]): string {
    const tapeName = (args[0] as string) || 'C-60 (000-300)';
    const sepName = (args[1] as string) || 'Space';
    const sep = sepName === 'Comma' ? ',' : ' ';

    let maxCounter = 300;
    if (tapeName.includes('C-90')) maxCounter = 450;
    else if (tapeName.includes('C-120')) maxCounter = 600;

    const step = maxCounter / 26;
    const parts: string[] = [];

    for (const ch of input) {
      const code = ch.toUpperCase().charCodeAt(0);
      if (code >= 65 && code <= 90) {
        const pos = Math.round((code - 64) * step);
        parts.push(String(pos).padStart(3, '0'));
      } else if (ch === ' ') {
        parts.push('/');
      }
    }
    return parts.join(sep);
  }
}

registerCustomOp(K7CodeEncode, {
  name: NAME,
  module: 'Custom',
  description: 'K7 Code encode — letters to cassette tape counter positions.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Tape Length', type: 'option', value: ['C-60 (000-300)', 'C-90 (000-450)', 'C-120 (000-600)'] },
    { name: 'Separator', type: 'option', value: ['Space', 'Comma'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default K7CodeEncode;
