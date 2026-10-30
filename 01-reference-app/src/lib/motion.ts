import { motionForced, osReducedMotion } from './environment';

/** Frame-rate independent exponential smoothing toward a target. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/**
 * Reduced motion as ODIN applies it: the OS preference, unless the deployment forces motion on
 * (`?motion=on` / VITE_ODIN_MOTION, lib/environment.ts) — remote desktops (AVD) report reduce by default.
 */
export const prefersReducedMotion = () => !motionForced() && osReducedMotion();
