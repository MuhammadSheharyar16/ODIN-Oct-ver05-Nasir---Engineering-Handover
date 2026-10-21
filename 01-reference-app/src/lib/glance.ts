import type { Box } from './homeLayout';

/**
 * Glance answer geometry, shared by the composer (where ODIN's globe goes)
 * and the Glance component (where the readout and facts go).
 * Wide boxes: globe centred, facts left and right. Narrow boxes: facts below.
 */
export type GlanceHome = { globe: { x: number; y: number; r: number }; ring: { x: number; y: number } };

/** Height of the card row in stacked layouts (tablet / phone). */
export const glanceRowH = (b: Box) => (b.w < 700 ? 108 : 132);

export function glanceOrb(b: Box, home?: GlanceHome) {
  const stacked = b.w < b.h * 1.25;
  // Wide: the answer sits exactly where Home's globe stands, above the floor ring on its beam.
  if (!stacked && home) return { x: home.globe.x, y: home.globe.y, r: home.globe.r, stacked, rowY: 0 };
  if (stacked && home) {
    // Tablet / phone: the cards in a row under the title; the sphere stands on the floor ring
    // below them (like Home), so its beam reaches the floor with nothing in between.
    const top = b.y - b.h / 2, rowH = glanceRowH(b);
    const floor = Math.min(home.ring.y, b.y + b.h / 2);
    // The sphere floats a little above the ring so the beam and its rays read (Home's gap).
    const room = floor - (top + rowH + b.h * 0.08);
    const r = Math.max(60, Math.min(b.w * 0.36, room / 2.3));
    const y = floor - r * 1.26;
    // The card row sits centred in the space between the title and the sphere.
    const rowY = Math.max(top + rowH / 2, (top + (y - r)) / 2);
    return { x: home.ring.x, y, r, stacked, rowY };
  }
  const r = stacked ? Math.min(b.w * 0.36, b.h * 0.27) : Math.min(b.h * 0.34, b.w * 0.16);
  return { x: b.x, y: stacked ? b.y - b.h / 2 + r + b.h * 0.06 : b.y, r, stacked, rowY: 0 };
}
