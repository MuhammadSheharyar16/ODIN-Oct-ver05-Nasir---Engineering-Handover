import { describe, expect, it } from 'vitest';
import { itemsOf, plan, understand, type ResponsePlan } from './composer';
import { FOLLOW_UP_SCRIPTS, PHRASINGS as ROWS } from './phrasings';

/** Phrasing suite: see phrasings.ts (also the acceptance table for engineering's LLM classifier). */
const ask = (q: string, last?: ResponsePlan) => plan(understand(q, last?.intent), { last });

describe('composer: phrasing → screen, depth, spotlight', () => {
  it.each(ROWS)('%s → %s · %s', (q, view, depth, item) => {
    const p = ask(q);
    expect({ view: p.view, depth: p.depth }).toEqual({ view, depth });
    if (item) expect(depth === 'glance' ? itemsOf(p).join('+') : p.spotlight?.item).toBe(item);
  });
});

describe('composer: catalogue rules pass through', () => {
  it.each([
    ['What is the weather in Dubai?', 'unsupported'],
    ['Go home', 'home'],
    ['Go back', 'back'],
    ['How long do biometrics take?', 'timeMatrix'],
    ['Which country is slowest?', 'ranking'],
    ['Show top countries on the globe', 'geo'],
    ['What is the travel purpose mix?', 'mix'],
  ])('%s → %s', (q, type) => {
    const p = ask(q);
    expect(p.measure).toBeNull();
    expect(p.intent.type).toBe(type);
  });
});

describe('composer: voice follow-up scripts', () => {
  it.each(FOLLOW_UP_SCRIPTS.map((s) => [s.name, s.steps] as const))('%s', (_, steps) => {
    let last: ResponsePlan | undefined;
    for (const [q, view, depth, items] of steps) {
      last = ask(q, last);
      expect([q, last.view, last.depth]).toEqual([q, view, depth]);
      if (items) expect(itemsOf(last).join('+')).toBe(items);
    }
  });
});

describe('composer: voice follow-ups change depth, keep the subject', () => {
  it('answer → more → more → less → less', () => {
    const a = ask('How many applications are in processing?');
    expect([a.view, a.depth]).toEqual(['V30', 'glance']);
    const b = ask('Tell me more', a);
    expect([b.view, b.depth, b.measure]).toEqual(['V02', 'context', 'in_processing']);
    const b2 = ask('More detail', b);
    expect([b2.view, b2.depth]).toEqual(['V26', 'explore']);
    const c = ask('More detail', b2);
    expect(c.depth).toBe('explore');
    const d = ask('Less detail', c);
    expect([d.view, d.depth]).toEqual(['V02', 'context']);
    const e = ask('Just the number', d);
    expect([e.view, e.depth]).toEqual(['V30', 'glance']);
  });

  it('glance → tell me more → context', () => {
    const a = ask('Just the closure rate');
    const b = ask('Tell me more', a);
    expect([b.view, b.depth, b.measure]).toEqual(['V04', 'context', 'closure_rate']);
  });

  it('a filter alone keeps the previous measure ("and for India?")', () => {
    const a = ask('How many were rejected?');
    const b = ask('And for India?', a);
    expect(b.measure).toBe('rejected');
    expect(b.query.filters.country).toBe('IN');
  });

  it('every plan offers spoken follow-ups (never drawn)', () => {
    for (const [q] of ROWS) expect(ask(q).followUps.length).toBeGreaterThan(0);
  });
});

describe('component catalogue', () => {
  it('every answer metric has a component, every component sits on real screens', async () => {
    const { COMPONENTS, componentFor } = await import('./components');
    const { SINGLE } = await import('./composer');
    const { VIEWS } = await import('./views');
    for (const m of SINGLE) expect(componentFor(m)?.id).toMatch(/^C0\d$/);
    const ids = new Set(VIEWS.map((v) => v.id));
    for (const c of COMPONENTS) for (const v of c.on) expect(ids.has(v), `${c.id} → ${v}`).toBe(true);
    expect(new Set(COMPONENTS.map((c) => c.id)).size).toBe(COMPONENTS.length);
  });
});

describe('waiting experience', () => {
  it('reads ?latency= and schedules the check-ins', async () => {
    const { demoLatency, checkInsWithin, CHECK_INS } = await import('./waiting');
    expect(demoLatency('?latency=12')).toEqual({ ms: 12000, progressive: false });
    expect(demoLatency('?latency=8&progressive')).toEqual({ ms: 8000, progressive: true });
    expect(demoLatency('?latency=90').ms).toBe(63000); // retries at 60 s, answers 3 s later
    expect(demoLatency('').ms).toBe(0);
    expect(checkInsWithin(9000)).toHaveLength(0);
    expect(checkInsWithin(16000).map((c) => c.at)).toEqual([10, 15]);
    expect(checkInsWithin(63000)).toHaveLength(CHECK_INS.length);
    expect(CHECK_INS.at(-1)!.say).toMatch(/try once more/i);
  });
});

describe('answer transitions', () => {
  it('picks Grow, Regroup, Swap, Expand and Gather by state', async () => {
    const { transitionFor } = await import('./transitions');
    const ans = (item: string, more = 0) => ({ template: 'glance', components: [{ spec: { kind: 'glance', item, more: Array(more).fill({}) } }] }) as never;
    const page = { template: 'galaxy', components: [] } as never;
    expect(transitionFor(ans('rejected'), ans('rejected', 1))).toBe('T01');
    expect(transitionFor(ans('rejected', 2), ans('rejected', 1))).toBe('T02');
    expect(transitionFor(ans('rejected'), page)).toBe('T03');
    expect(transitionFor(page, ans('rejected'))).toBe('T04');
    expect(transitionFor(null, ans('rejected'))).toBe('T04');
    expect(transitionFor(ans('rejected'), ans('closure_rate'))).toBe('T05');
    expect(transitionFor(page, page)).toBeUndefined();
  });
});

describe('backdrop blur control', () => {
  it('defaults to sharp; F/G toggle depth of field and full blur; code and screens can set it', async () => {
    const b = await import('../lib/backdrop');
    b.setBackdropBlur(null);
    b.setSceneBackdrop(undefined);
    expect(b.backdropMode()).toBe('none');
    b.toggleBackdropBlur('dof');
    expect(b.backdropMode()).toBe('dof');
    b.toggleBackdropBlur('dof');
    expect(b.backdropMode()).toBe('none');
    b.toggleBackdropBlur('full');
    expect(b.backdropMode()).toBe('full');
    b.setBackdropBlur(null);
    b.setSceneBackdrop('dof');
    expect(b.backdropMode()).toBe('dof');
    b.setBackdropBlur('none');
    expect(b.backdropMode()).toBe('none');
    b.setBackdropBlur(null);
    b.setSceneBackdrop(undefined);
  });
});
