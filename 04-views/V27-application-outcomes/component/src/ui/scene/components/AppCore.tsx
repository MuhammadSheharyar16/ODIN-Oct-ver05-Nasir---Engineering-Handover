import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { CircleCheck, CircleDashed, Clock } from 'lucide-react';
import type { AppCoreSpec } from '../../../odin/types';
import type { Box, HomeLayout } from '../../../lib/homeLayout';
import { EnergyStreams } from '../../home/EnergyStreams';
import { formatCount } from '../../../lib/format';
import { prefersReducedMotion } from '../../../lib/motion';
import { useOdinLayout } from '../../bridge';
import { Count } from './shared';
import './appcore.css';
import { requestFrame, cancelFrame } from '../../../lib/ticker';

/**
 * Applications v2: the application core — a deep-blue glass orb filled with
 * points of light (one per application, coloured by status; in-processing
 * lights swirl faster) inside a segmented status ring — with the approval and
 * closure rates as gauge cards and the status breakdown that sums to the total.
 * Wide: fixed 1920×1080 frame scaled to fit. Other devices: stacked layout.
 */
const CORE = { x: 960, y: 440, r: 214 };
const RING = { r: 244, size: 560 };
const GAP = 0.035;

const rgb = (h: string) => { const n = parseInt(h.slice(1), 16); return `${n >> 16},${(n >> 8) & 255},${n & 255}`; };

/** Status-coloured application lights on and inside a rotating sphere (2D canvas). */
/** `gain` brightens and slightly enlarges the lights (e.g. over ODIN's bright globe). */
export function Lights({ segments, size, gain = 1, fill = 1 }: { segments: AppCoreSpec['segments']; size: number; gain?: number; /** Share of the box the sphere of lights spans (1 = default 88%). */ fill?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useMemo(() => prefersReducedMotion(), []);
  useEffect(() => {
    const cv = ref.current;
    const g = cv?.getContext('2d');
    if (!cv || !g) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = size * dpr; cv.height = size * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sprites = segments.map((s) => {
      const o = document.createElement('canvas'); o.width = o.height = 24;
      const x = o.getContext('2d')!; const gr = x.createRadialGradient(12, 12, 0, 12, 12, 12);
      const c = rgb(s.accent);
      gr.addColorStop(0, '#fff'); gr.addColorStop(0.16, `rgb(${c})`); gr.addColorStop(0.5, `rgba(${c},.22)`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gr; x.fillRect(0, 0, 24, 24); return o;
    });
    const total = segments.reduce((a, s) => a + s.count, 0) || 1;
    const pick = () => { let u = Math.random() * total; for (let i = 0; i < segments.length; i++) { if ((u -= segments[i].count) <= 0) return i; } return 0; };
    // Smaller orbs keep the same density of light (and dots never shrink below a readable glow).
    const n = size > 300 ? 2600 : size > 180 ? 1900 : 1200;
    const P = Array.from({ length: n }, () => {
      const i = pick(), shell = Math.random() < 0.6, u = Math.random() * 2 - 1, th = Math.random() * 6.28;
      const r = shell ? 0.9 + Math.random() * 0.08 : Math.cbrt(Math.random()) * 0.85;
      return { i, x: Math.sqrt(1 - u * u) * Math.cos(th) * r, y: u * r, z: Math.sqrt(1 - u * u) * Math.sin(th) * r, sz: Math.random(), sp: segments[i].key === 'processing' ? 2.4 : 1 };
    });
    const c = size / 2, RR = size * 0.44 * fill;
    let raf = 0;
    const draw = (now: number) => {
      g.clearRect(0, 0, size, size); g.globalCompositeOperation = 'lighter';
      const ct = Math.cos(0.3), st = Math.sin(0.3);
      for (const p of P) {
        const a = reduced ? 0.6 : (now / 16000) * p.sp, ca = Math.cos(a), sa = Math.sin(a);
        const x1 = p.x * ca + p.z * sa, z1 = -p.x * sa + p.z * ca, y2 = p.y * ct - z1 * st, z2 = p.y * st + z1 * ct;
        const depth = (z2 + 1) / 2, S = (1.1 + p.sz * 2.4) * (0.55 + depth * 0.75) * Math.max(1, size / 444) * (1 + (gain - 1) * 0.5);
        g.globalAlpha = Math.min(1, (0.22 + depth * 0.78) * gain); g.drawImage(sprites[p.i], c + x1 * RR - S, c + y2 * RR - S, S * 2, S * 2);
      }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      if (!reduced) raf = requestFrame(draw);
    };
    raf = requestFrame(draw);
    return () => cancelFrame(raf);
  }, [segments, size, reduced, gain, fill]);
  return <canvas ref={ref} className="apc-core__lights" style={{ width: size, height: size }} aria-hidden />;
}

/** Slim segmented status ring with glow and a fine tick scale. */
export function StatusRing({ segments }: { segments: AppCoreSpec['segments'] }) {
  const c = RING.size / 2, R = RING.r;
  const total = segments.reduce((a, s) => a + s.count, 0) || 1;
  let a0 = -Math.PI / 2;
  const arcs = segments.map((s) => {
    const a1 = a0 + (s.count / total) * Math.PI * 2;
    const p = (a: number) => [c + Math.cos(a) * R, c + Math.sin(a) * R];
    const [x0, y0] = p(a0 + GAP / 2), [x1, y1] = p(a1 - GAP / 2);
    const d = a1 - a0 > GAP ? `M${x0} ${y0} A${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1} ${y1}` : '';
    a0 = a1;
    return { key: s.key, accent: s.accent, d };
  });
  return (
    <svg className="apc-core__ring" viewBox={`0 0 ${RING.size} ${RING.size}`} aria-hidden>
      <circle cx={c} cy={c} r={R} className="apc-ring__bed" />
      <circle cx={c} cy={c} r={R} className="apc-ring__track" />
      {arcs.map((a) => a.d && (
        <g key={a.key} style={{ '--c': a.accent } as CSSProperties}>
          <path d={a.d} className="apc-ring__glow" />
          <path d={a.d} className="apc-ring__arc" />
          <path d={a.d} className="apc-ring__hot" />
        </g>
      ))}
      {Array.from({ length: 60 }, (_, i) => {
        const a = -Math.PI / 2 + (i / 60) * Math.PI * 2, r1 = R + 16, r2 = R + (i % 5 ? 20 : 26);
        return <line key={i} x1={c + Math.cos(a) * r1} y1={c + Math.sin(a) * r1} x2={c + Math.cos(a) * r2} y2={c + Math.sin(a) * r2} className={i % 5 ? 'apc-ring__tick' : 'apc-ring__tick is-major'} />;
      })}
    </svg>
  );
}

function Readout({ spec }: { spec: AppCoreSpec }) {
  return (
    <div className="apc-readout" data-spot-key="total">
      <div className="apc-readout__k">Applications</div>
      <b className="apc-readout__v"><Count v={spec.total} fmt={formatCount} delay={600} /></b>
      <div className="apc-readout__c">{spec.caption}</div>
      <div className="apc-readout__hint">each light is an application · ring shows current status</div>
    </div>
  );
}

function RateCard({ spot, accent, icon, label, rate, value, of, sub, style }: { spot: string; accent: string; icon: ReactNode; label: string; rate: number; value: number; of: number; sub: string; style?: CSSProperties }) {
  const C = 2 * Math.PI * 50;
  return (
    <section className="apc-card apc-rate" data-spot-key={spot} style={{ ...style, '--c': accent, '--spot': accent } as CSSProperties} aria-label={`${label}: ${rate.toFixed(1)} percent, ${formatCount(value)} of ${formatCount(of)}`}>
      <div className="apc-rate__body">
        <div className="apc-rate__lbl"><span className="apc-badge" aria-hidden>{icon}</span>{label}</div>
        <b className="apc-rate__v"><Count v={rate} fmt={(v) => `${v.toFixed(1)}%`} /></b>
        <div className="apc-rate__sub">{sub}</div>
      </div>
      <svg className="apc-gauge" viewBox="0 0 128 128" aria-hidden>
        <circle cx="64" cy="64" r="50" className="apc-gauge__track" />
        <circle cx="64" cy="64" r="50" className="apc-gauge__fill" strokeDasharray={`${(rate / 100) * C} ${C}`} />
        <text x="64" y="62" textAnchor="middle" className="apc-gauge__v">{formatCount(value)}</text>
        <text x="64" y="80" textAnchor="middle" className="apc-gauge__s">of {formatCount(of)}</text>
      </svg>
    </section>
  );
}

function StatusCard({ spec, style, compact }: { spec: AppCoreSpec; style?: CSSProperties; compact?: boolean }) {
  const total = spec.segments.reduce((a, s) => a + s.count, 0) || 1;
  return (
    <section className={`apc-card apc-status${compact ? ' is-compact' : ''}`} style={{ ...style, '--c': '#4f9cff' } as CSSProperties} aria-label="Current status">
      <header className="apc-status__hd">
        <span className="apc-badge" aria-hidden><Clock /></span>
        <div><h3>Current status</h3>{!compact && <div className="apc-status__s">each application counted once</div>}</div>
      </header>
      <div className="apc-status__rows">
        {spec.segments.map((s, i) => (
          <div key={s.key} className="apc-row" data-spot-key={s.key} style={{ '--r': s.accent, '--spot': s.accent, '--i': i } as CSSProperties}>
            <div className="apc-row__top">
              <span className="apc-row__dot" aria-hidden />
              <span className="apc-row__nm">{s.label}</span>
              <span className="apc-row__v"><Count v={s.count} fmt={formatCount} delay={700 + i * 80} /></span>
              <span className="apc-row__p">{((s.count / total) * 100).toFixed(1)}%</span>
            </div>
            {!compact && <div className="apc-row__bar" aria-hidden><i style={{ width: `${(s.count / total) * 100}%` }} /></div>}
          </div>
        ))}
      </div>
      <footer className="apc-status__foot"><span>Sums to total</span><b>{formatCount(spec.total)}</b></footer>
    </section>
  );
}

export function AppCore({ spec, box }: { spec: AppCoreSpec; box: Box }) {
  const home = useOdinLayout();
  const { width, height, mode } = home;
  const approval = <RateCard spot="approval" accent="#3ed6a0" icon={<CircleCheck />} label="Approval rate" rate={spec.approval.rate} value={spec.approval.approved} of={spec.approval.decided} sub="of decided applications" />;
  const closure = <RateCard spot="closure" accent="#a67cff" icon={<CircleDashed />} label="Closure rate" rate={spec.closure.rate} value={spec.closure.closed} of={spec.total} sub="closed ÷ all applications" />;

  if (mode !== 'wide') {
    const orb = Math.round(Math.min(box.w * 0.58, box.h * 0.33));
    return (
      <div className="apc-stack" data-surface>
        <div className="apc-stack__core" style={{ width: orb, height: orb }} data-aura="" data-surface>
          <div className="apc-core__orb" />
          <Lights segments={spec.segments} size={orb} />
          <Readout spec={spec} />
        </div>
        <div className="apc-stack__rates">{approval}{closure}</div>
        <StatusCard spec={spec} compact />
      </div>
    );
  }
  const k = Math.min(width / 1920, height / 1080);
  return (
    <div className="apc" style={{ '--k': k } as CSSProperties}>
      <div className="apc__frame">
        {/* Same energy links as Home: braided strands, drifting dust and eased comets into the core. */}
        <div className="apc__energy">
          <EnergyStreams
            layout={{ ...home, width: 1920, height: 1080, globe: { x: CORE.x, y: CORE.y, r: RING.r + 6 }, capsules: [
              { x: 112 + 210, y: 296 + 94, w: 420, h: 188, orientation: 'horizontal' },
              { x: 112 + 210, y: 508 + 94, w: 420, h: 188, orientation: 'horizontal' },
              { x: 1388 + 210, y: 282 + 202, w: 420, h: 404, orientation: 'horizontal' },
            ] as unknown as HomeLayout['capsules'] }}
            accents={['#3ed6a0', '#a67cff', '#4f9cff']}
            land={1.02}
          />
        </div>
        <div className="apc-core" style={{ left: CORE.x, top: CORE.y, '--r': `${CORE.r}px`, '--ring': `${RING.size}px` } as CSSProperties}>
          {/* ODIN's speaking spectrum hugs the orb. */}
          <div className="apc-core__orb" data-aura="" data-surface data-beam={spec.segments.map((x) => x.accent).join(',')} />
          <div className="apc-core__lightsbox"><Lights segments={spec.segments} size={CORE.r * 2} /></div>
          <StatusRing segments={spec.segments} />
          <div className="apc-core__readout"><Readout spec={spec} /></div>
        </div>
        <div className="apc__rate" style={{ left: 112, top: 296 }}>{approval}</div>
        <div className="apc__rate" style={{ left: 112, top: 508 }}>{closure}</div>
        <StatusCard spec={spec} style={{ left: 1388, top: 282, width: 420, height: 404, position: 'absolute' }} />
      </div>
    </div>
  );
}
