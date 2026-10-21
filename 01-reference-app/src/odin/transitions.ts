import type { SceneAnswer } from './types';

/**
 * Transition catalogue: every change of state has an ID so engineering can
 * trigger, test and tune it on its own (handover: E13).
 *
 * Answer-first states (V30 and the full pages around it) use T01–T06. Any other
 * screen → screen change uses one of the six screen morphs M01–M06 (picked so
 * two in a row never look the same).
 *
 * `?transition=T03` (or `window.__odinTransition = 'T03'`) forces one for review.
 */
export type TransitionId = 'T01' | 'T02' | 'T03' | 'T04' | 'T05' | 'T06' | 'M01' | 'M02' | 'M03' | 'M04' | 'M05' | 'M06';

export type TransitionEntry = {
  id: TransitionId;
  name: string;
  /** When the director uses it. */
  when: string;
  /** What the CEO sees, in order (timings in seconds from the start). */
  steps: string[];
  /** Total length in seconds (before ODIN starts speaking). */
  duration: number;
  /** Particle path style for the morph burst (fx.style). */
  particles: number;
};

export const TRANSITIONS: TransitionEntry[] = [
  {
    id: 'T01', name: 'Grow', when: 'Answer → answer with one more metric ("and approved?")', duration: 1.4, particles: 1,
    steps: [
      '0.00 The sphere stays, breathes once (scale 0.97 → 1).',
      '0.00 Cards that stay glide to their new place (0.9 s, expo in-out).',
      '0.15 Light streams out of the sphere towards the new card.',
      '0.30 The new card is born from the sphere: it travels out along its energy line, growing from 12% with a blur that clears (1.1 s, expo out).',
      '0.60 Its energy line draws in.',
    ],
  },
  {
    id: 'T02', name: 'Regroup', when: 'Answer → answer with fewer metrics ("less detail")', duration: 1.2, particles: 1,
    steps: [
      '0.00 The removed card is drawn back into the sphere (0.7 s, power2 in), shrinking to 15%.',
      '0.10 Light streams from the card into the sphere.',
      '0.20 Cards that stay glide to their new place (0.9 s).',
      '0.70 The sphere pulses as it absorbs the card (scale 1.04 → 1).',
    ],
  },
  {
    id: 'T03', name: 'Expand', when: 'Answer → its full page ("full picture"), or any screen opened from an answer', duration: 1.6, particles: 4,
    steps: [
      '0.00 The answer sphere swells and dissolves (scale 1.5, blur 14 px, 0.75 s).',
      '0.00 Its cards drift outwards and fade (0.6 s).',
      '0.15 Light bursts from the sphere to every part of the full page.',
      '0.35 The full page unfolds from the sphere\'s centre: each part grows from 30% and travels out to its place, nearest first (1.05 s, expo out, 0.06 s apart).',
    ],
  },
  {
    id: 'T04', name: 'Gather', when: 'A full page (or Home) → an answer (a single-number question)', duration: 1.7, particles: 1,
    steps: [
      '0.00 Everything on screen is pulled towards the centre and vanishes into a point (0.7 s, power2 in), outer parts last.',
      '0.10 Light streams from every part into the centre.',
      '0.45 The answer sphere forms from that point (scale 0.3 → 1, back out, 1.0 s).',
      '0.75 The number rises into the sphere.',
      '0.90 Cards are born from the sphere (as T01).',
    ],
  },
  {
    id: 'T05', name: 'Swap', when: 'Answer → answer with a new lead metric ("what is the closure rate?")', duration: 1.4, particles: 5,
    steps: [
      '0.00 The old number rolls up and blurs out (0.45 s).',
      '0.10 The sphere contracts and springs back (scale 0.86 → 1, elastic, 1.0 s) while light swirls around it.',
      '0.35 The new number rolls up from below (0.8 s, expo out).',
      '0.30 New cards are born from the sphere; cards no longer asked return into it.',
    ],
  },
  {
    id: 'T06', name: 'Spotlight', when: 'The asked item is already on the open screen (no new screen)', duration: 0.9, particles: 0,
    steps: [
      '0.00 The screen stays. The asked item glows; its neighbours calm (opacity 0.72).',
      '0.00 On Top countries the asked panel glides to the centre (FLIP, 0.9 s) and the others step back to 75%.',
      '0.95 ODIN\'s spectrum moves to the asked item.',
    ],
  },
  { id: 'M01', name: 'Depth', when: 'Screen → screen', duration: 1.4, particles: 0, steps: ['Old screen recedes into depth with blur; the new one comes forward from depth.'] },
  { id: 'M02', name: 'Vortex', when: 'Screen → screen', duration: 1.4, particles: 1, steps: ['Old parts spiral into the centre; new parts spiral out.'] },
  { id: 'M03', name: 'Sweep', when: 'Screen → screen', duration: 1.4, particles: 2, steps: ['Old parts sweep left with a skew; new parts sweep in from the right.'] },
  { id: 'M04', name: 'Rise', when: 'Screen → screen', duration: 1.4, particles: 3, steps: ['Old parts rise and tilt away; new parts rise from below.'] },
  { id: 'M05', name: 'Scatter', when: 'Screen → screen', duration: 1.4, particles: 4, steps: ['Old parts scatter towards the viewer; new parts gather from far away.'] },
  { id: 'M06', name: 'Helix', when: 'Screen → screen', duration: 1.4, particles: 5, steps: ['Old parts turn away like a helix; new parts turn in.'] },
];

export const transitionById = (id: TransitionId) => TRANSITIONS.find((t) => t.id === id)!;

const isAnswer = (s: SceneAnswer | null) => !!s && s.template === 'glance';
const glanceOf = (s: SceneAnswer) => s.components.find((c) => c.spec.kind === 'glance')?.spec as { item?: string; more?: unknown[] } | undefined;
const countOf = (s: SceneAnswer) => 1 + (glanceOf(s)?.more?.length ?? 0);

function forced(): TransitionId | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = (window as unknown as { __odinTransition?: TransitionId }).__odinTransition;
  const q = new URLSearchParams(location.search).get('transition') as TransitionId | null;
  const id = w ?? q ?? undefined;
  return id && TRANSITIONS.some((t) => t.id === id) ? id : undefined;
}

/**
 * Which answer-state transition a change of screen uses; undefined = a screen morph (M01–M06).
 * T06 (same screen, new spotlight) is decided by the director before any morph.
 */
export function transitionFor(prev: SceneAnswer | null, next: SceneAnswer | null): TransitionId | undefined {
  const f = forced();
  if (f && !f.startsWith('M')) return f;
  const a = isAnswer(prev), b = isAnswer(next);
  if (a && b) {
    const hp = glanceOf(prev!)?.item, hn = glanceOf(next!)?.item;
    if (hp !== hn) return 'T05';
    const d = countOf(next!) - countOf(prev!);
    return d > 0 ? 'T01' : d < 0 ? 'T02' : 'T05';
  }
  if (a && next) return 'T03';
  if (b) return 'T04';
  return undefined;
}
