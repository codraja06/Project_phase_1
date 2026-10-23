// Requires an explicitly isolated local backend plus the local AI service.
// Unlike the layout suite, this test never intercepts application API calls.
const { chromium, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const api = process.env.CIVICTRACK_AUDIT_API_URL;
if (!api || new URL(api).hostname !== '127.0.0.1' || new URL(api).port !== '5099') {
  throw new Error('Set CIVICTRACK_AUDIT_API_URL=http://127.0.0.1:5099/api for the isolated audit backend.');
}
const web = process.env.CIVICTRACK_WEB_URL || 'http://localhost:8081';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const errors = [];
  const results = {};
  const contexts = [];
  const makePage = async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['geolocation'], geolocation: { latitude: 12.9, longitude: 80.1 }, reducedMotion: 'reduce' });
    contexts.push(context);
    await context.addInitScript(value => {
      if (window === window.top) localStorage.setItem('@civic_server_url', value);
    }, api);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    return page;
  };
  try {
    const citizen = await makePage();
    const email = `audit-citizen-${Date.now()}@example.test`;
    await citizen.goto(`${web}/citizen-register`);
    await citizen.getByLabel('Full Legal Name', { exact: true }).fill('Live Audit Citizen');
    await citizen.getByLabel('Email Address', { exact: true }).fill(email);
    await citizen.getByLabel('Phone Number', { exact: true }).fill('9876543210');
    await citizen.getByLabel('Security Password', { exact: true }).fill('LiveAuditPassword123!');
    await citizen.getByLabel('Confirm Password', { exact: true }).fill('LiveAuditPassword123!');
    const registered = citizen.waitForResponse(response => response.url() === `${api}/auth/register`);
    await citizen.getByRole('button', { name: 'Complete Registration', exact: true }).click();
    expect((await registered).status()).toBe(201);
    await expect(citizen.getByText('Quick Issue Categories', { exact: true })).toBeVisible();
    results.registration = 'passed';
    await citizen.getByRole('button', { name: 'Report Issue', exact: true }).click();
    const chooser = citizen.waitForEvent('filechooser');
    const aiResponse = citizen.waitForResponse(response => response.url() === `${api}/ai/detect`, { timeout: 90000 });
    const uploadResponse = citizen.waitForResponse(response => response.url() === `${api}/uploads/image`, { timeout: 30000 });
    await citizen.getByRole('button', { name: 'Upload Image', exact: true }).click();
    await (await chooser).setFiles(path.join(__dirname, '../../assets/icon.png'));
    expect((await uploadResponse).status()).toBe(200);
    const ai = await aiResponse;
    expect(ai.status()).toBe(200);
    const aiResult = await ai.json();
    expect(Array.isArray(aiResult.data.detections)).toBe(true);
    results.realImageUpload = 'passed';
    results.realAiRequest = { status: ai.status(), detections: aiResult.data.detections.length };
    await citizen.getByRole('button', { name: 'Pothole', exact: true }).click();
    await citizen.getByLabel('Complaint description', { exact: true }).fill('Automated isolated audit report. No real-world incident is represented.');
    await citizen.getByRole('button', { name: 'Continue to Location', exact: true }).click();
    await citizen.getByLabel('Incident latitude', { exact: true }).fill('12.9');
    await citizen.getByLabel('Incident longitude', { exact: true }).fill('80.1');
    await citizen.getByRole('button', { name: 'Set incident location', exact: true }).click();
    await citizen.getByRole('button', { name: 'Confirm Location & Review', exact: true }).click();
    const submitted = citizen.waitForResponse(response => response.url() === `${api}/complaints` && response.request().method() === 'POST');
    await citizen.getByRole('button', { name: 'SUBMIT COMPLAINT', exact: true }).click();
    const createdResponse = await submitted;
    expect(createdResponse.status()).toBe(201);
    const complaint = (await createdResponse.json()).data;
    results.complaintCode = complaint.complaintId;
    await citizen.getByRole('button', { name: 'VIEW COMPLAINT DETAILS', exact: true }).click();
    await expect(citizen.getByText('Incident Dossier', { exact: true })).toBeVisible();

    const officer = await makePage();
    await officer.goto(`${web}/authority-login`);
    await officer.getByLabel('Department Official Email', { exact: true }).fill('audit-officer-20261018@example.test');
    await officer.getByLabel('Officer Security Password', { exact: true }).fill('AuditOfficer123!');
    await officer.getByRole('button', { name: 'Authenticate as Officer', exact: true }).click();
    await expect(officer.getByText('Command Center', { exact: true }).last()).toBeVisible();
    await officer.getByRole('button', { name: 'All Complaints', exact: true }).click();
    await officer.getByText(complaint.complaintId, { exact: true }).filter({ visible: true }).first().click();
    await officer.getByRole('button', { name: 'Verify Incident', exact: true }).click();
    await expect(officer.getByRole('button', { name: 'Verify Incident', exact: true })).toHaveCount(0);
    await officer.getByRole('button', { name: 'Mark In Progress', exact: true }).click();
    await officer.getByRole('button', { name: 'Confirm Dispatch', exact: true }).click();
    await expect(officer.getByRole('button', { name: 'Mark Resolved', exact: true })).toBeVisible();
    await officer.getByRole('button', { name: 'Mark Resolved', exact: true }).click();
    await officer.getByRole('button', { name: 'Confirm Resolution', exact: true }).click();
    await expect(officer.getByRole('button', { name: 'Resolved ✓', exact: true })).toBeVisible();
    await expect(officer.getByText('Live Audit Citizen', { exact: true }).filter({ visible: true }).last()).toBeVisible();
    await expect(officer.getByRole('button', { name: 'Purge Record', exact: true })).toHaveCount(0);
    results.officerVerifyProgressResolve = 'passed';
    await citizen.getByRole('button', { name: 'Back', exact: true }).click();
    await citizen.getByRole('button', { name: 'My Complaints', exact: true }).click();
    await citizen.getByText(complaint.complaintId, { exact: true }).filter({ visible: true }).first().click();
    await expect(citizen.getByText('Resolved', { exact: true }).filter({ visible: true }).first()).toBeVisible();
    results.citizenSeesPersistedResolution = 'passed';
    await Promise.race([
      citizen.frameLocator('iframe[title="CivicTrack OpenStreetMap"]').locator('.leaflet-tile-loaded').first().waitFor({ state: 'visible', timeout: 20000 }),
      citizen.getByText('OpenStreetMap preview unavailable', { exact: true }).filter({ visible: true }).first().waitFor({ state: 'visible', timeout: 20000 }),
    ]);
    expect(errors).toEqual([]);
    fs.mkdirSync('tests/artifacts/audit-2026-10-18', { recursive: true });
    await citizen.screenshot({ path: 'tests/artifacts/audit-2026-10-18/live-citizen-resolved.png' });
    fs.writeFileSync('tests/artifacts/audit-2026-10-18/live-results.json', JSON.stringify({ ...results, errors }, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally {
    for (const context of contexts) await context.close();
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
