#!/usr/bin/env npx tsx
/**
 * CyberWeb Backend Server
 *
 * WebSocket server on :8540 that executes CTF tools (binwalk, steghide,
 * hashcat, exiftool, etc.) and streams results back to the CyberWeb worker.
 *
 * Usage:  npx tsx scripts/backend-server.ts
 *    or:  npm run backend
 */

import { WebSocketServer, WebSocket } from 'ws';
import * as pty from 'node-pty';
import { mkdtemp, mkdir, writeFile, readFile, readdir, stat, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const PORT = parseInt(process.env.BACKEND_PORT ?? '8540', 10);
const HOST = process.env.BACKEND_HOST ?? '0.0.0.0';
const MAX_OUTPUT = 1024 * 1024; // 1 MB stdout cap per request
const WORDLIST_ROOT = process.env.WORDLIST_ROOT ?? '/usr/share/wordlists';
const JOHN_DIR = process.env.JOHN_DIR ?? '/opt/homebrew/share/john';

/* ------------------------------------------------------------------ */
/*  Hash Extract — *2john auto-detection maps                          */
/* ------------------------------------------------------------------ */

/** Regex applied to `file -b` output → *2john binary name. */
const HASH_EXTRACT_MAP: [RegExp, string][] = [
  [/Zip archive/i,             'zip2john'],
  [/RAR archive/i,             'rar2john'],
  [/7-zip archive/i,           '7z2john.pl'],
  [/PDF document/i,            'pdf2john.pl'],
  [/Microsoft .*(Word|Excel|PowerPoint|Office)/i, 'office2john.py'],
  [/KeePass/i,                 'keepass2john'],
  [/OpenSSH private key|PEM RSA private key/i, 'ssh2john.py'],
  [/PGP.*key|GPG/i,            'gpg2john'],
  [/pcap/i,                    'wpapcap2john'],
  [/DMG.*disk image|Apple Disk Image/i, 'dmg2john'],
];

/** Dropdown override label → *2john binary. */
const TYPE_OVERRIDE_MAP: Record<string, string> = {
  'ZIP':       'zip2john',
  'RAR':       'rar2john',
  '7z':        '7z2john.pl',
  'PDF':       'pdf2john.pl',
  'Office':    'office2john.py',
  'KeePass':   'keepass2john',
  'SSH Key':   'ssh2john.py',
  'GPG Key':   'gpg2john',
  'WPA pcap':  'wpapcap2john',
  'DMG':       'dmg2john',
};

/** Script extensions that need an interpreter prefix. */
function john2Cmd(binary: string): { cmd: string; args: string[] } {
  const fullPath = path.join(JOHN_DIR, binary);
  if (binary.endsWith('.py')) return { cmd: 'python3', args: [fullPath] };
  if (binary.endsWith('.pl')) return { cmd: 'perl', args: [fullPath] };
  return { cmd: fullPath, args: [] };
}

/* ------------------------------------------------------------------ */
/*  Tool definitions                                                   */
/* ------------------------------------------------------------------ */

interface PrepareResult {
  /** Override the tool binary for this invocation. */
  binary?: string;
  /** Override argv entirely (skips buildArgs). */
  argv?: string[];
}

interface ToolDef {
  name: string;
  description: string;
  binary: string;
  /** Whether input is binary (written to temp file) vs text (passed as argument/stdin). */
  binaryInput: boolean;
  /** Run before the process — create output dirs, write extra files, etc.
   *  May return { binary } to override the tool binary for this invocation. */
  prepare?: (args: Record<string, any>, workDir: string, inputPath: string) => Promise<PrepareResult | void>;
  /** Build argv from args + input file path. */
  buildArgs: (args: Record<string, any>, inputPath: string) => string[];
  /** Whether to collect extracted files from a directory. */
  collectFiles?: (workDir: string) => Promise<FileResult[]>;
}

interface FileResult {
  name: string;
  size: number;
  data: string; // base64
}

async function collectDirFiles(dir: string, maxFiles = 50): Promise<FileResult[]> {
  const results: FileResult[] = [];
  try {
    const entries = await readdir(dir, { recursive: true });
    for (const entry of entries) {
      if (results.length >= maxFiles) break;
      const fullPath = path.join(dir, entry);
      const st = await stat(fullPath).catch(() => null);
      if (!st) continue;
      if (st.isFile()) {
        const data = await readFile(fullPath);
        results.push({ name: entry, size: data.byteLength, data: data.toString('base64') });
      } else if (st.isDirectory()) {
        // Include empty directories as zero-byte artifacts
        const children = await readdir(fullPath).catch(() => []);
        if (children.length === 0) {
          results.push({ name: entry + '/', size: 0, data: '' });
        }
      }
    }
  } catch { /* dir might not exist */ }
  return results;
}

const tools: ToolDef[] = [
  {
    name: 'binwalk',
    description: 'Firmware analysis and carving (no recursive decompression)',
    binary: 'binwalk',
    binaryInput: true,
    buildArgs: (args, inputPath) => {
      const argv: string[] = [];
      const mode = (args.mode ?? 'extract').toLowerCase();
      if (mode === 'extract') argv.push('-c'); // carve raw files, no decompression
      else if (mode === 'entropy') argv.push('-E');
      if (args.flags) argv.push(...(args.flags as string).split(/\s+/).filter(Boolean));
      argv.push(inputPath);
      return argv;
    },
    collectFiles: async (workDir) => {
      // binwalk v3 carve: extractions/<name>_<offset>_<type>.raw
      // binwalk v2: _<name>.extracted/ or extractions/<name>.extracted/
      const extDir = path.join(workDir, 'extractions');
      const entries = await readdir(extDir).catch(() => []);
      if (entries.length > 0) {
        return collectDirFiles(extDir);
      }
      // v2 fallback
      const wdEntries = await readdir(workDir).catch(() => []);
      for (const e of wdEntries) {
        if (e.endsWith('.extracted')) {
          return collectDirFiles(path.join(workDir, e));
        }
      }
      return [];
    },
  },
  {
    name: '7z',
    description: 'Extract 7z, zip, rar, tar, gz, bz2, xz and other archives',
    binary: '7z',
    binaryInput: true,
    buildArgs: (args, inputPath) => {
      const outDir = path.join(path.dirname(inputPath), '7z_out');
      const argv = ['x', inputPath, `-o${outDir}`, '-y'];
      if (args.password) argv.push(`-p${args.password as string}`);
      else argv.push('-p'); // empty password to avoid interactive prompt
      return argv;
    },
    collectFiles: async (workDir) => {
      const outDir = path.join(workDir, '7z_out');
      return collectDirFiles(outDir);
    },
  },
  {
    name: 'steghide',
    description: 'Steganography embed/extract for JPEG/BMP/WAV/AU',
    binary: 'steghide',
    binaryInput: true,
    buildArgs: (args, inputPath) => {
      const mode = (args.mode ?? 'extract').toLowerCase();
      const argv = [mode, '-sf', inputPath, '-f'];
      if (mode === 'extract') {
        argv.push('-xf', path.join(path.dirname(inputPath), 'steghide_out'));
      }
      if (args.passphrase) {
        argv.push('-p', args.passphrase as string);
      } else {
        argv.push('-p', '');
      }
      return argv;
    },
    collectFiles: async (workDir) => {
      const outPath = path.join(workDir, 'steghide_out');
      const st = await stat(outPath).catch(() => null);
      if (st?.isFile()) {
        const data = await readFile(outPath);
        return [{ name: 'steghide_out', size: data.byteLength, data: data.toString('base64') }];
      }
      return [];
    },
  },
  {
    name: 'stegseek',
    description: 'Fast steghide passphrase cracker',
    binary: 'stegseek',
    binaryInput: true,
    buildArgs: (args, inputPath) => {
      const argv = [inputPath];
      if (args.wordlist) argv.push(args.wordlist as string);
      argv.push('-xf', path.join(path.dirname(inputPath), 'stegseek_out'));
      if (args.passphrase) argv.push('-p', args.passphrase as string);
      return argv;
    },
    collectFiles: async (workDir) => {
      const outPath = path.join(workDir, 'stegseek_out');
      const st = await stat(outPath).catch(() => null);
      if (st?.isFile()) {
        const data = await readFile(outPath);
        return [{ name: 'stegseek_out', size: data.byteLength, data: data.toString('base64') }];
      }
      return [];
    },
  },
  {
    name: 'hashcat',
    description: 'Advanced password recovery',
    binary: 'hashcat',
    binaryInput: false,
    buildArgs: (args, inputPath) => {
      const argv = [
        '-a', String(args.attackMode ?? 0),
        '-m', String(args.hashType ?? 0),
        inputPath,
      ];
      if (args.wordlist) argv.push(args.wordlist as string);
      if (args.rules) argv.push('-r', args.rules as string);
      argv.push('--potfile-disable', '--force');
      return argv;
    },
  },
  {
    name: 'exiftool',
    description: 'Read/write file metadata',
    binary: 'exiftool',
    binaryInput: true,
    buildArgs: (args, inputPath) => {
      const argv: string[] = [];
      if ((args.format ?? 'text').toLowerCase() === 'json') argv.push('-json');
      argv.push(inputPath);
      return argv;
    },
  },
  {
    name: 'foremost',
    description: 'File carving by headers/footers',
    binary: 'foremost',
    binaryInput: true,
    buildArgs: (args, inputPath) => {
      const outDir = path.join(path.dirname(inputPath), 'foremost_out');
      const argv = ['-i', inputPath, '-o', outDir];
      if (args.types) argv.push('-t', args.types as string);
      return argv;
    },
    collectFiles: async (workDir) => {
      return collectDirFiles(path.join(workDir, 'foremost_out'));
    },
  },
  {
    name: 'strings',
    description: 'Extract printable strings from binary',
    binary: 'strings',
    binaryInput: true,
    buildArgs: (args, inputPath) => {
      const argv: string[] = [];
      const min = args.minLength ?? 4;
      argv.push('-n', String(min));
      if ((args.encoding ?? 'ascii').toLowerCase() === 'unicode') argv.push('-e', 'l');
      argv.push(inputPath);
      return argv;
    },
  },
  {
    name: 'john',
    description: 'John the Ripper password cracker',
    binary: 'bash',
    binaryInput: false,
    buildArgs: (args, inputPath) => {
      // Run john with a session-local potfile, then --show to display results
      const potFile = path.join(path.dirname(inputPath), 'john.pot');
      const johnArgs = [inputPath, `--pot=${potFile}`];
      if (args.format) johnArgs.push(`--format=${args.format}`);
      if (args.wordlist) johnArgs.push(`--wordlist=${args.wordlist}`);
      if (args.rules) johnArgs.push(`--rules=${args.rules}`);
      const johnCmd = johnArgs.map((a) => `'${a.replace(/'/g, "'\\''")}'`).join(' ');

      const showArgs = [inputPath, `--pot=${potFile}`, '--show'];
      if (args.format) showArgs.push(`--format=${args.format}`);
      const showCmd = showArgs.map((a) => `'${a.replace(/'/g, "'\\''")}'`).join(' ');

      return [
        '-c',
        `john ${johnCmd}; echo; echo "=== Cracked Passwords ==="; john ${showCmd}`,
      ];
    },
  },
  {
    name: 'zsteg',
    description: 'PNG/BMP steganography detector',
    binary: 'zsteg',
    binaryInput: true,
    buildArgs: (args, inputPath) => {
      const argv = [inputPath];
      if (args.bits) argv.push('-b', args.bits as string);
      if (args.channels) argv.push('-c', args.channels as string);
      if (args.order && args.order !== 'auto') argv.push('-o', args.order as string);
      return argv;
    },
  },
  {
    name: 'pngcheck',
    description: 'PNG file integrity checker',
    binary: 'pngcheck',
    binaryInput: true,
    buildArgs: (args, inputPath) => {
      const argv: string[] = [];
      if (args.verbose !== false) argv.push('-v');
      argv.push(inputPath);
      return argv;
    },
  },
  {
    name: 'file',
    description: 'Identify file type via magic bytes',
    binary: 'file',
    binaryInput: true,
    buildArgs: (args, inputPath) => {
      const argv = ['-b']; // brief, no filename prefix
      if (args.mime) argv.push('--mime');
      argv.push(inputPath);
      return argv;
    },
  },
  {
    name: 'tesseract',
    description: 'OCR — extract text from images',
    binary: 'tesseract',
    binaryInput: true,
    buildArgs: (args, inputPath) => {
      const outBase = path.join(path.dirname(inputPath), 'ocr_out');
      const argv = [inputPath, outBase];
      const lang = (args.language ?? 'eng') as string;
      argv.push('-l', lang);
      const psm = args.psm as string | undefined;
      if (psm) argv.push('--psm', psm);
      return argv;
    },
    collectFiles: async (workDir) => {
      const outPath = path.join(workDir, 'ocr_out.txt');
      const st = await stat(outPath).catch(() => null);
      if (st?.isFile()) {
        const data = await readFile(outPath);
        return [{ name: 'ocr_out.txt', size: data.byteLength, data: data.toString('base64') }];
      }
      return [];
    },
  },
  {
    name: 'ffprobe',
    description: 'Analyze audio/video/image media metadata',
    binary: 'ffprobe',
    binaryInput: true,
    buildArgs: (args, inputPath) => {
      const argv = ['-hide_banner'];
      if ((args.format ?? 'text') === 'json') {
        argv.push('-print_format', 'json', '-show_format', '-show_streams');
      }
      argv.push(inputPath);
      return argv;
    },
  },
  {
    name: 'ffmpeg',
    description: 'Extract frames, audio, or convert media formats',
    binary: 'ffmpeg',
    binaryInput: true,
    prepare: async (_args, workDir) => {
      await mkdir(path.join(workDir, 'ffmpeg_out'), { recursive: true });
    },
    buildArgs: (args, inputPath) => {
      const outDir = path.join(path.dirname(inputPath), 'ffmpeg_out');
      const mode = (args.mode ?? 'frames') as string;
      const argv = ['-hide_banner', '-y', '-i', inputPath];
      if (mode === 'frames') {
        const fps = args.fps ?? 1;
        argv.push('-vf', `fps=${fps}`, `${outDir}/frame_%04d.png`);
      } else if (mode === 'audio') {
        argv.push('-vn', '-acodec', 'pcm_s16le', `${outDir}/audio.wav`);
      } else if (mode === 'spectrogram') {
        argv.push('-lavfi', 'showspectrumpic=s=1024x512', `${outDir}/spectrogram.png`);
      }
      return argv;
    },
    collectFiles: async (workDir) => {
      return collectDirFiles(path.join(workDir, 'ffmpeg_out'));
    },
  },
  {
    name: 'identify',
    description: 'ImageMagick — detailed image analysis',
    binary: 'identify',
    binaryInput: true,
    buildArgs: (args, inputPath) => {
      const argv = ['-verbose'];
      if (args.format) argv.push('-format', args.format as string);
      argv.push(inputPath);
      return argv;
    },
  },
  {
    name: 'xxd',
    description: 'Hex dump with various output formats',
    binary: 'xxd',
    binaryInput: true,
    buildArgs: (args, inputPath) => {
      const argv: string[] = [];
      const mode = (args.mode ?? 'hex') as string;
      if (mode === 'binary') argv.push('-b');
      else if (mode === 'c-include') argv.push('-i');
      else if (mode === 'plain') argv.push('-p');
      const len = args.length as number | undefined;
      if (len && len > 0) argv.push('-l', String(len));
      argv.push(inputPath);
      return argv;
    },
  },
  {
    name: 'openssl',
    description: 'OpenSSL crypto — parse certs, enc/dec, hash',
    binary: 'openssl',
    binaryInput: true,
    buildArgs: (args, inputPath) => {
      const mode = (args.mode ?? 'x509') as string;
      if (mode === 'x509') {
        return ['x509', '-in', inputPath, '-text', '-noout'];
      } else if (mode === 'pkcs12') {
        const argv = ['pkcs12', '-in', inputPath, '-nodes'];
        if (args.password) argv.push('-password', `pass:${args.password as string}`);
        return argv;
      } else if (mode === 'rsa') {
        return ['rsa', '-in', inputPath, '-text', '-noout'];
      } else if (mode === 'asn1') {
        return ['asn1parse', '-in', inputPath];
      } else if (mode === 'dgst') {
        const alg = (args.algorithm ?? 'sha256') as string;
        return ['dgst', `-${alg}`, inputPath];
      }
      return ['x509', '-in', inputPath, '-text', '-noout'];
    },
  },
  {
    name: 'pdftotext',
    description: 'Extract text from PDF files',
    binary: 'pdftotext',
    binaryInput: true,
    buildArgs: (args, inputPath) => {
      const outPath = path.join(path.dirname(inputPath), 'pdf_text.txt');
      const argv = [inputPath, outPath];
      if (args.layout) argv.splice(1, 0, '-layout');
      if (args.pages) {
        const [first, last] = (args.pages as string).split('-');
        argv.splice(1, 0, '-f', first, '-l', last || first);
      }
      return argv;
    },
    collectFiles: async (workDir) => {
      const outPath = path.join(workDir, 'pdf_text.txt');
      const st = await stat(outPath).catch(() => null);
      if (st?.isFile()) {
        const data = await readFile(outPath);
        return [{ name: 'pdf_text.txt', size: data.byteLength, data: data.toString('base64') }];
      }
      return [];
    },
  },
  {
    name: 'tshark',
    description: 'Network packet analysis (pcap)',
    binary: 'tshark',
    binaryInput: true,
    buildArgs: (args, inputPath) => {
      const argv = ['-r', inputPath];
      if (args.filter) argv.push('-Y', args.filter as string);
      if (args.fields) {
        argv.push('-T', 'fields');
        for (const f of (args.fields as string).split(',')) {
          argv.push('-e', f.trim());
        }
      }
      const count = args.count as number | undefined;
      if (count && count > 0) argv.push('-c', String(count));
      return argv;
    },
  },
  {
    name: 'yara',
    description: 'Pattern matching for malware/CTF analysis',
    binary: 'yara',
    binaryInput: true,
    prepare: async (args, workDir) => {
      const rules = (args.rules as string) ?? '';
      await writeFile(path.join(workDir, 'rules.yar'), rules, 'utf-8');
    },
    buildArgs: (args, inputPath) => {
      const rulesPath = path.join(path.dirname(inputPath), 'rules.yar');
      const argv = ['-s', rulesPath, inputPath];
      return argv;
    },
  },

  /* ---- Hash Extract (*2john auto-detection) ---- */
  {
    name: 'hash-extract',
    description: 'Extract password hashes via *2john (auto-detects file type)',
    binary: 'file', // placeholder — overridden by prepare()
    binaryInput: true,
    prepare: async (args, workDir, inputPath) => {
      const typeOverride = (args.typeOverride ?? '') as string;
      let john2Binary: string;

      if (typeOverride && TYPE_OVERRIDE_MAP[typeOverride]) {
        john2Binary = TYPE_OVERRIDE_MAP[typeOverride];
      } else {
        // Auto-detect via `file -b`
        const { execSync } = await import('child_process');
        const fileType = execSync(`file -b "${inputPath}"`, { encoding: 'utf-8' }).trim();

        const match = HASH_EXTRACT_MAP.find(([re]) => re.test(fileType));
        if (!match) {
          throw new Error(`Cannot auto-detect hash type for: ${fileType}\nUse the Type dropdown to select manually.`);
        }
        john2Binary = match[1];
      }

      const { cmd, args: prefixArgs } = john2Cmd(john2Binary);
      return {
        binary: cmd,
        argv: [...prefixArgs, inputPath],
      };
    },
    buildArgs: (_args, inputPath) => [inputPath], // fallback, overridden by prepare
  },

  /* ---- APKTool ---- */
  {
    name: 'apktool',
    description: 'Decompile Android APK files',
    binary: 'apktool',
    binaryInput: true,
    prepare: async (_args, workDir) => {
      await mkdir(path.join(workDir, 'apktool_out'), { recursive: true });
    },
    buildArgs: (args, inputPath) => {
      const outDir = path.join(path.dirname(inputPath), 'apktool_out');
      const argv = ['d', inputPath, '-o', outDir, '-f'];
      if (args.noSources) argv.push('-s');
      if (args.noResources) argv.push('-r');
      return argv;
    },
    collectFiles: async (workDir) => {
      return collectDirFiles(path.join(workDir, 'apktool_out'));
    },
  },

  /* ---- JADX ---- */
  {
    name: 'jadx',
    description: 'Decompile Android APK/DEX to Java source',
    binary: 'jadx',
    binaryInput: true,
    prepare: async (_args, workDir) => {
      await mkdir(path.join(workDir, 'jadx_out'), { recursive: true });
    },
    buildArgs: (args, inputPath) => {
      const outDir = path.join(path.dirname(inputPath), 'jadx_out');
      const argv = ['-d', outDir];
      const threads = args.threads as number | undefined;
      if (threads && threads > 0) argv.push('-j', String(threads));
      argv.push(inputPath);
      return argv;
    },
    collectFiles: async (workDir) => {
      return collectDirFiles(path.join(workDir, 'jadx_out'));
    },
  },

  /* ---- pdfinfo ---- */
  {
    name: 'pdfinfo',
    description: 'Display PDF document metadata and properties',
    binary: 'pdfinfo',
    binaryInput: true,
    buildArgs: (args, inputPath) => {
      const argv: string[] = [];
      if (args.password) argv.push('-upw', args.password as string);
      argv.push(inputPath);
      return argv;
    },
  },

  /* ---- QPDF ---- */
  {
    name: 'qpdf',
    description: 'Decrypt, linearize, or check PDF files',
    binary: 'qpdf',
    binaryInput: true,
    buildArgs: (args, inputPath) => {
      const mode = (args.mode ?? 'decrypt') as string;
      const outPath = path.join(path.dirname(inputPath), 'qpdf_out.pdf');
      const argv: string[] = [];

      if (args.password) argv.push(`--password=${args.password as string}`);

      if (mode === 'decrypt') {
        argv.push('--decrypt', inputPath, outPath);
      } else if (mode === 'linearize') {
        argv.push('--linearize', inputPath, outPath);
      } else if (mode === 'check') {
        argv.push('--check', inputPath);
      }
      return argv;
    },
    collectFiles: async (workDir) => {
      const outPath = path.join(workDir, 'qpdf_out.pdf');
      const st = await stat(outPath).catch(() => null);
      if (st?.isFile()) {
        const data = await readFile(outPath);
        return [{ name: 'qpdf_out.pdf', size: data.byteLength, data: data.toString('base64') }];
      }
      return [];
    },
  },

  /* ---- Aircrack-ng ---- */
  {
    name: 'aircrack-ng',
    description: 'Crack WPA/WEP keys from capture files',
    binary: 'aircrack-ng',
    binaryInput: true,
    buildArgs: (args, inputPath) => {
      const argv: string[] = [];
      const attack = (args.attack ?? 'wpa') as string;

      if (attack === 'wep') {
        // WEP mode — no wordlist needed
      } else {
        // WPA mode
        if (args.wordlist) argv.push('-w', args.wordlist as string);
      }
      if (args.essid) argv.push('-e', args.essid as string);
      if (args.bssid) argv.push('-b', args.bssid as string);
      argv.push(inputPath);
      return argv;
    },
  },

  /* ---- StegCracker ---- */
  {
    name: 'stegcracker',
    description: 'Brute-force steganography passphrases',
    binary: 'stegcracker',
    binaryInput: true,
    buildArgs: (args, inputPath) => {
      const argv = [inputPath];
      if (args.wordlist) argv.push(args.wordlist as string);
      return argv;
    },
  },
];

const toolMap = new Map(tools.map((t) => [t.name, t]));

/* ------------------------------------------------------------------ */
/*  Active PTY tracking (for resize)                                   */
/* ------------------------------------------------------------------ */

const activeProcs = new Map<string, pty.IPty>();

/** Last known terminal size — used for new spawns. */
let termCols = 80;
let termRows = 50;

/* ------------------------------------------------------------------ */
/*  Execute a tool                                                     */
/* ------------------------------------------------------------------ */

interface ExecRequest {
  type: 'execute';
  id: string;
  tool: string;
  input: string; // base64 for binary, raw text for string
  args: Record<string, any>;
}

async function executeTool(
  ws: WebSocket,
  req: ExecRequest,
) {
  const tool = toolMap.get(req.tool);

  // Generic / unknown tool — try running as bare command
  if (!tool) {
    if (req.args?.raw !== undefined) {
      // Generic backend tool
      await executeGeneric(ws, req);
      return;
    }
    ws.send(JSON.stringify({ type: 'error', id: req.id, message: `Unknown tool: ${req.tool}` }));
    return;
  }

  let workDir: string | null = null;

  try {
    workDir = await mkdtemp(path.join(tmpdir(), `cyberweb-${req.tool}-`));
    const inputPath = path.join(workDir, 'input');

    // Write input file
    if (tool.binaryInput) {
      const buf = Buffer.from(req.input, 'base64');
      await writeFile(inputPath, buf);
    } else {
      await writeFile(inputPath, req.input, 'utf-8');
    }

    let resolvedBinary = tool.binary;
    let argv: string[];

    if (tool.prepare) {
      const prepResult = await tool.prepare(req.args ?? {}, workDir, inputPath);
      if (prepResult?.binary) resolvedBinary = prepResult.binary;
      if (prepResult?.argv) {
        argv = prepResult.argv;
      } else {
        argv = tool.buildArgs(req.args ?? {}, inputPath);
      }
    } else {
      argv = tool.buildArgs(req.args ?? {}, inputPath);
    }

    const timeout = (req.args?.timeout ?? 120) * 1000;

    const result = await runProcess(ws, req.id, resolvedBinary, argv, workDir, timeout);

    // Collect extracted files if applicable
    let files: FileResult[] = [];
    if (tool.collectFiles) {
      files = await tool.collectFiles(workDir);
    }

    ws.send(JSON.stringify({
      type: 'result',
      id: req.id,
      status: 'success', // return output even on non-zero exit
      files: files.length > 0 ? files : undefined,
    }));
  } catch (err: any) {
    ws.send(JSON.stringify({
      type: 'error',
      id: req.id,
      message: err?.message ?? String(err),
    }));
  } finally {
    if (workDir) {
      rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

async function executeGeneric(ws: WebSocket, req: ExecRequest) {
  let workDir: string | null = null;
  try {
    workDir = await mkdtemp(path.join(tmpdir(), `cyberweb-generic-`));
    const rawArgs = (req.args?.raw ?? '') as string;
    const argv = rawArgs.split(/\s+/).filter(Boolean);
    const timeout = 120_000;

    const result = await runProcess(ws, req.id, req.tool, argv, workDir, timeout);

    ws.send(JSON.stringify({
      type: 'result',
      id: req.id,
      status: 'success',
      // stderr is already streamed via 'output' messages — don't duplicate
    }));
  } catch (err: any) {
    ws.send(JSON.stringify({
      type: 'error',
      id: req.id,
      message: err?.message ?? String(err),
    }));
  } finally {
    if (workDir) {
      rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

interface ProcessResult {
  exitCode: number;
}

/* ------------------------------------------------------------------ */
/*  Real-time output via node-pty (like ttyd)                          */
/*                                                                     */
/*  Uses forkpty() under the hood so the child process sees a real TTY */
/*  and uses line buffering. Data arrives immediately via onData —     */
/*  no block-buffering, no Python wrapper needed.                      */
/*                                                                     */
/*  Docker-wrapped tools: the child (docker CLI) inherits the PTY, so  */
/*  `[ -t 1 ]` in wrapper scripts returns true, enabling them to       */
/*  pass -t to `docker run` for unbuffered container output.           */
/* ------------------------------------------------------------------ */

/**
 * Send raw PTY output as a binary WebSocket frame (like ttyd).
 *
 * Binary frame layout:  [36 bytes request-ID (ASCII UUID)] [raw PTY data]
 * Text frames are reserved for JSON control messages (result/error/capabilities).
 *
 * Raw data is NOT sanitized — ANSI codes, \r, etc. are preserved so the
 * client can render them in xterm.js for a real terminal experience.
 */
function sendRawOutput(ws: WebSocket, reqId: string, data: Buffer) {
  const frame = Buffer.allocUnsafe(36 + data.length);
  frame.write(reqId, 0, 36, 'ascii');       // first 36 bytes = request ID
  data.copy(frame, 36);                     // rest = raw PTY bytes
  ws.send(frame);                           // binary frame
}

function runProcess(
  ws: WebSocket,
  reqId: string,
  binary: string,
  argv: string[],
  cwd: string,
  timeoutMs: number,
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    let proc: pty.IPty;
    try {
      proc = pty.spawn(binary, argv, {
        name: 'xterm-256color',
        cols: termCols,
        rows: termRows,
        cwd,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
          RUBY_FORCE_FLUSH: '1',
        },
      });
    } catch (err: any) {
      reject(new Error(`Failed to spawn ${binary}: ${err.message}`));
      return;
    }

    // Track for resize
    activeProcs.set(reqId, proc);

    let totalLen = 0;
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      proc.kill();
    }, timeoutMs);

    // Data arrives immediately from PTY — send as raw binary frame
    proc.onData((data: string) => {
      totalLen += data.length;
      if (totalLen > MAX_OUTPUT) return;

      sendRawOutput(ws, reqId, Buffer.from(data, 'utf-8'));
    });

    proc.onExit(({ exitCode }) => {
      clearTimeout(timer);
      activeProcs.delete(reqId);
      if (killed) {
        reject(new Error(`Process timed out after ${timeoutMs}ms`));
      } else {
        resolve({ exitCode });
      }
    });
  });
}

/* ------------------------------------------------------------------ */
/*  Directory listing for wordlist browser                             */
/* ------------------------------------------------------------------ */

async function handleListDir(ws: WebSocket, msg: any) {
  const reqPath = typeof msg.path === 'string' ? msg.path : '';
  const root = path.resolve(WORDLIST_ROOT);

  try {
    const resolved = path.resolve(root, reqPath);
    // Prevent directory traversal outside WORDLIST_ROOT
    if (!resolved.startsWith(root)) {
      ws.send(JSON.stringify({
        type: 'list-dir',
        id: msg.id,
        path: reqPath,
        error: 'Path outside wordlist root',
      }));
      return;
    }

    const entries = await readdir(resolved, { withFileTypes: true });
    const folders: string[] = [];
    const files: { name: string; size: number }[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue; // skip hidden
      if (entry.isDirectory()) {
        folders.push(entry.name);
      } else if (entry.isFile()) {
        const st = await stat(path.join(resolved, entry.name)).catch(() => null);
        files.push({ name: entry.name, size: st?.size ?? 0 });
      }
    }

    folders.sort((a, b) => a.localeCompare(b));
    files.sort((a, b) => a.name.localeCompare(b.name));

    ws.send(JSON.stringify({
      type: 'list-dir',
      id: msg.id,
      path: reqPath,
      folders,
      files,
    }));
  } catch (err: any) {
    ws.send(JSON.stringify({
      type: 'list-dir',
      id: msg.id,
      path: reqPath,
      error: err?.code === 'ENOENT' ? 'Directory not found' : (err?.message ?? String(err)),
    }));
  }
}

/* ------------------------------------------------------------------ */
/*  Recursive wordlist search                                          */
/* ------------------------------------------------------------------ */

async function handleSearchWordlists(ws: WebSocket, msg: any) {
  const query = typeof msg.query === 'string' ? msg.query.toLowerCase() : '';
  const root = path.resolve(WORDLIST_ROOT);
  const maxResults = 200;

  if (!query) {
    ws.send(JSON.stringify({ type: 'search-wordlists', id: msg.id, results: [] }));
    return;
  }

  try {
    const results: { relPath: string; name: string; size: number }[] = [];

    async function walk(dir: string) {
      if (results.length >= maxResults) return;
      let entries;
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch { return; }

      for (const entry of entries) {
        if (results.length >= maxResults) return;
        if (entry.name.startsWith('.')) continue;
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          if (entry.name.toLowerCase().includes(query)) {
            const rel = path.relative(root, fullPath);
            const st = await stat(fullPath).catch(() => null);
            results.push({ relPath: rel, name: entry.name, size: st?.size ?? 0 });
          }
        }
      }
    }

    await walk(root);
    results.sort((a, b) => a.relPath.localeCompare(b.relPath));

    ws.send(JSON.stringify({ type: 'search-wordlists', id: msg.id, results }));
  } catch (err: any) {
    ws.send(JSON.stringify({
      type: 'search-wordlists',
      id: msg.id,
      results: [],
      error: err?.message ?? String(err),
    }));
  }
}

/* ------------------------------------------------------------------ */
/*  WebSocket server                                                   */
/* ------------------------------------------------------------------ */

const wss = new WebSocketServer({ host: HOST, port: PORT });

wss.on('connection', (ws) => {
  const addr = (ws as any)._socket?.remoteAddress ?? '?';
  console.log(`[+] Client connected from ${addr}`);

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      handleMessage(ws, msg);
    } catch (err: any) {
      console.error('Bad message:', err?.message);
    }
  });

  ws.on('close', () => {
    console.log(`[-] Client disconnected (${addr})`);
  });
});

function handleMessage(ws: WebSocket, msg: any) {
  switch (msg.type) {
    case 'capabilities':
      ws.send(JSON.stringify({
        type: 'capabilities',
        tools: tools.map((t) => ({ name: t.name, description: t.description })),
        wordlistRoot: path.resolve(WORDLIST_ROOT),
      }));
      break;

    case 'execute':
      executeTool(ws, msg as ExecRequest);
      break;

    case 'list-dir':
      handleListDir(ws, msg);
      break;

    case 'search-wordlists':
      handleSearchWordlists(ws, msg);
      break;

    case 'resize': {
      const cols = Math.max(1, Math.min(500, msg.cols ?? 80));
      const rows = Math.max(1, Math.min(200, msg.rows ?? 50));
      termCols = cols;
      termRows = rows;
      // Resize all active PTYs
      for (const proc of activeProcs.values()) {
        try { proc.resize(cols, rows); } catch { /* process may have exited */ }
      }
      break;
    }

    default:
      console.warn('Unknown message type:', msg.type);
  }
}

wss.on('listening', () => {
  console.log(`CyberWeb Backend Server listening on ws://${HOST}:${PORT}`);
  console.log(`Tools available: ${tools.map((t) => t.name).join(', ')}`);
});
