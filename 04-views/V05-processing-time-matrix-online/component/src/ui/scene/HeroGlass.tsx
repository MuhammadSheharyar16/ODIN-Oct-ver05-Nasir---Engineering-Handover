import { useId, type CSSProperties } from 'react';
import './hero-glass.css';

/**
 * Card option C · hero glass (approved 16 Oct 2026): the Home capsule's glossy
 * glass in a card shape, carrying the chart. Used only for a page's headline
 * cards; support cards stay tiles (B). `?cards=b` shows the previous tiles.
 */
export const HERO_GLASS = typeof location === 'undefined' || new URLSearchParams(location.search).get('cards') !== 'b';

/** Glass layers drawn under the card content: halo, neon rim + travelling glint, hot hairline, sheen. */
export function HeroGlassFx() {
  return (
    <span className="hg__fx" aria-hidden>
      <i className="hg__halo" />
      <i className="hg__rim" />
      <i className="hg__core" />
      <i className="hg__sheen" />
    </span>
  );
}

/** Chart for a hero card: luminous area line with a live end point, or glass bars with today lit. */
export function HeroChart({ kind, values, className = '' }: { kind: 'bars' | 'line'; values: number[]; className?: string }) {
  const id = useId().replace(/:/g, '');
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (kind === 'bars') {
    return (
      <div className={`hchart hchart--bars ${className}`} aria-hidden>
        {values.map((v, i) => (
          <span key={i} className={i === values.length - 1 ? 'is-now' : ''} style={{ height: `${16 + (v / max) * 84}%`, '--i': i } as CSSProperties} />
        ))}
      </div>
    );
  }
  const y = (v: number) => 84 - ((v - min) / Math.max(0.001, max - min)) * 68;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * 100, y(v)] as const);
  const line = pts.map(([px, py]) => `${px},${py}`).join(' ');
  const [ex, ey] = pts[pts.length - 1];
  return (
    <div className={`hchart hchart--line ${className}`} aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--hg)', stopOpacity: 0.5 }} />
            <stop offset="1" style={{ stopColor: 'var(--hg)', stopOpacity: 0 }} />
          </linearGradient>
          <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" style={{ stopColor: 'var(--hg)', stopOpacity: 0.35 }} />
            <stop offset="0.7" style={{ stopColor: 'var(--hg)' }} />
            <stop offset="1" style={{ stopColor: '#fff' }} />
          </linearGradient>
        </defs>
        {[30, 57, 84].map((g) => <line key={g} className="hchart__grid" x1="0" x2="100" y1={g} y2={g} />)}
        <polygon className="hchart__area" points={`0,100 ${line} 100,100`} fill={`url(#${id}f)`} />
        <polyline className="hchart__glow" points={line} />
        <polyline className="hchart__line" points={line} stroke={`url(#${id}s)`} pathLength={1} />
      </svg>
      <i className="hchart__dot" style={{ left: `${ex}%`, top: `${ey}%` }} />
    </div>
  );
}
