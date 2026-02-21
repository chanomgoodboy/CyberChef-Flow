import Dish from '@cyberchef/Dish.mjs';
import type { DishData } from './types';

// Re-export the Dish class so consumers do not need a separate import.
export { Dish };

/**
 * Create a new CyberChef Dish with the given value and type.
 *
 * @param value  The raw data (string, ArrayBuffer, number, etc.).
 * @param type   Dish type enum (e.g. Dish.STRING, Dish.BYTE_ARRAY).
 */
export function createDish(value: any, type: number): InstanceType<typeof Dish> {
  return new Dish(value, type);
}

/**
 * Deep-clone a Dish.
 */
export function cloneDish(dish: InstanceType<typeof Dish>): InstanceType<typeof Dish> {
  return dish.clone();
}

/**
 * Convert a Dish's contents to a string, optionally truncated to
 * `maxLen` characters.
 */
export async function dishToString(
  dish: InstanceType<typeof Dish>,
  maxLen?: number,
): Promise<string> {
  const str: string = await Promise.resolve(dish.get(Dish.STRING));
  if (maxLen !== undefined && maxLen >= 0 && str.length > maxLen) {
    return str.slice(0, maxLen) + '\u2026'; // ellipsis
  }
  return str;
}

/**
 * Serialise a Dish into a plain object that is safe to post across
 * a structured-clone boundary (e.g. to a Web Worker).
 *
 * For most types the value is already transferable.  For Uint8Array /
 * Array-based byte arrays we convert to ArrayBuffer.
 */
export async function dishToTransferable(
  dish: InstanceType<typeof Dish>,
): Promise<DishData> {
  let { value, type } = dish;

  // Byte arrays need to become ArrayBuffers for structured clone.
  if (type === Dish.BYTE_ARRAY) {
    const arr = value as number[] | Uint8Array;
    const buf = new Uint8Array(arr).buffer;
    return { value: buf, type: Dish.ARRAY_BUFFER };
  }

  return { value, type };
}

/**
 * Reconstruct a Dish from a plain {value, type} payload (e.g. received
 * from a Web Worker).
 */
export function dishFromTransferable(data: DishData): InstanceType<typeof Dish> {
  return new Dish(data.value, data.type);
}

/**
 * If the Dish contains image data (PNG, JPEG, GIF, BMP, WebP),
 * return a `data:image/...;base64,...` URL.  Otherwise return null.
 */
export async function dishToImageDataUrl(
  dish: InstanceType<typeof Dish>,
): Promise<string | null> {
  let buf: ArrayBuffer;
  try {
    buf = await Promise.resolve(dish.get(Dish.ARRAY_BUFFER));
  } catch {
    return null;
  }

  const bytes = new Uint8Array(buf);
  if (bytes.length < 8) return null;

  const mime = detectImageMime(bytes);
  if (!mime) return null;

  // Convert to base64
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 = btoa(binary);
  return `data:${mime};base64,${b64}`;
}

function detectImageMime(bytes: Uint8Array): string | null {
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return 'image/png';
  }
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'image/jpeg';
  }
  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return 'image/gif';
  }
  // BMP: 42 4D
  if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
    return 'image/bmp';
  }
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return 'image/webp';
  }
  // SVG: starts with "<?xml" or "<svg"
  const head = String.fromCharCode(...bytes.slice(0, 100));
  if (head.trimStart().startsWith('<?xml') || head.trimStart().startsWith('<svg')) {
    return 'image/svg+xml';
  }
  return null;
}

/**
 * Return a human-readable label for the Dish's current type
 * (e.g. "string", "byteArray", "ArrayBuffer").
 */
export function getDishTypeLabel(dish: InstanceType<typeof Dish>): string {
  try {
    return Dish.enumLookup(dish.type) as string;
  } catch {
    return 'unknown';
  }
}
