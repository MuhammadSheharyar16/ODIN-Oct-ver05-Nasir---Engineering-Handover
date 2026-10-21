// Dev: audit sheet, every screen at one size.  node scripts/dev-audit.mjs <outDir> [w] [h]
import { chromium } from '@playwright/test';
const [out, w = '1600', h = '900'] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.goto('http://localhost:5173/?nointro&still', { waitUntil: 'networkidle' });
await p.waitForTimeout(2000);
const views = await p.evaluate(() => window.__odinViews.filter((v) => v.kind === 'screen' && v.question).map((v) => ({ id: v.id, title: v.title, status: v.status })));
const rows = [];
for (const v of views) {
  const errs = []; const on = (e) => errs.push(e.message); p.on('pageerror', on);
  await p.goto(`http://localhost:5173/?nointro&still&view=${v.id}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(6500);
  await p.screenshot({ path: `${out}/${v.id}.jpg`, type: 'jpeg', quality: 72 });
  p.off('pageerror', on);
  rows.push({ ...v, errs: [...new Set(errs)] });
  console.log(v.id, errs.length ? errs[0] : 'ok');
}
const home = await b.newPage({ viewport: { width: +w, height: +h } });
await home.goto('http://localhost:5173/?nointro&still', { waitUntil: 'networkidle' }); await home.waitForTimeout(6000);
await home.screenshot({ path: `${out}/V01.jpg`, type: 'jpeg', quality: 72 });
const fs = await import('node:fs');
fs.writeFileSync(`${out}/views.json`, JSON.stringify(rows, null, 2));
await b.close();
