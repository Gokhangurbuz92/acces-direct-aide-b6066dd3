/* global document */
import { chromium } from 'playwright';
async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('pageerror', err => console.log('ERROR:', err));
  await page.goto('http://localhost:5173/pro/disponibilites');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'snapshot.png' });
  const html = await page.evaluate(() => document.body.innerHTML);
  console.log(html);
  await browser.close();
}
run();
