// Dev: capture one screen at six resolutions.  node scripts/dev-shots.mjs <outDir> <query> [settleMs]
import { chromium } from '@playwright/test';
const [out, query = '?nointro&still&view=V03', settle = '7000'] = process.argv.slice(2);
const D = [['desktop', 1920, 1080, 1], ['laptop', 1440, 900, 1], ['tablet-l', 1024, 768, 2], ['tablet-p', 768, 1024, 2], ['phone', 390, 844, 2], ['phone-l', 844, 390, 2]];
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
for (const [id, w, h, dpr] of D) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto(`http://localhost:5173/${query}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(Number(settle));
  await p.screenshot({ path: `${out}/${id}.jpg`, type: 'jpeg', quality: 84 });
  console.log(id, errs.length ? [...new Set(errs)].slice(0, 3).join(' | ') : 'ok');
  await p.close();
}
await b.close();
