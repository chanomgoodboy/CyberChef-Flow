/**
 * Backend operations that require manual trigger (heavy/destructive tools).
 * These won't auto-run during normal graph execution — the user must click ▶.
 *
 * Defined in a standalone file so it can be imported from both the main thread
 * (OperationNode) and the worker (GraphEngine) without pulling in heavy deps.
 */
export const MANUAL_BACKEND_OPS = new Set([
  'Hashcat (Backend)',
  'John the Ripper (Backend)',
  'Aircrack-ng (Backend)',
  'Stegseek (Backend)',
  'StegCracker (Backend)',
]);
