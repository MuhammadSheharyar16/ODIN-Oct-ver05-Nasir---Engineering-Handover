import { useEffect, useRef, type CSSProperties } from 'react';
import { FloorBeam } from '../scene/FloorBeam';
import type { Kpi } from '../../data/types';
import { formatAsOf, formatCount } from '../../lib/format';
import { setAuraTarget } from '../../lib/aura';
import { useOdinLayout } from '../bridge';
import { NumberRoll } from '../NumberRoll';
import { IconApproved, IconClosure, IconEntered, IconRevenue } from '../icons';
import { EnergyStreams } from './EnergyStreams';
import { KpiCapsule } from './KpiCapsule';
import './home.css';

const ACCENTS = ['#f5ac45', '#4f9cff', '#3ed6a0', '#a67cff'];
const ICONS = [<IconRevenue />, <IconEntered />, <IconApproved />, <IconClosure />];

export type HomeData = { total: Kpi; orbs: [Kpi, Kpi, Kpi, Kpi]; asOf: Date };

/**
 * Scene A — Executive Home: globe readout, four KPI capsules and their energy.
 * `current`: Home is the active screen · `visible`: Home is on screen (incl. while morphing back).
 */
export function HomeComposition({ data, current, visible }: { data: HomeData; current: boolean; visible: boolean }) {
  const layout = useOdinLayout();
  const { total, orbs, asOf } = data;
  // Read at layout change only; the director moves the aura after a morph.
  const currentRef = useRef(current);
  currentRef.current = current;

  // On Home, ODIN's speaking spectrum wraps the globe.
  useEffect(() => {
    if (!currentRef.current) return;
    const g = layout.globe;
    setAuraTarget({ x: g.x, y: g.y, hw: g.r, hh: g.r, radius: g.r });
  }, [layout]);

  const g = layout.globe;
  const root = useRef<HTMLDivElement>(null);
  return (
    <div ref={root} className="presence-layer" data-layer="home" style={{ visibility: visible ? 'visible' : 'hidden' }}>
      {/* Hairline rays each side of the globe's beam, floor ring → globe (the beam itself is in 3D). */}
      {visible && <FloorBeam root={root} />}
      <div className="home-energy" data-morph="home-energy" data-accent="#7fb6ff">
        <EnergyStreams layout={layout} accents={ACCENTS} />
        <span aria-hidden data-beam="" data-beam-mode="rays" style={{ position: 'absolute', left: g.x - g.r, top: g.y - g.r, width: g.r * 2, height: g.r * 2, pointerEvents: 'none' }} />
      </div>

      <div
        className="globe-readout"
        aria-live="polite"
        style={{ left: `${g.x}px`, top: `${g.y}px`, '--r': `${g.r}px` } as CSSProperties}
      >
        <div className="globe-readout__intro" data-intro="readout" data-morph="total-applications" data-accent="#4f9cff">
          <NumberRoll className="globe-readout__value" value={total.value ?? 0} format={formatCount} countUp />
          <div className="globe-readout__label">{total.label}</div>
          <div className="globe-readout__qualifier">
            {total.qualifier} · {formatAsOf(asOf)}
          </div>
        </div>
      </div>

      {orbs.map((kpi, i) => (
        <KpiCapsule
          key={kpi.id}
          kpi={kpi}
          slot={layout.capsules[i]}
          accent={ACCENTS[i]}
          icon={ICONS[i]}
          phase={i * 2.3}
          ring={kpi.format === 'percent'}
        />
      ))}
    </div>
  );
}
