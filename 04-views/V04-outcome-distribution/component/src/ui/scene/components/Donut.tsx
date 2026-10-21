import { useEffect, useRef, type CSSProperties } from 'react';
import type { DonutSpec } from '../../../odin/types';
import type { Box } from '../../../lib/homeLayout';
import { formatCount } from '../../../lib/format';
import { registerProxy } from '../../../odin/fx';
import { useOdinLayout } from '../../bridge';
import { OutcomeGalaxy } from './OutcomeGalaxy';
import { OutcomeBoard } from './OutcomeBoard';
import { Lights, StatusRing } from './AppCore';
import './appcore.css';

import { DONUT_TILT, segmentAngles } from './donutGeometry';

export { DONUT_TILT, segmentAngles };
const SQUASH = Math.cos(DONUT_TILT);
/** Clean ring (Outcome Distribution): the Applications v2 core (sphere of status lights) inside a thin status ring.
 *  CORE = sphere diameter, RING = status-ring svg size, both as a share of the stage. */
const CORE = 0.8;
const RING = 0.94;

/**
 * Status distribution: a 3D glass donut (rendered in WebGL, following this
 * element) with flat, always-readable labels. Segments are mutually
 * exclusive current statuses, so they sum to the total.
 */
export function Donut({ spec, box }: { spec: DonutSpec; box: Box }) {
  const stage = useRef<HTMLDivElement>(null);
  const clean = !!spec.clean;
  // The 3D glass donut is only for the labelled donut; the clean ring is a thin SVG status ring (as Applications v2).
  useEffect(() => {
    if (!stage.current || clean) return;
    return registerProxy(`donut:${spec.key}`, { el: stage.current, kind: 'donut', data: spec });
  }, [spec, clean]);

  const legendMode = !clean && (box.w / box.h < 1.15 || box.w < 560);
  const angles = segmentAngles(spec);
  const S = clean ? Math.min(box.w * 0.9, box.h * 0.9) : legendMode ? Math.min(box.w * 0.62, box.h * 0.62) : Math.min(box.w * 0.62, box.h * 0.8);

  // Label anchors: radial, then de-collided per side (min vertical gap).
  const placed = angles.map((a, i) => {
    const right = Math.cos(a.mid) >= 0;
    const r = S * 0.66;
    return { i, right, x: Math.cos(a.mid) * r + (right ? S * 0.1 : -S * 0.1), y: Math.sin(a.mid) * r * SQUASH };
  });
  const gap = S * 0.25;
  for (const side of [true, false]) {
    const col = placed.filter((p) => p.right === side).sort((p, q) => p.y - q.y);
    for (let k = 1; k < col.length; k++) if (col[k].y - col[k - 1].y < gap) col[k].y = col[k - 1].y + gap;
    // Re-centre the column if it was pushed down.
    const over = col.length ? col[col.length - 1].y - S * 0.62 : 0;
    if (over > 0) col.forEach((p) => (p.y -= over));
  }

  return (
    <div className={`donut${legendMode ? ' is-legend' : ''}${clean ? ' is-clean' : ''}`}>
      <div className="donut__stage" ref={stage} data-aura data-surface {...(clean ? { 'data-beam': spec.segments.map((x) => x.accent).join(','), 'data-beam-level': '0.5' } : {})} style={{ width: S, height: S, borderRadius: '50%' }}>
        {/* Clean ring: the application core (one light per application, coloured by status) fills the centre. */}
        {clean && (
          <div className="donut__core" style={{ width: Math.round(S * CORE), height: Math.round(S * CORE) }} aria-hidden>
            <div className="apc-core__orb donut__core-orb" />
            <div className="donut__core-lights"><Lights segments={spec.segments} size={Math.round(S * CORE)} /></div>
          </div>
        )}
        {clean && (
          <div className="donut__ringwrap" style={{ '--ring': `${Math.round(S * RING * 560 / 488)}px` } as CSSProperties} aria-hidden>
            <StatusRing segments={spec.segments} />
          </div>
        )}
        <div className="donut__center" style={{ '--s': `${S}px` } as CSSProperties}>
          {spec.centre ? (
            <>
              <div className="donut__total">{spec.centre.value.toFixed(1)}%</div>
              <div className="donut__total-label">{spec.centre.label}</div>
              {clean && <span className="donut__underline" aria-hidden />}
              {spec.centre.caption && <div className="donut__caption">{spec.centre.caption}</div>}
            </>
          ) : (
            <>
              <div className="donut__total">{formatCount(spec.total)}</div>
              <div className="donut__total-label">{spec.totalLabel}</div>
              {clean && <span className="donut__underline" aria-hidden />}
            </>
          )}
        </div>
        {!legendMode && !clean && (
          <svg className="donut__leaders" viewBox={`${-S} ${-S} ${S * 2} ${S * 2}`} style={{ width: S * 2, height: S * 2 }} aria-hidden>
            {placed.map(({ i, right, y }) => {
              const a = angles[i];
              const r1 = S * 0.5;
              const x1 = Math.cos(a.mid) * r1;
              const y1 = Math.sin(a.mid) * r1 * SQUASH;
              const x2 = Math.cos(a.mid) * S * 0.62;
              const x3 = x2 + (right ? S * 0.08 : -S * 0.08);
              return <path key={i} d={`M ${x1} ${y1} L ${x2} ${y} L ${x3} ${y}`} stroke={spec.segments[i].accent} />;
            })}
          </svg>
        )}
        {!legendMode && !clean &&
          placed.map(({ i, right, x, y }) => {
            const a = angles[i];
            const seg = spec.segments[i];
            return (
              <div
                key={seg.key}
                className={`donut__label${right ? ' is-right' : ' is-left'}`}
                style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, '--accent': seg.accent, '--s': `${S}px` } as CSSProperties}
              >
                <div className="donut__pct">{(a.share * 100).toFixed(1)}%</div>
                <div className="donut__count">{formatCount(seg.count)}</div>
                <div className="donut__name">{seg.label}</div>
              </div>
            );
          })}
      </div>
      {legendMode && (
        <ul className="donut__legend">
          {spec.segments.map((seg, i) => (
            <li key={seg.key} style={{ '--accent': seg.accent } as CSSProperties}>
              <span className="donut__dot" />
              <span>{seg.label}</span>
              <b>{formatCount(seg.count)}</b>
              <em>{(angles[i].share * 100).toFixed(1)}%</em>
            </li>
          ))}
        </ul>
      )}
      {!clean && <div className="donut__basis">{spec.basis}</div>}
    </div>
  );
}

/** Donut; Application Outcomes v1 board; or, for Outcomes v2 on wide screens, the outcome galaxy (other devices use the v1 board). */
export function DonutView({ spec, box }: { spec: DonutSpec; box: Box }) {
  const mode = useOdinLayout().mode;
  if (spec.variant === 'galaxy' && mode === 'wide') return <OutcomeGalaxy spec={spec} />;
  // Galaxy on tablet/phone: the same board around the application-core sphere (no 3D donut).
  if (spec.variant === 'cards' || spec.variant === 'galaxy') return <OutcomeBoard spec={spec} box={box} donut={spec.variant === 'cards'} />;
  return <Donut spec={spec} box={box} />;
}
