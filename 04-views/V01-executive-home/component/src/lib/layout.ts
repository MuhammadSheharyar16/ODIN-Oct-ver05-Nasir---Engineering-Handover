import { CAMERA_FOV } from './envFit';

/** Depth of the ODIN presence plane, in front of the interior layer. */
export const PRESENCE_DEPTH = 8;

const tanHalf = Math.tan((CAMERA_FOV / 2) * (Math.PI / 180));
export const visibleHeightAt = (depth: number) => 2 * depth * tanHalf;

export type Viewport = { width: number; height: number };

/** Screen point (CSS px) → world position on the plane at `depth`, camera at rest. */
export function screenToWorld(sx: number, sy: number, depth: number, vp: Viewport): [number, number, number] {
  const upp = visibleHeightAt(depth) / vp.height;
  return [(sx - vp.width / 2) * upp, -(sy - vp.height / 2) * upp, -depth];
}

/** Screen length (CSS px) → world length at `depth`. */
export function screenLengthToWorld(len: number, depth: number, vp: Viewport) {
  return len * (visibleHeightAt(depth) / vp.height);
}

/** Live camera offset written by the camera rig, read by DOM parallax. */
export const cameraOffset = { x: 0, y: 0 };
/**
 * Environment-only parallax (world units, camera-equivalent): the room layers
 * shift by this; the camera and every UI element (DOM and 3D) stay fixed.
 */
export const envParallax = { x: 0, y: 0 };
