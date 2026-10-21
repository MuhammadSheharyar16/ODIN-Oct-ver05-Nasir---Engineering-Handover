import { create } from 'zustand';
import type { Intent, SceneAnswer } from './types';
import type { ResponsePlan } from './composer';

/**
 * Conversation state. `active` null = Home. `leaving` holds the outgoing
 * scene while the morph runs, so both are on screen at once.
 *
 * phase: idle → thinking → morphing → speaking → idle (any phase can be
 * interrupted by a new question).
 */
export type Phase = 'idle' | 'thinking' | 'morphing' | 'speaking';

type Experience = {
  phase: Phase;
  active: SceneAnswer | null;
  leaving: SceneAnswer | null | undefined;
  history: (SceneAnswer | null)[];
  lastIntent?: Intent;
  /** Last composer plan: "tell me more" / "less detail" change its depth. */
  lastPlan?: ResponsePlan;
  /** Last question as typed/heard, shown in the mic bar while thinking. */
  heard: string;
  composerOpen: boolean;
  /** Name of the last morph choreography (depth, vortex, sweep, rise, scatter, helix). */
  morph: string;
};

export const useExperience = create<Experience>(() => ({
  phase: 'idle',
  active: null,
  leaving: undefined,
  history: [],
  heard: '',
  composerOpen: false,
  morph: 'depth',
}));

/** Globe target written by the director, read every frame by the WebGL globe. */
export const presence = {
  target: { x: 0, y: 0, r: 0, form: 1 },
  /** true until the first scene change: the globe follows the Home layout. */
  followHome: true,
};

if (import.meta.env.DEV) (window as unknown as { __odinExp: typeof useExperience }).__odinExp = useExperience;
