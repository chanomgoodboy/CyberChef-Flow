import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';

const NAME = 'Binwalk Scan';

/* ------------------------------------------------------------------ */
/*  Signature definitions                                              */
/* ------------------------------------------------------------------ */

interface Sig {
  /** Magic bytes to match */
  magic: number[];
  /** Offset within the file where to also check (0 = scan everywhere) */
  fixedOffset?: number;
  /** Human-readable label */
  label: string;
  /** Short format id */
  ext: string;
  /** If true, only check at fixedOffset (don't scan byte-by-byte) */
  onlyFixed?: boolean;
  /** Mask bytes (0xFF = exact match, omitted = all 0xFF) */
  mask?: number[];
  /** Extra validation callback — return null to reject, or extra info string */
  validate?: (data: Uint8Array, offset: number) => string | null;
}

const SIGS: Sig[] = [
  // Archives
  { magic: [0x50, 0x4B, 0x03, 0x04], label: 'Zip archive', ext: 'zip' },
  { magic: [0x50, 0x4B, 0x05, 0x06], label: 'Zip end of central directory', ext: 'zip' },
  { magic: [0x1F, 0x8B, 0x08], label: 'gzip compressed data', ext: 'gz' },
  { magic: [0x42, 0x5A, 0x68], label: 'bzip2 compressed data', ext: 'bz2',
    validate: (d, o) => {
      const bl = d[o + 3];
      return (bl >= 0x31 && bl <= 0x39) ? `block size ${bl - 0x30}00k` : null;
    },
  },
  { magic: [0xFD, 0x37, 0x7A, 0x58, 0x5A, 0x00], label: 'XZ compressed data', ext: 'xz' },
  { magic: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C], label: '7-zip archive', ext: '7z' },
  { magic: [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00], label: 'RAR archive v4', ext: 'rar' },
  { magic: [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x01, 0x00], label: 'RAR archive v5', ext: 'rar' },
  { magic: [0x28, 0xB5, 0x2F, 0xFD], label: 'Zstandard compressed data', ext: 'zst' },
  { magic: [0x4D, 0x53, 0x43, 0x46], label: 'Microsoft Cabinet archive', ext: 'cab' },
  { magic: [0x04, 0x22, 0x4D, 0x18], label: 'LZ4 compressed data', ext: 'lz4' },

  // TAR at offset 257
  { magic: [0x75, 0x73, 0x74, 0x61, 0x72], fixedOffset: 257, onlyFixed: true,
    label: 'POSIX tar archive', ext: 'tar' },

  // CPIO
  { magic: [0x30, 0x37, 0x30, 0x37, 0x30, 0x31], label: 'CPIO archive (newc)', ext: 'cpio' },
  { magic: [0x30, 0x37, 0x30, 0x37, 0x30, 0x37], label: 'CPIO archive (odc)', ext: 'cpio' },
  { magic: [0xC7, 0x71], label: 'CPIO archive (binary)', ext: 'cpio' },

  // Compressed streams
  { magic: [0x78, 0x01], label: 'zlib compressed data, no compression', ext: 'zlib' },
  { magic: [0x78, 0x5E], label: 'zlib compressed data, default compression', ext: 'zlib' },
  { magic: [0x78, 0x9C], label: 'zlib compressed data, default compression', ext: 'zlib' },
  { magic: [0x78, 0xDA], label: 'zlib compressed data, best compression', ext: 'zlib' },
  { magic: [0x5D, 0x00, 0x00], label: 'LZMA compressed data', ext: 'lzma',
    validate: (d, o) => {
      // Check dict size bytes are reasonable (not all zeros or all 0xFF)
      if (o + 8 >= d.length) return null;
      const ds = d[o+1] | (d[o+2] << 8) | (d[o+3] << 16) | (d[o+4] << 24);
      return (ds > 0 && ds <= 0x40000000) ? `dict size ${ds}` : null;
    },
  },

  // Images
  { magic: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], label: 'PNG image', ext: 'png' },
  { magic: [0xFF, 0xD8, 0xFF], label: 'JPEG image', ext: 'jpg' },
  { magic: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], label: 'GIF image (87a)', ext: 'gif' },
  { magic: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], label: 'GIF image (89a)', ext: 'gif' },
  { magic: [0x42, 0x4D], label: 'BMP image', ext: 'bmp',
    validate: (d, o) => {
      if (o + 6 >= d.length) return null;
      const sz = d[o+2] | (d[o+3] << 8) | (d[o+4] << 16) | (d[o+5] << 24);
      return (sz > 26 && sz <= d.length - o) ? `${sz} bytes` : null;
    },
  },
  { magic: [0x49, 0x49, 0x2A, 0x00], label: 'TIFF image (little-endian)', ext: 'tif' },
  { magic: [0x4D, 0x4D, 0x00, 0x2A], label: 'TIFF image (big-endian)', ext: 'tif' },
  { magic: [0x52, 0x49, 0x46, 0x46], label: 'RIFF', ext: 'riff',
    validate: (d, o) => {
      if (o + 12 > d.length) return null;
      const tag = String.fromCharCode(d[o+8], d[o+9], d[o+10], d[o+11]);
      if (tag === 'WEBP') return 'WebP image';
      if (tag === 'WAVE') return 'WAV audio';
      if (tag === 'AVI ') return 'AVI video';
      return tag;
    },
  },

  // Documents / Executables
  { magic: [0x25, 0x50, 0x44, 0x46, 0x2D], label: 'PDF document', ext: 'pdf' },
  { magic: [0x7F, 0x45, 0x4C, 0x46], label: 'ELF executable', ext: 'elf',
    validate: (d, o) => {
      if (o + 5 >= d.length) return null;
      const cls = d[o + 4] === 1 ? '32-bit' : d[o + 4] === 2 ? '64-bit' : null;
      const end = d[o + 5] === 1 ? 'LSB' : d[o + 5] === 2 ? 'MSB' : null;
      return cls && end ? `${cls} ${end}` : null;
    },
  },
  { magic: [0x4D, 0x5A], label: 'DOS/PE executable', ext: 'exe',
    validate: (d, o) => {
      if (o + 4 >= d.length) return null;
      // Check bytes at offset 2-3 aren't zeros (basic sanity)
      return (d[o+2] !== 0 || d[o+3] !== 0) ? null : null; // too many false positives
      // Just accept if MZ found
    },
  },
  { magic: [0xCE, 0xFA, 0xED, 0xFE], label: 'Mach-O executable (32-bit)', ext: 'macho' },
  { magic: [0xCF, 0xFA, 0xED, 0xFE], label: 'Mach-O executable (64-bit)', ext: 'macho' },
  { magic: [0xCA, 0xFE, 0xBA, 0xBE], label: 'Mach-O universal binary / Java class', ext: 'macho' },
  { magic: [0x64, 0x65, 0x78, 0x0A, 0x30, 0x33], label: 'Android DEX', ext: 'dex' },

  // Firmware
  { magic: [0x27, 0x05, 0x19, 0x56], label: 'uImage header', ext: 'uimage' },
  { magic: [0xD0, 0x0D, 0xFE, 0xED], label: 'Device Tree Blob (FDT)', ext: 'dtb' },
  { magic: [0x41, 0x4E, 0x44, 0x52, 0x4F, 0x49, 0x44, 0x21],
    label: 'Android boot image', ext: 'boot.img' },
  { magic: [0x3A, 0xFF, 0x26, 0xED], label: 'Android sparse image', ext: 'simg' },
  { magic: [0x48, 0x44, 0x52, 0x30], label: 'TRX firmware header', ext: 'trx' },

  // Filesystems
  { magic: [0x68, 0x73, 0x71, 0x73], label: 'SquashFS filesystem (little-endian)', ext: 'sqfs' },
  { magic: [0x73, 0x71, 0x73, 0x68], label: 'SquashFS filesystem (big-endian)', ext: 'sqfs' },
  { magic: [0x45, 0x3D, 0xCD, 0x28], label: 'CramFS filesystem', ext: 'cramfs' },
  { magic: [0x85, 0x19], label: 'JFFS2 filesystem (little-endian)', ext: 'jffs2' },
  { magic: [0x55, 0x42, 0x49, 0x23], label: 'UBI image', ext: 'ubi' },
  { magic: [0x2D, 0x72, 0x6F, 0x6D, 0x31, 0x66, 0x73, 0x2D],
    label: 'RomFS filesystem', ext: 'romfs' },

  // ext2/3/4 superblock at offset 1080
  { magic: [0x53, 0xEF], fixedOffset: 1080, onlyFixed: true,
    label: 'ext2/3/4 filesystem', ext: 'ext' },
  // ISO 9660 at offset 32769
  { magic: [0x43, 0x44, 0x30, 0x30, 0x31], fixedOffset: 32769, onlyFixed: true,
    label: 'ISO 9660 CD-ROM image', ext: 'iso' },

  // Crypto / Certificates
  { magic: [0x2D, 0x2D, 0x2D, 0x2D, 0x2D, 0x42, 0x45, 0x47, 0x49, 0x4E],
    label: 'PEM encoded data', ext: 'pem',
    validate: (d, o) => {
      // Read until newline to get the full header
      let end = o + 10;
      while (end < d.length && end < o + 80 && d[end] !== 0x0A) end++;
      const header = String.fromCharCode(...Array.from(d.slice(o, end)));
      const m = header.match(/-----BEGIN (.+?)-----/);
      return m ? m[1] : 'unknown';
    },
  },

  // Database / Data
  { magic: [0x53, 0x51, 0x4C, 0x69, 0x74, 0x65, 0x20, 0x66,
            0x6F, 0x72, 0x6D, 0x61, 0x74, 0x20, 0x33, 0x00],
    label: 'SQLite database', ext: 'sqlite' },

  // Audio/Video
  { magic: [0x4F, 0x67, 0x67, 0x53], label: 'OGG container', ext: 'ogg' },
  { magic: [0x66, 0x4C, 0x61, 0x43], label: 'FLAC audio', ext: 'flac' },
  { magic: [0x49, 0x44, 0x33], label: 'MP3 audio (ID3)', ext: 'mp3' },
  { magic: [0x46, 0x4C, 0x56, 0x01], label: 'Flash video (FLV)', ext: 'flv' },
  { magic: [0x1A, 0x45, 0xDF, 0xA3], label: 'Matroska/WebM container', ext: 'mkv' },

  // XML / HTML
  { magic: [0x3C, 0x3F, 0x78, 0x6D, 0x6C], label: 'XML document', ext: 'xml' },

  // Encryption
  { magic: [0x4C, 0x55, 0x4B, 0x53, 0xBA, 0xBE], label: 'LUKS encrypted volume', ext: 'luks' },

  // End markers (for carving)
  { magic: [0xFF, 0xD9], label: 'JPEG end of image (EOI)', ext: 'jpg-end' },
  { magic: [0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82],
    label: 'PNG end (IEND)', ext: 'png-end' },
];

// Build prefix index for fast scanning
const PREFIX_MAP = new Map<number, Sig[]>();
for (const sig of SIGS) {
  if (sig.onlyFixed) continue;
  const key = sig.magic[0];
  const arr = PREFIX_MAP.get(key) ?? [];
  arr.push(sig);
  PREFIX_MAP.set(key, arr);
}

/* ------------------------------------------------------------------ */
/*  Scan logic                                                         */
/* ------------------------------------------------------------------ */

interface Hit {
  offset: number;
  label: string;
  ext: string;
  extra?: string;
}

function matchAt(data: Uint8Array, offset: number, sig: Sig): string | null | undefined {
  if (offset + sig.magic.length > data.length) return null;
  for (let j = 0; j < sig.magic.length; j++) {
    const mask = sig.mask ? sig.mask[j] : 0xFF;
    if ((data[offset + j] & mask) !== (sig.magic[j] & mask)) return null;
  }
  if (sig.validate) {
    return sig.validate(data, offset);
  }
  return undefined; // match, no extra info
}

function scan(data: Uint8Array, maxHits: number): Hit[] {
  const hits: Hit[] = [];

  // Check fixed-offset signatures first
  for (const sig of SIGS) {
    if (!sig.fixedOffset) continue;
    const res = matchAt(data, sig.fixedOffset, sig);
    if (res !== null) {
      hits.push({
        offset: sig.fixedOffset,
        label: sig.label,
        ext: sig.ext,
        extra: typeof res === 'string' ? res : undefined,
      });
    }
  }

  // Scan byte-by-byte with prefix index
  for (let i = 0; i < data.length && hits.length < maxHits; i++) {
    const candidates = PREFIX_MAP.get(data[i]);
    if (!candidates) continue;
    for (const sig of candidates) {
      const res = matchAt(data, i, sig);
      if (res !== null) {
        hits.push({
          offset: i,
          label: sig.label,
          ext: sig.ext,
          extra: typeof res === 'string' ? res : undefined,
        });
      }
    }
  }

  // Sort by offset
  hits.sort((a, b) => a.offset - b.offset);
  return hits;
}

/* ------------------------------------------------------------------ */
/*  Entropy calculation                                                */
/* ------------------------------------------------------------------ */

function shannonEntropy(data: Uint8Array, start: number, len: number): number {
  const end = Math.min(start + len, data.length);
  const n = end - start;
  if (n <= 0) return 0;
  const freq = new Uint32Array(256);
  for (let i = start; i < end; i++) freq[data[i]]++;
  let ent = 0;
  for (let i = 0; i < 256; i++) {
    if (freq[i] === 0) continue;
    const p = freq[i] / n;
    ent -= p * Math.log2(p);
  }
  return ent;
}

/* ------------------------------------------------------------------ */
/*  Operation                                                          */
/* ------------------------------------------------------------------ */

class BinwalkScan extends CustomOperation {
  constructor() {
    super();
    this.name = NAME;
    this.description =
      'Scan binary data for embedded file signatures, similar to binwalk. ' +
      'Detects archives (ZIP, GZIP, BZIP2, XZ, 7z, RAR, Zstd), images (PNG, JPEG, GIF, BMP, TIFF, WebP), ' +
      'executables (ELF, PE, Mach-O), firmware headers (uImage, FDT, Android), ' +
      'filesystems (SquashFS, CramFS, JFFS2, ext, UBI), compressed streams (zlib, LZMA, LZ4), ' +
      'documents (PDF), databases (SQLite), certificates (PEM), and more. ' +
      'Runs entirely in the browser — no backend required.';
    this.infoURL = 'https://github.com/ReFirmLabs/binwalk';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = [
      { name: 'Max Results', type: 'number', value: 500, min: 1, max: 10000 },
      { name: 'Show Entropy', type: 'boolean', value: true },
      { name: 'Entropy Block Size', type: 'number', value: 1024, min: 64, max: 65536 },
    ];
  }

  run(input: ArrayBuffer, args: any[]): string {
    const data = new Uint8Array(input);
    if (data.length === 0) return '(empty input)';

    const maxHits = (args[0] as number) || 500;
    const showEntropy = args[1] !== false;
    const entropyBlock = (args[2] as number) || 1024;

    const hits = scan(data, maxHits);
    const lines: string[] = [];

    // Header
    lines.push('DECIMAL       HEXADECIMAL     DESCRIPTION');
    lines.push('-----------------------------------------------------------');

    if (hits.length === 0) {
      lines.push('(no signatures found)');
    } else {
      for (const h of hits) {
        const dec = String(h.offset).padStart(12);
        const hex = ('0x' + h.offset.toString(16).toUpperCase()).padStart(14);
        let desc = h.label;
        if (h.extra) desc += `, ${h.extra}`;
        lines.push(`${dec}  ${hex}     ${desc}`);
      }
    }

    // Summary
    lines.push('');
    lines.push(`${hits.length} signature(s) found in ${data.length} bytes`);

    // Entropy
    if (showEntropy) {
      const overall = shannonEntropy(data, 0, data.length);
      lines.push('');
      lines.push(`Overall entropy: ${overall.toFixed(6)} bits/byte`);
      if (overall > 7.5) {
        lines.push('  -> High entropy (likely encrypted or compressed)');
      } else if (overall > 6.0) {
        lines.push('  -> Moderate entropy (possibly compressed data)');
      } else if (overall < 2.0) {
        lines.push('  -> Low entropy (sparse/text data)');
      }

      // Block entropy map (compact)
      const blocks = Math.ceil(data.length / entropyBlock);
      if (blocks > 1 && blocks <= 256) {
        lines.push('');
        lines.push(`Entropy map (${entropyBlock}-byte blocks):`);
        const BAR = ' ░▒▓█';
        let row = '';
        for (let b = 0; b < blocks; b++) {
          const ent = shannonEntropy(data, b * entropyBlock, entropyBlock);
          const idx = Math.min(4, Math.floor(ent / 2));
          row += BAR[idx];
          if ((b + 1) % 64 === 0) {
            const off = ((b - 63) * entropyBlock).toString(16).padStart(8, '0');
            lines.push(`  ${off}  ${row}`);
            row = '';
          }
        }
        if (row) {
          const off = ((blocks - (blocks % 64 || 64)) * entropyBlock)
            .toString(16)
            .padStart(8, '0');
          lines.push(`  ${off}  ${row}`);
        }
      }
    }

    return lines.join('\n');
  }
}

registerCustomOp(
  BinwalkScan,
  {
    name: NAME,
    module: 'Custom',
    description:
      'Scan binary data for embedded file signatures (ZIP, PNG, ELF, etc). Browser-based binwalk alternative.',
    infoURL: 'https://github.com/ReFirmLabs/binwalk',
    inputType: 'ArrayBuffer',
    outputType: 'string',
    args: [
      { name: 'Max Results', type: 'number', value: 500, min: 1, max: 10000 },
      { name: 'Show Entropy', type: 'boolean', value: true },
      { name: 'Entropy Block Size', type: 'number', value: 1024, min: 64, max: 65536 },
    ],
    flowControl: false,
  },
  'Forensics',
);

export default BinwalkScan;
