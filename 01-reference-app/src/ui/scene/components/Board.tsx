import type { CSSProperties } from 'react';
import type { BoardSpec } from '../../../odin/types';
import type { Kpi } from '../../../data/types';
import { frameMapper, type HomeLayout } from '../../../lib/homeLayout';
import { formatCount } from '../../../lib/format';
import { useOdinLayout } from '../../bridge';
import { KpiCapsule } from '../../home/KpiCapsule';
import { EnergyStreams } from '../../home/EnergyStreams';
import { IconApproved, IconClosure, IconEntered, IconRevenue } from '../../icons';
import { Count, useProxy } from './shared';
import { Lights } from './AppCore';
import './board.css';

/** Light colours for the sphere (stages are mostly blue; a mix reads as "each light an application"). */
const LIGHT = ['#4f9cff', '#4fd6ff', '#3ed6a0', '#a67cff', '#ff7aa8'];
const ICONS = { entered: <IconEntered />, approved: <IconApproved />, closure: <IconClosure />, revenue: <IconRevenue /> };

/**
 * Home-style answer board (wide screens): ODIN's globe carries the headline,
 * four horizontal glass capsules hold the supporting facts (linked to ODIN by
 * the same energy as Home), and a stage row on the floor shows where the
 * applications are. Related to Home, not a copy: horizontal capsules, a
 * floor-level stage row, a different headline.
 */
export function Board({ spec }: { spec: BoardSpec }) {
  const home = useOdinLayout();
  const orbRef = useProxy(`orb:${spec.key}`, 'orb');
  const glass = spec.orb === 'glass';
  const { box } = frameMapper(home.width, home.height);
  const g = home.globe;
  const slots = [box(430, 318, 420, 150), box(372, 568, 420, 150), box(1490, 318, 420, 150), box(1548, 568, 420, 150)].map((b) => ({ ...b, orientation: 'horizontal' as const }));
  const layout: HomeLayout = { ...home, capsules: slots as HomeLayout['capsules'] };
  const row = box(960, 812, 1360, 88);
  const kpis: Kpi[] = spec.capsules.map((c) => ({
    id: c.id, label: c.label, value: c.value, format: c.format, state: 'valid', delta: c.delta, detail: c.detail, featureIds: [], kpiIds: [],
  }));
  return (
    <div className="board" data-surface>
      <div className="board__energy">
        <EnergyStreams layout={layout} accents={spec.capsules.map((c) => c.accent)} land={glass ? 1.07 : 0.9} />
      </div>
      {/* ODIN sits here; the director places the globe from this element. */}
      <span className="board__presence" {...(glass ? {} : { 'data-presence': '0.5' })} data-aura="" style={{ left: g.x - g.r, top: g.y - g.r, width: g.r * 2, height: g.r * 2 }} />
      {glass && (
        // Application lights inside the glass sphere (same language as the application core).
        <div className="board__lights" style={{ left: g.x - g.r * 1.06, top: g.y - g.r * 1.06, width: g.r * 2.12, height: g.r * 2.12 }} aria-hidden>
          <Lights segments={spec.stages.map((s, i) => ({ key: s.key, label: s.label, count: Math.max(1, s.count), accent: LIGHT[i % LIGHT.length] }))} size={Math.round(g.r * 2.12)} gain={1.3} fill={0.935} />
        </div>
      )}
      {glass && <div ref={orbRef} className="board__orb" data-beam-level="0.5" data-beam={spec.capsules.map((c) => c.accent).join(',')} style={{ left: g.x - g.r * 1.06, top: g.y - g.r * 1.06, width: g.r * 2.12, height: g.r * 2.12 }} />}
      <div data-spot-key="hero" className={`globe-readout board__readout${glass ? ' is-glass' : ''}`} style={{ left: g.x, top: g.y, '--r': `${g.r}px` } as CSSProperties}>
        {glass && (
          <svg className="board__hourglass" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 3h12M6 21h12M7 3c0 4.5 4 6 4.6 9-.6 3-4.6 4.5-4.6 9M17 3c0 4.5-4 6-4.6 9 .6 3 4.6 4.5 4.6 9" />
          </svg>
        )}
        {glass && <div className="globe-readout__label">{spec.hero.label}</div>}
        <Count className="globe-readout__value" v={spec.hero.value} fmt={formatCount} />
        {!glass && <div className="globe-readout__label">{spec.hero.label}</div>}
        <div className={`board__delta ${spec.hero.delta >= 0 ? 'is-up' : 'is-down'}`}>
          {spec.hero.delta >= 0 ? '▲' : '▼'} {formatCount(Math.abs(spec.hero.delta))} <span>{spec.hero.deltaBasis}</span>
        </div>
        <div className="globe-readout__qualifier">{spec.hero.caption}</div>
      </div>
      {kpis.map((k, i) => (
        <KpiCapsule key={k.id} spotKey={k.id} kpi={k} slot={slots[i]} accent={spec.capsules[i].accent} icon={ICONS[spec.capsules[i].icon]} phase={i * 2.3} ring={k.format === 'percent'} gaugeOnly morph={false} />
      ))}
      <div className="board__row" style={{ left: row.x - row.w / 2, top: row.y - row.h / 2, width: row.w, height: row.h, '--u': String(home.u) } as CSSProperties}>
        <div className="board__row-title">{spec.stagesTitle}</div>
        {spec.stages.map((s, i) => (
          <div key={s.key} className={`board__stage${s.top ? ' is-top' : ''}`} style={{ '--a': s.accent, '--i': i } as CSSProperties}>
            <span className="board__stage-name">{s.label}</span>
            <b><Count v={s.count} fmt={formatCount} delay={700 + i * 90} /></b>
            <span className="board__stage-share">{Math.round(s.share * 100)}%</span>
            <i style={{ '--w': `${Math.max(4, s.share * 100)}%` } as CSSProperties} />
          </div>
        ))}
      </div>
    </div>
  );
}
