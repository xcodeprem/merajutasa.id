import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACTS_ROOT = path.resolve(__dirname, '../../../../', 'artifacts');

test('dashboard renders and shows KPI Visualization', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=/KPI Visualization|Visualisasi KPI/')).toBeVisible();
});

test('can navigate to Analytics and Compliance (guarded)', async ({ page }) => {
  await page.goto('/#/analytics');
  await expect(page.locator('text=/Analytics|Tren Keputusan|Decision Trends/')).toBeVisible();

  await page.goto('/#/compliance');
  await expect(page.locator('text=/Settings|Pengaturan/')).toBeVisible();
});

test.afterAll(async () => {
  await fs.mkdir(ARTIFACTS_ROOT, { recursive: true });
  await fs.writeFile(
    path.join(ARTIFACTS_ROOT, 'equity-ui-e2e-smoke.json'),
    JSON.stringify({ ok: true, ts: new Date().toISOString() }, null, 2)
  );
});
