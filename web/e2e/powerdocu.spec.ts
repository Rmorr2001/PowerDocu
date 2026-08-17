import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { unzipSync } from 'fflate';

import { writeSyntheticMsapp } from './synthetic-msapp';

test('uses real documentation routes from the streamlined workflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Runtime ready', { exact: true })).toHaveCount(0);

  await expect(page.getByRole('link', { name: 'PowerDocu Repo' })).toHaveAttribute(
    'href',
    'https://github.com/modery/PowerDocu',
  );
  await expect(page.getByRole('link', { name: 'Browser App Source' })).toHaveAttribute(
    'href',
    'https://github.com/Rmorr2001/PowerDocu/tree/codex/browser-adapter-restart',
  );

  await expect(page.getByText('Your app file stays local')).toHaveCount(0);
  await expect(page.locator('[data-progress-state]')).toHaveCount(0);

  await page.getByRole('link', { name: 'Instructions' }).click();
  await expect(page).toHaveURL('/instructions');
  await expect(page.getByRole('region', { name: 'Source & credit' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Generate a complete app report' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Generate the report' })).toBeVisible();
  await expect(page.getByText('Your app data is not uploaded')).toBeVisible();

  await page.getByRole('link', { name: '.msapp files', exact: true }).click();
  await expect(page).toHaveURL('/instructions/msapp');
  await expect(page.getByRole('region', { name: 'Source & credit' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'How .msapp files work' })).toBeVisible();
  await expect(page.getByText('References/DataSources.json', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'PowerDocu', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Source & credit' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'The document pipeline' })).toBeVisible();
  await expect(page.getByText('Microsoft Power Fx', { exact: true })).toBeVisible();

  await page.goto('/instructions/webassembly');
  await expect(page.getByRole('region', { name: 'Source & credit' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'How this WebAssembly app works' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Where the implementation lives' })).toBeVisible();
  await expect(page.getByText('web/src/powerdocu.worker.ts', { exact: true })).toBeVisible();
});

test('generates a safe HTML archive entirely on the page origin', async ({ page }, testInfo) => {
  const requestOrigins = new Set<string>();
  page.on('request', (request) => requestOrigins.add(new URL(request.url()).origin));

  const fixturePath = testInfo.outputPath('synthetic.msapp');
  await writeSyntheticMsapp(fixturePath);
  await page.goto('/');

  await page.locator('input[type="file"]').setInputFiles(fixturePath);
  await expect(page.getByText('synthetic.msapp', { exact: true })).toBeVisible();
  await page.getByRole('radio', { name: 'HTML report' }).click();
  const generateButton = page.getByRole('button', { name: 'Generate full report' });
  await expect(generateButton).toBeEnabled({ timeout: 120_000 });
  await generateButton.click();
  const outcome = page.getByRole('heading', { name: /Archive ready|Generation failed/ });
  await expect(outcome).toBeVisible({ timeout: 120_000 });
  expect(await outcome.innerText()).toBe('Archive ready');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download complete HTML ZIP' }).click();
  const download = await downloadPromise;
  const archivePath = testInfo.outputPath('powerdocu-output.zip');
  await download.saveAs(archivePath);

  const files = unzipSync(await readFile(archivePath));
  const names = Object.keys(files);
  expect(names.some((name) => name.endsWith('.html'))).toBe(true);
  expect(names.some((name) => name.endsWith('.svg'))).toBe(true);
  expect(names.some((name) => name.endsWith('.png'))).toBe(true);
  expect(names.every(isSafeRelativePath)).toBe(true);
  expect(requestOrigins).toEqual(new Set([new URL(testInfo.project.use.baseURL as string).origin]));
});

test('generates a Word report with local SVG and PNG diagram parts', async ({ page }, testInfo) => {
  const fixturePath = testInfo.outputPath('synthetic.msapp');
  await writeSyntheticMsapp(fixturePath);
  await page.goto('/');

  await page.locator('input[type="file"]').setInputFiles(fixturePath);
  const generateButton = page.getByRole('button', { name: 'Generate full report' });
  await expect(generateButton).toBeEnabled({ timeout: 120_000 });
  await generateButton.click();
  const outcome = page.getByRole('heading', { name: /Archive ready|Generation failed/ });
  await expect(outcome).toBeVisible({ timeout: 120_000 });
  expect(await outcome.innerText()).toBe('Archive ready');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download complete Word ZIP' }).click();
  const download = await downloadPromise;
  const archivePath = testInfo.outputPath('powerdocu-word-output.zip');
  await download.saveAs(archivePath);

  const files = unzipSync(await readFile(archivePath));
  const names = Object.keys(files);
  const documentName = names.find((name) => name.endsWith('/Synthetic Canvas.docx'));
  expect(documentName).toBeDefined();
  expect(names.some((name) => name.endsWith('/ScreenNavigation.svg'))).toBe(true);
  expect(names.some((name) => name.endsWith('/ScreenNavigation.png'))).toBe(true);

  const documentParts = unzipSync(files[documentName!]);
  expect(Object.keys(documentParts)).toContain('word/document.xml');
  expect(Object.keys(documentParts).some((name) => name.endsWith('.svg'))).toBe(true);
  const pngPartName = Object.keys(documentParts).find((name) => name.endsWith('.png'));
  expect(pngPartName).toBeDefined();
  expect(Array.from(documentParts[pngPartName!].slice(0, 8))).toEqual([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
});

test('cancels by replacing the Worker and recovers for the next run', async ({ page }, testInfo) => {
  const fixturePath = testInfo.outputPath('synthetic.msapp');
  await writeSyntheticMsapp(fixturePath);
  await page.goto('/');
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
  await page.getByRole('radio', { name: 'HTML report' }).click();

  const generateButton = page.getByRole('button', { name: 'Generate full report' });
  await expect(generateButton).toBeEnabled({ timeout: 120_000 });
  await generateButton.click();
  await page.getByRole('button', { name: 'Cancel generation' }).click();
  await expect(page.getByRole('heading', { name: 'Cancelled — runtime restarted' })).toBeVisible();
  await expect(generateButton).toBeEnabled({ timeout: 120_000 });

  await generateButton.click();
  const outcome = page.getByRole('heading', { name: /Archive ready|Generation failed/ });
  await expect(outcome).toBeVisible({ timeout: 120_000 });
  expect(await outcome.innerText()).toBe('Archive ready');
});

function isSafeRelativePath(path: string): boolean {
  return !path.startsWith('/') && !path.includes('\\') && !path.split('/').includes('..');
}
