import gsap from 'gsap';
import { parse } from './nlu';
import { CUE_INFO, DEPTHS, MEASURE_INFO, MEASURE_LIST, plan, planFromIntent, route, understand } from './composer';
import { respond } from './respond';
import { FOLLOW_UP_SCRIPTS, PHRASINGS } from './phrasings';
import { QUESTIONS, matchQuestion } from './questions';
import { VIEWS } from './views';
import { COMPONENTS } from './components';
import { demoLatency, useWaiting, waitWithCheckIns } from './waiting';
import { TRANSITIONS, transitionById, transitionFor, type TransitionId } from './transitions';
import { answer, homeSpoken } from './answers';
import { composeScene } from './compose';
import { presence, useExperience } from './experience';
import { burst, type FxRect } from './fx';
import type { SceneAnswer } from './types';
import { startSpeechPreview, stopSpeech } from '../audio/odinAudio';
import { playMorph } from '../audio/morphSfx';
import { useCaption } from '../state/caption';
import { useLayout } from '../state/layout';
import { setAuraTarget, type AuraShape } from '../lib/aura';
import { backdrop, backdropMode, setBackdropBlur, setSceneBackdrop, toggleBackdropBlur } from '../lib/backdrop';
const backdropApi = { set: setBackdropBlur, toggle: toggleBackdropBlur, mode: backdropMode, state: backdrop };
import { useStage } from '../state/store';
import { prefersReducedMotion } from '../lib/motion';
import { REST_VIEW, envView, floorView, lowView } from '../lib/envFit';
import { FLOOR_CX } from '../ui/scene/components/floorJourney';

/**
 * Morph director: question → plan → scene → 3D morph → ODIN speaks.
 * Picker questions open their catalogue screen directly; free text and voice
 * go through the response composer (depth + spotlight, see composer.ts).
 * Any state can reach any state. Shared components (same key) travel from
 * their old place to their new one; others recede into depth while the new
 * ones assemble, with a particle stream carried through ODIN.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
let token = 0;

const layerSel = (s: SceneAnswer | null) => (s ? `[data-scene="${s.id}"]` : '[data-layer="home"]');
const morphEls = (s: SceneAnswer | null) => Array.from(document.querySelectorAll<HTMLElement>(`${layerSel(s)} [data-morph]`));

function rectOf(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
}

/** Aura writes go through aim(): live (ease to it), or measured for later (a new screen's final layout). */
let measuring: AuraShape | null | false = false;
function aim(shape: AuraShape) {
  if (measuring !== false) measuring = shape;
  else setAuraTarget(shape);
}
/** Where ODIN's spectrum belongs on a screen, measured at its final layout (before any morph transform). */
function measureAura(s: SceneAnswer | null): AuraShape | null {
  // Entrance animations are paused for the measurement, so scaled-in parts read at full size.
  const root = s ? document.querySelector<HTMLElement>(layerSel(s)) : null;
  root?.classList.add('odin-measure');
  void root?.offsetWidth;
  measuring = null;
  try { auraFor(s); return measuring as AuraShape | null; } finally { measuring = false; root?.classList.remove('odin-measure'); }
}

function auraFor(s: SceneAnswer | null) {
  const home = useLayout.getState().home;
  if (!s) {
    const g = home.globe;
    aim({ x: g.x, y: g.y, hw: g.r, hh: g.r, radius: g.r });
    return;
  }
  // Compositions (journeys, rows of jars) get the floor form around everything.
  const floor = document.querySelector<HTMLElement>(`${layerSel(s)} [data-aura="floor"]`);
  if (floor) {
    let r = rectOf(floor);
    if (floor.dataset.auraFrom === 'plinths') {
      const bs = Array.from(document.querySelectorAll<HTMLElement>(`${layerSel(s)} [data-plinth]`))
        .map((e) => e.getBoundingClientRect())
        .filter((b) => b.width > 1);
      if (bs.length) {
        const l = Math.min(...bs.map((b) => b.left));
        const rr = Math.max(...bs.map((b) => b.right));
        const w = Math.max(...bs.map((b) => b.width));
        const cy = bs.reduce((a, b) => a + b.top, 0) / bs.length;
        r = { x: (l + rr) / 2, y: cy + w * 0.16, w: rr - l + w * 0.55, h: w * 0.62 };
      }
    }
    const k = parseFloat(floor.dataset.rise ?? '') || 0.16;
    aim({ x: r.x, y: r.y, hw: r.w / 2, hh: r.h / 2, radius: 0, mode: 1, rise: (r.w / 2) * k });
    return;
  }
  // Spotlight: ODIN's spectrum wraps only the asked card (when it is a card-sized element).
  const spotEl = s.spot ? document.querySelector<HTMLElement>(`${layerSel(s)} [data-spot-key="${CSS.escape(s.spot)}"]`) : null;
  const spotBox = spotEl?.getBoundingClientRect();
  const spotted = spotEl && spotBox && spotBox.width > 120 && spotBox.height > 80 ? spotEl : null;
  const focus = document.querySelector<HTMLElement>(`${layerSel(s)} [data-focus]`);
  const sphere = focus?.querySelector<HTMLElement>('[data-aura]');
  // An asked item inside the sphere (its number) → the spectrum circles the sphere, never hides inside it.
  const inside = (a: DOMRect, b: DOMRect) => a.left >= b.left - 2 && a.right <= b.right + 2 && a.top >= b.top - 2 && a.bottom <= b.bottom + 2;
  const card = spotted && !(sphere && spotBox && inside(spotBox, sphere.getBoundingClientRect())) ? spotted : null;
  const el = card ?? sphere ?? focus;
  if (!el) return;
  wrapAura(el, !!card);
}

/** Point ODIN's spectrum at one element, in its own shape (circle for a sphere, pill for a capsule). */
function wrapAura(el: HTMLElement, card: boolean) {
  const r = rectOf(el);
  const radOf = (e: HTMLElement) => { const raw = getComputedStyle(e).borderTopLeftRadius; return raw.endsWith('%') ? (parseFloat(raw) / 100) * Math.min(r.w, r.h) * 2 : parseFloat(raw) || 0; };
  const surface = el.querySelector<HTMLElement>('[data-surface]') ?? el;
  // A spotted card takes the roundest of its own glass layers (a pill capsule stays a pill).
  const rad = card
    ? Math.max(radOf(el), ...Array.from(el.querySelectorAll<HTMLElement>('*')).slice(0, 30).filter((e) => e.getBoundingClientRect().width > r.w * 0.8).map(radOf)) || 24
    : radOf(surface) || 24;
  aim({ x: r.x, y: r.y, hw: r.w / 2, hh: r.h / 2, radius: Math.min(rad, r.w / 2, r.h / 2) });
}

/**
 * Morph choreographies. Each pairs a DOM entrance/exit with a particle path
 * style (fx.style) so consecutive transitions never look the same.
 */
type Vars = gsap.TweenVars;
type Morph = {
  name: string;
  particles: number;
  out: (r: { x: number; y: number }, c: { x: number; y: number }) => Vars;
  in: (r: { x: number; y: number }, c: { x: number; y: number }) => Vars;
  order?: (r: { x: number; y: number }) => number;
  ease?: string;
};
/** Screen morphs, M01–M06 in this order (transitions.ts). */
const MORPHS: Morph[] = [
  {
    name: 'depth',
    particles: 0,
    out: () => ({ z: -280, scale: 0.86, rotationX: 7, filter: 'blur(12px)' }),
    in: () => ({ z: -340, rotationX: -14, y: 26, scale: 0.9, filter: 'blur(14px)' }),
  },
  {
    name: 'vortex',
    particles: 1,
    out: (r, c) => ({ rotation: r.x < c.x ? -14 : 14, scale: 0.4, x: (c.x - r.x) * 0.6, y: (c.y - r.y) * 0.6, filter: 'blur(10px)' }),
    in: (r, c) => ({ rotation: r.x < c.x ? 18 : -18, scale: 0.35, x: (c.x - r.x) * 0.7, y: (c.y - r.y) * 0.7, filter: 'blur(10px)' }),
    order: (r) => -Math.abs(r.x - innerWidth / 2),
    ease: 'back.out(1.25)',
  },
  {
    name: 'sweep',
    particles: 2,
    out: () => ({ x: -160, skewX: 10, filter: 'blur(8px)' }),
    in: () => ({ x: 220, skewX: -12, filter: 'blur(10px)' }),
    order: (r) => r.x,
  },
  {
    name: 'rise',
    particles: 3,
    out: () => ({ y: -90, z: -140, rotationX: 22, filter: 'blur(10px)' }),
    in: () => ({ y: 140, z: -120, rotationX: -32, scale: 0.94, filter: 'blur(8px)' }),
    order: (r) => -r.y,
  },
  {
    name: 'scatter',
    particles: 4,
    out: (r, c) => ({ x: (r.x - c.x) * 0.35, y: (r.y - c.y) * 0.35, z: 160, scale: 1.18, filter: 'blur(16px)' }),
    in: (r, c) => ({ x: (r.x - c.x) * -0.25, y: (r.y - c.y) * -0.25, z: -420, scale: 0.6, filter: 'blur(12px)' }),
  },
  {
    name: 'helix',
    particles: 5,
    out: (r, c) => ({ rotationY: r.x < c.x ? 70 : -70, z: -220, filter: 'blur(8px)' }),
    in: (r, c) => ({ rotationY: r.x < c.x ? -75 : 75, z: -220, filter: 'blur(8px)' }),
    order: (r) => r.x,
    ease: 'expo.out',
  },
];
let lastMorph = -1;
function pickMorph(): Morph {
  const forced = (window as unknown as { __odinMorph?: number }).__odinMorph;
  if (typeof forced === 'number') return MORPHS[forced % MORPHS.length];
  const byId = (window as unknown as { __odinTransition?: string }).__odinTransition ?? new URLSearchParams(location.search).get('transition');
  if (byId && /^M0[1-6]$/.test(byId)) return MORPHS[Number(byId.slice(1)) - 1];
  let i = Math.floor(Math.random() * MORPHS.length);
  if (i === lastMorph) i = (i + 1 + Math.floor(Math.random() * (MORPHS.length - 1))) % MORPHS.length;
  lastMorph = i;
  return MORPHS[i];
}

/** Floor scenes push the camera onto the interior floor (wide screens); the environment blurs like every answer. */
function applyEnv(s: SceneAnswer | null) {
  const home = useLayout.getState().home;
  const floor = s?.env === 'floor' && home.mode === 'wide';
  // Pan so the journey (centred on FLOOR_CX in the reference frame) sits mid-screen.
  const sx = Math.min(home.height / 1080, home.width / 1920);
  const low = s?.env === 'low' && home.mode === 'wide';
  envView.target = floor ? floorView(home.width, home.height, (FLOOR_CX - 960) * sx) : low ? lowView(home.width, home.height) : { ...REST_VIEW };
  useStage.getState().setFocus(s ? 1 : 0);
  setSceneBackdrop(s?.backdrop);
}

function presenceFor(s: SceneAnswer | null) {
  const home = useLayout.getState().home;
  if (!s) return { x: home.globe.x, y: home.globe.y, r: home.globe.r, form: 1 };
  return composeScene(s, home).presence;
}

/** Ask ODIN a question (typed now; transcribed speech later). */
export function ask(text: string) {
  const q = text.trim();
  if (!q) return;
  const st = useExperience.getState();
  const picked = matchQuestion(q)?.intent;
  const p = picked ? planFromIntent(picked) : plan(understand(q, st.lastIntent), { last: st.lastPlan });
  const intent = p.intent;
  useExperience.setState({ heard: q });
  if (intent.type === 'back') {
    const history = [...st.history];
    const prev = history.length ? history.pop()! : null;
    void go(prev, history);
    return;
  }
  let next = picked && intent.type !== 'answer' ? answer(intent) : respond(p);
  // Already on screen: same scene, new spotlight (go() highlights in place instead of morphing).
  if (next && st.active && p.reason.startsWith('already on screen')) next = { ...next, id: st.active.id };
  const home = intent.type === 'home';
  useExperience.setState({ lastIntent: home ? undefined : intent, lastPlan: home ? undefined : p.measure ? p : st.lastPlan });
  void go(next, next ? [...st.history, st.active] : []);
}

let waiter: ReturnType<typeof waitWithCheckIns> | undefined;
let beatTimers: number[] = [];

/**
 * Answer view: as ODIN reaches each metric's sentence, its spectrum moves to that metric
 * (a circle round the sphere for the first, then each card beside it).
 */
function playBeats(s: SceneAnswer | null, my: number) {
  beatTimers.forEach(clearTimeout);
  beatTimers = [];
  const u = useCaption.getState().current;
  if (!s?.beats?.length || !u) return;
  let word = 0;
  for (const b of s.beats) {
    const at = u.wordStarts[Math.min(word, u.wordStarts.length - 1)] ?? 0;
    word += b.words;
    beatTimers.push(window.setTimeout(() => {
      if (my !== token) return;
      const el = document.querySelector<HTMLElement>(b.target === 'globe' ? `${layerSel(s)} [data-answer-globe]` : `${layerSel(s)} [data-spot-key="${CSS.escape(b.target)}"]`);
      if (el) wrapAura(el, b.target !== 'globe');
    }, Math.max(0, at - 150)));
  }
}

/** Sound for each answer transition (reuses the morph cues). */
const T_SOUND: Partial<Record<TransitionId, string>> = { T01: 'rise', T02: 'vortex', T03: 'scatter', T04: 'vortex', T05: 'helix' };
type OutInfo = { el: HTMLElement; key: string; rect: ReturnType<typeof rectOf>; accent: string };

/**
 * Answer-state transitions T01–T05 (see transitions.ts for the storyboard of each).
 * The answer sphere is the hinge: cards are born from it, full pages unfold from it,
 * and everything gathers into it.
 */
function answerTransition(id: TransitionId, tl: gsap.core.Timeline, prev: SceneAnswer | null, next: SceneAnswer | null, outInfo: OutInfo[], inEls: HTMLElement[]) {
  const P = 1300;
  const sphereOf = (s: SceneAnswer | null) => (s ? document.querySelector<HTMLElement>(`${layerSel(s)} [data-answer-sphere]`) : null);
  const oldSphere = sphereOf(prev), newSphere = sphereOf(next);
  const centre = { x: innerWidth / 2, y: innerHeight * 0.45 };
  const sp = newSphere ? rectOf(newSphere) : oldSphere ? rectOf(oldSphere) : { ...centre, w: 0, h: 0 };
  const isWrap = (k: string) => k === 'glance';
  const isAns = (k: string) => k.startsWith('ans:');
  const nextKeys = new Set(inEls.map((e) => e.dataset.morph!));
  const prevKeys = new Set(outInfo.map((o) => o.key));
  const outByKey = new Map(outInfo.map((o) => [o.key, o]));
  // gsap drives every entrance here: switch off the components' own CSS entrances.
  if (next) document.querySelectorAll<HTMLElement>(`${layerSel(next)} [data-morph], ${layerSel(next)} [data-answer-sphere]`).forEach((e) => (e.style.animation = 'none'));
  const dist = (r: { x: number; y: number }) => Math.hypot(r.x - sp.x, r.y - sp.y);
  const t = transitionById(id);
  const born: FxRect[] = [], gone: FxRect[] = [];

  // ── Leaving ──
  for (const o of outInfo) {
    if (isWrap(o.key)) { tl.to(o.el, { opacity: 0, duration: 0.3, ease: 'power1.out' }, id === 'T03' ? 0.6 : id === 'T02' ? 0.65 : 0.2); continue; }
    if (nextKeys.has(o.key)) { tl.set(o.el, { opacity: 0 }, 0); continue; }
    if (id === 'T03') {
      // Expand: the answer drifts outwards and dissolves.
      tl.to(o.el, { x: (o.rect.x - sp.x) * 0.45, y: (o.rect.y - sp.y) * 0.45, scale: isAns(o.key) ? 1.25 : 0.92, opacity: 0, filter: 'blur(10px)', duration: 0.6, ease: 'power2.in' }, 0);
    } else if (id === 'T05' && o.key === `ans:${(prev?.components[0]?.spec as { item?: string })?.item}`) {
      // Swap: the old number rolls up and out.
      tl.to(o.el, { y: -50, opacity: 0, filter: 'blur(8px)', duration: 0.45, ease: 'power2.in' }, 0);
    } else {
      // Grow / Regroup / Swap / Gather: drawn into the sphere.
      gone.push({ ...o.rect, accent: o.accent });
      tl.to(o.el, { x: sp.x - o.rect.x, y: sp.y - o.rect.y, scale: 0.15, opacity: 0, filter: 'blur(6px)', transformPerspective: P, duration: 0.7, ease: 'power2.in' }, id === 'T04' ? Math.max(0, 0.25 - dist(o.rect) / 4000) : 0);
    }
  }
  if (oldSphere && id === 'T03') tl.to(oldSphere, { scale: 1.5, opacity: 0, filter: 'blur(14px)', duration: 0.75, ease: 'power2.in' }, 0);

  // ── Arriving ──
  const fresh = inEls.filter((e) => !isWrap(e.dataset.morph!) && !prevKeys.has(e.dataset.morph!));
  const order = new Map([...fresh].sort((a, b) => dist(rectOf(a)) - dist(rectOf(b))).map((e, i) => [e, i]));
  for (const el of inEls) {
    const key = el.dataset.morph!, r = rectOf(el);
    if (isWrap(key)) { tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0); continue; }
    const shared = outByKey.get(key);
    if (shared && !isWrap(key)) {
      tl.fromTo(el, { x: shared.rect.x - r.x, y: shared.rect.y - r.y, scaleX: shared.rect.w / r.w, scaleY: shared.rect.h / r.h, opacity: 1, transformPerspective: P }, { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1, duration: 0.9, ease: 'expo.inOut', clearProps: 'transform' }, 0);
      continue;
    }
    born.push({ ...r, accent: el.dataset.accent ?? '#7fb6ff' });
    const heroNext = `ans:${(next?.components[0]?.spec as { item?: string })?.item}`;
    if ((id === 'T05' || id === 'T04') && key === heroNext) {
      // The number rises into the sphere.
      tl.fromTo(el, { y: 50, opacity: 0, filter: 'blur(8px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.8, ease: 'expo.out', clearProps: 'transform,filter' }, id === 'T04' ? 0.75 : 0.35);
      continue;
    }
    // Born from the sphere (cards) or unfolding from it (a full page).
    const k = id === 'T03' ? 0.85 : 1;
    const at = id === 'T03' ? 0.35 + (order.get(el) ?? 0) * 0.06 : id === 'T04' ? 0.9 + (order.get(el) ?? 0) * 0.08 : 0.3 + (order.get(el) ?? 0) * 0.1;
    tl.fromTo(el, { x: (sp.x - r.x) * k, y: (sp.y - r.y) * k, scale: id === 'T03' ? 0.3 : 0.12, opacity: 0, filter: 'blur(12px)', transformPerspective: P },
      { x: 0, y: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: id === 'T03' ? 1.05 : 1.1, ease: 'expo.out', clearProps: 'transform,filter' }, at);
  }
  if (newSphere) {
    if (id === 'T04') tl.fromTo(newSphere, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.0, ease: 'back.out(1.3)', clearProps: 'transform' }, 0.45);
    else if (id === 'T05') tl.fromTo(newSphere, { scale: 1 }, { keyframes: [{ scale: 0.86, duration: 0.3, ease: 'power2.in' }, { scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.55)' }], clearProps: 'transform' }, 0.1);
    else if (id === 'T02') tl.fromTo(newSphere, { scale: 1 }, { keyframes: [{ scale: 1.04, duration: 0.18 }, { scale: 1, duration: 0.5, ease: 'power2.out' }], clearProps: 'transform' }, 0.65);
    else if (id === 'T01') tl.fromTo(newSphere, { scale: 0.97 }, { scale: 1, duration: 0.8, ease: 'power2.out', clearProps: 'transform' }, 0);
  }
  // Light: out of the sphere into what is born, or from what leaves into the sphere.
  const sRect: FxRect = { ...sp, accent: '#8fc6ff' };
  if (id === 'T05') burst([sRect], [sRect], sp, t.particles);
  else if (id === 'T04' || id === 'T02') burst(gone.length ? gone : [sRect], [sRect], sp, t.particles);
  else burst([sRect], born.length ? born : [sRect], sp, t.particles);
  const snd = T_SOUND[id];
  if (snd) playMorph(snd);
}

async function go(next: SceneAnswer | null, history: (SceneAnswer | null)[]) {
  const my = ++token;
  const reduced = prefersReducedMotion();
  stopSpeech();
  gsap.killTweensOf('[data-morph]');
  // Finish any interrupted morph instantly.
  if (useExperience.getState().leaving !== undefined) useExperience.setState({ leaving: undefined });

  useExperience.setState({ phase: 'thinking' });
  waiter?.cancel();
  useWaiting.setState({ note: null, dataAt: 0 });
  // Demo latency (?latency=): think with check-ins, or show the screen and load each number in turn.
  const lat = next ? demoLatency() : { ms: 0, progressive: false };
  if (lat.ms && !lat.progressive) {
    waiter = waitWithCheckIns(lat.ms, () => my === token);
    await waiter.done;
  } else await sleep(reduced ? 80 : 420);
  if (my !== token) return;
  if (lat.ms && lat.progressive) {
    useWaiting.setState({ dataAt: performance.now() + lat.ms, note: 'Bringing in the figures…' });
    waiter = waitWithCheckIns(lat.ms, () => my === token);
    // Clear the data clock once everything has arrived, so later screens load instantly.
    void waiter.done.then(() => { if (my === token) window.setTimeout(() => useWaiting.setState({ dataAt: 0 }), 4000); });
  }

  const prev = useExperience.getState().active;
  if (prev?.id === next?.id && next !== null) {
    // Already on screen: highlight in place (no new screen, no morph); the screen animates its own focus.
    useExperience.setState({ active: next, phase: 'speaking', history: useExperience.getState().history, morph: 'T06' });
    window.setTimeout(() => { if (my === token) auraFor(next); }, reduced ? 0 : 950);
    startSpeechPreview(next.spoken);
    return;
  }
  const outEls = morphEls(prev);
  const outInfo = outEls.map((el) => ({ el, key: el.dataset.morph!, rect: rectOf(el), accent: el.dataset.accent ?? '#7fb6ff' }));

  useExperience.setState({ active: next, leaving: prev, phase: 'morphing', history });
  applyEnv(next);
  await frame();
  if (my !== token) return;

  const inEls = morphEls(next);
  // Where ODIN's spectrum will be on this screen: measured now, at the final layout, and placed there
  // (no travelling) the moment ODIN starts speaking.
  const auraAt = measureAura(next);
  const outByKey = new Map(outInfo.map((o) => [o.key, o]));
  const tl = gsap.timeline();

  // Particle stream from old shapes, through ODIN, into new ones.
  const via = presence.target.form > 0.5 ? { x: presence.target.x, y: presence.target.y } : presenceFor(null);
  const fromRects: FxRect[] = outInfo.map((o) => ({ ...o.rect, accent: o.accent }));
  const toRects: FxRect[] = inEls.map((el) => ({ ...rectOf(el), accent: el.dataset.accent ?? '#7fb6ff' }));
  // Answer states use their own transitions (T01–T05); other screens a screen morph (M01–M06).
  const tid = reduced ? undefined : transitionFor(prev, next);
  const m = pickMorph();
  const c = { x: innerWidth / 2, y: innerHeight / 2 };
  useExperience.setState({ morph: tid ?? `M0${MORPHS.indexOf(m) + 1}` });
  if (!reduced && !tid) {
    burst(fromRects, toRects, via, m.particles);
    playMorph(m.name);
  }

  // Globe: dissolve into particles, travel, or re-form.
  presence.followHome = false;
  Object.assign(presence.target, presenceFor(next));
  // Core presence: sit exactly in the component's core as actually laid out.
  // [data-presence="k"] gives the radius as a fraction of the core's short side.
  if (next?.presence === 'core') {
    const core = document.querySelector<HTMLElement>(`${layerSel(next)} [data-presence]`);
    const ring = core ?? document.querySelector<HTMLElement>(`${layerSel(next)} [data-aura]`);
    const r = ring ? rectOf(ring) : null;
    if (ring && r && r.w > 4) {
      const k = core ? parseFloat(core.dataset.presence || '0.27') : 0.27;
      Object.assign(presence.target, { x: r.x, y: r.y, r: Math.min(r.w, r.h) * k, form: 1 });
    }
  }

  const P = 1300;
  const rank = <T,>(items: T[], at: (x: T) => { x: number; y: number }) => {
    if (!m.order) return items.map((_, i) => i);
    const idx = items.map((x, i) => ({ i, k: m.order!(at(x)) })).sort((a, b) => a.k - b.k);
    const pos = new Array(items.length);
    idx.forEach((v, n) => (pos[v.i] = n));
    return pos as number[];
  };
  const outRank = rank(outInfo, (o) => o.rect);
  if (tid) answerTransition(tid, tl, prev, next, outInfo, inEls);
  else outInfo.forEach((o, i) => {
    if (inEls.some((el) => el.dataset.morph === o.key)) {
      tl.to(o.el, { opacity: 0, duration: 0.25, ease: 'power1.out' }, 0.05);
    } else {
      tl.to(
        o.el,
        { opacity: 0, ...m.out(o.rect, c), transformPerspective: P, duration: reduced ? 0.01 : 0.55, ease: 'power2.in' },
        outRank[i] * 0.04,
      );
    }
  });

  const inRects = inEls.map(rectOf);
  const inRank = rank(inRects, (r) => r);
  if (!tid) inEls.forEach((el, i) => {
    const shared = outByKey.get(el.dataset.morph!);
    const r = inRects[i];
    if (shared && !reduced) {
      // Shared object: travel and reshape from where it was.
      tl.fromTo(
        el,
        { x: shared.rect.x - r.x, y: shared.rect.y - r.y, scaleX: shared.rect.w / r.w, scaleY: shared.rect.h / r.h, opacity: 0.4, transformPerspective: P },
        { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1, duration: 1.0, ease: 'expo.inOut', clearProps: 'transform' },
        0.1,
      );
    } else {
      tl.fromTo(
        el,
        { opacity: 0, ...m.in(r, c), transformPerspective: P },
        {
          opacity: 1, x: 0, y: 0, z: 0, rotation: 0, rotationX: 0, rotationY: 0, skewX: 0, scale: 1, filter: 'blur(0px)',
          duration: reduced ? 0.01 : 0.95, ease: m.ease ?? 'expo.out', clearProps: 'transform,filter',
        },
        reduced ? 0 : 0.42 + inRank[i] * 0.07,
      );
    }
  });

  // ODIN starts speaking as the new screen settles (no pause after the morph).
  // Progressive loading: ODIN speaks once the numbers are in.
  const dataIn = Math.max(0, (useWaiting.getState().dataAt - performance.now()) / 1000);
  tl.call(() => { if (my === token) { if (auraAt) setAuraTarget(auraAt, true); startSpeechPreview(next ? next.spoken : homeSpoken()); playBeats(next, my); } }, [], reduced ? 0 : Math.max(0.3, tl.duration() * 0.62, dataIn + 0.4));
  await tl.then();
  if (my !== token) return;
  useExperience.setState({ leaving: undefined, phase: useCaption.getState().speaking ? 'speaking' : 'idle' });
  presence.followHome = next === null;
  auraFor(next);
}

// Speaking ends → idle.
useCaption.subscribe((c, p) => {
  if (p.speaking && !c.speaking && useExperience.getState().phase === 'speaking') useExperience.setState({ phase: 'idle' });
});

// Keep the aura on the focus object when the layout changes.
useLayout.subscribe(() => {
  const st = useExperience.getState();
  applyEnv(st.active);
  if (st.phase !== 'morphing') requestAnimationFrame(() => auraFor(st.active));
});

export function speakCurrent() {
  const a = useExperience.getState().active;
  startSpeechPreview(a ? a.spoken : homeSpoken());
  useExperience.setState({ phase: 'speaking' });
}

if (import.meta.env.DEV) {
  // Dev/handover hooks: ask, and the scene spec a question produces (data contract samples).
  const w = window as unknown as Record<string, unknown>;
  w.__odinAsk = ask;
  // Picker questions answer directly; anything else goes through the composer (as ask() does).
  w.__odinAnswer = (q: string) => { const i = matchQuestion(q)?.intent; return i && i.type !== 'answer' ? answer(i) : respond(i ? planFromIntent(i) : plan(understand(q))); };
  w.__odinRoutes = () => MEASURE_LIST.filter((m) => m !== 'compare').map((m) => ({ measure: m, info: MEASURE_INFO[m], ...Object.fromEntries(DEPTHS.map((d) => { const r = route(m, d, {}); return [d, { view: r.view, spotlight: r.spotlight ?? null }]; })), filtered: (() => { const r = route(m, 'context', { country: 'IN' }); return { view: r.view, spotlight: r.spotlight ?? null }; })() }));
  w.__odinCues = () => CUE_INFO;
  w.__odinComponents = () => COMPONENTS;
  w.__odinTransitions = () => TRANSITIONS;
  w.__odinBackdrop = backdropApi;
  w.__odinPhrasings = () => {
    const row = (q: string, p: ReturnType<typeof plan>) => ({ question: q, query: p.query, view: p.view, depth: p.depth, measure: p.measure, spotlight: p.spotlight ?? null, items: p.intent.type === 'answer' ? p.intent.items : null, followUps: p.followUps, reason: p.reason });
    const scripts = FOLLOW_UP_SCRIPTS.map((sc) => {
      let last: ReturnType<typeof plan> | undefined;
      return { name: sc.name, steps: sc.steps.map(([q]) => { last = plan(understand(q, last?.intent), { last }); return row(q, last); }) };
    });
    return { rows: PHRASINGS.map(([q, view, depth, item]) => ({ ...row(q, plan(understand(q))), expected: { view, depth, item: item ?? null } })), scripts };
  };
  w.__odinIntent = (q: string) => matchQuestion(q)?.intent ?? parse(q);
  w.__odinPlan = (q: string) => plan(understand(q, useExperience.getState().lastIntent), { last: useExperience.getState().lastPlan });
  w.__odinViews = VIEWS;
  w.__odinQuestions = QUESTIONS;
}
