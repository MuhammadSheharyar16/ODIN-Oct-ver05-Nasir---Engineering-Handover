import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from 'react';
import type { PodiumColumn, PodiumsSpec } from '../../../odin/types';
import type { Box } from '../../../lib/homeLayout';
import { formatCount } from '../../../lib/format';
import { prefersReducedMotion } from '../../../lib/motion';
import { SceneIcon } from '../SceneIcon';
import { Count } from './shared';
import { HeroGlassFx } from '../HeroGlass';
import { useOdinSpot } from '../../bridge';
import './tops.css';

/**
 * Top countries, nationalities and centres.
 *  v1 · Leaderboards: three hero-glass panels composed in depth (nationalities in
 *       front, countries and centres set back), each reflected faintly on the floor.
 *       A hero #1 with its share, ranks 2–5 with bars against the leader, top-5 share.
 *  v2 · Skyline: five glass pillars per breakdown standing on the floor, heights by
 *       value, light particles rising slowly inside each pillar; the leader glows.
 * Centres are attributed applications only, so they show counts, not shares.
 */
type Mode = 'wide' | 'stack' | 'row' | 'stack-lanes';
const modeOf = (box: Box): Mode => (box.w / box.h < 1.2 ? 'stack' : box.h < 320 ? 'row' : 'wide');
const pct = (n: number, total?: number) => (total ? `${((n / total) * 100).toFixed(1)}%` : '');

export function Tops({ spec, box }: { spec: PodiumsSpec; box: Box }) {
  return <Leaderboards spec={spec} box={box} />;
}

// ───────────────────────── v1 · Leaderboards ─────────────────────────
function Panel({ col, total, compact }: { col: PodiumColumn; total?: number; compact?: boolean }) {
  const [lead, ...rest] = col.items;
  const max = lead?.value || 1;
  const share = col.share ? total : undefined;
  const top5 = col.items.reduce((a, it) => a + it.value, 0);
  return (
    <section className={`tl-card hglass${compact ? ' is-compact' : ''}`} style={{ '--accent': col.accent, '--hg-i': col.key.length % 4 } as CSSProperties} aria-label={`${col.title}: ${col.items.map((it) => `${it.label} ${formatCount(it.value)}`).join(', ')}`}>
      <HeroGlassFx />
      <header className="tl-card__hd">
        <span className="tl-badge" aria-hidden><SceneIcon name={col.icon} /></span>
        <div className="tl-card__titles"><h3>{col.title}</h3><p>{col.sub}</p></div>
      </header>
      {lead && (
        <div className="tl-lead">
          {!compact && <div className="tl-lead__k">#1</div>}
          <div className="tl-lead__n">{lead.code && <span className="tl-code">{lead.code}</span>}<span>{lead.label}</span></div>
          <div className="tl-lead__v">
            <b><Count v={lead.value} fmt={formatCount} delay={600} /></b>
            <em>{share ? `${pct(lead.value, share)}${compact ? '' : ' of all applications'}` : 'applications'}</em>
          </div>
        </div>
      )}
      <ol className="tl-rows">
        {rest.map((it, i) => (
          <li key={it.label} style={{ '--i': i } as CSSProperties}>
            <span className="tl-r">{i + 2}</span>
            <span className="tl-nm">{it.code && !compact && <span className="tl-code">{it.code}</span>}<span>{it.label}</span></span>
            <span className="tl-v"><Count v={it.value} fmt={formatCount} delay={700 + i * 80} />{share && !compact && <small>{pct(it.value, share)}</small>}</span>
            <span className="tl-bar" aria-hidden><i style={{ '--w': `${(it.value / max) * 100}%` } as CSSProperties} /></span>
          </li>
        ))}
      </ol>
      {!compact && (
        <footer className="tl-foot">
          <span>{share ? 'Top 5 share of all applications' : 'Top 5 centres combined'}</span>
          <b>{share ? pct(top5, share) : formatCount(top5)}</b>
        </footer>
      )}
    </section>
  );
}

/** FLIP: when the order changes, each panel glides from where it was to its new place. */
function useFlip(host: RefObject<HTMLDivElement | null>, dep: string, lead?: string) {
  const last = useRef(new Map<string, DOMRect>());
  useLayoutEffect(() => {
    const els = Array.from(host.current?.querySelectorAll<HTMLElement>('[data-flip]') ?? []);
    const prev = last.current;
    const next = new Map(els.map((el) => [el.dataset.flip!, el.getBoundingClientRect()]));
    if (prev.size && !prefersReducedMotion()) {
      for (const el of els) {
        const a = prev.get(el.dataset.flip!), b = next.get(el.dataset.flip!);
        if (!a || !b || (Math.abs(a.left - b.left) < 1 && Math.abs(a.top - b.top) < 1)) continue;
        const dx = a.left - b.left, dy = a.top - b.top;
        // The asked panel glides over the top; the one it replaces dims as they cross.
        const frames = el.dataset.flip === lead
          ? [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }]
          : [{ transform: `translate(${dx}px, ${dy}px)`, opacity: 1 }, { opacity: 0.2, offset: 0.5 }, { transform: 'none', opacity: 1 }];
        el.animate(frames, { duration: 900, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' });
      }
    }
    last.current = next;
  }, [host, dep, lead]);
}

/** Spotlight order: the asked breakdown in the middle, the other two either side. */
function spotOrder(cols: PodiumColumn[], spot?: string) {
  const asked = cols.find((c) => c.key === spot);
  if (!asked || cols.length !== 3) return { order: cols, asked };
  const rest = cols.filter((c) => c !== asked);
  return { order: [rest[0], asked, rest[1]], asked };
}

function Leaderboards({ spec, box }: { spec: PodiumsSpec; box: Box }) {
  const mode = modeOf(box);
  const host = useRef<HTMLDivElement>(null);
  // Wide: the middle column stands in front; the outer two set back and turned in.
  // Spotlight: the asked breakdown moves to the middle and glows; the other two step back smaller.
  const { order, asked } = spotOrder(spec.columns, useOdinSpot());
  useFlip(host, order.map((c) => c.key).join() + mode, asked?.key);
  return (
    <div ref={host} className={`tl is-${mode}${asked ? ' is-spot' : ''}`} data-surface>
      {order.map((col, i) => {
        const pos = mode !== 'wide' ? '' : i === 1 ? ' is-front' : i === 0 ? ' is-back is-left' : ' is-back is-right';
        return (
          <div key={col.key} data-flip={col.key} className={`tl-pos${col === asked ? ' is-asked' : ''}`}>
          <div className={`tl-slot${pos}${col === asked ? ' is-asked' : ''}`} data-spot-key={col.key} style={{ '--c': col.accent, '--spot': col.accent, '--i': i } as CSSProperties}>
            <Panel col={col} total={spec.total} compact={mode !== 'wide'} />
            {mode === 'wide' && (
              // Faint reflection on the floor (decorative, hidden from assistive tech).
              <div className="tl-refl" aria-hidden><div className="tl-refl__img"><Panel col={col} total={spec.total} /></div></div>
            )}
          </div>
          </div>
        );
      })}
    </div>
  );
}
