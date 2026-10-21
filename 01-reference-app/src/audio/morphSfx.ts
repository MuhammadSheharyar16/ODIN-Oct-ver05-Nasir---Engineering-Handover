/**
 * Interface sound effects (supplied design assets, public/sfx):
 *  - intro-pulse: plays once when ODIN first appears (Home load-in)
 *  - morph-bass / morph-woosh: one picked at random for every morph (UI change)
 * Played through Web Audio for tight timing. ODIN's voice stays the subject, so
 * effects sit under it. Browsers block sound until the first user gesture: if
 * the page loads silently, the intro pulse plays on the first click/key within
 * a few seconds of load. `?sfx=0` or the M key mutes.
 */

const FILES = { intro: '/sfx/intro-pulse.m4a', bass: '/sfx/morph-bass.m4a', woosh: '/sfx/morph-woosh.m4a' } as const;
type Name = keyof typeof FILES;
const MORPHS: Name[] = ['bass', 'woosh'];
const GAIN: Record<Name, number> = { intro: 0.7, bass: 0.6, woosh: 0.55 };
/** Late intro (after a gesture) only if it still belongs to the load-in. */
const INTRO_GRACE_MS = 6000;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const buffers: Partial<Record<Name, AudioBuffer>> = {};
let muted = typeof location !== 'undefined' && new URLSearchParams(location.search).get('sfx') === '0';
let introWanted = 0;
let introPlayed = false;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 1;
  master.connect(ctx.destination);
  for (const n of Object.keys(FILES) as Name[]) {
    fetch(FILES[n])
      .then((r) => r.arrayBuffer())
      .then((a) => ctx!.decodeAudioData(a))
      .then((b) => {
        buffers[n] = b;
        if (n === 'intro' && introWanted && !introPlayed) tryIntro();
      })
      .catch(() => {});
  }
  return ctx;
}

function play(n: Name) {
  const c = ensure();
  const b = buffers[n];
  if (muted || !c || !master || !b || c.state !== 'running') return false;
  const src = c.createBufferSource();
  src.buffer = b;
  const g = c.createGain();
  g.gain.value = GAIN[n];
  src.connect(g).connect(master);
  src.start();
  return true;
}

function tryIntro() {
  if (introPlayed || !introWanted || performance.now() - introWanted > INTRO_GRACE_MS) return;
  if (play('intro')) introPlayed = true;
}

if (typeof window !== 'undefined') {
  ensure();
  const unlock = () => {
    const c = ensure();
    if (c && c.state === 'suspended') void c.resume().then(tryIntro);
    else tryIntro();
  };
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', (e) => {
    unlock();
    if ((e.key === 'm' || e.key === 'M') && !(e.target instanceof HTMLInputElement)) muted = !muted;
  });
}

/** Home load-in: ODIN first appears. */
export function playIntro() {
  introWanted = performance.now();
  const c = ensure();
  if (!c) return;
  if (c.state === 'suspended') void c.resume().then(tryIntro, () => {});
  tryIntro();
}

/** Every morph between views: one of the two morph sounds at random. */
export function playMorph(_style?: string) {
  void _style;
  play(MORPHS[Math.floor(Math.random() * MORPHS.length)]);
}
