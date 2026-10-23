const { chromium, mockApi, login } = require('./fixtures.cjs');
const { expect } = require('@playwright/test');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const output = 'tests/artifacts/analytics-2026-10-19';
  fs.mkdirSync(output, { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const state = await mockApi(page, 'authority');
    // A real-shaped fixture with one valid resolution interval, not live data.
    state.complaints[2].resolvedAt = new Date(Date.parse(state.complaints[2].createdAt) + 4 * 3600000).toISOString();
    await login(page, 'authority');
    await page.getByRole('button', { name: 'Operations Analytics', exact: true }).click();
    await expect(page.getByText('4.0 hrs', { exact: true })).toBeVisible();
    const checks = [];
    for (const [width, height] of [[1920,1080], [1440,900], [1024,768], [768,1024], [393,873], [320,568], [844,390]]) {
      await page.setViewportSize({ width, height });
      await expect(page.getByRole('button', { name: 'Export Excel workbook', exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `${output}/analytics-${width}x${height}.png`, animations: 'disabled' });
      checks.push({ width, height, overflow: false });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('button', { name: 'All Time', exact: true }).click();
    await expect(page.getByRole('button', { name: 'All Time', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Operations overview', { exact: true })).toBeVisible();
    await expect(page.getByText('Ward-level analysis and service-level compliance are unavailable', { exact: false })).toBeVisible();
    state.complaints = [];
    await page.getByRole('button', { name: 'Refresh analytics', exact: true }).click();
    await expect(page.getByText('No reports in this period', { exact: true })).toBeVisible();
    await expect(page.getByText('No valid resolution timestamps', { exact: true })).toBeVisible();
    state.fail = true;
    await page.getByRole('button', { name: 'Refresh analytics', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Backend server encountered an error');
    state.fail = false;
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(page.getByText('Operations overview', { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
    fs.writeFileSync(`${output}/results.json`, JSON.stringify({ checks, periods: 'passed', validResolutionTime: 'passed', emptyState: 'passed', errorRecovery: 'passed', errors }, null, 2));
    console.log('Analytics layout passed: seven viewports, valid metrics, period selection, empty state and error recovery.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
