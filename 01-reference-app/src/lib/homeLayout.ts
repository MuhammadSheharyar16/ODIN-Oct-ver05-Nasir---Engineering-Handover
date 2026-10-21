import { FLOOR_RING, envToScreen } from './envFit';

/**
 * Adaptive layout engine. The environment always fills the screen exactly as
 * on desktop; the UI is re-composed per device class rather than shrunk.
 * Each mode designs on its own reference canvas and is scaled by `u`
 * (CSS px per reference unit). All outputs are screen CSS px, centre-based.
 */

export type LayoutMode = 'wide' | 'portrait' | 'compact' | 'short';
export type Box = { x: number; y: number; w: number; h: number };
export type CapsuleSlot = Box & { orientation: 'vertical' | 'horizontal' };

export type HomeLayout = {
  mode: LayoutMode;
  width: number;
  height: number;
  /** CSS px per reference unit for this mode. */
  u: number;
  globe: { x: number; y: number; r: number };
  ring: { x: number; y: number; halfWidth: number };
  capsules: [CapsuleSlot, CapsuleSlot, CapsuleSlot, CapsuleSlot];
  strip: Box & { compact: boolean };
  mic: Box;
  chrome: { inset: number; compact: boolean };
};

type Ref = { w: number; h: number };
const REFS: Record<LayoutMode, Ref> = {
  wide: { w: 1920, h: 1080 },
  portrait: { w: 1080, h: 1620 },
  compact: { w: 430, h: 932 },
  short: { w: 932, h: 430 },
};

export function pickMode(width: number, height: number): LayoutMode {
  const aspect = width / height;
  if (aspect >= 1.25) return height < 520 ? 'short' : 'wide';
  return width < 600 ? 'compact' : 'portrait';
}

/** Reference-canvas mapper for a viewport (shared by Home and scene layouts). */
export function frameMapper(width: number, height: number) {
  const mode = pickMode(width, height);
  const ref = REFS[mode];
  const u = Math.min(width / ref.w, height / ref.h);
  const stretchX = mode === 'wide' || mode === 'short' ? Math.min(width / ref.w, u * 1.22) : u;
  const stretchY = mode === 'portrait' || mode === 'compact' ? Math.min(height / ref.h, u * 1.3) : u;
  const map = (fx: number, fy: number) => ({ x: width / 2 + (fx - ref.w / 2) * stretchX, y: height / 2 + (fy - ref.h / 2) * stretchY });
  const box = (fx: number, fy: number, fw: number, fh: number): Box => ({ ...map(fx, fy), w: fw * u, h: fh * u });
  return { mode, ref, u, map, box };
}

export function computeHomeLayout(width: number, height: number): HomeLayout {
  const mode = pickMode(width, height);
  const ref = REFS[mode];
  const u = Math.min(width / ref.w, height / ref.h);
  // Sizes scale by u; spacing may stretch a little further along the long axis,
  // so tall phones and ultrawide screens use their space instead of letterboxing.
  const stretchX = mode === 'wide' || mode === 'short' ? Math.min(width / ref.w, u * 1.22) : u;
  const stretchY = mode === 'portrait' || mode === 'compact' ? Math.min(height / ref.h, u * 1.3) : u;
  const map = (fx: number, fy: number) => ({
    x: width / 2 + (fx - ref.w / 2) * stretchX,
    y: height / 2 + (fy - ref.h / 2) * stretchY,
  });
  const box = (fx: number, fy: number, fw: number, fh: number): Box => ({ ...map(fx, fy), w: fw * u, h: fh * u });
  const cap = (fx: number, fy: number, fw: number, fh: number, orientation: CapsuleSlot['orientation']): CapsuleSlot => ({
    ...box(fx, fy, fw, fh),
    orientation,
  });

  const ringPt = envToScreen(FLOOR_RING.u, FLOOR_RING.v, width, height);
  const ring = { x: ringPt.x, y: ringPt.y, halfWidth: FLOOR_RING.halfWidth * ringPt.scale };

  let globe: HomeLayout['globe'];
  let capsules: HomeLayout['capsules'];
  let strip: HomeLayout['strip'];
  let mic: Box;
  let chrome: HomeLayout['chrome'];

  switch (mode) {
    case 'wide': {
      // Matches the approved 2.1 composition on a 16:9 canvas.
      const boost = u < 0.72 ? 1.1 : 1; // keep text legible on small laptops/tablets
      const g = map(960, 486);
      globe = { ...g, r: 228 * u };
      capsules = [
        cap(474, 314, 200 * boost, 320 * boost, 'vertical'),
        cap(346, 594, 200 * boost, 320 * boost, 'vertical'),
        cap(1446, 314, 200 * boost, 320 * boost, 'vertical'),
        cap(1574, 594, 200 * boost, 320 * boost, 'vertical'),
      ];
      strip = { ...box(960, 911, 1180, 96), compact: false };
      mic = box(960, 1011, 880, 64);
      chrome = { inset: 60 * u, compact: false };
      break;
    }
    case 'portrait': {
      const g = map(540, 600);
      globe = { ...g, r: 222 * u };
      capsules = [
        cap(176, 446, 196, 310, 'vertical'),
        cap(146, 800, 196, 310, 'vertical'),
        cap(904, 446, 196, 310, 'vertical'),
        cap(934, 800, 196, 310, 'vertical'),
      ];
      strip = { ...box(540, 1352, 980, 124), compact: false };
      mic = box(540, 1490, 860, 76);
      chrome = { inset: 56 * u, compact: false };
      break;
    }
    case 'compact': {
      const g = map(215, 318);
      globe = { ...g, r: 116 * u };
      capsules = [
        cap(117, 516, 192, 100, 'horizontal'),
        cap(117, 628, 192, 100, 'horizontal'),
        cap(313, 516, 192, 100, 'horizontal'),
        cap(313, 628, 192, 100, 'horizontal'),
      ];
      strip = { ...box(215, 748, 396, 88), compact: true };
      mic = box(215, 840, 396, 60);
      chrome = { inset: 22 * u, compact: true };
      break;
    }
    case 'short': {
      const g = map(466, 196);
      globe = { ...g, r: 110 * u };
      capsules = [
        cap(150, 142, 200, 86, 'horizontal'),
        cap(150, 244, 200, 86, 'horizontal'),
        cap(782, 142, 200, 86, 'horizontal'),
        cap(782, 244, 200, 86, 'horizontal'),
      ];
      strip = { ...box(466, 344, 640, 50), compact: true };
      mic = box(466, 398, 520, 42);
      chrome = { inset: 18 * u, compact: true };
      break;
    }
  }

  // Never let the globe sink into the floor ring (it stands above it on its beam).
  const maxCentre = ring.y - globe.r * 1.08;
  if (globe.y > maxCentre) globe.y = maxCentre;

  return { mode, width, height, u, globe, ring, capsules, strip, mic, chrome };
}
