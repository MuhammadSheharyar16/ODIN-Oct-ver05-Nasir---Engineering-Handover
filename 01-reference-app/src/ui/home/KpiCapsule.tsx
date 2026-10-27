import type { CSSProperties, ReactNode } from 'react';
import type { Kpi } from '../../data/types';
import type { CapsuleSlot } from '../../lib/homeLayout';
import { formatCount, formatDelta, formatKpiValue } from '../../lib/format';
import { NumberRoll } from '../NumberRoll';

type Props = {
  kpi: Kpi;
  slot: CapsuleSlot;
  accent: string;
  icon: ReactNode;
  /** Float phase so the four objects never bob in unison. */
  phase: number;
  ring?: boolean;
  /** Optional unit line (e.g. currency) shown at the foot of a vertical capsule. */
  unit?: string;
  /** Register as a morph element (Home). Off when nested inside a scene's own morph wrapper. */
  morph?: boolean;
  /** Composer spotlight key (scenes only). */
  spotKey?: string;
  /** Ring as a plain gauge; the value is shown in the text column like the other capsules. */
  gaugeOnly?: boolean;
};

/**
 * Home KPI capsule (approved 2.1 direction): a front-facing glass stadium
 * with a luminous accent rim. Vertical on wide/portrait layouts, horizontal
 * pill on phones. All content scales from the capsule's own size.
 */
export function KpiCapsule({ kpi, slot, accent, icon, phase, ring, unit, morph = true, spotKey, gaugeOnly }: Props) {
  const unavailable = kpi.state === 'unavailable' || kpi.value === null;
  const style = {
    '--accent-raw': accent,
    left: `${slot.x}px`,
    top: `${slot.y}px`,
    width: `${slot.w}px`,
    height: `${slot.h}px`,
    '--phase': `${phase}s`,
  } as CSSProperties;

  const delta = kpi.delta;
  const trend = !delta ? '' : delta.value > 0 ? 'up' : delta.value < 0 ? 'down' : 'flat';
  const showRing = ring && !unavailable && kpi.value !== null;

  const visual = showRing ? (
    <div className="capsule__ring" style={{ '--p': kpi.value! / 100 } as CSSProperties}>
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle className="capsule__ring-track" cx="50" cy="50" r="42" />
        <circle className="capsule__ring-fill" cx="50" cy="50" r="42" pathLength="1" />
      </svg>
      {!gaugeOnly && <NumberRoll className="capsule__ring-value" value={kpi.value!} format={(v) => formatKpiValue(kpi, v)} countUp />}
    </div>
  ) : (
    <div className="capsule__icon">{icon}</div>
  );

  return (
    <div className={`capsule is-${slot.orientation}${unavailable ? ' is-unavailable' : ''}`} style={{ ...style, '--spot': accent } as CSSProperties} {...(spotKey ? { 'data-spot-key': spotKey } : {})}>
      <div className="capsule__intro" data-intro="capsule" {...(morph ? { 'data-morph': `home:${kpi.id}`, 'data-accent': accent } : {})}>
      <div className="capsule__float">
        <div className="capsule__halo" />
        <div className="capsule__shell" />
        <div className="capsule__edge" />
        <div className="capsule__content">
          {visual}
          <div className="capsule__text">
            <div className="capsule__label">{kpi.label}</div>
            {unavailable ? (
              <>
                <div className="capsule__na">Not available</div>
                {kpi.unavailableReason && <div className="capsule__basis">{kpi.unavailableReason}</div>}
              </>
            ) : (
              <>
                {(!showRing || gaugeOnly) && (kpi.format === 'currency' && kpi.currency ? (
                  // The amount is the answer: the currency is a small prefix so the figure keeps its full size on one line.
                  <div className="capsule__value is-currency">
                    <span className="capsule__cur">{kpi.currency}</span>
                    <NumberRoll value={kpi.value!} format={formatCount} countUp />
                  </div>
                ) : (
                  <NumberRoll className="capsule__value" value={kpi.value!} format={(v) => formatKpiValue(kpi, v)} countUp />
                ))}
                {delta && (
                  <div className={`capsule__delta is-${trend}`}>
                    <span className="capsule__arrow" aria-hidden>
                      {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '•'}
                    </span>
                    {formatDelta(delta)}
                  </div>
                )}
                {delta && <div className="capsule__basis">{delta.basis}</div>}
                {!delta && kpi.note && <div className="capsule__note">{kpi.note}</div>}
                {!delta && kpi.detail && <div className="capsule__basis">{kpi.detail}</div>}
              </>
            )}
            {unit && slot.orientation === 'vertical' && <div className="capsule__unit">{unit}</div>}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
