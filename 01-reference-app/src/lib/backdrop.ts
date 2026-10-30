/**
 * Backdrop blur: how ODIN's room behaves behind the UI. One control, three modes.
 *
 *   'none' — sharp room (default since 21 Oct).
 *   'dof'  — depth of field: the interior stays sharp, the exterior (skyline, water, sky)
 *            gets a light lens blur.
 *   'full' — the previous style: interior and exterior both blurred (the receded room).
 *
 * Engineering can call it per screen:
 *   setBackdropBlur('dof')          // from code, when a screen needs it
 *   SceneAnswer.backdrop = 'full'    // or declare it on the screen; the director applies it
 * Keyboard (review): F toggles 'dof', G toggles 'full' (pressing again returns to the screen's own mode).
 * URL (review): ?blur=dof · ?blur=1 (full) set the starting mode.
 * Dimming is separate and off by default (?dim=1 brings back the old darkening).
 * Changes ease in and out (about 0.4 s) in EnvironmentLayers.
 */
import { isLite } from './environment';
export type BackdropBlur = 'none' | 'dof' | 'full';

const fromUrl = (): BackdropBlur | null => {
  if (typeof location === 'undefined') return null;
  const b = new URLSearchParams(location.search).get('blur');
  return b === 'dof' ? 'dof' : b === '1' || b === 'full' ? 'full' : null;
};

export const backdrop = {
  /** Set from code or the keyboard; wins over the screen's own mode. null = follow the screen. */
  // Lite mode (software WebGL, ver05.4): the room stays sharp; the blur pass is a full-screen cost.
  manual: (fromUrl() ?? (isLite() ? 'none' : null)) as BackdropBlur | null,
  /** The open screen's own mode (SceneAnswer.backdrop). */
  scene: 'none' as BackdropBlur,
};

/** The mode in effect now. */
export const backdropMode = (): BackdropBlur => backdrop.manual ?? backdrop.scene;

/** Engineering / code: force a mode ('none' keeps the room sharp); null hands control back to the screen. */
export function setBackdropBlur(mode: BackdropBlur | null) {
  backdrop.manual = mode;
}

/** Keyboard: F → 'dof', G → 'full'; the same key again turns it off. */
export function toggleBackdropBlur(mode: Exclude<BackdropBlur, 'none'>) {
  backdrop.manual = backdropMode() === mode ? 'none' : mode;
}

/** Director: the screen that just opened declares its mode (default 'none'). */
export function setSceneBackdrop(mode: BackdropBlur | undefined) {
  backdrop.scene = mode ?? 'none';
}
