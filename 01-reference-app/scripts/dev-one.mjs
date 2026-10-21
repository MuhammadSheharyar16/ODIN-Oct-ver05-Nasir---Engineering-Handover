// Dev: one screenshot at a given size.  node scripts/dev-one.mjs <out.jpg> <query> <w> <h> [dpr] [settle]
import { chromium } from '@playwright/test';
const [out, query, w, h, dpr = '2', settle = '6500'] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`http://localhost:5173/${query}`, { waitUntil: 'networkidle' });
await p.waitForTimeout(+settle);
await p.screenshot({ path: out, type: 'jpeg', quality: 84 });
console.log(errs.join(' | ') || 'ok');
await b.close();
