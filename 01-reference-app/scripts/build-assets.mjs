// Converts the canonical environment masters into web-ready layers.
// The masters are never modified; outputs go to public/env.
// Usage: npm run assets
import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const assetDir = path.resolve(projectRoot, '../../Graphical Assests');
const outDir = path.resolve(projectRoot, 'public/env');

const layers = [
  { name: 'exterior', file: 'Exterior-ODIN.png', alpha: false },
  { name: 'interior', file: 'Interior-ODIN.png', alpha: true },
];
const widths = [3840, 2560, 1600];

sharp.cache(false);
sharp.concurrency(4);
await mkdir(outDir, { recursive: true });

for (const layer of layers) {
  const src = path.join(assetDir, layer.file);
  const meta = await sharp(src, { limitInputPixels: false }).metadata();
  console.log(`${layer.file}: ${meta.width}x${meta.height}, alpha=${meta.hasAlpha}`);
  for (const w of widths) {
    const out = path.join(outDir, `${layer.name}-${w}.webp`);
    await sharp(src, { limitInputPixels: false })
      .resize({ width: w })
      .webp({ quality: layer.alpha ? 88 : 84, alphaQuality: 100, effort: 5, smartSubsample: true })
      .toFile(out);
    const { size } = await stat(out);
    console.log(`  -> ${path.basename(out)} ${(size / 1024 / 1024).toFixed(2)} MB`);
  }
  // Pre-blurred focus layer: crossfaded in the shader when ODIN answers,
  // giving a depth-of-field recede without runtime blur cost.
  const blurOut = path.join(outDir, `${layer.name}-blur.webp`);
  await sharp(src, { limitInputPixels: false })
    .resize({ width: 1280 })
    .blur(layer.alpha ? 6 : 9)
    .webp({ quality: 80, alphaQuality: 90, effort: 5 })
    .toFile(blurOut);
  const { size } = await stat(blurOut);
  console.log(`  -> ${path.basename(blurOut)} ${(size / 1024).toFixed(0)} KB`);
}
