/**
 * Home sphere style: which look ODIN's presence sphere uses.
 *
 *   'classic' — the approved network sphere with travelling particle bands (default).
 *   'grid'    — v5.1 option: no particle bands (they read as brush strokes), only the
 *               thin grid with slow light pulses, a clean bright rim, soft inner sparkle
 *               and a slow iridescent sheen (Nasir's "home sphere references").
 *
 * Engineering can call setSphereStyle('grid') from code.
 * Keyboard (review): O toggles between the two. URL (review): ?sphere=grid.
 * The change eases over about a second in OdinGlobe.
 */
export type SphereStyle = 'classic' | 'grid';

const fromUrl = (): SphereStyle => {
  if (typeof location === 'undefined') return 'classic';
  return new URLSearchParams(location.search).get('sphere') === 'grid' ? 'grid' : 'classic';
};

export const sphere = { style: fromUrl() as SphereStyle };

export function setSphereStyle(style: SphereStyle) {
  sphere.style = style;
}

/** Keyboard: O switches between classic and grid. */
export function toggleSphereStyle() {
  sphere.style = sphere.style === 'grid' ? 'classic' : 'grid';
}
