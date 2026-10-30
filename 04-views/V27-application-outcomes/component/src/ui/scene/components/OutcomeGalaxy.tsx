import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { DonutSpec } from '../../../odin/types';
import { formatCount } from '../../../lib/format';
import { prefersReducedMotion } from '../../../lib/motion';
import { useOdinLayout, useOdinSpot } from '../../bridge';
import { HeroGlassFx } from '../HeroGlass';
import { Count } from './shared';
import { segmentAngles } from './donutGeometry';
import './galaxy.css';
import { requestFrame, cancelFrame } from '../../../lib/ticker';

/**
 * Application Outcomes (wide): a spiral galaxy inside a dark glass portal —
 * each arm is an outcome, sized by its share — framed by a slim neon ring,
 * with each metric on a glossy hero-glass card glowing in its outcome colour.
 * ODIN spotlights one outcome at a time. Fixed 1920×1080 frame, scaled to fit.
 */
const C = { x: 960, y: 500 };
const R = 236;
const TW = 22;
const GAP = (2.2 * Math.PI) / 180;
const SPOT_MS = 3400;

/** Card placement per outcome (frame px, top-left). */
const CARD: Record<string, { x: number; y: number }> = {
  approved: { x: 1290, y: 462 },
  processing: { x: 392, y: 500 },
  rejected: { x: 512, y: 236 },
  closed: { x: 1150, y: 196 },
};
const SUB: Record<string, string> = {
  approved: 'final decision · approved',
  processing: 'awaiting a final decision',
  rejected: 'final decision · rejected',
  closed: 'closed for other reasons',
};

const pt = (a: number, r: number) => ({ x: C.x + Math.cos(a) * r, y: C.y + Math.sin(a) * r });
const arc = (a: number, b: number, r: number) => {
  const p = pt(a, r), q = pt(b, r);
  return `M${p.x} ${p.y} A${r} ${r} 0 ${b - a > Math.PI ? 1 : 0} 1 ${q.x} ${q.y}`;
};

export function OutcomeGalaxy({ spec }: { spec: DonutSpec }) {
  const { width, height } = useOdinLayout();
  const k = Math.min(width / 1920, height / 1080);
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const canvas = useRef<HTMLCanvasElement>(null);
  // Composer spotlight: the asked outcome stays lit; otherwise ODIN cycles through them.
  const askedKey = useOdinSpot();
  const asked = spec.segments.findIndex((s) => s.key === askedKey);
  const [spot, setSpot] = useState(Math.max(0, asked));
  const spotRef = useRef(0);
  const total = spec.segments.reduce((a, s) => a + s.count, 0) || 1;
  const angles = useMemo(() => segmentAngles(spec), [spec]);

  // Spotlight one outcome at a time (static with reduced motion).
  useEffect(() => {
    if (reduced || asked >= 0) return;
    const id = window.setInterval(() => setSpot((i) => (i + 1) % spec.segments.length), SPOT_MS);
    return () => window.clearInterval(id);
  }, [reduced, asked, spec.segments.length]);
  useEffect(() => { spotRef.current = spot; }, [spot]);

  // Galaxy: four arms sized by share + inter-arm dust, drawn on a 2D canvas around the centre.
  useEffect(() => {
    const cv = canvas.current;
    const g = cv?.getContext('2d');
    if (!cv || !g) return;
    const W = 560, H = 560, ox = W / 2, oy = H / 2;
    const sprite = (rgb: string, r = 16, core = 0.12) => {
      const o = document.createElement('canvas'); o.width = o.height = r * 2;
      const x = o.getContext('2d')!; const gr = x.createRadialGradient(r, r, 0, r, r, r);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(core, `rgb(${rgb})`); gr.addColorStop(0.45, `rgba(${rgb},.25)`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gr; x.fillRect(0, 0, r * 2, r * 2); return o;
    };
    const haze = (rgb: string, r = 128) => {
      const o = document.createElement('canvas'); o.width = o.height = r * 2;
      const x = o.getContext('2d')!; const gr = x.createRadialGradient(r, r, 0, r, r, r);
      gr.addColorStop(0, `rgba(${rgb},.55)`); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, r * 2, r * 2); return o;
    };
    const rgb = (h: string) => { const n = parseInt(h.slice(1), 16); return `${n >> 16},${(n >> 8) & 255},${n & 255}`; };
    const sprites = spec.segments.map((s) => sprite(rgb(s.accent)));
    const dustSpr = sprite('200,220,255'), coreSpr = sprite('190,215,255', 64, 0.05), coreHaze = haze('150,190,255');
    const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
    const shares = spec.segments.map((s) => s.count / total);
    const pick = () => { let u = Math.random(); for (let i = 0; i < shares.length; i++) { if ((u -= shares[i]) <= 0) return i; } return 0; };
    const n = reduced ? 6000 : 11000;
    const P = Array.from({ length: n }, () => {
      const dust = Math.random() < 0.14; const arm = pick(); const d = Math.pow(Math.random(), 0.8);
      return { arm, dust, d, off: gauss() * (dust ? 2.4 : 0.62) * (1 - d * 0.3), sz: Math.random() };
    });
    let raf = 0;
    const draw = (now: number) => {
      const rot = reduced ? 0.4 : now / 9000;
      const focus = spotRef.current;
      g.clearRect(0, 0, W, H);
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.6; g.drawImage(coreHaze, ox - 230, oy - 150, 460, 300);
      for (const p of P) {
        const armA = (p.arm / spec.segments.length) * Math.PI * 2;
        const r = 14 + p.d * 182;
        // Anticlockwise spin on screen (y is down, so the angle decreases); the arms wind outwards clockwise, so they trail the spin like a real galaxy.
        const ang = armA + p.d * 3.6 + p.off - rot * 2.2;
        const x = ox + Math.cos(ang) * r, y = oy + Math.sin(ang) * r * 0.6;
        const S = (1.6 + p.sz * 2.8) * (1.15 - p.d * 0.45);
        g.globalAlpha = p.dust ? 0.28 : (p.arm === focus ? 1 : 0.62) * (1 - p.d * 0.45);
        g.drawImage(p.dust ? dustSpr : sprites[p.arm], x - S, y - S, S * 2, S * 2);
      }
      g.globalAlpha = 0.95; g.drawImage(coreSpr, ox - 90, oy - 60, 180, 120);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      if (!reduced) raf = requestFrame(draw);
    };
    raf = requestFrame(draw);
    return () => cancelFrame(raf);
  }, [spec, total, reduced]);

  const pctOf = (c: number) => (c / total) * 100;
  return (
    <div className="ogx" style={{ '--k': k } as CSSProperties}>
      <div className="ogx__frame">
        {/* Dark glass portal: the night inside the ring where the light lives. ODIN's spectrum wraps it. */}
        <div className="ogx__portal" style={{ left: C.x, top: C.y }} data-aura="" data-surface />
        <canvas ref={canvas} className="ogx__galaxy" width={560} height={560} style={{ left: C.x - 280, top: C.y - 280 }} aria-hidden />

        <svg className="ogx__ring" viewBox="0 0 1920 1080" aria-hidden>
          <circle cx={C.x} cy={C.y} r={R} className="ogx__bed" />
          <circle cx={C.x} cy={C.y} r={R} className="ogx__track" />
          <circle cx={C.x} cy={C.y} r={R + TW / 2 + 5} className="ogx__edge" />
          <circle cx={C.x} cy={C.y} r={R - TW / 2 - 5} className="ogx__edge is-in" />
          {spec.segments.map((s, i) => {
            const a = angles[i];
            if (a.share <= 0) return null;
            const d = arc(a.start + GAP / 2, a.end - GAP / 2, R);
            return (
              <g key={s.key} className={`ogx__seg${i === spot ? ' is-on' : ''}`} style={{ '--c': s.accent } as CSSProperties}>
                <path d={d} className="ogx__seg-glow" />
                <path d={d} className="ogx__seg-core" />
                <path d={arc(a.start + GAP / 2, a.end - GAP / 2, R - TW / 2 + 3)} className="ogx__seg-hot" />
              </g>
            );
          })}
          {Array.from({ length: 40 }, (_, i) => {
            const a = -Math.PI / 2 + (i / 40) * Math.PI * 2;
            const p = pt(a, R + TW / 2 + 12), q = pt(a, R + TW / 2 + (i % 4 ? 16 : 22));
            return <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} className={i % 4 ? 'ogx__tick' : 'ogx__tick is-major'} />;
          })}
        </svg>

        <div className="ogx__lens" style={{ left: C.x, top: C.y }}>
          <b><Count v={spec.total} fmt={formatCount} /></b>
          <span>{spec.totalLabel}</span>
          <em>arms sized by share</em>
        </div>

        {spec.segments.map((s, i) => {
          const pos = CARD[s.key];
          if (!pos) return null;
          const p = pctOf(s.count);
          return (
            <div
              key={s.key}
              className={`ogx__card hglass${i === spot ? ' is-on' : ''}`}
              data-spot-key={s.key}
              style={{ left: pos.x, top: pos.y, '--accent': s.accent, '--hg-i': i } as CSSProperties}
              aria-label={`${s.label}: ${p.toFixed(1)} percent, ${formatCount(s.count)} applications`}
            >
              <HeroGlassFx />
              <div className="ogx__label"><i aria-hidden />{s.label}</div>
              <div className="ogx__big">
                <b><Count v={p} fmt={(v) => `${v.toFixed(1)}%`} /></b>
                <span><Count v={s.count} fmt={formatCount} /></span>
              </div>
              <div className="ogx__sub">{SUB[s.key] ?? ''}</div>
            </div>
          );
        })}

        {spec.closure && (
          <div className="ogx__closure" style={{ left: C.x, top: C.y + R + 52 }}>
            <svg viewBox="0 0 36 36" aria-hidden>
              <circle cx="18" cy="18" r="14" className="ogx__cl-track" />
              <circle cx="18" cy="18" r="14" className="ogx__cl-fill" strokeDasharray={`${(spec.closure.value / 100) * 88} 88`} transform="rotate(-90 18 18)" />
            </svg>
            <span><b>{spec.closure.value.toFixed(1)}%</b> closure rate · {spec.closure.basis}</span>
          </div>
        )}
      </div>
    </div>
  );
}
