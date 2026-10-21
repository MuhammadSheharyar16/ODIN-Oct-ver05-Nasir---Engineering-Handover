/**
 * ODIN response composer acceptance (E12, vitest). Every phrasing in the kit must
 * reach the same screen, depth and spotlight through YOUR classifier + planner.
 * Register both in odin-adapters.ts.
 *   ODIN_KIT=./odin-handover npx vitest run odin-handover/06-port-kit/tests/odin.composer.test.ts
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { classify, planner } from './odin-adapters';

const KIT = path.resolve(process.env.ODIN_KIT ?? 'odin-handover');
const table = JSON.parse(fs.readFileSync(path.join(KIT, '03-effects/E12-response-composer/phrasings.json'), 'utf8')) as {
  rows: { question: string; expected: { view: string; depth: string; item: string | null } }[];
  scripts: { name: string; steps: { question: string; view: string; depth: string; items: string[] | null }[] }[];
};
const ready = !!classify && !!planner;
/** Asked metrics of an answer-view plan (intent { type: 'answer', items }). */
const itemsOf = (p: { intent?: { type?: string; items?: string[] } }) => (p.intent?.type === 'answer' ? p.intent.items ?? [] : []);

describe('ODIN response composer', () => {
  it.skipIf(ready)('classifier / planner not registered yet', () => {});
  for (const r of table.rows) {
    it.runIf(ready)(`“${r.question}” → ${r.expected.view} · ${r.expected.depth}`, async () => {
      const p = planner!(await classify!(r.question, null), undefined);
      expect({ view: p.view, depth: p.depth }).toEqual({ view: r.expected.view, depth: r.expected.depth });
      // Answer view (V30): the item is the asked metric(s), joined by "+"; full pages: the spotlit item.
      if (r.expected.item) expect(r.expected.depth === 'glance' ? itemsOf(p).join('+') : p.spotlight?.item).toBe(r.expected.item);
    }, 30_000);
  }
  for (const s of table.scripts) {
    it.runIf(ready)(`follow-ups: ${s.name}`, async () => {
      let last: unknown, previous: unknown = null;
      for (const step of s.steps) {
        const q = await classify!(step.question, previous);
        const p = planner!(q, last);
        expect([step.question, p.view, p.depth]).toEqual([step.question, step.view, step.depth]);
        if (step.items) expect(itemsOf(p)).toEqual(step.items);
        last = p; previous = q;
      }
    }, 60_000);
  }
});
