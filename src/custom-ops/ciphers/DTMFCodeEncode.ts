import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'DTMF Code Encode';

const DTMF_TABLE: Record<string, [number, number]> = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477], 'A': [697, 1633],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477], 'B': [770, 1633],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477], 'C': [852, 1633],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477], 'D': [941, 1633],
};

class DTMFCodeEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts phone keypad characters to DTMF (Dual-Tone Multi-Frequency) frequency pairs. ' +
      '1=(697,1209), 2=(697,1336), etc.';
    this.infoURL = 'https://www.dcode.fr/dtmf-code';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Format',
        type: 'option',
        value: ['Frequency pairs', 'Key names'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const format = (args[0] as string) || 'Frequency pairs';

    const parts: string[] = [];
    for (const ch of input) {
      const upper = ch.toUpperCase();
      const freqs = DTMF_TABLE[upper];
      if (freqs) {
        if (format === 'Key names') {
          parts.push(upper);
        } else {
          parts.push(`${freqs[0]}+${freqs[1]}`);
        }
      } else if (ch === ' ') {
        parts.push('/');
      }
    }
    return parts.join(' ');
  }
}

registerCustomOp(DTMFCodeEncode, {
  name: NAME,
  module: 'Custom',
  description: 'DTMF Code encode — characters to dual-frequency tone pairs.',
  infoURL: 'https://www.dcode.fr/dtmf-code',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Format', type: 'option', value: ['Frequency pairs', 'Key names'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default DTMFCodeEncode;
