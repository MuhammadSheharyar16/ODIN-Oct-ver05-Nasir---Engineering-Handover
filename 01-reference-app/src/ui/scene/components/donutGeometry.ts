import type { DonutSpec } from '../../../odin/types';

/** Ring tilt shared with the WebGL donut (radians about X). */
export const DONUT_TILT = 0.5;
/** Start angle (12 o'clock) and direction (clockwise on screen). */
export function segmentAngles(spec: DonutSpec) {
  const total = spec.segments.reduce((a, s) => a + s.count, 0) || 1;
  let a = -Math.PI / 2;
  return spec.segments.map((s) => {
    const span = (s.count / total) * Math.PI * 2;
    const r = { start: a, end: a + span, mid: a + span / 2, share: s.count / total };
    a += span;
    return r;
  });
}
