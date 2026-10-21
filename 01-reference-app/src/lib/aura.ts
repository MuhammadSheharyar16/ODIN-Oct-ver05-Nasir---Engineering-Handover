/**
 * The shape ODIN's speaking spectrum wraps. Screen CSS px, centre-based.
 *
 * mode 0 — wrap: rounded box around one object (`radius` = corner radius;
 *          half-size for a circle, half-width for a vertical capsule).
 * mode 1 — floor: a perspective ellipse on the floor (hw × hh radii) that
 *          encircles a whole set of objects (a journey, a row of jars), with
 *          a voice curtain rising `rise` px behind it. Used when ODIN speaks
 *          about the whole composition rather than a single box.
 *
 * Scenes set the target; the aura eases toward it, so the spectrum morphs.
 * `snap` places it there at once (a new screen: ODIN appears in place, it never
 * travels in from the previous screen). While the aura is hidden it always snaps.
 */
export type AuraShape = { x: number; y: number; hw: number; hh: number; radius: number; mode?: 0 | 1; rise?: number };

export const auraTarget: Required<AuraShape> = { x: 0, y: 0, hw: 1, hh: 1, radius: 1, mode: 0, rise: 0 };

export const auraSnap = { pending: false };

export function setAuraTarget(shape: AuraShape, snap = false) {
  Object.assign(auraTarget, { mode: 0, rise: 0 }, shape);
  if (snap) auraSnap.pending = true;
}
