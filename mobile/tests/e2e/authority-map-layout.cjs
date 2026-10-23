const { chromium, mockApi, login } = require('./fixtures.cjs');
const { expect } = require('@playwright/test');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const output = 'tests/artifacts/authority-map-2026-10-19';
  fs.mkdirSync(output, { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const state = await mockApi(page, 'authority');
    state.complaints = state.complaints.slice(0, 2).map(complaint => ({ ...complaint, status: 'Resolved', address: 'கொள்ளுமேடு, ஆவடி, சென்னை மாநகராட்சி, தமிழ்நாடு — Near the main road and community park' }));
    await login(page, 'authority');
    await page.getByRole('button', { name: 'Incident Map', exact: true }).click();
    await expect(page.frameLocator('iframe[title="CivicTrack OpenStreetMap"]').locator('.leaflet-tile-loaded').first()).toBeVisible({ timeout: 20000 });
    const checks = [];
    for (const [width, height] of [[1920,1080], [1440,900], [1024,768], [768,1024], [393,873], [320,568], [844,390]]) {
      await page.setViewportSize({ width, height });
      await expect(page.frameLocator('iframe[title="CivicTrack OpenStreetMap"]').locator('.leaflet-tile-loaded').first()).toBeVisible({ timeout: 20000 });
      await expect(page.getByTestId('selected-map-incident')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      // Confirm the title and filters are separate rows on desktop.
      if (width >= 1024) {
        const heading = await page.getByText('Incident Map', { exact: true }).filter({ visible: true }).last().boundingBox();
        const filter = await page.getByRole('button', { name: 'All Pinned, 2 incidents', exact: true }).boundingBox();
        expect(filter.y).toBeGreaterThan(heading.y + heading.height);
      }
      await page.screenshot({ path: `${output}/map-${width}x${height}.png`, animations: 'disabled' });
      checks.push({ width, height, overflow: false });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('button', { name: 'Pending, 0 incidents', exact: true }).click();
    await expect(page.getByText('No incidents to display').first()).toBeVisible();
    await page.getByRole('button', { name: 'Show all incidents', exact: true }).first().click();
    await page.getByRole('button', { name: 'Preview incident CIV-100101', exact: true }).click();
    await expect(page.getByTestId('selected-map-incident')).toContainText('CIV-100101');
    await page.getByRole('button', { name: 'Inspect Dossier', exact: true }).click();
    await expect(page.getByText('Incident Dossier', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await page.setViewportSize({ width: 393, height: 873 });
    await page.getByRole('button', { name: 'Preview incident CIV-100100', exact: true }).click();
    await expect(page.getByTestId('selected-map-incident')).toContainText('CIV-100100');
    await page.getByRole('button', { name: 'Inspect Dossier', exact: true }).click();
    await expect(page.getByText('Incident Dossier', { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
    fs.writeFileSync(`${output}/results.json`, JSON.stringify({ checks, emptyFilterRecovery: 'passed', selectionAndNavigation: 'passed', errors }, null, 2));
    console.log('Authority map passed: seven viewports, long addresses, filters, empty recovery, selection and detail navigation.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
