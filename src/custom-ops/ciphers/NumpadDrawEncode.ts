import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Numeric Keypad Draw Encode';

// Letters drawn on phone numpad (3x4 layout: 1-9, *, 0, #)
// Phone layout:  1 2 3 / 4 5 6 / 7 8 9 / * 0 #
// Each letter shape is a sequence of numpad keys tracing the letter
const PHONE_SHAPES: Record<string, string> = {
  A: '7-8-9-4-6-1-3', B: '1-4-7-8-9-6-5-4-3-2-1', C: '3-2-1-4-7-8-9',
  D: '1-4-7-8-9-6-3-2-1', E: '3-2-1-4-5-4-7-8-9', F: '3-2-1-4-5-4-7',
  G: '3-2-1-4-7-8-9-6-5', H: '1-4-7-5-6-3-9', I: '1-2-3-2-5-8-7-8-9',
  J: '1-2-3-6-9-8-7', K: '1-4-7-4-2-6-4-8', L: '1-4-7-8-9',
  M: '7-4-1-5-3-6-9', N: '7-4-1-5-9-6-3', O: '1-2-3-6-9-8-7-4-1',
  P: '7-4-1-2-3-6-5-4', Q: '2-1-4-8-9-6-3-2', R: '7-4-1-2-3-6-5-4-8',
  S: '3-2-1-4-5-6-9-8-7', T: '1-2-3-2-5-8', U: '1-4-7-8-9-6-3',
  V: '1-4-8-6-3', W: '1-4-7-5-9-6-3', X: '1-5-9-3-5-7',
  Y: '1-5-3-5-8', Z: '1-2-3-5-7-8-9',
};

// Calculator layout: 7 8 9 / 4 5 6 / 1 2 3 / 0 . =
const CALC_SHAPES: Record<string, string> = {
  A: '1-2-3-4-6-7-9', B: '7-4-1-2-3-6-5-4-9-8-7', C: '9-8-7-4-1-2-3',
  D: '7-4-1-2-3-6-9-8-7', E: '9-8-7-4-5-4-1-2-3', F: '9-8-7-4-5-4-1',
  G: '9-8-7-4-1-2-3-6-5', H: '7-4-1-5-6-9-3', I: '7-8-9-8-5-2-1-2-3',
  J: '7-8-9-6-3-2-1', K: '7-4-1-4-8-6-4-2', L: '7-4-1-2-3',
  M: '1-4-7-5-9-6-3', N: '1-4-7-5-3-6-9', O: '7-8-9-6-3-2-1-4-7',
  P: '1-4-7-8-9-6-5-4', Q: '8-7-4-2-3-6-9-8', R: '1-4-7-8-9-6-5-4-2',
  S: '9-8-7-4-5-6-3-2-1', T: '7-8-9-8-5-2', U: '7-4-1-2-3-6-9',
  V: '7-4-2-6-9', W: '7-4-1-5-3-6-9', X: '7-5-3-9-5-1',
  Y: '7-5-9-5-2', Z: '7-8-9-5-1-2-3',
};

class NumpadDrawEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Traces letter shapes on a numeric keypad. Each letter is represented by the ' +
      'sequence of keys you would press to draw it on a phone or calculator numpad.';
    this.infoURL = 'https://www.dcode.fr/numpad-draw-cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Keypad',
        type: 'option',
        value: ['Phone', 'Calculator'],
      },
      {
        name: 'Separator',
        type: 'option',
        value: ['Space', 'Line feed'],
      },
    ];
  }

  run(input: string, args: any[]): string {
    const keypad = (args[0] as string) || 'Phone';
    const sepName = (args[1] as string) || 'Space';
    const sep = sepName === 'Line feed' ? '\n' : ' ';
    const shapes = keypad === 'Calculator' ? CALC_SHAPES : PHONE_SHAPES;

    const parts: string[] = [];
    for (const ch of input) {
      const upper = ch.toUpperCase();
      const shape = shapes[upper];
      if (shape) {
        parts.push(shape);
      } else if (ch === ' ') {
        parts.push('/');
      }
    }
    return parts.join(sep);
  }
}

registerCustomOp(NumpadDrawEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Numeric Keypad Draw encode — letters to numpad key sequences.',
  infoURL: 'https://www.dcode.fr/numpad-draw-cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Keypad', type: 'option', value: ['Phone', 'Calculator'] },
    { name: 'Separator', type: 'option', value: ['Space', 'Line feed'] },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default NumpadDrawEncode;
