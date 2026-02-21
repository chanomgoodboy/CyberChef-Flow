import { test, expect } from '@playwright/test';

test.describe('CyberWeb E2E', () => {
  test('app loads with toolbar, sidebar, and input node', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.toolbar-brand')).toBeVisible();
    await expect(page.locator('.operation-palette')).toBeVisible();
    await expect(page.locator('.input-node')).toBeVisible();
  });

  test('input node accepts text', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea.input-textarea').first();
    await expect(textarea).toBeVisible();
    await textarea.fill('hello world');
    await expect(textarea).toHaveValue('hello world');
  });

  test('Cmd+K opens palette and adds operation', async ({ page }) => {
    await page.goto('/');

    // Click the toolbar brand to focus the page without hitting a form control
    await page.locator('.toolbar-brand').click();

    // Open command palette (Ctrl works cross-platform; handler checks ctrlKey || metaKey)
    await page.keyboard.press('Control+k');
    await expect(page.locator('.cmd-palette-overlay')).toBeVisible();

    // Type operation name and select
    await page.locator('.cmd-palette-input').fill('To Base64');
    await expect(page.locator('.cmd-palette-item-label:has-text("To Base64")')).toBeVisible();
    await page.keyboard.press('Enter');

    // Verify operation node appeared
    await expect(page.locator('.cyberweb-node.operation-node')).toBeVisible();
  });

  test('graph executes and shows status checkmark', async ({ page }) => {
    await page.goto('/');

    // Type input
    const textarea = page.locator('textarea.input-textarea').first();
    await textarea.fill('test data');

    // Click the input node header to select it (so the palette chains from it)
    await page.locator('.input-label-row').first().click();

    // Add operation via Cmd+K — it will chain from the selected input node
    await page.keyboard.press('Control+k');
    await page.locator('.cmd-palette-input').fill('To Base64');
    await page.keyboard.press('Enter');

    // Wait for auto-run execution to complete (status checkmark appears)
    await expect(page.locator('.status-check').first()).toBeVisible({ timeout: 10_000 });
  });

  test('URL hash updates after typing', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea.input-textarea').first();
    await textarea.fill('url state test');

    // URL hash should update with graph encoding
    await expect(async () => {
      const url = page.url();
      expect(url).toContain('#g=');
    }).toPass({ timeout: 5_000 });
  });

  test('URL state restores on reload', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea.input-textarea').first();
    await textarea.fill('persist me');

    // Wait for URL hash to update
    await expect(async () => {
      expect(page.url()).toContain('#g=');
    }).toPass({ timeout: 5_000 });

    const urlWithState = page.url();

    // Navigate to the captured URL (simulates reload with state)
    await page.goto(urlWithState);

    // Verify input was restored
    const restored = page.locator('textarea.input-textarea').first();
    await expect(restored).toHaveValue('persist me', { timeout: 5_000 });
  });
});
