import { useEffect, useMemo, useRef } from 'react';
import type { HomeLayout } from '../../lib/homeLayout';
import { odinAudio } from '../../audio/odinAudio';
import { intro } from '../../lib/intro';
import { prefersReducedMotion } from '../../lib/motion';

/** `land`: where strands meet the globe, as a share of globe.r (Home 0.9: into the glow; scenes ≈ 1: on the outer edge). */
type Props = { layout: HomeLayout; accents: string[]; land?: number };

type Strand = {
  kind: 'link' | 'ambient';
  ax: number; ay: number; bx: number; by: number;
  nx: number; ny: number; // unit normal for bowing
  bow: number; amp: number; speed: number; phase: number;
  width: number; color: string; opacity: number;
};

/** Point on a capsule/ellipse boundary in direction (dx, dy). */
function edgePoint(cx: number, cy: number, hw: number, hh: number, dx: number, dy: number) {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const t = 1 / Math.sqrt((ux / hw) ** 2 + (uy / hh) ** 2);
  return { x: cx + ux * t, y: cy + uy * t };
}

/**
 * Energy linking each KPI object to ODIN, plus ambient streams to the edges.
 * Paths are recomputed each frame so strands breathe at idle and widen into
 * waves while ODIN speaks (driven by ODIN's own output level).
 */
export function EnergyStreams({ layout, accents, land = 0.9 }: Props) {
  const refs = useRef<(SVGPathElement | null)[]>([]);
  /** Per strand: glow, dust, comet tail, comet head (all follow the core's path). */
  const fxRefs = useRef<(SVGPathElement | null)[][]>([]);
  const reduced = useMemo(prefersReducedMotion, []);
  const { globe, capsules } = layout;
  const S = globe.r / 228;

  const strands = useMemo<Strand[]>(() => {
    const out: Strand[] = [];
    capsules.forEach((c, i) => {
      const a = edgePoint(c.x, c.y, c.w / 2, c.h / 2, globe.x - c.x, globe.y - c.y);
      const dx = globe.x - c.x;
      const dy = globe.y - c.y;
      const len = Math.hypot(dx, dy) || 1;
      const b = { x: globe.x - (dx / len) * globe.r * land, y: globe.y - (dy / len) * globe.r * land };
      const nx = -dy / len;
      const ny = dx / len;
      [
        { bow: 0.1, w: 3.6, o: 1 },
        { bow: -0.14, w: 2.2, o: 0.85 },
        { bow: 0.26, w: 1.5, o: 0.65 },
      ].forEach((s, k) => {
        out.push({
          kind: 'link',
          ax: a.x, ay: a.y, bx: b.x, by: b.y, nx, ny,
          bow: s.bow * len, amp: 5 * S, speed: 0.6 + k * 0.25, phase: i * 1.7 + k,
          width: s.w * Math.max(0.7, S), color: accents[i], opacity: s.o,
        });
      });
    });
    return out;
  }, [capsules, globe, accents, S, land]);

  useEffect(() => {
    let raf = 0;
    let t = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduced) t += dt;
      const e = odinAudio.level;
      const draw = intro.energy;
      strands.forEach((s, i) => {
        const el = refs.current[i];
        if (!el) return;
        const wave = Math.sin(t * s.speed + s.phase);
        const wave2 = Math.sin(t * s.speed * 1.7 + s.phase * 1.3);
        const speak = s.kind === 'ambient' ? e * 70 * S : e * 22 * S;
        const b1 = s.bow + (s.amp + speak) * wave;
        const b2 = s.bow * 0.6 + (s.amp + speak) * wave2;
        const c1x = s.ax + (s.bx - s.ax) * 0.33 + s.nx * b1;
        const c1y = s.ay + (s.by - s.ay) * 0.33 + s.ny * b1;
        const c2x = s.ax + (s.bx - s.ax) * 0.66 + s.nx * b2;
        const c2y = s.ay + (s.by - s.ay) * 0.66 + s.ny * b2;
        const d = `M ${s.ax.toFixed(1)} ${s.ay.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${s.bx.toFixed(1)} ${s.by.toFixed(1)}`;
        el.setAttribute('d', d);
        el.style.strokeDashoffset = String(1 - draw);
        const amb = s.kind === 'ambient' ? 0.45 + e * 0.9 : 1;
        el.style.opacity = String(s.opacity * amb);
        const fx = fxRefs.current[i];
        if (fx) {
          const k = s.kind === 'ambient' ? 0.35 + e : 0.8 + e * 0.4;
          fx.forEach((p, n) => {
            if (!p) return;
            p.setAttribute('d', d);
            // glow breathes with ODIN's voice; dust and comets fade in with the intro draw.
            p.style.opacity = String(draw * (n === 0 ? (0.16 + e * 0.35) * s.opacity : n === 1 ? 0.5 * k : k));
          });
        }
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [strands, reduced, S]);

  return (
    <svg className="energy" viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden>
      <defs>
        {/* Wide soft bloom for the volumetric glow; tight hot glow for comet heads. */}
        <filter id="energy-bloom" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={7 * Math.max(0.6, S)} />
        </filter>
        <filter id="energy-hot" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={1.6 * Math.max(0.6, S)} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {strands.map((s, i) => (
          <linearGradient key={i} id={`energy-g-${i}`} gradientUnits="userSpaceOnUse" x1={s.ax} y1={s.ay} x2={s.bx} y2={s.by}>
            <stop offset="0" stopColor={soft(s.color)} stopOpacity="0.9" />
            <stop offset="0.55" stopColor="#d8e8ff" stopOpacity="0.75" />
            <stop offset="1" stopColor={s.kind === 'ambient' ? soft(s.color) : '#ffffff'} stopOpacity={s.kind === 'ambient' ? 0 : 0.55} />
          </linearGradient>
        ))}
      </defs>
      {/* 1 · volumetric glow */}
      <g filter="url(#energy-bloom)">
        {strands.map((s, i) => (
          <path key={`g${i}`} ref={(el) => { (fxRefs.current[i] ??= [])[0] = el; }} stroke={soft(s.color)} strokeWidth={s.width * 5} />
        ))}
      </g>
      {/* 2 · fine filament core */}
      {strands.map((s, i) => (
        <path
          key={`b${i}`}
          ref={(el) => {
            refs.current[i] = el;
          }}
          stroke={`url(#energy-g-${i})`}
          strokeWidth={Math.max(0.8, s.width * 0.55)}
          pathLength={1}
          strokeDasharray="1 1"
        />
      ))}
      {/* 3 · light dust drifting along the filament */}
      {strands.map((s, i) => (
        <path
          key={`d${i}`}
          className="energy__dust"
          ref={(el) => { (fxRefs.current[i] ??= [])[1] = el; }}
          stroke="#eef5ff"
          strokeWidth={s.width * 1.1}
          pathLength={1}
          style={{ ['--delay' as string]: `${-i * 1.3}s`, ['--dur' as string]: `${9 + (i % 4) * 2.5}s` }}
        />
      ))}
      {/* 4 · comets: soft tail + white-hot head travelling to ODIN */}
      {strands.map((s, i) => (
        <path
          key={`t${i}`}
          className="energy__tail"
          ref={(el) => { (fxRefs.current[i] ??= [])[2] = el; }}
          stroke={`url(#energy-g-${i})`}
          strokeWidth={s.width * 2.2}
          pathLength={1}
          style={{ ['--delay' as string]: `${-i * 0.91}s`, ['--dur' as string]: `${4.2 + (i % 3) * 1.1}s` }}
        />
      ))}
      <g filter="url(#energy-hot)">
        {strands.map((s, i) => (
          <path
            key={`h${i}`}
            className="energy__head"
            ref={(el) => { (fxRefs.current[i] ??= [])[3] = el; }}
            stroke="#ffffff"
            strokeWidth={s.width * 1.9}
            pathLength={1}
            style={{ ['--delay' as string]: `${-i * 0.91}s`, ['--dur' as string]: `${4.2 + (i % 3) * 1.1}s` }}
          />
        ))}
      </g>
    </svg>
  );
}

/** Desaturated accent: calmer, cinematic rather than neon. */
function soft(c: string) {
  const n = parseInt(c.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = 0.38; // mix toward cool grey-white
  const m = (v: number, w: number) => Math.round(v + (w - v) * t);
  return `rgb(${m(r, 214)},${m(g, 226)},${m(b, 245)})`;
}
