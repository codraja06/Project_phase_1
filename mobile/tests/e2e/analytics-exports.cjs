// Real download test. Requires the isolated audit backend and its Officer fixture.
const { chromium, expect } = require('@playwright/test');
const ExcelJS = require('../../../backend/node_modules/exceljs');
const fs = require('fs');
const path = require('path');
const api = process.env.CIVICTRACK_AUDIT_API_URL;
if (!api || new URL(api).hostname !== '127.0.0.1' || new URL(api).port !== '5099') throw new Error('Use the isolated audit API on 127.0.0.1:5099.');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const output = '.expo/analytics-export-verification';
  fs.mkdirSync(output, { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(value => { if (window === window.top) localStorage.setItem('@civic_server_url', value); }, api);
    await page.goto(`${process.env.CIVICTRACK_WEB_URL || 'http://localhost:8082'}/authority-login`);
    await page.getByLabel('Department Official Email', { exact: true }).fill('audit-officer-20261018@example.test');
    await page.getByLabel('Officer Security Password', { exact: true }).fill('AuditOfficer123!');
    await page.getByRole('button', { name: 'Authenticate as Officer', exact: true }).click();
    await page.getByRole('button', { name: 'Operations Analytics', exact: true }).click();
    const exportExcel = page.getByRole('button', { name: 'Export Excel workbook', exact: true });
    await expect(exportExcel).toBeEnabled();
    await page.getByText('All Time', { exact: true }).filter({ visible: true }).click();
    const excelPromise = page.waitForEvent('download');
    await exportExcel.click();
    const excel = await excelPromise;
    expect(excel.suggestedFilename()).toMatch(/operations-all-.*\.xlsx$/);
    const excelPath = path.join(output, 'operations-all.xlsx');
    await excel.saveAs(excelPath);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelPath);
    expect(workbook.getWorksheet('Incidents').getTable('Incidents')).toBeDefined();
    const count = workbook.getWorksheet('Operations Summary').getCell('B5').result;
    expect(count).toBeGreaterThan(0);
    expect(workbook.getWorksheet('Incidents').rowCount - 1).toBe(count);
    await page.getByText('30 Days', { exact: true }).filter({ visible: true }).click();
    const csvPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export Power BI CSV', exact: true }).click();
    const csv = await csvPromise;
    expect(csv.suggestedFilename()).toMatch(/operations-30d-.*\.csv$/);
    const csvPath = path.join(output, 'operations-30d.csv');
    await csv.saveAs(csvPath);
    expect(fs.readFileSync(csvPath, 'utf8')).toContain('"ComplaintId","Title","Category","Status"');
    await page.setViewportSize({ width: 320, height: 568 });
    await expect(page.getByRole('button', { name: 'Export Power BI CSV', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByText('Export operations data', { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/exports-mobile.png` });
    // Exercise a failed export without replacing any successful API calls.
    await page.route('**/authority/analytics/export?**', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Export unavailable' }) }));
    await exportExcel.click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(exportExcel).toBeEnabled();
    expect(errors).toEqual([]);
    fs.writeFileSync(`${output}/results.json`, JSON.stringify({ realExcelDownload: 'passed', rows: count, powerBiCsvDownload: 'passed', selectedPeriods: ['all', '30d'], mobile320: 'passed', errorRecovery: 'passed', errors }, null, 2));
    console.log('Real Excel/Power BI downloads passed, with valid workbook contents, period selection, mobile layout and error recovery.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
