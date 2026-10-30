/**
 * One shared animation clock for the whole app (ver05.3 performance, P2).
 * A single requestAnimationFrame loop calls every subscriber at most 60 times a second, so a
 * 120 Hz screen (ProMotion) does not draw twice as often. It stops when nothing is subscribed or
 * the tab is hidden, and every subscriber gets the same `now`, so 2D canvases and the 3D stage
 * draw on the same frame.
 */
export type Tick = (now: number, dt: number) => void;

const MIN_STEP = 1000 / 60 - 1.2; // ~15.5 ms: tolerate rAF jitter on a 60 Hz screen
const subs = new Set<Tick>();
let raf = 0;
let last = 0;

function loop(now: number) {
  raf = 0;
  if (!subs.size || (typeof document !== 'undefined' && document.hidden)) return;
  if (now - last >= MIN_STEP) {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60);
    last = now;
    for (const f of [...subs]) f(now, dt);
  }
  raf = requestAnimationFrame(loop);
}

function start() {
  if (!raf && subs.size && !(typeof document !== 'undefined' && document.hidden)) raf = requestAnimationFrame(loop);
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { last = 0; start(); });
}

/** Subscribe to the shared clock; returns the unsubscribe function. */
export function onTick(f: Tick): () => void {
  subs.add(f);
  start();
  return () => {
    subs.delete(f);
    if (!subs.size && raf) { cancelAnimationFrame(raf); raf = 0; last = 0; }
  };
}

/** Test hook: number of live subscribers. */
export const tickerSize = () => subs.size;

/**
 * Drop-in for `requestAnimationFrame` in self-rescheduling loops: the callback runs once on the
 * next shared tick (so at most 60 fps). Returns an id for `cancelFrame`.
 */
const once = new Map<number, (now: number) => void>();
let nextId = 1;
let onceSub: (() => void) | null = null;
function runOnce(now: number) {
  const due = [...once.entries()];
  once.clear();
  for (const [, f] of due) f(now);
  if (!once.size && onceSub) { onceSub(); onceSub = null; }
}
export function requestFrame(f: (now: number) => void): number {
  const id = nextId++;
  once.set(id, f);
  if (!onceSub) onceSub = onTick(runOnce);
  return id;
}
export function cancelFrame(id: number) {
  once.delete(id);
}
