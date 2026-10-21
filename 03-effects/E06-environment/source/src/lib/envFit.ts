/**
 * How the environment master is fitted to the screen (cover, centred,
 * small overscan for parallax). Shared by the WebGL layers and the layout
 * engine so UI can anchor to features in the artwork, e.g. the floor ring.
 */
export const CAMERA_FOV = 30;
export const IMAGE_ASPECT = 7600 / 4652;
export const OVERSCAN = 1.07;

/** Floor-ring centre in the interior artwork (normalised, origin top-left). */
export const FLOOR_RING = { u: 0.5, v: 0.7, halfWidth: 0.19 };

export function envCover(width: number, height: number) {
  const aspect = width / height;
  let w: number;
  let h: number;
  if (aspect > IMAGE_ASPECT) {
    w = width * OVERSCAN;
    h = w / IMAGE_ASPECT;
  } else {
    h = height * OVERSCAN;
    w = h * IMAGE_ASPECT;
  }
  return { w, h, left: (width - w) / 2, top: (height - h) / 2 };
}

/** Artwork point (normalised) → screen CSS px, at rest. */
export function envToScreen(u: number, v: number, width: number, height: number) {
  const c = envCover(width, height);
  return { x: c.left + u * c.w, y: c.top + v * c.h, scale: c.w };
}

/**
 * Environment view (camera push). `target` is set by the director per scene;
 * the WebGL layers ease `cur` toward it. zoom scales the artwork, cy is the
 * artwork row (0 top → 1 bottom) placed at the screen centre. Rest = {1, .5}.
 */
export type EnvView = { zoom: number; cy: number; cx: number };
export const REST_VIEW: EnvView = { zoom: 1, cy: 0.5, cx: 0.5 };
export const envView = { target: { ...REST_VIEW }, cur: { ...REST_VIEW } };

/**
 * Gentle tilt down: more marble floor in view, so glass cards can stand on it (wide screens).
 * The tilt is limited so the artwork's bottom edge (plus parallax room) never enters the screen.
 */
export function lowView(width: number, height: number): EnvView {
  const c = envCover(width, height);
  const zoom = 1.12;
  const maxCy = 1 - (height / 2 + height * 0.02) / (c.h * zoom);
  return { zoom, cy: Math.min(0.615, maxCy), cx: 0.5 };
}

/** Push down onto the interior floor: the bottom ~61% of the artwork fills the screen. */
export const FLOOR_CY = 0.696;
/**
 * `shiftPx`: screen px the camera pans right so the journey footprint sits centred
 * (its reference-frame centre is right of the screen centre).
 */
export function floorView(width: number, height: number, shiftPx = 0): EnvView {
  const c = envCover(width, height);
  const zoom = Math.max(height / ((1 - FLOOR_CY) * 2 * c.h), width / c.w);
  return { zoom, cy: FLOOR_CY, cx: 0.5 + shiftPx / (c.w * zoom) };
}
