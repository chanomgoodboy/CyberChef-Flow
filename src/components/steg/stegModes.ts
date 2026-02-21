/** Stegsolve-compatible image transform modes (39 total). */

export interface StegMode {
  id: number;
  name: string;
  shortName: string;
}

function bitPlanes(
  channel: string,
  prefix: string,
  startId: number,
): StegMode[] {
  const modes: StegMode[] = [];
  for (let bit = 7; bit >= 0; bit--) {
    modes.push({
      id: startId + (7 - bit),
      name: `${channel} Bit Plane ${bit}`,
      shortName: `${prefix}${bit}`,
    });
  }
  return modes;
}

export const STEG_MODES: StegMode[] = [
  { id: 0, name: 'Normal', shortName: 'Normal' },
  { id: 1, name: 'Color Inversion', shortName: 'Invert' },
  ...bitPlanes('Alpha', 'A', 2),
  ...bitPlanes('Red', 'R', 10),
  ...bitPlanes('Green', 'G', 18),
  ...bitPlanes('Blue', 'B', 26),
  { id: 34, name: 'Full Alpha', shortName: 'Alpha' },
  { id: 35, name: 'Full Red', shortName: 'Red' },
  { id: 36, name: 'Full Green', shortName: 'Green' },
  { id: 37, name: 'Full Blue', shortName: 'Blue' },
  { id: 38, name: 'Gray Bits', shortName: 'Gray' },
];

export const STEG_MODE_COUNT = STEG_MODES.length;
