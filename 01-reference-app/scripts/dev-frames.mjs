// Dev: frames of one screen over time (motion review).  node scripts/dev-frames.mjs <outDir> <query> <ms,ms,...> [w] [h]
import { chromium } from '@playwright/test';
const [out, query, times, w = '1920', h = '1080'] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`http://localhost:5173/${query}`, { waitUntil: 'networkidle' });
const t0 = Date.now();
for (const t of times.split(',').map(Number)) { await p.waitForTimeout(Math.max(0, t - (Date.now() - t0))); await p.screenshot({ path: `${out}/t${t}.jpg`, type: 'jpeg', quality: 84 }); }
console.log(errs.length ? errs.join(' | ') : 'ok');
await b.close();
