import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'ALT Codes Encode';

class ALTCodesEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts each character to its Windows ALT code (decimal code point). ' +
      'A=65, B=66, etc. Format as plain numbers or with ALT+ prefix.';
    this.infoURL = 'https://www.dcode.fr/alt-codes';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Format',
        type: 'option',
        value: ['Decimal', 'ALT+ prefix'],
      },
      {
        name: 'Separator',
        type: 'option',
        value: ['Space', 'Comma', 'Line feed'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const format = (args[0] as string) || 'Decimal';
    const sepName = (args[1] as string) || 'Space';
    const sep = sepName === 'Comma' ? ',' : sepName === 'Line feed' ? '\n' : ' ';
    const prefix = format === 'ALT+ prefix' ? 'ALT+' : '';

    const parts: string[] = [];
    for (const ch of input) {
      parts.push(prefix + ch.codePointAt(0));
    }
    return parts.join(sep);
  }
}

registerCustomOp(ALTCodesEncode, {
  name: NAME,
  module: 'Custom',
  description: 'ALT Codes encode — characters to Windows ALT+numpad decimal codes.',
  infoURL: 'https://www.dcode.fr/alt-codes',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Format', type: 'option', value: ['Decimal', 'ALT+ prefix'] },
    { name: 'Separator', type: 'option', value: ['Space', 'Comma', 'Line feed'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default ALTCodesEncode;
