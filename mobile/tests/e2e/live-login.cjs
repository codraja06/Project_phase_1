// Live smoke test: requires the local backend and its existing demo citizen account.
// Unlike fixtures.cjs, this test does not intercept API calls or modify account data.
const { chromium, expect } = require('@playwright/test');
const apiUrl = process.env.EXPO_PUBLIC_API_URL || require('../../eas.json').build.preview.env.EXPO_PUBLIC_API_URL;
const unavailableUrl = new URL(apiUrl);
unavailableUrl.port = '5999';
const unreachableAddress = unavailableUrl.toString().replace(/\/$/, '');
const webUrl = process.env.CIVICTRACK_WEB_URL || 'http://localhost:8082';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [];
  const newPage = async (width = 1440) => {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${webUrl}/citizen-login`);
    await expect(page.getByText('Auto-fill Demo', { exact: true })).toBeVisible();
    await page.getByText('Auto-fill Demo', { exact: true }).click();
    return page;
  };

  try {
    const success = await newPage();
    await success.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(success.getByTestId('citizen-dashboard-scroll')).toBeVisible({ timeout: 15000 });
    await success.close();

    const rejected = await newPage();
    await rejected.getByPlaceholder('Enter your password').fill('deliberately-wrong-password');
    await rejected.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(rejected.getByText('Invalid email or password.', { exact: true })).toBeVisible({ timeout: 15000 });
    await rejected.close();

    const unreachable = await newPage(390);
    await unreachable.getByRole('button', { name: 'Server connection settings' }).click();
    await unreachable.getByPlaceholder('http://192.168.X.X:5000/api').fill(unreachableAddress);
    await unreachable.getByText('Save & Apply', { exact: true }).click();
    await unreachable.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(unreachable.getByText(`Cannot reach backend server at ${unreachableAddress}`, { exact: false })).toBeVisible({ timeout: 20000 });
    await unreachable.close();

    if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`);
    console.log('Live login: HTTP success, wrong credentials, and unreachable backend messages passed.');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
