import { useEffect, useRef, type CSSProperties } from 'react';
import type { DonutSpec } from '../../../odin/types';
import type { Box } from '../../../lib/homeLayout';
import { formatCount } from '../../../lib/format';
import { registerProxy } from '../../../odin/fx';
import { useOdinLayout } from '../../bridge';
import { Count } from './shared';
import { Lights } from './AppCore';
import { DONUT_TILT, segmentAngles } from './donutGeometry';
import './appcore.css';
import './outboard.css';

/**
 * Application Outcomes v1: the 3D glass donut (WebGL, following the stage
 * element) around the application core (deep-blue glass orb, one light per
 * application, coloured by status). The total lives only in the core. Four
 * hero-glass cards answer the questions, each with its basis written out:
 * Approved / Rejected (% of decided and of all), In processing, Closure rate.
 * Wide: fixed frame (1920×1080, or 1280×960 below 0.8 scale so text stays
 * ≥ 12 px) with neon leaders from each segment to its card. Other devices:
 * tablet portrait 2 × 2 cards, phone status panel + two gauges, landscape
 * phone side by side.
 */
const SQUASH = Math.cos(DONUT_TILT);
const FRAMES = {
  A: { w: 1920, h: 1080, cx: 960, cy: 470, S: 471, card: { w: 400, h: 168 }, left: 150, right: 1370, rows: [250, 448], basis: 790 },
  B: { w: 1280, h: 960, cx: 640, cy: 430, S: 300, card: { w: 340, h: 140 }, left: 40, right: 900, rows: [282, 440], basis: 642 },
} as const;
type Frame = (typeof FRAMES)[keyof typeof FRAMES];

const pct = (v: number) => `${v.toFixed(1)}%`;

function data(spec: DonutSpec) {
  const n = (k: string) => spec.segments.find((s) => s.key === k)?.count ?? 0;
  const acc = (k: string) => spec.segments.find((s) => s.key === k)?.accent ?? '#7fb6ff';
  const total = spec.total || 1;
  const approved = n('approved'), rejected = n('rejected'), processing = n('processing'), closed = n('closed');
  const decided = Math.max(1, approved + rejected);
  const closure = ((total - processing) / total) * 100;
  return {
    total, closed, acc,
    cards: {
      approved: { key: 'approved', c: acc('approved'), label: 'Approved', value: approved, rate: `${pct((approved / decided) * 100)} of decided`, sub: `${pct((approved / total) * 100)} of all applications`, gauge: (approved / decided) * 100 },
      rejected: { key: 'rejected', c: acc('rejected'), label: 'Rejected', value: rejected, rate: `${pct((rejected / decided) * 100)} of decided`, sub: `${pct((rejected / total) * 100)} of all applications`, gauge: (rejected / decided) * 100 },
      processing: { key: 'processing', c: acc('processing'), label: 'In processing', value: processing, rate: `${pct((processing / total) * 100)} of all`, sub: 'awaiting a final decision', gauge: (processing / total) * 100 },
      closure: { key: 'closure', c: acc('closed'), label: 'Closure rate', value: closure, pctValue: true, rate: `${formatCount(total - processing)} of ${formatCount(total)} closed`, sub: 'approved + rejected + other ÷ all', gauge: closure },
    },
    approvalRate: (approved / decided) * 100,
    closure,
  };
}
type CardData = ReturnType<typeof data>['cards']['approved'] & { pctValue?: boolean };

function Gauge({ v }: { v: number }) {
  const r = 40, L = 2 * Math.PI * r;
  return (
    <svg className="ob-gauge" viewBox="0 0 100 100" aria-hidden>
      <circle className="ob-gauge__t" cx="50" cy="50" r={r} />
      <circle className="ob-gauge__f" cx="50" cy="50" r={r} strokeDasharray={`${(Math.min(100, v) / 100) * L} ${L}`} />
    </svg>
  );
}

function Card({ d, style, compact, i = 0 }: { d: CardData; style?: CSSProperties; compact?: boolean; i?: number }) {
  const fmt = d.pctValue ? pct : formatCount;
  return (
    <section className={`ob-card${compact ? ' is-compact' : ''}`} data-spot-key={d.key} style={{ ...style, '--c': d.c, '--spot': d.c, '--i': i } as CSSProperties}
      aria-label={`${d.label}: ${fmt(d.value)}, ${d.rate}`}>
      <div className="ob-card__body">
        <div className="ob-card__lbl"><i aria-hidden />{d.label}</div>
        <b className="ob-card__v"><Count v={d.value} fmt={fmt} delay={650 + i * 90} /></b>
        <div className="ob-card__rate">{d.rate}</div>
        {!compact && <div className="ob-card__sub">{d.sub}</div>}
      </div>
      <Gauge v={d.gauge} />
    </section>
  );
}

/** The 3D donut's DOM stage (WebGL follows it) with the application core in its hole. */
/** `scale`: rendered px per layout px (wide frames are scaled), so the readout never drops under 12 px on screen. */
function Ring({ spec, S, style, scale = 1, donut = true }: { spec: DonutSpec; S: number; style?: CSSProperties; scale?: number; donut?: boolean }) {
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!stage.current || !donut) return;
    return registerProxy(`donut:${spec.key}`, { el: stage.current, kind: 'donut', data: spec });
  }, [spec, donut]);
  // Without the 3D donut the application-core sphere fills the stage.
  const orb = Math.round(S * (donut ? 0.5 : 0.86));
  return (
    <div className="ob-ring" ref={stage} data-aura data-surface data-beam={spec.segments.map((x) => x.accent).join(',')} data-beam-squash={donut ? Math.cos(DONUT_TILT).toFixed(3) : '1'} data-beam-level="0.6" style={{ ...style, width: S, height: S, '--s': `${S}px` } as CSSProperties}>
      <div className="ob-core" style={{ width: orb, height: orb }}>
        <div className="apc-core__orb ob-core__orb" />
        <div className="ob-core__lights"><Lights segments={spec.segments} size={orb} /></div>
        <div className="ob-core__readout" data-spot-key="total">
          <div className="ob-core__k" style={{ fontSize: Math.max(12 / scale, S * 0.028) }}>{S * scale < 380 ? 'Total' : 'Total applications'}</div>
          <b className="ob-core__v" style={{ fontSize: Math.max(22 / scale, S * 0.118) }}><Count v={spec.total} fmt={formatCount} delay={600} /></b>
        </div>
      </div>
    </div>
  );
}

function ClosedChip({ d, style }: { d: ReturnType<typeof data>; style?: CSSProperties }) {
  return (
    <div className="ob-chip" data-spot-key="closed" style={{ ...style, '--c': d.acc('closed'), '--spot': d.acc('closed') } as CSSProperties}>
      <i aria-hidden /><b>{pct((d.closed / d.total) * 100)}</b> {formatCount(d.closed)} · Closed, other
    </div>
  );
}

const BASIS = 'Each light is an application · ring shows current status, each counted once · % of all applications';

function Wide({ spec, donut }: { spec: DonutSpec; donut: boolean }) {
  const { width, height } = useOdinLayout();
  const kA = Math.min(width / 1920, height / 1080);
  const F: Frame = kA >= 0.8 ? FRAMES.A : FRAMES.B;
  const k = Math.min(width / F.w, height / F.h);
  const d = data(spec);
  const angles = segmentAngles(spec);
  const R = F.S / 2;
  const anchor = (key: string) => {
    const a = angles[spec.segments.findIndex((s) => s.key === key)];
    return a ? [F.cx + Math.cos(a.mid) * R * 0.97, F.cy + Math.sin(a.mid) * R * 0.97 * SQUASH] : [F.cx, F.cy];
  };
  const place = { rejected: [F.left, F.rows[0]], processing: [F.left, F.rows[1]], approved: [F.right, F.rows[0]], closure: [F.right, F.rows[1]] } as const;
  const leaders = (['rejected', 'processing', 'approved'] as const).map((key) => {
    const [ax, ay] = anchor(key), [x, y] = place[key], left = x < F.cx;
    const ex = left ? x + F.card.w : x, ey = y + F.card.h / 2, mx = left ? ex + (ax - ex) * 0.45 : ex - (ex - ax) * 0.45;
    return { key, c: d.cards[key].c, ax, ay, d: `M${ax} ${ay} C${mx} ${ay} ${mx} ${ey} ${ex} ${ey}` };
  });
  const [qx, qy] = anchor('closed');
  const chip = { x: F.cx - F.S * 0.4, y: F.cy - F.S * 0.6 };
  return (
    <div className="ob" style={{ '--k': k } as CSSProperties} data-surface>
      <div className="ob__frame" style={{ width: F.w, height: F.h }}>
        <svg className="ob__leaders" viewBox={`0 0 ${F.w} ${F.h}`} aria-hidden>
          {leaders.map((l) => (
            <g key={l.key} className="ob-ld" style={{ '--c': l.c } as CSSProperties}>
              <path d={l.d} className="ob-ld__bed" /><path d={l.d} className="ob-ld__glow" /><path d={l.d} className="ob-ld__core" /><path d={l.d} className="ob-ld__hot" />
              <path d={l.d} className="ob-ld__flow" pathLength={1} />
              <circle cx={l.ax} cy={l.ay} r={F.S / 90} className="ob-ld__dot" />
            </g>
          ))}
          <g className="ob-ld" style={{ '--c': d.acc('closed') } as CSSProperties}>
            <path d={`M${qx} ${qy} L${chip.x + F.S * 0.12} ${chip.y}`} className="ob-ld__bed" />
            <path d={`M${qx} ${qy} L${chip.x + F.S * 0.12} ${chip.y}`} className="ob-ld__core" />
            <circle cx={qx} cy={qy} r={F.S / 110} className="ob-ld__dot" />
          </g>
        </svg>
        <Ring spec={spec} S={F.S} scale={k} donut={donut} style={{ position: 'absolute', left: F.cx - F.S / 2, top: F.cy - F.S / 2 }} />
        {(['rejected', 'processing', 'approved', 'closure'] as const).map((key, i) => (
          <Card key={key} d={d.cards[key]} i={i} style={{ position: 'absolute', left: place[key][0], top: place[key][1], width: F.card.w, height: F.card.h }} />
        ))}
        <ClosedChip d={d} style={{ position: 'absolute', left: chip.x, top: chip.y, transform: 'translate(-50%, -50%)' }} />
        <div className="ob-basis" style={{ left: F.cx, top: F.basis }}>{BASIS}</div>
      </div>
    </div>
  );
}

function StatusPanel({ spec, d }: { spec: DonutSpec; d: ReturnType<typeof data> }) {
  return (
    <section className="ob-panel" aria-label="Current status">
      <h4>Current status · % of all</h4>
      {spec.segments.map((s, i) => (
        <div key={s.key} className="ob-row" data-spot-key={s.key} style={{ '--c': s.accent, '--spot': s.accent, '--i': i } as CSSProperties}>
          <i aria-hidden /><span>{s.label}</span><b><Count v={s.count} fmt={formatCount} delay={650 + i * 80} /></b><em>{pct((s.count / d.total) * 100)}</em>
        </div>
      ))}
    </section>
  );
}

function Tiles({ d }: { d: ReturnType<typeof data> }) {
  const t = [
    { key: 'approval', c: d.cards.approved.c, label: 'Approval', v: d.approvalRate, sub: 'of decided' },
    { key: 'closure', c: d.cards.closure.c, label: 'Closure', v: d.closure, sub: 'closed ÷ all' },
  ];
  return (
    <div className="ob-tiles">
      {t.map((x, i) => (
        <section key={x.key} className="ob-card is-tile" data-spot-key={x.key} style={{ '--c': x.c, '--spot': x.c, '--i': i } as CSSProperties} aria-label={`${x.label} rate ${pct(x.v)} ${x.sub}`}>
          <div className="ob-card__body">
            <div className="ob-card__lbl"><i aria-hidden />{x.label}</div>
            <b className="ob-card__v"><Count v={x.v} fmt={pct} delay={700 + i * 90} /></b>
            <div className="ob-card__rate">{x.sub}</div>
          </div>
          <Gauge v={x.v} />
        </section>
      ))}
    </div>
  );
}

export function OutcomeBoard({ spec, box, donut = true }: { spec: DonutSpec; box: Box; donut?: boolean }) {
  const { mode } = useOdinLayout();
  if (mode === 'wide') return <Wide spec={spec} donut={donut} />;
  const d = data(spec);
  if (mode === 'portrait') {
    const S = Math.round(Math.min(box.w * 0.6, box.h * 0.5));
    return (
      <div className="ob-stack is-portrait" style={{ '--pu': Math.min(1.45, Math.max(1, box.w / 645)) } as CSSProperties} data-surface>
        <Ring spec={spec} S={S} donut={donut} />
        <div className="ob-stack__meta"><ClosedChip d={d} /><div className="ob-basis is-inline">{BASIS}</div></div>
        <div className="ob-grid">
          {(['approved', 'rejected', 'processing', 'closure'] as const).map((key, i) => <Card key={key} d={d.cards[key]} i={i} compact />)}
        </div>
      </div>
    );
  }
  if (mode === 'short') {
    const S = Math.round(Math.min(box.h * 0.72, box.w * 0.3));
    return (
      <div className="ob-side" data-surface>
        <Ring spec={spec} S={S} donut={donut} />
        <div className="ob-side__col"><StatusPanel spec={spec} d={d} /><Tiles d={d} /></div>
      </div>
    );
  }
  const S = Math.round(Math.min(box.w * 0.52, box.h * 0.42));
  return (
    <div className="ob-stack is-compact" data-surface>
      <Ring spec={spec} S={S} donut={donut} />
      <StatusPanel spec={spec} d={d} />
      <Tiles d={d} />
    </div>
  );
}
