// Dev: a voice conversation, one screenshot per answer.  node scripts/dev-talk.mjs <outPrefix> <w> <h> "<q1>" "<q2>" ...
import { chromium } from '@playwright/test';
const [prefix, w, h, ...qs] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await p.waitForTimeout(4000);
for (const [i, q] of qs.entries()) {
  await p.evaluate((q) => window.__odinAsk(q), q);
  await p.waitForTimeout(6000);
  await p.screenshot({ path: `${prefix}-${i + 1}.jpg`, type: 'jpeg', quality: 80 });
  console.log(i + 1, q, await p.evaluate(() => (window.__odinPlan ? '' : '')));
}
console.log(errs.join(' | ') || 'ok');
await b.close();
