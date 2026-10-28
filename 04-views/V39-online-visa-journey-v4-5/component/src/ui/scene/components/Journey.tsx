import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { registerProxy } from '../../../odin/fx';
import { journeyGeometry, journeyGeometryVertical } from './journeyGeometry';
import { ArrowRight, Check, X } from 'lucide-react';
import type { JourneySpec } from '../../../odin/types';
import type { Box } from '../../../lib/homeLayout';
import { formatCount } from '../../../lib/format';
import { useOdinLayout } from '../../bridge';
import { JourneyFloor } from './JourneyFloor';
import { JourneyCinema42 } from './journeyCinema/JourneyCinema42';
import { Count } from './shared';

function StageCard({ n, label, sub, count, days, delta, accent, emphasis, icon, unavailable, tag = 'Most waiting now', style }: { n?: number; label: string; sub?: string; count: number; days: number; delta?: number; accent: string; emphasis?: boolean; icon?: ReactNode; unavailable?: boolean; tag?: string; style: CSSProperties }) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className={`jcard${emphasis ? ' is-emphasis' : ''}${icon ? ' is-outcome' : ''}${unavailable ? ' is-na' : ''}`} style={{ ...style, '--accent': accent } as CSSProperties}>
      <div className="jcard__glass">
        <div className="jcard__head">
          {n !== undefined && <span className="jcard__n">{n}.</span>}
          {icon && <span className="jcard__badge">{icon}</span>}
          <span className="jcard__label">
            {label}
            {sub && <span className="jcard__sub">({sub})</span>}
          </span>
        </div>
        <div className="jcard__count">{unavailable ? 'Not available' : <Count v={count} fmt={formatCount} />}</div>
        {!unavailable && delta !== undefined && (
          <div className={`jcard__delta ${up ? 'is-up' : 'is-down'}`}>
            <span aria-hidden>{up ? '▲' : '▼'}</span> {up ? '+' : '−'}
            {Math.abs(delta).toFixed(1)}% <span className="jcard__basis">vs yesterday</span>
          </div>
        )}
        {unavailable ? <div className="jcard__days">Source event not yet captured</div> : <div className="jcard__days">Avg. {days.toFixed(1)} days</div>}
        {emphasis && <div className="jcard__tag">{tag}</div>}
      </div>
      <span className="jcard__stem" />
    </div>
  );
}

export function Journey({ spec, box }: { spec: JourneySpec; box: Box }) {
  const mode = useOdinLayout().mode;
  // Online Visa Journey v4.5 (V39): the Ask ODIN bar sits a little lower, leaving a gap above it (cinema.css).
  const cinema = !!(spec.floor && spec.cinema && mode === 'wide');
  useEffect(() => {
    if (!cinema) return;
    document.documentElement.dataset.journeyCinema = '1';
    return () => { delete document.documentElement.dataset.journeyCinema; };
  }, [cinema]);
  if (spec.floor && spec.cinema === 'v45' && mode === 'wide') return <JourneyCinema42 spec={spec} />;
  if (spec.floor && mode === 'wide') return <JourneyFloor spec={spec} />;
  const vertical = box.w / box.h < 1.25;
  return vertical ? <JourneyVertical spec={spec} /> : <JourneyHorizontal spec={spec} aspect={box.h / box.w} />;
}

/** Horizontal journey: cards + path nodes in DOM; pedestals, objects and light path in WebGL. */
function JourneyHorizontal({ spec, aspect }: { spec: JourneySpec; aspect: number }) {
  const proxy = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!proxy.current) return;
    return registerProxy(`journey:${spec.key}:${spec.channel}`, { el: proxy.current, kind: 'pedestal', data: { spec, vertical: false } });
  }, [spec]);
  const N = spec.stages.length;
  const g = journeyGeometry(N);
  const cardW = g.colW * 0.86;
  // Card bottom sits just above the floating object (object top ≈ 1.5 pedestal radii up).
  const lift = (pedW: number, k = 1.55) => ((pedW / 2) * k) / aspect;

  return (
    <div className="journey is-horizontal" data-surface ref={proxy}>
      {/* ODIN's floor spectrum encircles every station, not one card. */}
      <span className="journey__floor" data-aura="floor" data-rise="0.24" />
      {g.stages.slice(0, -1).map((p, i) => {
        const q = g.stages[i + 1];
        return (
          <span key={i} className="flow-node" style={{ left: `${(p.x + q.x) / 2}%`, top: `${(p.y + q.y) / 2 + 3.2}%` }}>
            <ArrowRight />
          </span>
        );
      })}
      <span className="flow-node is-good" style={{ left: `${(g.branch.x + g.approved.x) / 2 - 1}%`, top: `${(g.branch.y + g.approved.y) / 2 + 5}%` }}>
        <ArrowRight />
      </span>
      <span className="flow-node is-bad" style={{ left: `${(g.branch.x + g.rejected.x) / 2 - 1}%`, top: `${(g.branch.y + g.rejected.y) / 2 + 3}%` }}>
        <ArrowRight />
      </span>

      {spec.stages.map((s, i) => (
        <StageCard
          key={s.key}
          n={i + 1}
          label={s.label}
          sub={s.sub}
          count={s.count}
          days={s.days}
          delta={s.delta}
          accent={s.accent}
          unavailable={s.unavailable}
          tag={spec.emphasisLabel}
          emphasis={s.key === spec.emphasisKey}
          style={{ left: `${g.stages[i].x}%`, bottom: `${100 - g.stages[i].y + lift(g.pedW)}%`, width: `${cardW}%`, '--i': i } as CSSProperties}
        />
      ))}
      <StageCard
        label={spec.outcomeLabels?.good ?? 'Approved'}
        icon={<Check />}
        count={spec.approved.count}
        days={spec.approved.days}
        delta={spec.approved.delta}
        accent="#33d69a"
        style={{ left: `${g.approved.x}%`, bottom: `${100 - g.approved.y + lift(g.outPedW, 1.75)}%`, width: `${cardW * 0.92}%`, '--i': N } as CSSProperties}
      />
      <StageCard
        label={spec.outcomeLabels?.bad ?? 'Rejected'}
        icon={<X />}
        unavailable={spec.rejected.unavailable}
        count={spec.rejected.count}
        days={spec.rejected.days}
        delta={spec.rejected.delta}
        accent="#ff4f63"
        style={{ left: `${g.rejected.x}%`, bottom: `${100 - g.rejected.y + lift(g.outPedW, 1.7)}%`, width: `${cardW * 0.92}%`, '--i': N + 1 } as CSSProperties}
      />
    </div>
  );
}

function JourneyVertical({ spec }: { spec: JourneySpec }) {
  const proxy = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!proxy.current) return;
    return registerProxy(`journey:${spec.key}:${spec.channel}:v`, { el: proxy.current, kind: 'pedestal', data: { spec, vertical: true } });
  }, [spec]);
  const g = journeyGeometryVertical(spec.stages.length);
  const Out = ({ label, icon, count, days, accent, left, na }: { label: string; icon: ReactNode; count: number; days: number; accent: string; left: number; na?: boolean }) => (
    <div className="vj-out" style={{ left: `${left}%`, top: `${g.approved.y - 3}%`, '--accent': accent } as CSSProperties}>
      <span className="vj-out__label">
        <span className="jcard__badge">{icon}</span>
        {label}
      </span>
      <b className={na ? 'is-na' : undefined}>{na ? 'Not available' : formatCount(count)}</b>
      <span className="vj-out__days">{na ? 'not yet captured' : `Avg. ${days.toFixed(1)} days`}</span>
    </div>
  );
  return (
    <div className="journey is-vertical" data-surface ref={proxy}>
      {spec.stages.map((s, i) => {
        const up = (s.delta ?? 0) >= 0;
        return (
          <div
            key={s.key}
            className={`vj-row${s.key === spec.emphasisKey ? ' is-emphasis' : ''}`}
            style={{ top: `${g.stages[i].y - 4.5}%`, '--accent': s.accent, '--i': i } as CSSProperties}
          >
            <span className="vj-row__label">
              <span className="jcard__n">{i + 1}.</span>
              <span>
                {s.label}
                {s.key === spec.emphasisKey && <span className="vj-row__tag">{spec.emphasisLabel ?? 'Most waiting now'}</span>}
              </span>
            </span>
            {s.unavailable ? (
              <span className="vj-row__nums is-na">
                <b>Not available</b>
                <span className="vj-row__days">not yet captured</span>
              </span>
            ) : (
              <span className="vj-row__nums">
                <b>{formatCount(s.count)}</b>
                <span className={up ? 'is-up' : 'is-down'}>
                  {up ? '▲ +' : '▼ −'}
                  {Math.abs(s.delta ?? 0).toFixed(1)}%
                </span>
                <span className="vj-row__days">{s.days.toFixed(1)} days</span>
              </span>
            )}
          </div>
        );
      })}
      <Out label={spec.outcomeLabels?.goodShort ?? spec.outcomeLabels?.good ?? 'Approved'} icon={<Check />} count={spec.approved.count} days={spec.approved.days} accent="#33d69a" left={1} />
      <Out label={spec.outcomeLabels?.badShort ?? spec.outcomeLabels?.bad ?? 'Rejected'} icon={<X />} count={spec.rejected.count} days={spec.rejected.days} accent="#ff4f63" left={51} na={spec.rejected.unavailable} />
    </div>
  );
}
