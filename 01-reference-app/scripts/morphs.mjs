// Captures each morph choreography mid-flight. Usage: node scripts/morphs.mjs <outDir> <WxH>
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const [out = 'captures/morphs', size = '1920x1080'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: w, height: h } });
p.on('pageerror', (e) => console.error('pageerror', e.message));
await p.goto('http://localhost:5173/?nointro', { waitUntil: 'networkidle' });
await p.waitForTimeout(3500);
const names = ['depth', 'vortex', 'sweep', 'rise', 'scatter', 'helix'];
const qs = ['Show the application journey map', 'How long does it take to process a visa?', 'Show the centre stage queue', 'Show top countries on the globe', 'How does today\'s performance compare with yesterday?', 'Are customers applying through physical centres or online?'];
for (let i = 0; i < 6; i++) {
  await p.evaluate(([i, q]) => { window.__odinMorph = i; window.__odinAsk(q); }, [i, qs[i]]);
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${out}/${i}-${names[i]}-a.jpg`, type: 'jpeg', quality: 72 });
  await p.waitForTimeout(350);
  await p.screenshot({ path: `${out}/${i}-${names[i]}-b.jpg`, type: 'jpeg', quality: 72 });
  await p.waitForTimeout(3000);
}
await b.close();
