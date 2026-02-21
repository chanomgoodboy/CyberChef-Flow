import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Twin Hex Cipher Encode';

class TwinHexEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Splits each byte into high and low nibbles, output as separate hex digits with a separator.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Nibble Separator', type: 'option', value: ['Dot', 'Dash', 'Space', 'None'] },
      { name: 'Byte Separator', type: 'option', value: ['Space', 'Comma', 'Newline'] },
    ];
  }

  run(input: string, args: any[]): string {
    const nibSep = (args[0] as string) || 'Dot';
    const byteSep = (args[1] as string) || 'Space';
    const ns = nibSep === 'Dot' ? '.' : nibSep === 'Dash' ? '-' : nibSep === 'Space' ? ' ' : '';
    const bs = byteSep === 'Comma' ? ',' : byteSep === 'Newline' ? '\n' : ' ';

    const parts: string[] = [];
    for (let i = 0; i < input.length; i++) {
      const b = input.charCodeAt(i) & 0xFF;
      const hi = (b >> 4).toString(16).toUpperCase();
      const lo = (b & 0x0F).toString(16).toUpperCase();
      parts.push(`${hi}${ns}${lo}`);
    }
    return parts.join(bs);
  }
}

registerCustomOp(TwinHexEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Twin Hex Cipher encode — split bytes into nibble pairs.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Nibble Separator', type: 'option', value: ['Dot', 'Dash', 'Space', 'None'] },
    { name: 'Byte Separator', type: 'option', value: ['Space', 'Comma', 'Newline'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default TwinHexEncode;
