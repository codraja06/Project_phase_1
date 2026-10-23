// Run separately with internet access. Simulate a missing external map script.
const { chromium, mockApi, login } = require('./fixtures.cjs');
const { expect } = require('@playwright/test');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      if (window !== window.top) return;
      window.auditMissingMapScript = true;
      const transform = value => window.auditMissingMapScript ? value.replace(/<script src=[\s\S]*?<\/script>/g, '') : value;
      const descriptor = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'srcdoc');
      Object.defineProperty(HTMLIFrameElement.prototype, 'srcdoc', { ...descriptor, set(value) { descriptor.set.call(this, transform(value)); } });
      const setAttribute = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function(name, value) {
        return setAttribute.call(this, name, this.tagName === 'IFRAME' && name.toLowerCase() === 'srcdoc' ? transform(value) : value);
      };
    });
    const errors = [];
    const tileRequests = [];
    context.on('request', request => {
      if (request.url().startsWith('https://tile.openstreetmap.org/')) tileRequests.push(request);
    });
    page.on('pageerror', error => errors.push(error.message));
    await mockApi(page, 'authority');
    await login(page, 'authority');
    await page.getByRole('button', { name: 'Incident Map', exact: true }).click();
    await expect(page.getByText('OpenStreetMap preview unavailable', { exact: true })).toBeVisible({ timeout: 16000 });
    const output = 'tests/artifacts/audit-2026-10-18';
    fs.mkdirSync(output, { recursive: true });
    await page.screenshot({ path: `${output}/map-unavailable-recovery.png` });
    await page.evaluate(() => { window.auditMissingMapScript = false; });
    await page.getByRole('button', { name: 'Retry map preview', exact: true }).click();
    const frame = page.frameLocator('iframe[title="CivicTrack OpenStreetMap"]');
    await expect(frame.locator('.leaflet-tile-loaded').first()).toBeVisible({ timeout: 20000 });
    await expect(frame.locator('.leaflet-marker-icon')).toHaveCount(6);
    const tileHeaders = await Promise.all(tileRequests.map(request => request.allHeaders()));
    const expectedReferrer = `${new URL(page.url()).origin}/`;
    expect(tileHeaders.some(headers => headers.referer === expectedReferrer)).toBe(true);
    expect(await frame.locator('body').evaluate(() => {
      const script = document.createElement('script');
      script.textContent = 'window.untrustedMapScriptExecuted = true';
      document.body.appendChild(script);
      return window.untrustedMapScriptExecuted;
    })).toBeUndefined();
    expect(await frame.locator('body').evaluate(() => window.L.version)).toBe('1.9.4');
    await expect(page.getByText('OpenStreetMap preview unavailable', { exact: true })).toHaveCount(0);
    // Fixtures share coordinates; the last marker is the visible topmost pin.
    await frame.locator('.leaflet-marker-icon').last().click();
    await expect(frame.locator('.popup-title')).toHaveText('Road surface cracked');
    expect(errors).toEqual([]);
    await page.screenshot({ path: `${output}/real-leaflet-runtime.png` });
    fs.writeFileSync(`${output}/map-runtime-results.json`, JSON.stringify({ missingScriptFallback: 'passed', retry: 'passed', realLeaflet: '1.9.4', tiles: 'external OSM', browserReferrer: expectedReferrer, untrustedScriptBlocked: true, popup: 'passed', errors }, null, 2));
    console.log('Map runtime passed: missing script recovery, retry, real Leaflet/OSM rendering, markers and popup.');
    await context.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
