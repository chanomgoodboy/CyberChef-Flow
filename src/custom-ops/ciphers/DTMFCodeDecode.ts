import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'DTMF Code Decode';

const DTMF_REVERSE: Record<string, string> = {
  '697+1209': '1', '697+1336': '2', '697+1477': '3', '697+1633': 'A',
  '770+1209': '4', '770+1336': '5', '770+1477': '6', '770+1633': 'B',
  '852+1209': '7', '852+1336': '8', '852+1477': '9', '852+1633': 'C',
  '941+1209': '*', '941+1336': '0', '941+1477': '#', '941+1633': 'D',
};

class DTMFCodeDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts DTMF frequency pairs back to phone keypad characters. ' +
      '(697,1209)=1, (697,1336)=2, etc.';
    this.infoURL = 'https://www.dcode.fr/dtmf-code';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    const tokens = input.split(/\s+/).filter(Boolean);
    let result = '';
    for (const tok of tokens) {
      if (tok === '/') {
        result += ' ';
        continue;
      }
      const normalized = tok.replace(/[()]/g, '').replace(/[,;]/, '+');
      const ch = DTMF_REVERSE[normalized];
      if (ch) {
        result += ch;
      } else {
        result += tok;
      }
    }
    return result;
  }
}

registerCustomOp(DTMFCodeDecode, {
  name: NAME,
  module: 'Custom',
  description: 'DTMF Code decode — frequency pairs to phone keypad characters.',
  infoURL: 'https://www.dcode.fr/dtmf-code',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default DTMFCodeDecode;
