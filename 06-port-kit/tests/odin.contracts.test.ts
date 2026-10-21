/**
 * ODIN data contracts (vitest). For every screen you have ported, your adapter
 * (your API data → ODIN spec) must produce every field the reference sample has,
 * with the same type. Register adapters in odin-adapters.ts as you port screens.
 *   ODIN_KIT=./odin-handover npx vitest run odin-handover/06-port-kit/tests/odin.contracts.test.ts
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { adapters } from './odin-adapters';

const KIT = path.resolve(process.env.ODIN_KIT ?? 'odin-handover');
const sampleOf = (id: string) => {
  const dir = fs.readdirSync(path.join(KIT, '04-views')).find((d) => d.startsWith(id));
  return JSON.parse(fs.readFileSync(path.join(KIT, '04-views', dir!, 'spec.sample.json'), 'utf8'));
};

/** Paths present in `ref` that are missing in `out` or have a different type. */
function gaps(ref: unknown, out: unknown, at = '$'): string[] {
  if (ref === null || ref === undefined) return [];
  if (Array.isArray(ref)) {
    if (!Array.isArray(out)) return [`${at}: expected array`];
    return ref.length && out.length ? gaps(ref[0], out[0], `${at}[0]`) : [];
  }
  if (typeof ref === 'object') {
    if (typeof out !== 'object' || out === null) return [`${at}: expected object`];
    return Object.keys(ref as object).flatMap((k) => (k === 'id' ? [] : gaps((ref as Record<string, unknown>)[k], (out as Record<string, unknown>)[k], `${at}.${k}`)));
  }
  if (out === null) return []; // null = "Not available", always allowed
  return typeof out === typeof ref ? [] : [`${at}: expected ${typeof ref}, got ${out === undefined ? 'missing' : typeof out}`];
}

describe('ODIN screen data contracts', () => {
  const ids = Object.keys(adapters);
  it.skipIf(ids.length > 0)('no screens ported yet', () => {});
  for (const id of ids) {
    it(`${id} adapter matches spec.sample.json`, async () => {
      expect(gaps(sampleOf(id), await adapters[id]())).toEqual([]);
    });
  }
});
