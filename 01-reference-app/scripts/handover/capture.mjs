// Engineering handover · step 1: capture every UI from the running reference app.
//   node scripts/handover/capture.mjs <outDir> [--only=V04,V05] [--skip-video] [--video-only]
// Needs the dev server on http://localhost:5173 (npm run dev). Writes to <outDir>/_capture.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.ODIN_BASE ?? 'http://localhost:5173';
const out = path.resolve(process.argv[2] ?? 'handover-out', '_capture');
const only = (process.argv.find((a) => a.startsWith('--only=')) ?? '').slice(7).split(',').filter(Boolean);
const skipVideo = process.argv.includes('--skip-video');
const videoOnly = process.argv.includes('--video-only');
fs.mkdirSync(out, { recursive: true });

const SIZES = [
  { name: 'wide', w: 1920, h: 1080 },
  { name: 'portrait', w: 1080, h: 1920 },
  { name: 'phone', w: 390, h: 844, dpr: 2 },
];
const SETTLE = 6500;
const wait = (p, ms) => p.waitForTimeout(ms);
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu', '--autoplay-policy=no-user-gesture-required'] });
const errors = [];

async function open(size, query = '?nointro', video) {
  const ctx = await browser.newContext({
    viewport: { width: size.w, height: size.h },
    deviceScaleFactor: size.dpr ?? 1,
    ...(video ? { recordVideo: { dir: video, size: { width: size.w, height: size.h } } } : {}),
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${size.name}: ${e.message}`));
  await page.goto(`${BASE}/${query}`, { waitUntil: 'networkidle' });
  await wait(page, 3000);
  return { ctx, page };
}
const shot = (page, file) => page.screenshot({ path: file, type: 'jpeg', quality: 84 });
const ask = (page, q) => page.evaluate((q) => window.__odinAsk(q), q);

// ── Catalogue, questions, data samples ──
{
  const { ctx, page } = await open(SIZES[0]);
  const views = await page.evaluate(() => window.__odinViews);
  const questions = await page.evaluate(() => window.__odinQuestions.map(({ intent, ...q }) => ({ ...q, intent })));
  const samples = await page.evaluate((views) => {
    const res = {};
    for (const v of views) if (v.question) res[v.id] = JSON.parse(JSON.stringify(window.__odinAnswer(v.question)));
    return res;
  }, views);
  const intents = await page.evaluate((qs) => Object.fromEntries(qs.map((q) => [q.id, window.__odinIntent(q.q)])), questions);
  fs.writeFileSync(path.join(out, 'views.json'), JSON.stringify(views, null, 2));
  fs.writeFileSync(path.join(out, 'questions.json'), JSON.stringify(questions, null, 2));
  fs.writeFileSync(path.join(out, 'samples.json'), JSON.stringify(samples, null, 2));
  fs.writeFileSync(path.join(out, 'intents.json'), JSON.stringify(intents, null, 2));
  // Response composer (E12): phrasing table with live plans, measure × depth registry, cues.
  const composer = await page.evaluate(() => ({ ...window.__odinPhrasings(), routes: window.__odinRoutes(), cues: window.__odinCues() }));
  fs.writeFileSync(path.join(out, 'composer.json'), JSON.stringify(composer, null, 2));
  await ctx.close();
}
const views = JSON.parse(fs.readFileSync(path.join(out, 'views.json'), 'utf8'));
const screens = videoOnly ? [] : views.filter((v) => v.kind === 'screen' && (!only.length || only.includes(v.id)));

// ── Screens × sizes, plus the morph keys each screen exposes ──
const morphKeys = {};
for (const size of SIZES) {
  const { ctx, page } = await open(size);
  for (const v of screens) {
    const dir = path.join(out, 'screens', v.id);
    fs.mkdirSync(dir, { recursive: true });
    if (v.question) await ask(page, v.question);
    else await ask(page, 'home');
    await wait(page, v.id === 'V01' ? 3500 : SETTLE);
    await shot(page, path.join(dir, `${size.name}.jpg`));
    if (size.name === 'wide') {
      morphKeys[v.id] = await page.evaluate((id) => {
        const root = id === 'V01' ? document.querySelector('[data-layer="home"]') : [...document.querySelectorAll('[data-scene]')].pop();
        return [...new Set([...(root?.querySelectorAll('[data-morph]') ?? [])].map((e) => e.dataset.morph).filter((k) => !k.startsWith('title:')))];
      }, v.id);
      if (v.id === 'V09') {
        // Floor tour: traveller stops (first, middle, final).
        for (const t of [9000, 22000]) { await wait(page, t - (t === 9000 ? SETTLE : 9000)); await shot(page, path.join(dir, `wide-tour-${t / 1000}s.jpg`)); }
      }
    }
    console.log('captured', size.name, v.id);
  }
  await ctx.close();
}
if (!videoOnly) fs.writeFileSync(path.join(out, 'morph-keys.json'), JSON.stringify(morphKeys, null, 2));

// ── System states ──
if (!only.length && !videoOnly) {
  const sys = (id) => { const d = path.join(out, 'screens', id); fs.mkdirSync(d, { recursive: true }); return d; };
  // S01 intro frames
  {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    const t0 = Date.now();
    for (const t of [600, 1400, 2200, 3200, 5000]) { await wait(page, Math.max(0, t - (Date.now() - t0))); await shot(page, path.join(sys('S01'), `wide-${t}ms.jpg`)); }
    await ctx.close();
  }
  const { ctx, page } = await open(SIZES[0]);
  // S02 composer
  await page.evaluate(() => window.__odinExp.setState({ composerOpen: true }));
  await wait(page, 700);
  await shot(page, path.join(sys('S02'), 'wide.jpg'));
  await page.evaluate(() => window.__odinExp.setState({ composerOpen: false }));
  await wait(page, 500);
  // S03 thinking
  await ask(page, 'What percentage of visa applications have been closed?');
  await wait(page, 260);
  await shot(page, path.join(sys('S03'), 'wide.jpg'));
  // S05 speaking + summary
  await wait(page, 3600);
  await shot(page, path.join(sys('S05'), 'wide.jpg'));
  // S04 morph: each choreography at three moments
  const dest = ['How long does it take to process a visa?', 'How many visa applications are being processed?', 'Which countries or nationalities generate the most applications?', 'How much revenue is being generated?', "How does today's performance compare with yesterday?", 'What percentage of visa applications have been closed?'];
  const names = ['depth', 'vortex', 'sweep', 'rise', 'scatter', 'helix'];
  for (let i = 0; i < 6; i++) {
    await ask(page, 'home');
    await wait(page, 3500);
    await page.evaluate((i) => (window.__odinMorph = i), i);
    await ask(page, dest[i]);
    for (const t of [700, 1000, 1400]) { await wait(page, t === 700 ? 700 : t === 1000 ? 300 : 400); await shot(page, path.join(sys('S04'), `${i + 1}-${names[i]}-${t}ms.jpg`)); }
  }
  await page.evaluate(() => delete window.__odinMorph);
  await ctx.close();
}

// ── Reference videos (1280×720): intro, the six morphs, the journey tour ──
if (!skipVideo && !only.length) {
  const vdir = path.join(out, 'video');
  fs.mkdirSync(vdir, { recursive: true });
  const size = { name: 'video', w: 1280, h: 720 };
  const save = async (ctx, page, name) => { const v = page.video(); await ctx.close(); await v.saveAs(path.join(vdir, `${name}.webm`)); await v.delete(); };
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: vdir, size: { width: 1280, height: 720 } } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await wait(page, 7000);
    await save(ctx, page, 'S01-intro');
  }
  const dest = ['How long does it take to process a visa?', 'How many visa applications are being processed?', 'Which countries or nationalities generate the most applications?', 'How much revenue is being generated?', "How does today's performance compare with yesterday?", 'What percentage of visa applications have been closed?'];
  const names = ['depth', 'vortex', 'sweep', 'rise', 'scatter', 'helix'];
  for (let i = 0; i < 6; i++) {
    const { ctx, page } = await open(size, '?nointro', vdir);
    await page.evaluate((i) => (window.__odinMorph = i), i);
    await ask(page, dest[i]);
    await wait(page, 4500);
    await page.evaluate((i) => (window.__odinMorph = (i + 3) % 6), i);
    await ask(page, 'home');
    await wait(page, 3500);
    await save(ctx, page, `S04-morph-${i + 1}-${names[i]}`);
  }
  {
    const { ctx, page } = await open(size, '?nointro', vdir);
    await ask(page, 'Show the online visa journey');
    await wait(page, 38000);
    await save(ctx, page, 'V09-online-journey-tour');
  }
  console.log('videos saved');
}

fs.writeFileSync(path.join(out, 'errors.json'), JSON.stringify([...new Set(errors)], null, 2));
console.log('page errors:', errors.length ? [...new Set(errors)] : 'none');
await browser.close();
