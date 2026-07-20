import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto('http://127.0.0.1:8000/tests/run-tests.html', { waitUntil: 'networkidle' });
  const body = await page.locator('#results').innerText();
  if (!body.includes('tests passed')) {
    throw new Error(`Browser test harness did not report success.\n${body}`);
  }
  console.log(body);
} finally {
  await browser.close();
}