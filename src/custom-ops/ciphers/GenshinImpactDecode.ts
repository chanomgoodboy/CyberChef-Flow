import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { SCRIPTS, reverseScript } from '../_lib/genshinScripts';

const NAME = 'Genshin Impact Cipher Decode';

const SCRIPT_NAMES = Object.keys(SCRIPTS);

class GenshinImpactDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Decodes Teyvat script substitutions from Genshin Impact back to plain text.';
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

    const rev = reverseScript(script);

    let result = '';
    for (const ch of input) {
      const upper = ch.toUpperCase();
      if (upper >= 'A' && upper <= 'Z') {
        const mapped = rev[upper] || ch;
        result += ch === upper ? mapped : mapped.toLowerCase();
      } else {
        result += ch;
      }
    }
    return result;
  }
}

registerCustomOp(GenshinImpactDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Genshin Impact Cipher decode — reverse Teyvat script substitution.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Script', type: 'option', value: SCRIPT_NAMES },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default GenshinImpactDecode;
