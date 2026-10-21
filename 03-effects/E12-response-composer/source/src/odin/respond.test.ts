import { describe, expect, it, vi } from 'vitest';

// The answer engine reads the viewport layout; give node a 1920×1080 window.
vi.hoisted(() => {
  const mq = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  Object.assign(globalThis, { window: { innerWidth: 1920, innerHeight: 1080, devicePixelRatio: 1, matchMedia: mq, addEventListener() {}, removeEventListener() {} } });
});
import { plan, understand, type ResponsePlan } from './composer';
import { respond } from './respond';
import { formatCount } from '../lib/format';

/** Spoken/visual parity: the lead and the glance read their number from the screen's own spec. */
const run = (q: string) => respond(plan(understand(q)))!;
/** A conversation: each line is asked after the previous answer. */
const talk = (...qs: string[]) => {
  let last: ResponsePlan | undefined;
  for (const q of qs) last = plan(understand(q, last?.intent), { last });
  return respond(last!)!;
};

describe('respond: spotlight + lead', () => {
  it.each([
    ['Give me the full picture of applications in processing', 'board', 'hero'],
    ['Show me everything on rejections', 'donut', 'rejected'],
    ['Approval rate, the full picture', 'appcore', 'approval'],
    ['Which nationalities apply the most?', 'podiums', 'nat'],
    ['Which stage takes the longest?', 'tm', 'stages'],
  ])('%s → focus %s, spot %s', (q, focus, spot) => {
    const s = run(q);
    expect(s.focusKey).toBe(focus);
    expect(s.spot).toBe(spot);
    expect(s.depth).toBe('context');
  });

  it('ODIN opens with the asked number, read from the drawn spec', () => {
    const s = run('Show me everything on rejections');
    const donut = s.components.find((c) => c.spec.kind === 'donut')!.spec as { segments: { key: string; count: number }[] };
    const rejected = donut.segments.find((x) => x.key === 'rejected')!.count;
    expect(s.spoken.startsWith(`${formatCount(rejected)} applications have been rejected`)).toBe(true);
  });

  it('leads with the asked number when the screen would not say it first', () => {
    const s = run('Which stage takes the longest?');
    const tm = s.components.find((c) => c.spec.kind === 'timeMatrix')!.spec as { longest: { label: string } };
    expect(s.spoken.startsWith(`The longest stage is ${tm.longest.label}`)).toBe(true);
  });
});

it('never repeats the lead', () => {
  const s = run('Approval rate, the full picture');
  expect(s.spoken.match(/approval rate is/g)).toHaveLength(1);
});

describe('respond: glance', () => {
  it.each([
    'Just the number of applications in processing',
    'Only the number of rejections',
    'Just the closure rate',
    'Turnaround time, quickly',
    'Just the revenue number',
    'Success rate, quickly',
  ])('%s → one KPI in the answer sphere, two facts', (q) => {
    const s = run(q);
    expect(s.template).toBe('glance');
    // The answer sphere (status lights) carries the number; ODIN's globe steps aside.
    expect(s.presence).toBe('dissolved');
    expect((s.components[0].spec as { lights?: unknown[] }).lights?.length).toBeGreaterThan(0);
    expect(s.components).toHaveLength(1);
    const g = s.components[0].spec;
    expect(g.kind).toBe('glance');
    if (g.kind === 'glance') {
      expect(g.facts.length).toBeGreaterThan(0);
      expect(g.facts.length).toBeLessThanOrEqual(2);
      expect(s.spoken.length).toBeGreaterThan(10);
    }
  });
});

describe('respond: answer-first', () => {
  const heroOf = (s: ReturnType<typeof run>) => s.components[0].spec as Extract<typeof s.components[0]['spec'], { kind: 'glance' }>;

  it('one metric: only that number, in the core', () => {
    const s = run('How many were rejected?');
    expect([s.template, s.depth, s.components.length]).toEqual(['glance', 'glance', 1]);
    const g = heroOf(s);
    expect(g.item).toBe('rejected');
    expect(g.more ?? []).toHaveLength(0);
    // Same number as the full page draws.
    const full = run('Show me everything on rejections');
    const donut = full.components.find((c) => c.spec.kind === 'donut')!.spec as { segments: { key: string; count: number }[] };
    expect(g.value).toBe(donut.segments.find((x) => x.key === 'rejected')!.count);
    expect(s.spoken.startsWith(formatCount(g.value))).toBe(true);
  });

  it('closure rate leads with closure rate, not the total', () => {
    const g = heroOf(run('What is the closure rate?'));
    expect(g.item).toBe('closure_rate');
    expect(g.format).toBe('percent');
  });

  it('"and approved?" adds a card; a third adds another; "full picture" opens the page', () => {
    const two = talk('How many were rejected?', 'And approved?');
    expect(heroOf(two).more?.map((m) => m.item)).toEqual(['approved']);
    const three = talk('How many were rejected?', 'And approved?', 'What about in processing?');
    expect(heroOf(three).more?.map((m) => m.item)).toEqual(['approved', 'in_processing']);
    expect(three.spoken).toMatch(/approved/);
    const full = talk('How many were rejected?', 'And approved?', 'Full picture');
    expect(full.depth).toBe('context');
    expect(full.template).not.toBe('glance');
  });
});

describe('respond: spotlight on the open screen', () => {
  it('asking for another breakdown on Top countries highlights it in place and says only that', () => {
    const s = talk('Top countries', 'Which centres are busiest?');
    expect(s.spot).toBe('cen');
    expect(s.depth).toBe('context');
    expect(s.spoken.split(/(?<=\.)\s+/)).toHaveLength(1);
  });

  it('never says the lead number twice', () => {
    const s = run('Top countries');
    const n = s.spoken.match(/\d[\d,]*/)![0];
    expect(s.spoken.split(n).length - 1).toBe(1);
  });
});

describe('application journey', () => {
  it('ends in one ICP decision, one Approved and one Rejected, each split by route', async () => {
    const { answer } = await import('./answers');
    const s = answer({ type: 'journey', channel: 'online', filters: {} })!;
    expect(s.title).toBe('Application Journey');
    const j = s.components.find((c) => c.spec.kind === 'journey')!.spec as { floor: Record<string, { metric: number; split?: { value: number }[] }> };
    expect(Object.keys(j.floor)).toEqual(expect.arrayContaining(['dec', 'ok', 'no']));
    expect(Object.keys(j.floor)).not.toContain('okTop');
    for (const k of ['ok', 'no']) expect(j.floor[k].split!.reduce((a, x) => a + x.value, 0)).toBe(j.floor[k].metric);
    expect(j.floor.dec.metric).toBe(j.floor.ok.metric + j.floor.no.metric);
  });
});
