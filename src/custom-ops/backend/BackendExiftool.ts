import { BackendOperation, registerBackendOp } from './_base';
import type { BackendResult } from '../../worker/BackendClient';

const NAME = 'ExifTool (Backend)';

/* ------------------------------------------------------------------ */
/*  Field classification for visual highlighting                       */
/* ------------------------------------------------------------------ */

/** Fields that are always boring / expected — muted */
const UNINTERESTING = new Set([
  'ExifTool Version Number',
  'File Name',
  'Directory',
  'File Size',
  'File Modification Date/Time',
  'File Access Date/Time',
  'File Inode Change Date/Time',
  'File Permissions',
  'File Type',
  'File Type Extension',
  'MIME Type',
  'Image Width',
  'Image Height',
  'Image Size',
  'Megapixels',
  'Bit Depth',
  'Color Type',
  'Compression',
  'Filter',
  'Interlace',
  'Bits Per Sample',
  'Color Components',
  'Encoding Process',
  'JFIF Version',
  'Resolution Unit',
  'X Resolution',
  'Y Resolution',
  'Exif Byte Order',
  'Exif Image Width',
  'Exif Image Height',
  'Orientation',
  'YCbCr Sub Sampling',
  'YCbCr Positioning',
  'Background Color',
  'Pixels Per Unit X',
  'Pixels Per Unit Y',
  'Pixel Units',
  'Gamma',
  'SRGB Rendering',
  'Color Space',
  'Components Configuration',
  'Flashpix Version',
  'Interoperability Index',
  'Interoperability Version',
  'Profile CMM Type',
  'Profile Version',
  'Profile Class',
  'Color Space Data',
  'Profile Connection Space',
  'Profile Date Time',
  'Profile File Signature',
  'Primary Platform',
  'CMM Flags',
  'Device Manufacturer',
  'Device Model',
  'Device Attributes',
  'Rendering Intent',
  'Connection Space Illuminant',
  'Profile Creator',
  'Profile ID',
  'Profile Description',
  'Media White Point',
  'Chrome Adaption',
  'Red Matrix Column',
  'Green Matrix Column',
  'Blue Matrix Column',
  'Red Tone Reproduction Curve',
  'Green Tone Reproduction Curve',
  'Blue Tone Reproduction Curve',
  'Chromatic Adaptation',
  'Current IPTC Digest',
  'Coded Character Set',
  'Application Record Version',
  'Thumbnail Offset',
  'Thumbnail Length',
  'Thumbnail Image',
  'Scene Type',
  'Custom Rendered',
  'Scene Capture Type',
  'Contrast',
  'Saturation',
  'Sharpness',
  'Sub Sec Time',
  'Sub Sec Time Original',
  'Sub Sec Time Digitized',
]);

/** Fields that are steg/forensics-interesting — highlighted */
const INTERESTING_FIELDS = new Set([
  'Comment',
  'User Comment',
  'XP Comment',
  'Artist',
  'Author',
  'Copyright',
  'Rights',
  'Creator',
  'Description',
  'Subject',
  'Title',
  'Keywords',
  'XP Author',
  'XP Keywords',
  'XP Subject',
  'XP Title',
  'Warning',
  'Error',
  'Software',
  'Creator Tool',
  'Producer',
  'History Action',
  'History Parameters',
  'History Software Agent',
  'GPS Latitude',
  'GPS Longitude',
  'GPS Position',
  'GPS Altitude',
  'GPS Date/Time',
  'GPS Coordinates',
  'Modify Date',
  'Create Date',
  'Date/Time Original',
  'Make',
  'Camera Model Name',
  'Lens Model',
  'Serial Number',
  'Internal Serial Number',
  'Camera Serial Number',
  'Lens Serial Number',
  'Owner Name',
  'Host Computer',
  'Unique Camera Model',
  'Original Document ID',
  'Document ID',
  'Instance ID',
  'Derived From Document ID',
  'Derived From Instance ID',
  'ICC Profile Name',
  'Profile Copyright',
  'Steganography',
  'Hidden Data',
  'Embedded',
  'APP14 Flags 0',
  'APP14 Flags 1',
  'Photoshop Thumbnail',
  'Text Layer Name',
  'Text Layer Text',
]);

/** Patterns in field name that always mean interesting */
const INTERESTING_PATTERNS = [
  /comment/i,
  /gps/i,
  /author/i,
  /creator/i,
  /copyright/i,
  /serial/i,
  /owner/i,
  /hidden/i,
  /steg/i,
  /embed/i,
  /password/i,
  /secret/i,
  /flag/i,
  /ctf/i,
  /warning/i,
  /error/i,
  /thumbnail/i,
  /history/i,
];

/** Patterns in field values that make any field interesting */
const INTERESTING_VALUE_PATTERNS = [
  /flag\{/i,
  /ctf\{/i,
  /https?:\/\//i,
  /base64/i,
  /\b[A-Za-z0-9+/]{20,}={0,2}\b/, // possible base64 blob
  /password/i,
  /secret/i,
  /hidden/i,
  /steg/i,
  /0x[0-9a-f]{8,}/i, // long hex strings
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function classifyField(
  name: string,
  value: string,
): 'interesting' | 'uninteresting' | 'normal' {
  // Check interesting first (takes priority)
  if (INTERESTING_FIELDS.has(name)) return 'interesting';
  if (INTERESTING_PATTERNS.some((p) => p.test(name))) return 'interesting';
  if (INTERESTING_VALUE_PATTERNS.some((p) => p.test(value))) return 'interesting';

  // Check uninteresting
  if (UNINTERESTING.has(name)) return 'uninteresting';

  return 'normal';
}

/* ------------------------------------------------------------------ */
/*  Operation                                                          */
/* ------------------------------------------------------------------ */

class BackendExiftool extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'exiftool';
    this.name = NAME;
    this.description = 'Read metadata from files using ExifTool. Highlights interesting fields and mutes common ones.';
    this.infoURL = 'https://exiftool.org/';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'html';
    this.args = [
      { name: 'Output Format', type: 'option', value: ['Text', 'JSON'] },
    ];
  }

  protected buildToolArgs(args: any[]) {
    return {
      format: (args[0] as string).toLowerCase(),
    };
  }

  protected formatResult(result: BackendResult): string {
    const parts: string[] = [];

    const raw = result.stdout || result.text || '';

    if (!raw && result.status === 'error') {
      return `<span style="color:#ef5350">Error: ${escapeHtml(result.message || 'unknown')}</span>`;
    }

    if (!raw) return '(no output)';

    // Try to detect JSON output
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      // JSON mode — just return with basic syntax wrapping
      return `<pre style="margin:0;font-family:var(--font-mono);font-size:12px;line-height:1.5;color:var(--text-primary);white-space:pre-wrap;word-break:break-all">${escapeHtml(raw)}</pre>`;
    }

    // Text mode — parse lines like "Field Name                      : Value"
    const lines = raw.split('\n');
    const htmlLines: string[] = [];

    for (const line of lines) {
      const m = line.match(/^(.+?)\s*:\s(.*)$/);
      if (!m) {
        // Non-field line (separator, header, etc.)
        htmlLines.push(
          `<span style="color:var(--text-muted)">${escapeHtml(line)}</span>`,
        );
        continue;
      }

      const fieldName = m[1].trim();
      const fieldValue = m[2];
      const cls = classifyField(fieldName, fieldValue);

      if (cls === 'interesting') {
        htmlLines.push(
          `<span style="color:#ffcb6b;font-weight:600">${escapeHtml(fieldName.padEnd(34))}</span>` +
            `<span style="color:var(--text-muted)">: </span>` +
            `<span style="color:#c3e88d;font-weight:600">${escapeHtml(fieldValue)}</span>`,
        );
      } else if (cls === 'uninteresting') {
        htmlLines.push(
          `<span style="color:var(--text-muted);opacity:0.5">${escapeHtml(fieldName.padEnd(34))}: ${escapeHtml(fieldValue)}</span>`,
        );
      } else {
        // normal
        htmlLines.push(
          `<span style="color:var(--text-secondary)">${escapeHtml(fieldName.padEnd(34))}</span>` +
            `<span style="color:var(--text-muted)">: </span>` +
            `<span style="color:var(--text-primary)">${escapeHtml(fieldValue)}</span>`,
        );
      }
    }

    if (result.files && result.files.length > 0) {
      htmlLines.push('');
      htmlLines.push(
        `<span style="color:var(--text-muted)">--- Extracted ${result.files.length} file(s) ---</span>`,
      );
      for (const f of result.files) {
        htmlLines.push(
          `<span style="color:var(--text-secondary)">  ${escapeHtml(f.name)} (${f.size} bytes)</span>`,
        );
      }
    }

    return `<pre style="margin:0;font-family:var(--font-mono);font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-all">${htmlLines.join('\n')}</pre>`;
  }
}

registerBackendOp(BackendExiftool, {
  name: NAME,
  description: 'Read metadata from files using ExifTool. Highlights interesting fields and mutes common ones.',
  infoURL: 'https://exiftool.org/',
  inputType: 'ArrayBuffer',
  outputType: 'html',
  args: [
    { name: 'Output Format', type: 'option', value: ['Text', 'JSON'] },
  ],
});
