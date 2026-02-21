/**
 * File I/O helpers for saving output data to disk.
 */

/**
 * Trigger a browser file download from a data URL (image) or text string.
 */
export function saveOutputToFile(displayValue: string, dataUrl?: string): void {
  if (dataUrl) {
    // Image output — extract MIME and decode base64
    const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      const mime = match[1];
      const ext = mime.split('/')[1] || 'bin';
      const b64 = match[2];
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      downloadBlob(new Blob([bytes], { type: mime }), `output.${ext}`);
      return;
    }
  }

  if (displayValue) {
    // Text output — convert Latin-1 binary string to raw bytes
    const bytes = new Uint8Array(displayValue.length);
    for (let i = 0; i < displayValue.length; i++) {
      bytes[i] = displayValue.charCodeAt(i) & 0xFF;
    }
    downloadBlob(new Blob([bytes], { type: 'application/octet-stream' }), 'output.dat');
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
