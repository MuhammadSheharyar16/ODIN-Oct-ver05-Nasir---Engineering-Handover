// ODIN acceptance tests: run against the ODIN reference app (to refresh goldens)
// or against YOUR app's ODIN preview route (to verify a port).
//   ODIN_KIT=./odin-handover ODIN_URL='http://localhost:3000/odin-preview/{id}' npx playwright test -c odin-handover/06-port-kit/tests/playwright.config.ts
import { defineConfig } from '@playwright/test';
import path from 'node:path';

const KIT = path.resolve(process.env.ODIN_KIT ?? 'odin-handover');

export default defineConfig({
  testDir: path.join(KIT, '06-port-kit/tests'),
  testMatch: /odin\.acceptance\.spec\.ts$/,
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: path.join(KIT, '06-port-kit/report') }]],
  snapshotPathTemplate: path.join(KIT, '06-port-kit/golden/{arg}{ext}'),
  use: {
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    channel: process.env.ODIN_CHANNEL ?? 'chrome',
    launchOptions: { args: ['--ignore-gpu-blocklist', '--enable-gpu'] },
  },
});
