import type { CSSProperties } from 'react';
import type { GlanceSpec } from '../../../odin/types';
import type { Box } from '../../../lib/homeLayout';
import { glanceOrb, glanceRowH } from '../../../lib/glance';
import { formatCount } from '../../../lib/format';
import { HeroGlassFx } from '../HeroGlass';
import { Count } from './shared';
import { EnergyStreams } from '../../home/EnergyStreams';
import { useOdinLayout } from '../../bridge';
import { Lights } from './AppCore';
import './glance.css';

/**
 * Answer view (answer-first, V30): the asked number inside ODIN's globe, like
 * Home's total. One metric: two supporting facts on hero-glass capsules. Two or
 * three metrics: the others as glass cards beside the globe (right, then left),
 * linked by Home's energy lines; each joins by morph as the CEO asks.
 * "Full picture" opens the full page.
 */
const fmtOf = (f: GlanceSpec['format']) =>
  f === 'percent' ? (v: number) => `${v.toFixed(1)}%` : f === 'days' ? (v: number) => v.toFixed(1) : f === 'currency' ? (v: number) => (v >= 1e6 ? `AED ${(v / 1e6).toFixed(1)}M` : `AED ${Math.round(v / 1e3)}K`) : formatCount;

export function Glance({ spec, box }: { spec: GlanceSpec; box: Box }) {
  const home = useOdinLayout();
  const o = glanceOrb(box, home);
  // Local coordinates inside the slot.
  const cx = o.x - (box.x - box.w / 2), cy = o.y - (box.y - box.h / 2);
  const side = o.r + Math.min(64, box.w * 0.04);
  const more = spec.more ?? [];
  // Two metrics: the asked metric's own fact balances the second metric (fact left, metric right).
  const fact = more.length === 1 ? spec.facts[0] : undefined;
  const n = more.length + (fact ? 1 : 0);
  // Cards: right then left of the globe (wide); a row under it (stacked).
  const cw = o.stacked ? Math.min(box.w < 700 ? 220 : 320, (box.w - 12 * (n - 1)) / Math.max(1, n)) : Math.min(400, box.w * 0.26);
  const ch = o.stacked ? glanceRowH(box) : Math.round(cw * 0.46);
  const rowY = o.rowY - (box.y - box.h / 2);
  const slot = (i: number) => {
    if (o.stacked) {
      const total = n * cw + (n - 1) * 12;
      return { x: box.w / 2 - total / 2 + cw / 2 + i * (cw + 12), y: rowY };
    }
    return { x: cx + (i === 0 ? 1 : -1) * (side + 70 + cw / 2), y: cy };
  };
  // Stacked rows read left to right: the fact first, then the metric.
  const cards = more.map((m, i) => ({ m, ...slot(o.stacked && fact ? i + 1 : i) }));
  const factAt = fact ? slot(o.stacked ? 0 : 1) : null;
  return (
    <div className={`glance${o.stacked ? ' is-stacked' : ''}${box.w >= 700 ? ' is-roomy' : ''}`} style={{ '--r': `${o.r}px`, '--c': spec.accent } as CSSProperties} data-surface>
      {/* ODIN's globe sits here: the floor beam rises into it, and ODIN's spectrum circles it while it speaks. */}
      {/* The answer sphere (Applications v2 style): deep-blue glass filled with status lights. The floor beam rises into it; ODIN's spectrum circles it while it speaks. */}
      <div className="glance__sphere" data-answer-sphere style={{ left: cx - o.r, top: cy - o.r, width: o.r * 2, height: o.r * 2 } as CSSProperties}>
        <span className="apc-core__orb glance__orb" aria-hidden data-beam={(spec.lights ?? []).map((l) => l.accent).join(',') || spec.accent} data-beam-narrow data-aura data-answer-globe />
        {spec.lights && <span className="glance__lights" aria-hidden><Lights segments={spec.lights} size={Math.round(o.r * 2)} fill={0.98} /></span>}
      </div>
      <div className="glance__readout" style={{ left: cx, top: cy, '--vs': Math.min(1, 6 / fmtOf(spec.format)(spec.value).length) } as CSSProperties} {...(spec.item ? { 'data-morph': `ans:${spec.item}`, 'data-accent': spec.accent } : {})} aria-label={`${spec.label}: ${fmtOf(spec.format)(spec.value)}${spec.format === 'days' ? ' days' : ''}`}>
        <div className="glance__k">{spec.label}</div>
        <b className="glance__v">
          <Count v={spec.value} fmt={fmtOf(spec.format)} delay={500} memo={spec.item ? `ans:${spec.item}` : undefined} />
          {spec.format === 'days' && <small> days</small>}
        </b>
        {spec.caption && <div className="glance__c">{spec.caption}</div>}
      </div>
      {!o.stacked && cards.length > 0 && (
        <div className="glance__energy" aria-hidden>
          <EnergyStreams
            layout={{ ...home, width: box.w, height: box.h, globe: { x: cx, y: cy, r: o.r }, capsules: cards.map((c) => ({ x: c.x, y: c.y, w: cw, h: ch, orientation: 'horizontal' as const })) as typeof home.capsules }}
            accents={cards.map((c) => c.m.accent)}
            land={1.02}
          />
        </div>
      )}
      {cards.map((c, i) => (
        <section key={c.m.item} className="glance__card hglass" data-morph={`ans:${c.m.item}`} data-accent={c.m.accent} data-spot-key={c.m.item}
          style={{ left: c.x - cw / 2, top: c.y - ch / 2, width: cw, height: ch, '--accent': c.m.accent, '--hg-i': i + 1 } as CSSProperties}
          aria-label={`${c.m.label}: ${fmtOf(c.m.format)(c.m.value)}`}>
          <HeroGlassFx />
          <div className="glance__card-k"><i aria-hidden />{c.m.label}</div>
          <b className="glance__card-v"><Count v={c.m.value} fmt={fmtOf(c.m.format)} delay={400} memo={`ans:${c.m.item}`} />{c.m.format === 'days' && <small> days</small>}</b>
          {c.m.caption && <div className="glance__card-c">{c.m.caption}</div>}
        </section>
      ))}
      {fact && factAt && (
        <section className="glance__card is-fact hglass" style={{ left: factAt.x - cw / 2, top: factAt.y - ch / 2, width: cw, height: ch, '--accent': spec.accent, '--hg-i': 0 } as CSSProperties} aria-label={`${fact.label}: ${fact.value}`}>
          <HeroGlassFx />
          <div className="glance__card-k">{fact.label}</div>
          <b className="glance__card-v">{fact.value}</b>
          <div className="glance__card-c">{spec.label}</div>
        </section>
      )}
      {!fact && <div className="glance__facts" style={o.stacked ? { top: rowY - ch / 2 } : { top: cy, '--side': `${side}px` } as CSSProperties}>
        {spec.facts.map((f, i) => (
          <section key={f.label} className={`glance__fact hglass is-${i ? 'r' : 'l'}`} style={{ '--hg-i': i } as CSSProperties}>
            <HeroGlassFx />
            <span className="glance__fact-k">{f.label}</span>
            <b className="glance__fact-v">{f.value}</b>
          </section>
        ))}
      </div>}
    </div>
  );
}
