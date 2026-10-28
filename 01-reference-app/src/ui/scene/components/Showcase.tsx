import type { GeoSpec } from '../../../odin/types';
import type { Box } from '../../../lib/homeLayout';
import { Count, DeltaTag, Plinth, css, flag, useProxy } from './shared';
import { HeroGlassFx } from '../HeroGlass';

// ───────────────────────────── Earth geo ranking ─────────────────────────────
/** Top five in an arc around the globe (framing it, never covering it). */
const TOP_SLOTS = [
  { x: 50, y: -2 },
  { x: 27, y: 14 },
  { x: 73, y: 14 },
  { x: 21, y: 38 },
  { x: 79, y: 38 },
];
const BOTTOM_X = [16, 33, 50, 67, 84];

const FLAG_SLICES = 32;
/**
 * A flag waving in the wind: the emoji is cut into thin vertical strips; a short sine wave (about 2.5 ripples across the flag)
 * travels from the pole side outward (each strip rises, falls and catches light a moment after
 * the one before it; the pole side moves least).
 */
const WavingFlag = ({ code }: { code?: string }) => {
  const f = flag(code);
  if (!f) return null;
  return (
    <span className="wflag" aria-label={code} role="img">
      {Array.from({ length: FLAG_SLICES }, (_, k) => (
        <i key={k} style={css({ '--k': k, '--n': FLAG_SLICES })}>
          <span>{f}</span>
        </i>
      ))}
    </span>
  );
};

/** Module-level so React keeps its state (count-up) across Geo re-renders. */
const GeoCard = ({ it, rank, big }: { it: GeoSpec['items'][number]; rank: number; big?: boolean }) => (
  <div className={`geo-card hglass${big ? ' is-big' : ''}`} style={css({ '--i': rank, '--hg-i': rank % 4 })}>
    <HeroGlassFx />
    <span className="geo-card__rank">{rank}</span>
    <span className="geo-card__flag"><WavingFlag code={it.code} /></span>
    <span className="geo-card__body">
      <span className="geo-card__name">{it.name}</span>
      <b><Count v={it.value} delay={500 + rank * 70} /></b>
      <DeltaTag value={it.delta} />
    </span>
  </div>
);

/** Design: "Top countries by visas processed" — 3D Earth with floating cards. */
export function Geo({ spec, box }: { spec: GeoSpec; box: Box }) {
  const narrow = box.w / box.h < 1.2;
  const plinths = useProxy(`plinths:${spec.key}`, 'plinths');
  const pins = spec.items.map((it, i) => ({ lat: it.lat, lon: it.lon, value: it.value, accent: i < 5 ? '#ffd28a' : '#9fd0ff' }));
  const earth = useProxy(`earth:${spec.key}`, 'earth', { pins, focusLon: 55, focusLat: 22 });
  const top = spec.items.slice(0, 5);
  const rest = spec.items.slice(5, 10);
  // Top 10 Countries v2 (V40): one reading order, 1–5 down the left and 6–10 down the right, the Earth centred.
  if (spec.layout === 'sides' && !narrow) {
    return (
      <div className="geo is-sides" data-surface>
        <div className="geo__earth" ref={earth} data-aura="" />
        {[top, rest].map((col, c) => (
          <div key={c} className={`geo__col is-${c ? 'right' : 'left'}`}>
            {col.map((it, i) => <GeoCard key={it.code} it={it} rank={c * 5 + i + 1} big={c === 0 && i === 0} />)}
          </div>
        ))}
      </div>
    );
  }
  if (narrow) {
    return (
      <div className="geo is-narrow" data-surface ref={plinths}>
        <div className="geo__earth" ref={earth} data-aura="" />
        <div className="geo__list">
          {spec.items.slice(0, 8).map((it, i) => (
            <GeoCard key={it.code} it={it} rank={i + 1} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="geo" data-surface ref={plinths}>
      {/* The scene title already names the screen and its basis: no second heading here. */}
      <div className="geo__earth" ref={earth} data-aura="" />
      {top.map((it, i) => (
        <div key={it.code} className="geo__slot" style={css({ left: `${TOP_SLOTS[i].x}%`, top: `${TOP_SLOTS[i].y}%` })}>
          <GeoCard it={it} rank={i + 1} big={i === 0} />
        </div>
      ))}
      {rest.map((it, i) => (
        <div key={it.code} className="geo__base" style={css({ left: `${BOTTOM_X[i]}%` })}>
          <GeoCard it={it} rank={i + 6} />
          <Plinth accent="#4f9cff" noBloom tilt={0.1} style={css({ width: '76%' })} />
        </div>
      ))}
    </div>
  );
}
