import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Book Cipher Decode';

class BookCipher extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description = 'Decodes a book cipher (also called running key cipher). The input contains indices referencing words or characters in a book/key text. Supports word-index and char-index modes.';
    this.infoURL = 'https://en.wikipedia.org/wiki/Book_cipher';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      { name: 'Book / Key text', type: 'text', value: '', rows: 5 },
      {
        name: 'Mode',
        type: 'option',
        value: ['Word index (first letter)', 'Character index'],
      },
      { name: 'Index base', type: 'option', value: ['1 (one-based)', '0 (zero-based)'] },
      { name: 'Separator', type: 'string', value: ' ' },
    ];
  }

  run(input: string, args: any[]): string {
    const bookText = (args[0] as string) || '';
    const mode = (args[1] as string) || 'Word index (first letter)';
    const base = (args[2] as string || '').startsWith('0') ? 0 : 1;
    const sep = (args[3] as string) ?? ' ';

    if (!bookText) throw new Error('Book/Key text is required.');

    const indices = input.trim().split(sep).filter(Boolean).map(Number);

    if (mode === 'Character index') {
      return indices.map((idx) => {
        const pos = idx - base;
        return pos >= 0 && pos < bookText.length ? bookText[pos] : '?';
      }).join('');
    }

    // Word index mode: split book into words, take first letter of each indexed word
    const words = bookText.split(/\s+/).filter(Boolean);
    return indices.map((idx) => {
      const pos = idx - base;
      return pos >= 0 && pos < words.length ? words[pos][0] : '?';
    }).join('');
  }
}

registerCustomOp(BookCipher, {
  name: NAME,
  module: 'Custom',
  description: 'Book cipher decode — indices reference words/chars in a key text.',
  infoURL: 'https://en.wikipedia.org/wiki/Book_cipher',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Book / Key text', type: 'text', value: '', rows: 5 },
    { name: 'Mode', type: 'option', value: ['Word index (first letter)', 'Character index'] },
    { name: 'Index base', type: 'option', value: ['1 (one-based)', '0 (zero-based)'] },
    { name: 'Separator', type: 'string', value: ' ' },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default BookCipher;
