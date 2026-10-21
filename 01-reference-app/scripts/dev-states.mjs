// Dev: high-res screenshot of every screen and every answer-first state.
//   node scripts/dev-states.mjs "<outDir>" [w] [h] [dpr] [extraFlags]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const [out, w = '1920', h = '1080', dpr = '2', extra = ''] = process.argv.slice(2);
// extra: more URL flags for every shot, e.g. '&blur=0' (room kept sharp behind answers).
const BASE = 'http://localhost:5173/';
const X = extra;
const safe = (s) => s.replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const open = async () => b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr });

// Catalogue: screens and answer-first states, read from the app itself.
const p0 = await open();
await p0.goto(`${BASE}?nointro&still`, { waitUntil: 'networkidle' });
await p0.waitForTimeout(1500);
const cat = await p0.evaluate(async () => {
  const q = await import('/src/odin/questions.ts');
  return {
    views: window.__odinViews.filter((v) => v.kind === 'screen' && v.question).map((v) => ({ id: v.id, title: v.title })),
    states: q.QUESTIONS.filter((x) => x.category === 'Answer-first states').map((x) => ({ id: x.id, q: x.q })),
  };
});
await p0.close();

const jobs = [
  { dir: '01 Screens', file: 'V01 Executive Home', url: `${BASE}?nointro&still${X}` },
  ...cat.views.map((v) => ({ dir: '01 Screens', file: `${v.id} ${safe(v.title)}`, url: `${BASE}?nointro&still${X}&view=${v.id}` })),
  ...cat.states.map((s, i) => ({ dir: '02 Answer-first states', file: `${String(i + 1).padStart(2, '0')} ${s.id} ${safe(s.q)}`, url: `${BASE}?nointro&still${X}&q=${encodeURIComponent(s.q)}` })),
];
for (const d of new Set(jobs.map((j) => j.dir))) fs.mkdirSync(path.join(out, d), { recursive: true });
let n = 0;
for (const j of jobs) {
  const p = await open();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(j.url, { waitUntil: 'networkidle' });
  await p.waitForTimeout(j.url.includes('view=') || j.url.includes('q=') ? 8500 : 6500);
  await p.screenshot({ path: path.join(out, j.dir, `${j.file}.png`) });
  await p.close();
  console.log(`${++n}/${jobs.length} ${j.dir}/${j.file}${errs.length ? ' ! ' + errs[0] : ''}`);
}
await b.close();
console.log('done');
