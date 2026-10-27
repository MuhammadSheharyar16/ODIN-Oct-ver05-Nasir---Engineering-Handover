import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { Building2, Globe2, Info, Receipt, UserRound } from 'lucide-react';
import type { Box, HomeLayout } from '../../../lib/homeLayout';
import { EnergyStreams } from '../../home/EnergyStreams';
import type { RevenueBreakdown, RevenueSpec } from '../../../odin/types';
import { prefersReducedMotion } from '../../../lib/motion';
import { useOdinLayout } from '../../bridge';
import { Count } from './shared';
import './revcore.css';

/**
 * VAS Revenue (V32 · BQ05, BQ27): a gold revenue core (glass orb, swirling gold dust,
 * gradient ring) on its floor beam, fed by energy links from two breakdown panels on
 * each side. Each panel is a full breakdown of the same total (top items + the rest),
 * so it sums to the total. Wide: fixed 1920×1080 frame scaled to fit. Other devices: stacked layout.
 */
const ICON: Record<string, ReactNode> = { countries: <Globe2 />, centres: <Building2 />, services: <Receipt />, nationalities: <UserRound /> };
type Geo = { core: { x: number; y: number; r: number }; panels: { x: number; y: number; w: number; h: number }[] };
/** The core in the centre on its floor beam; country and centre on the left, service and nationality on the right. */
const G: Geo = {
  core: { x: 960, y: 452, r: 200 },
  panels: [
    { x: 104, y: 214, w: 452, h: 292 },
    { x: 104, y: 532, w: 452, h: 292 },
    { x: 1364, y: 214, w: 452, h: 292 },
    { x: 1364, y: 532, w: 452, h: 292 },
  ],
};
/** Ring and readout scale with the core (designed at r = 158). */
const ringOf = (r: number) => 372 * (r / 158);
const aed = (v: number) => (v >= 1e6 ? `AED ${(v / 1e6).toFixed(1)}M` : `AED ${Math.round(v / 1e3)}K`);

function Panel({ b, total, rows, style, compact }: { b: RevenueBreakdown; total: number; rows: number; style?: CSSProperties; compact?: boolean }) {
  const list = b.rows.slice(0, rows);
  const max = Math.max(...list.map((r) => r.share), b.rest.share);
  return (
    <section className={`rvc-panel${compact ? ' is-compact' : ''}`} data-spot-key={b.key} style={{ ...style, '--c': b.accent, '--spot': b.accent } as CSSProperties} aria-label={`Revenue ${b.title.toLowerCase()}`}>
      <header className="rvc-panel__head">
        <span className="rvc-panel__ic" aria-hidden>{ICON[b.key]}</span>
        <div className="rvc-panel__titles">
          <h3>{b.title}</h3>
          {!compact && <div className="rvc-panel__sub">{b.sub}</div>}
        </div>
        {b.preview && <span className="rvc-panel__tag">Preview · post-Oct</span>}
      </header>
      <div className="rvc-panel__rows">
        {[...list.map((r) => ({ name: r.name, share: r.share, value: r.value, rest: false })), { name: b.rest.label, share: b.rest.share, value: b.rest.value, rest: true }].map((r, i) => (
          <div key={r.name} className={`rvc-row${r.rest ? ' is-rest' : ''}`} style={{ '--i': i } as CSSProperties}>
            <span className="rvc-row__nm">{r.name}</span>
            <span className="rvc-row__bar" aria-hidden><i style={{ width: `${(r.share / max) * 100}%` }} /></span>
            <span className="rvc-row__v"><Count v={r.value} fmt={aed} delay={700 + i * 80} /></span>
            <span className="rvc-row__p">{Math.round(r.share * 100)}%</span>
          </div>
        ))}
      </div>
      {!compact && <footer className="rvc-panel__foot"><span>Sums to total</span><b>{aed(total)}</b></footer>}
    </section>
  );
}

function Readout({ spec }: { spec: RevenueSpec }) {
  const up = (spec.delta ?? 0) >= 0;
  return (
    <div className="rvc-readout" data-spot-key="total">
      <div className="rvc-readout__k">Total VAS revenue</div>
      <b className="rvc-readout__v"><Count v={spec.amount ?? 0} fmt={aed} delay={600} /></b>
      {spec.delta !== null && (
        <div className={`rvc-readout__d${up ? '' : ' is-down'}`}>
          <span aria-hidden>{up ? '▲' : '▼'}</span> {Math.abs(spec.delta).toFixed(1)}% <em>vs previous period</em>
        </div>
      )}
      {spec.validation && <div className="rvc-chip"><Info aria-hidden /> Validation required</div>}
    </div>
  );
}

/** Gold revenue dust swirling inside the orb (2D canvas). */
function GoldDust({ r: coreR }: { r: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useMemo(() => prefersReducedMotion(), []);
  useEffect(() => {
    const cv = ref.current;
    const g = cv?.getContext('2d');
    if (!cv || !g) return;
    const S = coreR * 2;
    cv.width = S * 2; cv.height = S * 2; g.scale(2, 2);
    const spr = document.createElement('canvas'); spr.width = spr.height = 24;
    const x = spr.getContext('2d')!; const gr = x.createRadialGradient(12, 12, 0, 12, 12, 12);
    gr.addColorStop(0, '#fff'); gr.addColorStop(0.15, '#ffd27a'); gr.addColorStop(0.5, 'rgba(255,170,60,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 24, 24);
    const c = S / 2, R = coreR - 8;
    const D = Array.from({ length: 1400 }, () => ({ r: R * Math.sqrt(Math.random()), a: Math.random() * 6.28, y: Math.random(), s: 0.3 + Math.random() * 0.9, sp: 0.2 + Math.random() * 0.6 }));
    let raf = 0;
    const draw = () => {
      g.clearRect(0, 0, S, S); g.globalCompositeOperation = 'lighter';
      for (const p of D) {
        if (!reduced) { p.a += p.sp * 0.004; p.y -= 0.0009 * p.sp; if (p.y < 0) p.y += 1; }
        const px = c + Math.cos(p.a) * p.r, py = 18 + p.y * (S - 36) + Math.sin(p.a) * p.r * 0.18;
        const dx = px - c, dy = py - c; if (dx * dx + dy * dy > R * R) continue;
        const z = (Math.sin(p.a) + 1) / 2, s = (1.2 + p.s * 2.2) * (0.6 + z * 0.7);
        g.globalAlpha = (0.25 + z * 0.65) * Math.min(1, p.y * 6, (1 - p.y) * 6); g.drawImage(spr, px - s, py - s, s * 2, s * 2);
      }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [reduced, coreR]);
  return <canvas ref={ref} className="rvc-core__dust" style={{ width: coreR * 2, height: coreR * 2 }} aria-hidden />;
}

export function RevenueCore({ spec, box }: { spec: RevenueSpec; box: Box }) {
  const home = useOdinLayout();
  const { width, height, mode } = home;
  const total = spec.amount ?? 0;
  const bds = spec.breakdowns ?? [];
  if (mode !== 'wide') {
    const one = box.w < 560;
    return (
      <div className={`rvc-stack${one ? ' is-one' : ''}`} data-surface>
        <div className="rvc-stack__core" data-presence="0.3" data-aura=""><Readout spec={spec} /></div>
        <div className="rvc-stack__grid">
          {bds.map((b) => <Panel key={b.key} b={b} total={total} rows={one ? 2 : 3} compact />)}
        </div>
      </div>
    );
  }
  const k = Math.min(width / 1920, height / 1080);
  const CORE = G.core, RING = ringOf(CORE.r), PANELS = G.panels;
  // Each energy link leaves its panel from the inner side edge.
  const anchor = (p: Geo['panels'][number]) => ({ x: p.x < CORE.x ? p.x + p.w - 14 : p.x + 14, y: p.y + p.h / 2, w: 28, h: p.h * 0.5, orientation: 'vertical' as const });
  return (
    <div className="rvc is-sides" style={{ '--k': k } as CSSProperties}>
      <div className="rvc__frame">
        {/* Same energy links as Home: braided strands, drifting dust and eased comets into the core. */}
        <div className="rvc__energy">
          <EnergyStreams
            layout={{ ...home, width: 1920, height: 1080, globe: { x: CORE.x, y: CORE.y, r: RING / 2 }, capsules: PANELS.slice(0, bds.length).map(anchor) as HomeLayout['capsules'] }}
            accents={bds.map((b) => b.accent)}
            land={0.99}
          />
        </div>
        <div className="rvc-core" style={{ left: CORE.x, top: CORE.y, '--r': `${CORE.r}px`, '--ring': `${RING}px` } as CSSProperties}>
          <div className="rvc-core__orb" data-aura="" data-surface data-beam="#f5b342,#ffd27a" data-beam-level="0.8" />
          <GoldDust r={CORE.r} />
          <svg className="rvc-core__ring" viewBox="0 0 372 372" aria-hidden>
            <defs>
              <linearGradient id="rvc-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffe7a8" /><stop offset=".45" stopColor="#f5b342" /><stop offset=".8" stopColor="#ff8a5c" /><stop offset="1" stopColor="#ff6fb0" />
              </linearGradient>
            </defs>
            <circle cx="186" cy="186" r="178" className="rvc-core__track" />
            <circle cx="186" cy="186" r="178" className="rvc-core__arc" stroke="url(#rvc-ring)" strokeDasharray={spec.validation ? '880 1118' : '1118 1118'} transform="rotate(-62 186 186)" />
          </svg>
          <Readout spec={spec} />
        </div>

        {bds.map((b, i) => {
          const p = PANELS[i];
          return <Panel key={b.key} b={b} total={total} rows={3} style={{ left: p.x, top: p.y, width: p.w, height: p.h, '--i': i } as CSSProperties} />;
        })}
      </div>
    </div>
  );
}
