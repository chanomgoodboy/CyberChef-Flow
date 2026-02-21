import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { WEATHER_REVERSE } from '../_lib/weatherCodes';

const NAME = 'Weather WKS Encode';

class WeatherWKSEncode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts weather descriptions to METAR/WKS short codes. ' +
      'E.g., "Rain" → RA, "Thunderstorm" → TS, "Fog" → FG.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    const words = input.split(/\s*,\s*|\s*;\s*|\n/).filter(Boolean);
    const parts: string[] = [];
    for (const word of words) {
      const code = WEATHER_REVERSE[word.trim().toLowerCase()];
      parts.push(code ?? `[${word.trim()}]`);
    }
    return parts.join(' ');
  }
}

registerCustomOp(WeatherWKSEncode, {
  name: NAME,
  module: 'Custom',
  description: 'Weather WKS encode — descriptions to METAR short codes.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default WeatherWKSEncode;
