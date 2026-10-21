import { chromium } from '@playwright/test';
const out = process.argv[2];
const D = [['desktop', 1920, 1080], ['laptop', 1440, 900], ['tablet-l', 1024, 768], ['tablet-p', 768, 1024], ['phone', 390, 844], ['phone-l', 844, 390]];
const b = await chromium.launch({ channel: 'chrome', headless: true });
for (const [id, w, h] of D) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: w < 900 ? 2 : 1 });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://localhost:5173/direction-outcomes-v1.html?bare&d=${id}${id === 'desktop' ? '' : ''}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${out}/${id}.jpg`, type: 'jpeg', quality: 86 });
  console.log(id, errs.join('|') || 'ok');
  await p.close();
}
await b.close();
