// Captures frames during a morph. Usage: node scripts/filmstrip.mjs <outDir> <WxH> "<q1>" "<q2>" ...
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const [out, size, ...qs] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: w, height: h } });
p.on('pageerror', (e) => console.error('pageerror', e.message));
await p.goto('http://localhost:5173/?nointro', { waitUntil: 'networkidle' });
await p.waitForTimeout(3500);
let n = 0;
for (const q of qs) {
  await p.evaluate((q) => window.__odinAsk(q), q);
  let last = 0;
  for (const t of [450, 700, 900, 1100, 1350, 1800]) {
    await p.waitForTimeout(t - last);
    last = t;
    await p.screenshot({ path: `${out}/${String(++n).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 70 });
  }
  await p.waitForTimeout(1500);
}
await b.close();
