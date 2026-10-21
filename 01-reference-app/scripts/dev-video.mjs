// Dev: record a short motion clip.  node scripts/dev-video.mjs <out.webm> <query> [ms] [w] [h]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const [out, query, ms = '12000', w = '1280', h = '720'] = process.argv.slice(2);
const dir = path.dirname(out);
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, recordVideo: { dir, size: { width: +w, height: +h } } });
const p = await ctx.newPage();
await p.goto(`http://localhost:5173/${query}`, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(+ms);
const v = p.video(); await ctx.close(); await v.saveAs(out); await v.delete(); await b.close();
console.log('saved', out, fs.statSync(out).size);
