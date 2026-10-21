/**
 * ODIN acceptance test — one test per screen in manifest.json.
 * 1. Morph contract: the screen exposes the same data-morph keys as the reference,
 *    so shared elements travel between screens (effect E01).
 * 2. Visual: the HTML layer matches the golden frame (1920×1080, demo data,
 *    3D canvas hidden, CSS animations frozen; see odin.screenshot.css). 3D is reviewed against the
 *    captures/videos in each screen folder.
 * Your preview route must render the screen from its spec.sample.json.
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

type View = { id: string; title: string; kind: string; morphKeys: string[]; visualTolerance: number };
const KIT = path.resolve(process.env.ODIN_KIT ?? 'odin-handover');
// Reference app: ?nointro skips the load-in, ?still freezes the simulated live feed.
const URL = process.env.ODIN_URL ?? 'http://localhost:5173/?nointro&still&view={id}';
const ONLY = (process.env.ODIN_VIEWS ?? '').split(',').filter(Boolean);
const manifest = JSON.parse(fs.readFileSync(path.join(KIT, 'manifest.json'), 'utf8')) as { views: View[] };
const views = manifest.views.filter((v) => v.kind === 'screen' && (!ONLY.length || ONLY.includes(v.id)));

for (const v of views) {
  test(`${v.id} · ${v.title}`, async ({ page }) => {
    await page.goto(URL.replace('{id}', v.id), { waitUntil: 'networkidle' });
    await page.waitForTimeout(Number(process.env.ODIN_SETTLE_MS ?? 6500));

    for (const key of v.morphKeys) {
      await expect(page.locator(`[data-morph="${key}"]`).first(), `data-morph="${key}"`).toBeAttached();
    }

    await expect(page).toHaveScreenshot(`${v.id}.png`, {
      animations: 'disabled',
      caret: 'hide',
      stylePath: path.join(KIT, '06-port-kit/tests/odin.screenshot.css'),
      maxDiffPixelRatio: v.visualTolerance,
    });
  });
}
