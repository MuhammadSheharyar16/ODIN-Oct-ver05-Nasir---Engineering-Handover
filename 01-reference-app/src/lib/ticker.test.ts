import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// A fake 120 Hz display: rAF callbacks fire every 8.33 ms when the test advances time.
let queue: { id: number; f: FrameRequestCallback }[] = [];
let now = 0, nextId = 1;
const flush = (ms: number) => {
  for (const end = now + ms; now + 1000 / 120 <= end;) {
    now += 1000 / 120;
    const due = queue; queue = [];
    for (const q of due) q.f(now);
  }
};

beforeEach(() => {
  queue = []; now = 0; nextId = 1;
  vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => { const id = nextId++; queue.push({ id, f }); return id; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => { queue = queue.filter((q) => q.id !== id); });
  vi.resetModules();
});
afterEach(() => vi.unstubAllGlobals());

describe('shared ticker (ver05.3 performance)', () => {
  it('runs subscribers at most 60 times a second on a 120 Hz screen', async () => {
    const { onTick } = await import('./ticker');
    let calls = 0;
    const stop = onTick(() => { calls++; });
    flush(1000);
    expect(calls).toBeGreaterThanOrEqual(58);
    expect(calls).toBeLessThanOrEqual(61);
    stop();
  });

  it('stops its frame loop when nothing is subscribed', async () => {
    const { onTick, tickerSize } = await import('./ticker');
    const stop = onTick(() => {});
    flush(100);
    stop();
    expect(tickerSize()).toBe(0);
    expect(queue.length).toBe(0);
  });

  it('requestFrame runs a callback once on the next tick and can be cancelled', async () => {
    const { requestFrame, cancelFrame } = await import('./ticker');
    let a = 0, b = 0;
    requestFrame(() => { a++; });
    const id = requestFrame(() => { b++; });
    cancelFrame(id);
    flush(100);
    expect(a).toBe(1);
    expect(b).toBe(0);
  });
});
