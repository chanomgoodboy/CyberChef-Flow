import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { polyalphabeticCipher } from '../_lib/polyalphabetic';

const NAME = 'Variant Beaufort Cipher Encode';

class VariantBeaufortCipherEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'The Variant Beaufort cipher uses C = (P - K) mod 26. Unlike the standard Beaufort cipher, it is NOT reciprocal.';
    this.infoURL = 'https://www.dcode.fr/variant-beaufort-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Key', type: 'string', value: 'SECRET' },
    ];
  }

  run(input: string, args: any[]): string {
    const key = (args[0] as string) || 'SECRET';
    return polyalphabeticCipher(input, key, (pIdx, kIdx) => pIdx - kIdx);
  }
}

registerCustomOp(VariantBeaufortCipherEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Variant Beaufort cipher encode — C = (P - K) mod 26.',
  infoURL: 'https://www.dcode.fr/variant-beaufort-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [{ name: 'Key', type: 'string', value: 'SECRET' }],
  flowControl: false,
}, 'Classical Ciphers');

export default VariantBeaufortCipherEncode;
