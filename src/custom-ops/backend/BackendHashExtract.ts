import { BackendOperation, registerBackendOp } from './_base';
import type { BackendResult } from '../../worker/BackendClient';

const NAME = 'Hash Extract (Backend)';

const TYPE_OPTIONS = [
  'Auto-detect',
  'ZIP', 'RAR', '7z', 'PDF', 'Office',
  'KeePass', 'SSH Key', 'GPG Key', 'WPA pcap', 'DMG',
];

const OUTPUT_FORMATS = ['Hashcat', 'John'];

/** ANSI escape sequences */
const ANSI_RE = /\x1b\[[0-9;]*[A-Za-z]|\x1b\].*?\x07|\x1b[()][A-Z0-9]|\x1b[=>]/g;
/** Server temp dir paths */
const TMPDIR_RE = /\/(?:private\/)?(?:tmp|var\/folders)\/[^\s/]+(?:\/[^\s/]+)*\/cyberweb-[^\s/]+\//g;

const ARGS = [
  { name: 'Type', type: 'option', value: TYPE_OPTIONS },
  { name: 'Output Format', type: 'option', value: OUTPUT_FORMATS },
];

class BackendHashExtract extends BackendOperation {
  constructor() {
    super();
    this.toolName = 'hash-extract';
    this.name = NAME;
    this.description = 'Extract password hashes from files using *2john tools. Auto-detects file type.';
    this.infoURL = 'https://www.openwall.com/john/';
    this.inputType = 'ArrayBuffer';
    this.outputType = 'string';
    this.args = ARGS;
  }

  protected buildToolArgs(args: any[]) {
    const typeOverride = args[0] as string;
    return {
      typeOverride: typeOverride === 'Auto-detect' ? '' : typeOverride,
    };
  }

  /** Stash the output format selection so formatResult can use it. */
  private _outputFormat = 'Hashcat';

  async run(input: any, args: any[]): Promise<string> {
    this._outputFormat = (args[1] as string) ?? 'Hashcat';
    return super.run(input, args);
  }

  protected formatResult(result: BackendResult): string {
    if (result.status === 'error' && result.message) {
      return `Error: ${result.message}`;
    }

    const raw = ((result.stdout ?? '') + (result.text ?? ''))
      .replace(ANSI_RE, '')
      .replace(TMPDIR_RE, './');

    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    // Hash lines from *2john contain ':$' (e.g. "input:$pkzip2$..." or "id:$ssh$...")
    const hashLines = lines.filter(l => l.includes(':$'));

    if (hashLines.length === 0) {
      return lines.join('\n') || '(no hash extracted)';
    }

    if (this._outputFormat === 'John') {
      // John expects user:$hash$ — keep as-is
      return hashLines.join('\n');
    }

    // Hashcat expects raw $hash$ — strip filename prefix
    return hashLines
      .map(line => {
        const idx = line.indexOf(':$');
        return idx >= 0 ? line.substring(idx + 1) : line;
      })
      .join('\n');
  }
}

registerBackendOp(BackendHashExtract, {
  name: NAME,
  description: 'Extract password hashes from files using *2john tools. Auto-detects file type.',
  infoURL: 'https://www.openwall.com/john/',
  inputType: 'ArrayBuffer',
  outputType: 'string',
  args: ARGS,
});
