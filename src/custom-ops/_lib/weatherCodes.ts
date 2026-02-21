/**
 * Short Weather WKS (Wetterkurzschlüssel) codes.
 * Meteorological station observation codes used in weather reports.
 */

export const WEATHER_CODES: Record<string, string> = {
  // Present weather phenomena
  'RA': 'Rain',
  'SN': 'Snow',
  'DZ': 'Drizzle',
  'FG': 'Fog',
  'BR': 'Mist',
  'HZ': 'Haze',
  'FU': 'Smoke',
  'DU': 'Dust',
  'SA': 'Sand',
  'TS': 'Thunderstorm',
  'SH': 'Shower',
  'GR': 'Hail',
  'GS': 'Small hail',
  'PE': 'Ice pellets',
  'IC': 'Ice crystals',
  'PL': 'Ice pellets',
  'SG': 'Snow grains',
  'UP': 'Unknown precipitation',
  'FZ': 'Freezing',
  'MI': 'Shallow',
  'PR': 'Partial',
  'BC': 'Patches',
  'DR': 'Drifting',
  'BL': 'Blowing',
  'VC': 'Vicinity',
  'RE': 'Recent',
  // Cloud types
  'CI': 'Cirrus',
  'CS': 'Cirrostratus',
  'CC': 'Cirrocumulus',
  'AS': 'Altostratus',
  'AC': 'Altocumulus',
  'NS': 'Nimbostratus',
  'SC': 'Stratocumulus',
  'ST': 'Stratus',
  'CU': 'Cumulus',
  'CB': 'Cumulonimbus',
  'TCU': 'Towering cumulus',
  // Sky condition
  'SKC': 'Sky clear',
  'CLR': 'Clear',
  'FEW': 'Few',
  'SCT': 'Scattered',
  'BKN': 'Broken',
  'OVC': 'Overcast',
  'VV': 'Vertical visibility',
  // Visibility/intensity
  'P6SM': 'Visibility > 6 statute miles',
  'CAVOK': 'Ceiling and visibility OK',
  // Wind
  'KT': 'Knots',
  'G': 'Gusting',
  'VRB': 'Variable',
  // Intensity
  '+': 'Heavy',
  '-': 'Light',
  // Miscellaneous
  'NSW': 'No significant weather',
  'NOSIG': 'No significant change',
  'BECMG': 'Becoming',
  'TEMPO': 'Temporary',
  'METAR': 'Meteorological aerodrome report',
  'TAF': 'Terminal aerodrome forecast',
  'SPECI': 'Special report',
  'RMK': 'Remark',
  'AUTO': 'Automated',
  'COR': 'Correction',
};

// Build reverse map: lowercase description → code
export const WEATHER_REVERSE: Record<string, string> = {};
for (const [code, desc] of Object.entries(WEATHER_CODES)) {
  WEATHER_REVERSE[desc.toLowerCase()] = code;
}
