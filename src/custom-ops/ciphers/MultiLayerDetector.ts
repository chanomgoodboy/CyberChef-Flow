import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { identifyCipher, type CipherMatch } from '../_lib/cipherIdentifier';

const NAME = 'Multi-Layer Detector';

/**
 * Repeatedly apply the Cipher Identifier to peel off layers of stacked
 * encodings. E.g., Base64(ROT13(Hex("test"))) → detects Base64 first,
 * decodes, then detects ROT13, decodes, then detects Hex, decodes.
 *
 * Only auto-peels encodings that produce a "reversed" (decoded) output
 * in the identifier results, so it won't break on ambiguous detections.
 */
class MultiLayerDetector extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Repeatedly identify and decode stacked ciphers/encodings. ' +
      'Peels layers one at a time (e.g., Base64 → ROT13 → Hex). ' +
      'Shows each layer detected and the intermediate results.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [
      {
        name: 'Max Layers',
        type: 'number',
        value: 10,
      },
      {
        name: 'Min Score',
        type: 'number',
        value: 50,
      },
    ];
  }

  run(input: string, args: any[]): string {
    const maxLayers = Math.max(1, Math.min((args[0] as number) ?? 10, 50));
    const minScore = (args[1] as number) ?? 50;

    let current = input;
    const layers: { layer: number; cipher: string; score: number; preview: string }[] = [];

    for (let i = 0; i < maxLayers; i++) {
      if (current.trim().length < 2) break;

      const matches = identifyCipher(current);
      // Find first high-confidence match that has a reversed (decoded) output
      const best = matches.find(
        (m: CipherMatch) => m.score >= minScore && m.reversed && m.reversed.trim().length > 0
      );

      if (!best || !best.reversed) break;

      // Check we're not in a loop (output same as input)
      if (best.reversed === current) break;

      layers.push({
        layer: i + 1,
        cipher: best.name,
        score: best.score,
        preview: best.reversed.length > 100 ? best.reversed.slice(0, 100) + '...' : best.reversed,
      });

      current = best.reversed;
    }

    if (layers.length === 0) {
      return 'No decodable layers detected (try lowering Min Score).';
    }

    const lines: string[] = [];
    lines.push(`Detected ${layers.length} layer(s):\n`);
    for (const l of layers) {
      lines.push(`Layer ${l.layer}: ${l.cipher} (score ${l.score})`);
      lines.push(`  → ${l.preview}`);
    }
    lines.push(`\nFinal result:\n${current}`);

    return lines.join('\n');
  }
}

registerCustomOp(MultiLayerDetector, {
  name: NAME,
  module: 'Custom',
  description: 'Peel stacked cipher/encoding layers automatically.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [
    { name: 'Max Layers', type: 'number', value: 10 },
    { name: 'Min Score', type: 'number', value: 50 },
  ],
  flowControl: false,
}, 'Classical Ciphers');

export default MultiLayerDetector;
