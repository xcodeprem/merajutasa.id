import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACTS_ROOT = path.resolve(__dirname, '../../../../', 'artifacts');

async function writeArtifact(name: string, data: unknown) {
  await fs.mkdir(ARTIFACTS_ROOT, { recursive: true });
  const file = path.join(ARTIFACTS_ROOT, name);
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
}

async function scanAndAssert(page: Page, route: string) {
  await page.goto(route);
  const axe = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);
  const results = await axe.analyze();
  await writeArtifact(`a11y-${route.replace(/[^a-zA-Z0-9-_]/g, '_')}.json`, results);
  expect(results.violations).toEqual([]);
}

test('homepage a11y', async ({ page }) => {
  await scanAndAssert(page, '/');
});

test('analytics a11y', async ({ page }) => {
  await scanAndAssert(page, '/#/analytics');
});

test('compliance a11y', async ({ page }) => {
  await scanAndAssert(page, '/#/compliance');
});

test('settings a11y', async ({ page }) => {
  await scanAndAssert(page, '/#/settings');
});
