import { test, expect, Page } from '@playwright/test';

/* ------------------------------------------------------------------ */
/*  Test data                                                          */
/* ------------------------------------------------------------------ */

// Minimal 4x4 red PNG
const TINY_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAEAQMAAACTPww9AAAAIGNIUk0AAHomAACAhAAA' +
  '+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGUExURf8AAP///0EdNBEAAAABYktH' +
  'RAH/Ai3eAAAAB3RJTUUH6gITEAYrpafE4wAAAAtJREFUCNdjYIAAAAAIAAEvID0xAAAA' +
  'JXRFWHRkYXRlOmNyZWF0ZQAyMDI2LTAyLTE5VDE2OjA2OjQzKzAwOjAw1VKllQAAAC' +
  'V0RVh0ZGF0ZTptb2RpZnkAMjAyNi0wMi0xOVQxNjowNjo0MyswMDowMKQPHSkAAAAo' +
  'dEVYdGRhdGU6dGltZXN0YW1wADIwMjYtMDItMTlUMTY6MDY6NDMrMDA6MDDzGjz2AA' +
  'AAAElFTkSuQmCC';

// Minimal 4x4 red BMP (steghide accepts JPEG/BMP/WAV/AU)
const TINY_BMP_B64 =
  'Qk26AAAAAAAAAIoAAAB8AAAABAAAAAQAAAABABgAAAAAADAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAD/AAD/AAD/AAAAAAAA/0JHUnOPwvUoUbgeFR6F6wEzMzMTZmZmJmZmZgaZmZkJPQ' +
  'rXAyhcjzIAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAD/AAD/AAD/AAD/AAD/AAD/' +
  'AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/';

// MD5 of "hello"
const MD5_HELLO = '5d41402abc4b2a76b9719d911017c592';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Enable backend in localStorage before navigating. */
async function setupBackend(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'cyberweb_backend',
      JSON.stringify({ url: 'ws://localhost:8540', enabled: true }),
    );
  });
}

/** Navigate to app and wait for backend to connect (green indicator). */
async function gotoAndWaitForBackend(page: Page) {
  await page.goto('/');
  await expect(
    page.locator('.backend-indicator-label'),
  ).toHaveText('Backend', { timeout: 15_000 });
}

/** Set text input on the input node. */
async function setTextInput(page: Page, text: string) {
  const textarea = page.locator('textarea.input-textarea').first();
  await expect(textarea).toBeVisible({ timeout: 5_000 });
  await textarea.fill(text);
}

/**
 * Set binary data on the input node via page.evaluate.
 * Converts base64 to ArrayBuffer and writes to the graphStore node data.
 */
async function setBinaryInput(page: Page, b64: string, fileName: string) {
  await page.evaluate(
    ({ b64, fileName }) => {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const buf = bytes.buffer;

      // Build a display string (Latin-1, one char per byte)
      const chunks: string[] = [];
      for (let i = 0; i < bytes.length; i += 8192) {
        chunks.push(
          String.fromCharCode(...bytes.subarray(i, i + 8192)),
        );
      }
      const display = chunks.join('');

      // Find the input node and update it via the Zustand store
      // Access the store via the module's internal API
      const storeApi = (window as any).__ZUSTAND_GRAPHSTORE__;
      if (storeApi) {
        const state = storeApi.getState();
        const inputNode = state.nodes.find((n: any) => n.type === 'input');
        if (inputNode) {
          state.updateNodeData(inputNode.id, {
            inputValue: display,
            inputRaw: buf,
            fileName,
          });
        }
      }
    },
    { b64, fileName },
  );
}

/** Select the input node by clicking its label row. */
async function selectInputNode(page: Page) {
  await page.locator('.input-label-row').first().click();
}

/** Add an operation via Cmd+K command palette. */
async function addOperation(page: Page, opName: string) {
  await page.keyboard.press('Control+k');
  await expect(page.locator('.cmd-palette-overlay')).toBeVisible();
  await page.locator('.cmd-palette-input').fill(opName);
  const item = page.locator('.cmd-palette-item-label', { hasText: opName });
  await expect(item).toBeVisible({ timeout: 5_000 });
  await page.keyboard.press('Enter');
  // Wait for the operation node to appear
  await expect(page.locator('.operation-node')).toBeVisible({ timeout: 5_000 });
}

/**
 * Wait for execution to complete on the operation node.
 * Returns 'success' or 'error'.
 */
async function waitForExecution(
  page: Page,
  timeoutMs = 30_000,
): Promise<{ status: 'success' | 'error'; errorMsg?: string }> {
  const success = page.locator('.operation-node .status-check');
  const error = page.locator('.operation-node .status-error');

  await expect(success.or(error)).toBeVisible({ timeout: timeoutMs });

  if (await success.isVisible()) {
    return { status: 'success' };
  }
  const errorMsg = await page
    .locator('.operation-node .status-error-msg')
    .textContent()
    .catch(() => '');
  return { status: 'error', errorMsg: errorMsg ?? '' };
}

/** Assert no code-level errors in the error message. */
function assertNoCodeErrors(errorMsg: string) {
  expect(errorMsg).not.toContain('randomUUID');
  expect(errorMsg).not.toContain('Backend not connected');
  expect(errorMsg).not.toContain('is not a function');
  expect(errorMsg).not.toContain('Cannot read properties');
  expect(errorMsg).not.toContain('is not defined');
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

test.describe('Backend Tools E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupBackend(page);
  });

  /* ---- Connection ---- */

  test('backend connects and shows green indicator', async ({ page }) => {
    await gotoAndWaitForBackend(page);
    await expect(page.locator('.backend-indicator')).toBeVisible();
  });

  test('backend settings modal shows connected tools', async ({ page }) => {
    await gotoAndWaitForBackend(page);
    await page.locator('button[title="Backend Tools Settings"]').click();
    await expect(page.locator('.modal-title')).toHaveText('Backend Settings');
    await expect(page.locator('.backend-tool-name').first()).toBeVisible();
    const toolNames = await page
      .locator('.backend-tool-name')
      .allTextContents();
    expect(toolNames).toContain('binwalk');
    expect(toolNames).toContain('exiftool');
    expect(toolNames).toContain('strings');
  });

  test('backend hidden when disabled', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'cyberweb_backend',
        JSON.stringify({ url: 'ws://localhost:8540', enabled: false }),
      );
    });
    await page.goto('/');
    await expect(page.locator('.backend-indicator')).not.toBeVisible();
  });

  /* ---- Binary-input tools (PNG) ---- */

  test('Binwalk (Backend) — scan PNG', async ({ page }) => {
    await gotoAndWaitForBackend(page);
    await setBinaryInput(page, TINY_PNG_B64, 'test.png');
    await selectInputNode(page);
    await addOperation(page, 'Binwalk (Backend)');
    const r = await waitForExecution(page);
    expect(r.status).toBe('success');
  });

  test('ExifTool (Backend) — read PNG metadata', async ({ page }) => {
    await gotoAndWaitForBackend(page);
    await setBinaryInput(page, TINY_PNG_B64, 'test.png');
    await selectInputNode(page);
    await addOperation(page, 'ExifTool (Backend)');
    const r = await waitForExecution(page);
    expect(r.status).toBe('success');
  });

  test('Pngcheck (Backend) — validate PNG', async ({ page }) => {
    await gotoAndWaitForBackend(page);
    await setBinaryInput(page, TINY_PNG_B64, 'test.png');
    await selectInputNode(page);
    await addOperation(page, 'Pngcheck (Backend)');
    const r = await waitForExecution(page);
    expect(r.status).toBe('success');
  });

  test('Strings (Backend) — extract from PNG', async ({ page }) => {
    await gotoAndWaitForBackend(page);
    await setBinaryInput(page, TINY_PNG_B64, 'test.png');
    await selectInputNode(page);
    await addOperation(page, 'Strings (Backend)');
    const r = await waitForExecution(page);
    expect(r.status).toBe('success');
  });

  test('Zsteg (Backend) — analyze PNG', async ({ page }) => {
    await gotoAndWaitForBackend(page);
    await setBinaryInput(page, TINY_PNG_B64, 'test.png');
    await selectInputNode(page);
    await addOperation(page, 'Zsteg (Backend)');
    const r = await waitForExecution(page);
    // zsteg may error on tiny images but the pipeline should work
    if (r.status === 'error') {
      assertNoCodeErrors(r.errorMsg!);
    }
  });

  test('Foremost (Backend) — carve from PNG', async ({ page }) => {
    await gotoAndWaitForBackend(page);
    await setBinaryInput(page, TINY_PNG_B64, 'test.png');
    await selectInputNode(page);
    await addOperation(page, 'Foremost (Backend)');
    const r = await waitForExecution(page);
    expect(r.status).toBe('success');
  });

  /* ---- Steganography tools (BMP) ---- */

  test('Steghide (Backend) — info on BMP', async ({ page }) => {
    await gotoAndWaitForBackend(page);
    await setBinaryInput(page, TINY_BMP_B64, 'test.bmp');
    await selectInputNode(page);
    await addOperation(page, 'Steghide (Backend)');
    const r = await waitForExecution(page);
    // steghide may fail on tiny BMPs — just verify pipeline
    if (r.status === 'error') {
      assertNoCodeErrors(r.errorMsg!);
    }
  });

  test('Stegseek (Backend) — crack on BMP', async ({ page }) => {
    await gotoAndWaitForBackend(page);
    await setBinaryInput(page, TINY_BMP_B64, 'test.bmp');
    await selectInputNode(page);
    await addOperation(page, 'Stegseek (Backend)');
    const r = await waitForExecution(page);
    if (r.status === 'error') {
      assertNoCodeErrors(r.errorMsg!);
    }
  });

  /* ---- Text-input tools ---- */

  test('Hashcat (Backend) — crack MD5', async ({ page }) => {
    await gotoAndWaitForBackend(page);
    await setTextInput(page, MD5_HELLO);
    await selectInputNode(page);
    await addOperation(page, 'Hashcat (Backend)');
    const r = await waitForExecution(page, 45_000);
    // hashcat may fail (no GPU etc.) — just verify pipeline
    if (r.status === 'error') {
      assertNoCodeErrors(r.errorMsg!);
    }
  });

  test('John the Ripper (Backend) — crack MD5', async ({ page }) => {
    await gotoAndWaitForBackend(page);
    await setTextInput(page, MD5_HELLO);
    await selectInputNode(page);
    await addOperation(page, 'John the Ripper (Backend)');
    const r = await waitForExecution(page, 45_000);
    if (r.status === 'error') {
      assertNoCodeErrors(r.errorMsg!);
    }
  });

  test('Generic Backend Tool — run echo', async ({ page }) => {
    await gotoAndWaitForBackend(page);
    await setTextInput(page, 'hello');
    await selectInputNode(page);
    await addOperation(page, 'Generic Backend Tool');
    // The "echo" tool is not registered on the backend, so it should error
    // with "not available on backend server" — that's correct behavior
    const r = await waitForExecution(page, 15_000);
    if (r.status === 'error') {
      assertNoCodeErrors(r.errorMsg!);
    }
  });
});
