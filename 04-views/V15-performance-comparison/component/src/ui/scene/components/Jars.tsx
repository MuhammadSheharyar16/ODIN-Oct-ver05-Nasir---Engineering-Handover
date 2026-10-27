import type { ReactNode } from 'react';
import { CalendarDays, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import type { PeriodsSpec } from '../../../odin/types';
import type { Box } from '../../../lib/homeLayout';
import { Count, DeltaTag, Plinth, css, useProxy } from './shared';
import { HeroGlassFx } from '../HeroGlass';

/**
 * Glass bell-jar family (designs: Submission Channel, Visa Performance
 * Comparison, Stage Queue/Aging, VAS Revenue). Jars are unblurred glass so
 * the 3D object on the pedestal below shows through; text sits in a darker
 * crown for legibility.
 */
function Jar({ accent, crown, children, tall = 1, highlight, i, heat, glossy }: { accent: string; crown: ReactNode; children?: ReactNode; tall?: number; highlight?: boolean; i: number; heat?: number; /** ODIN glossy hero glass (as the Home cards). */ glossy?: boolean }) {
  return (
    <div className={`jar${highlight ? ' is-highlight' : ''}${heat !== undefined ? ' has-heat' : ''}${glossy ? ' is-glossy' : ''}`} style={css({ '--accent': accent, '--tall': tall, '--i': i, '--hg-i': i % 4, ...(heat !== undefined ? { '--heat': heat.toFixed(3) } : {}) })}>
      {glossy && <span className="jar__hg hglass" aria-hidden><HeroGlassFx /></span>}
      {glossy && <span className="jar__shoulder" aria-hidden />}
      {glossy && <span className="jar__collar" aria-hidden />}
      <div className="jar__glass">
        <div className="jar__crown">{crown}</div>
        {children}
      </div>
    </div>
  );
}

// ───────────────────────────── Period comparison ─────────────────────────────
export function Periods({ spec, box }: { spec: PeriodsSpec; box: Box }) {
  const ref = useProxy(`plinths:${spec.key}`, 'plinths');
  const narrow = box.w / box.h < 1.2;
  const items = narrow ? spec.items.filter((p) => p.key !== 'prev7') : spec.items;
  return (
    <div className={`jars is-front${narrow ? ' is-narrow' : ''}`} data-surface ref={ref}>
      {!narrow && <span className="floor-aura" data-aura="floor" data-aura-from="plinths" data-rise="0.22" />}
      {items.map((p, i) => (
        <div key={p.key} className="jar-col" data-spot-key={p.key} style={css({ '--i': i, '--accent': p.accent, '--spot': p.accent })}>
          <Jar glossy accent={p.accent} i={i} highlight={p.key === 'last7'} tall={p.key === 'last7' ? 1.08 : 1} crown={
            <>
              <span className="jar__icon"><CalendarDays /></span>
              <span className="jar__title">{p.label}</span>
              <span className="jar__value"><Count v={p.value} /></span>
              <span className="jar__sub">visas processed</span>
              <DeltaTag value={p.delta} basis={p.cmp} className="jar__delta" />
            </>
          } />
          <Plinth accent={p.accent} object="passports" scale={0.78} tilt={0.14} style={css({ width: '88%' })} />
          <div className="jar-stats hglass" style={css({ '--accent': p.accent, '--hg-i': (i + 2) % 4 })}>
            <HeroGlassFx />
            <div>
              <ShieldCheck />
              <span>Approval rate</span>
              <b>{p.approval.toFixed(1)}%</b>
              <DeltaTag value={p.approvalDelta} unit=" pp" />
            </div>
            <div>
              <Clock />
              <span>Avg. processing time</span>
              <b>{p.days.toFixed(1)} days</b>
              <DeltaTag value={p.daysDelta} goodWhen="down" />
            </div>
          </div>
          {!narrow && i < items.length - 1 && <ChevronRight className="jar-chev" />}
        </div>
      ))}
    </div>
  );
}
