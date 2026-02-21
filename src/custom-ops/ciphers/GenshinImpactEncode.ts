import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { SCRIPTS } from '../_lib/genshinScripts';

const NAME = 'Genshin Impact Cipher Encode';

const SCRIPT_NAMES = Object.keys(SCRIPTS);

class GenshinImpactEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Encodes text using Teyvat script substitutions from Genshin Impact. ' +
      'Each region (Mondstadt, Liyue, Inazuma, Sumeru, Fontaine) has its own 1:1 letter mapping.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Script', type: 'option', value: SCRIPT_NAMES },
    ];
  }

  run(input: string, args: any[]): string {
    const scriptName = (args[0] as string) || 'Mondstadt';
    const script = SCRIPTS[scriptName];
    if (!script) return input;

    let result = '';
    for (const ch of input) {
      const upper = ch.toUpperCase();
      if (upper >= 'A' && upper <= 'Z') {
        const mapped = script[upper] || ch;
        result += ch === upper ? mapped : mapped.toLowerCase();
      } else {
        result += ch;
      }
    }
    return result;
  }
}

registerCustomOp(GenshinImpactEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Genshin Impact Cipher encode — Teyvat script substitution.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Script', type: 'option', value: SCRIPT_NAMES },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default GenshinImpactEncode;
