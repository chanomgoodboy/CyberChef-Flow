import CustomOperation from '../_base/CustomOperation';
import { registerCustomOp } from '../_base/registry';
import type { OperationMeta } from '@/adapter/types';
import * as BackendClient from '../../worker/BackendClient';
import type { BackendResult } from '../../worker/BackendClient';

const CATEGORY = 'Backend Tools';

/** Strip ANSI escape sequences from terminal output. */
const ANSI_RE = /\x1b\[[0-9;]*[A-Za-z]|\x1b\].*?\x07|\x1b[()][A-Z0-9]|\x1b[=>]/g;
/** Strip server-side temp directory paths from output. */
const TMPDIR_RE = /\/(?:private\/)?(?:tmp|var\/folders)\/[^\s/]+(?:\/[^\s/]+)*\/cyberweb-[^\s/]+\//g;

function stripAnsi(s: string): string {
  return s.replace(ANSI_RE, '');
}

function cleanOutput(s: string): string {
  return stripAnsi(s).replace(TMPDIR_RE, './');
}

/**
 * Base class for backend tool operations.
 * Subclasses set toolName, define args, and override buildToolArgs().
 */
export class BackendOperation extends CustomOperation {
  protected toolName = '';

  /** Stream callback — set by the engine before run() for live output updates. */
  _onStream?: (accumulated: string) => void;

  /** Extracted files stashed after the last run (read by OperationAdapter). */
  _extractedFiles?: { name: string; size: number; data: string }[];

  constructor() {
    super();
    this.module = 'Backend';
  }

  async run(input: any, args: any[]): Promise<string> {
    if (BackendClient.getStatus() !== 'connected') {
      throw new Error('Backend not connected. Enable in Settings \u2192 Backend.');
    }
    if (!BackendClient.isToolAvailable(this.toolName)) {
      throw new Error(`Tool "${this.toolName}" not available on backend server.`);
    }

    // Get raw input — for ArrayBuffer operations, input is already ArrayBuffer
    const result = await BackendClient.execute(
      this.toolName,
      input,
      this.buildToolArgs(args),
      undefined,
      this._onStream,
    );

    // Stash extracted files so OperationAdapter can read them
    if (result.files && result.files.length > 0) {
      this._extractedFiles = result.files;
    }

    return this.formatResult(result);
  }

  /** Override to map CyberChef args array to tool-specific key/value args. */
  protected buildToolArgs(_args: any[]): Record<string, any> {
    return {};
  }

  /** Format the backend result into displayable text. */
  protected formatResult(result: BackendResult): string {
    const parts: string[] = [];

    if (result.stdout) {
      parts.push(cleanOutput(result.stdout));
    }

    if (result.text) {
      parts.push(cleanOutput(result.text));
    }

    if (result.files && result.files.length > 0) {
      parts.push('');
      parts.push(`--- Extracted ${result.files.length} file(s) ---`);
      for (const f of result.files) {
        parts.push(`  ${f.name} (${f.size} bytes)`);
      }
    }

    if (result.status === 'error' && result.message) {
      parts.push(`Error: ${result.message}`);
    }

    return parts.join('\n') || '(no output)';
  }
}

/** Helper to register a backend operation with standard metadata. */
export function registerBackendOp(
  OpClass: new () => any,
  meta: Omit<OperationMeta, 'module' | 'flowControl'>,
) {
  registerCustomOp(
    OpClass,
    { ...meta, module: 'Backend', flowControl: false },
    CATEGORY,
  );
}
