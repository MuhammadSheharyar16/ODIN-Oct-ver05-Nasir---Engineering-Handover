import { create } from 'zustand';

/**
 * Render-level state shared between the WebGL stage and the DOM overlay.
 * Conversation logic lives in the experience machine (Phase 3); this store
 * only carries values the renderer needs every frame.
 */
type StageState = {
  /** 0 = ambient Home, 1 = an answer is in focus (environment recedes). */
  focus: number;
  setFocus: (focus: number) => void;
  /** ODIN's own output audio level 0..1 — drives the globe spectrum only. */
  odinLevel: number;
  setOdinLevel: (level: number) => void;
  /** The user's microphone input level 0..1 — drives the mic bar only. */
  micLevel: number;
  setMicLevel: (level: number) => void;
  /** Environment textures decoded and on the GPU. */
  envReady: boolean;
  /**
   * Render quality tier. 'high' (projection room / strong GPU): full post-FX at
   * up to 2× DPR; 'medium': post-FX at 1.5×; 'low': no post-FX at 1×.
   * Starts from `?tier=` or 'high', then adapts down (and back up) to hold
   * frame rate. Visual content is identical across tiers; only finish changes.
   */
  tier: 'high' | 'medium' | 'low';
  tierLocked: boolean;
};

const urlTier = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('tier') : null;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const useStage = create<StageState>((set) => ({
  focus: 0,
  setFocus: (focus) => set({ focus: clamp01(focus) }),
  odinLevel: 0,
  setOdinLevel: (odinLevel) => set({ odinLevel: clamp01(odinLevel) }),
  micLevel: 0,
  setMicLevel: (micLevel) => set({ micLevel: clamp01(micLevel) }),
  envReady: false,
  tier: urlTier === 'low' || urlTier === 'medium' ? urlTier : 'high',
  tierLocked: urlTier !== null,
}));

if (import.meta.env.DEV) {
  (window as unknown as { __odinStage: typeof useStage }).__odinStage = useStage;
}
