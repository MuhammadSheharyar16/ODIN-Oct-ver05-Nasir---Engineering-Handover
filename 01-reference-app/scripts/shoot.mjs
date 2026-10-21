// Real-time captures with the installed Chrome (GPU on), driving ODIN like a user.
// Usage: node scripts/shoot.mjs <outDir> <WxH> <name>=<question|home> ...
import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const [out = 'captures', size = '1920x1080', ...shots] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('pageerror:', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('console:', m.text()));
await page.goto('http://localhost:5173/?nointro' + (process.env.Q ? '&' + process.env.Q : ''), { waitUntil: 'networkidle' });
await page.waitForTimeout(3500);
for (const s of shots) {
  const [name, q] = s.split('=');
  if (q && q !== 'home-shot') {
    await page.locator('.mic-bar').click();
    await page.locator('.mic-bar__input').fill(q);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(name.endsWith('-mid') ? 1250 : 3600);
  }
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log('shot', name);
}
await browser.close();
