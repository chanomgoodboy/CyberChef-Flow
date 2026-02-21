import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import { WEATHER_CODES } from '../_lib/weatherCodes';

const NAME = 'Weather WKS Decode';

class WeatherWKSDecode extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Converts METAR/WKS short codes to weather descriptions. ' +
      'E.g., RA → Rain, TS → Thunderstorm, FG → Fog.';
    this.infoURL = '';
    this.inputType = 'string';
    this.outputType = 'string';
    this.args = [];
  }

  run(input: string, _args: any[]): string {
    const tokens = input.trim().split(/\s+/).filter(Boolean);
    const parts: string[] = [];
    for (const tok of tokens) {
      const desc = WEATHER_CODES[tok.toUpperCase()];
      parts.push(desc ?? tok);
    }
    return parts.join(', ');
  }
}

registerCustomOp(WeatherWKSDecode, {
  name: NAME,
  module: 'Custom',
  description: 'Weather WKS decode — METAR short codes to descriptions.',
  infoURL: '',
  inputType: 'string',
  outputType: 'string',
  args: [],
  flowControl: false,
}, 'Classical Ciphers');

export default WeatherWKSDecode;
