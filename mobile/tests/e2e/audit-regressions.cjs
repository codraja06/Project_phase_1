const { chromium, mockApi, login } = require('./fixtures.cjs');
const { expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const errors = [];
  const output = 'tests/artifacts/audit-2026-10-18';
  fs.mkdirSync(output, { recursive: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['geolocation'], geolocation: { latitude: 12.9, longitude: 80.1 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    const state = await mockApi(page);
    let oldGeocode;
    await page.route('**/nominatim.openstreetmap.org/**', route => {
      const latitude = new URL(route.request().url()).searchParams.get('lat');
      if (latitude === '-33.9') { oldGeocode = route; return; }
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ display_name: latitude === '-34' ? 'Latest incident location' : 'Initial incident location' }) });
    });
    await login(page);
    await page.getByRole('button', { name: 'Report Issue', exact: true }).click();
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Upload Image', exact: true }).click();
    await (await chooser).setFiles(path.join(__dirname, '../../assets/icon.png'));
    const description = page.getByLabel('Complaint description', { exact: true });
    await description.fill('Citizen notes that must be retained.');
    await page.getByRole('button', { name: 'Garbage', exact: true }).click();
    await expect(description).toHaveValue('Citizen notes that must be retained.');
    await page.getByRole('button', { name: 'Reset description template', exact: true }).click();
    await expect(description).toHaveValue(/uncollected waste/);
    await page.setViewportSize({ width: 393, height: 873 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await description.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/citizen-description-phone.png` });
    await page.getByRole('button', { name: 'Continue to Location', exact: true }).click();
    await page.getByLabel('Incident latitude', { exact: true }).fill('-33.9');
    await page.getByLabel('Incident longitude', { exact: true }).fill('151.2');
    await page.getByRole('button', { name: 'Set incident location', exact: true }).click();
    await expect.poll(() => Boolean(oldGeocode)).toBe(true);
    await page.getByLabel('Incident latitude', { exact: true }).fill('-34');
    await page.getByLabel('Incident longitude', { exact: true }).fill('151.3');
    await page.getByRole('button', { name: 'Set incident location', exact: true }).click();
    await expect(page.getByText('Latest incident location', { exact: true }).first()).toBeVisible();
    const oldFinished = page.waitForResponse(response => response.url().includes('lat=-33.9'));
    await oldGeocode.fulfill({ contentType: 'application/json', body: JSON.stringify({ display_name: 'Outdated incident location' }) });
    await oldFinished;
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expect(page.getByText('Outdated incident location', { exact: true })).toHaveCount(0);
    await page.evaluate(() => window.postMessage(JSON.stringify({ type: 'location_selected', latitude: 80, longitude: 80 }), '*'));
    await expect(page.getByLabel('Incident latitude', { exact: true })).toHaveValue('-34');
    await page.getByRole('button', { name: 'Confirm Location & Review', exact: true }).click();
    await expect(page.getByText(/uncollected waste at Latest incident location/)).toBeVisible();
    await page.getByRole('button', { name: 'SUBMIT COMPLAINT', exact: true }).click();
    await expect(page.getByText('CIV-100199', { exact: true })).toBeVisible();
    expect(state.complaints[0]).toMatchObject({ latitude: -34, longitude: 151.3, address: 'Latest incident location', category: 'garbage' });
    console.log('Citizen draft and location regressions passed.');
    await context.close();

    const authorityContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const authorityPage = await authorityContext.newPage();
    authorityPage.on('pageerror', error => errors.push(error.message));
    const authority = await mockApi(authorityPage, 'authority');
    // Leaflet is stubbed only to exercise our popup DOM without external CDN access.
    const leafletStub = `window.L={map:()=>({on(){},panTo(){}}),tileLayer:()=>({on(){return this},addTo(){}}),divIcon:()=>({}),marker:()=>({addTo(){return this},bindPopup(content){const host=document.createElement('div');if(typeof content==='string')host.innerHTML=content;else host.appendChild(content);document.body.appendChild(host);return this},on(){return this},setLatLng(){return this}})};`;
    authority.complaints[0].title = '<img src=x onerror="window.mapInjection=true">';
    authority.complaints[0].address = '<b>Citizen supplied address</b>';
    await login(authorityPage, 'authority');
    await authorityPage.getByRole('button', { name: 'Incident Map', exact: true }).click();
    await authorityPage.locator('iframe[title="CivicTrack OpenStreetMap"]').evaluate((element, stub) => {
      // Substitute only the external library in this isolated frame. The app's
      // generated popup code and iframe sandbox remain intact.
      const nonce = element.srcdoc.match(/nonce="([^"]+)"/)[1];
      element.srcdoc = element.srcdoc.replace(/<link[^>]*>/g, '').replace(/<script src=[\s\S]*?<\/script>/g, `<script nonce="${nonce}">${stub}</script>`);
    }, leafletStub);
    const frame = authorityPage.frameLocator('iframe[title="CivicTrack OpenStreetMap"]');
    await expect(frame.locator('.popup-title').first()).toHaveText(authority.complaints[0].title);
    await expect(frame.locator('.popup-title img')).toHaveCount(0);
    await expect(frame.locator('.popup-address').first()).toHaveText(authority.complaints[0].address);
    await expect(frame.locator('.popup-address b')).toHaveCount(0);
    await authorityPage.screenshot({ path: `${output}/authority-map-literal-popup.png` });
    await authorityPage.getByRole('button', { name: 'All Complaints', exact: true }).click();
    await authorityPage.getByRole('checkbox', { name: 'Select complaint CIV-100100', exact: true }).click();
    await authorityPage.getByRole('checkbox', { name: 'Select complaint CIV-100103', exact: true }).click();
    await authorityPage.getByRole('button', { name: /^In Progress\s*2$/ }).click();
    const selectAll = authorityPage.getByRole('checkbox', { name: 'Select all visible complaints', exact: true });
    await expect(selectAll).not.toBeChecked();
    await selectAll.click();
    await expect(authorityPage.getByRole('checkbox', { name: 'Select complaint CIV-100101', exact: true })).toBeChecked();
    await expect(authorityPage.getByRole('checkbox', { name: 'Select complaint CIV-100104', exact: true })).toBeChecked();
    await authorityContext.close();
    expect(errors).toEqual([]);
    fs.writeFileSync(`${output}/regressions-results.json`, JSON.stringify({ checks: ['custom draft survives category changes', 'reset restores category draft', 'latest geocode wins and draft matches location', 'foreign window messages ignored', 'complaint submitted with selected coordinates', 'map popup content rendered as text', 'bulk select uses visible record identities'], errors }, null, 2));
    console.log('Audit regressions passed: drafts, location races, map content/messages, filtered bulk selection.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
