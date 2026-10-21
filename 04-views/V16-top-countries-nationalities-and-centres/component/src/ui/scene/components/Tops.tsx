import { useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react';
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
  return spec.variant === 'skyline' ? <Skyline spec={spec} box={box} /> : <Leaderboards spec={spec} box={box} />;
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

// ───────────────────────── v2 · Skyline ─────────────────────────
const rgbOf = (h: string) => { const n = parseInt(h.slice(1), 16); return `${n >> 16},${(n >> 8) & 255},${n & 255}`; };

/** Light motes rising slowly inside each pillar (or flowing along each lane), clipped to the glass. */
function useMotes(root: RefObject<HTMLDivElement | null>, canvas: RefObject<HTMLCanvasElement | null>, accent: string, dir: 'up' | 'right') {
  const reduced = useMemo(() => prefersReducedMotion(), []);
  useEffect(() => {
    const host = root.current, cv = canvas.current, g = cv?.getContext('2d');
    if (!host || !cv || !g) return;
    const spr = document.createElement('canvas'); spr.width = spr.height = 20;
    const sx = spr.getContext('2d')!; const gr = sx.createRadialGradient(10, 10, 0, 10, 10, 10); const c = rgbOf(accent);
    gr.addColorStop(0, '#fff'); gr.addColorStop(0.22, `rgba(${c},1)`); gr.addColorStop(0.55, `rgba(${c},.25)`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    sx.fillStyle = gr; sx.fillRect(0, 0, 20, 20);
    type Mote = { u: number; t: number; v: number; s: number; a: number; ph: number };
    let rects: { x: number; y: number; w: number; h: number; r: number; lead: boolean; m: Mote[] }[] = [];
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const measure = () => {
      const R = host.getBoundingClientRect();
      const k = R.width / (host.offsetWidth || 1) || 1;
      cv.width = Math.round(host.offsetWidth * dpr); cv.height = Math.round(host.offsetHeight * dpr);
      cv.style.width = `${host.offsetWidth}px`; cv.style.height = `${host.offsetHeight}px`;
      rects = Array.from(host.querySelectorAll<HTMLElement>('[data-pillar]'), (el, i) => {
        const b = el.getBoundingClientRect();
        const lead = el.dataset.pillar === 'lead';
        const w = b.width / k, h = b.height / k;
        const n = Math.round((dir === 'up' ? h * w : h * w) / (lead ? 260 : 420)) + (lead ? 10 : 4);
        const old = rects[i]?.m;
        const m = old?.length === n ? old : Array.from({ length: n }, () => ({ u: Math.random(), t: Math.random(), v: 0.035 + Math.random() * 0.06, s: 0.7 + Math.random() * 1.6, a: 0.45 + Math.random() * 0.55, ph: Math.random() * 6.28 }));
        return { x: (b.left - R.left) / k, y: (b.top - R.top) / k, w, h, r: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 8, lead, m };
      });
    };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(host);
    const t0 = [400, 1400].map((ms) => window.setTimeout(measure, ms));
    let raf = 0, last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
      g.globalCompositeOperation = 'lighter';
      for (const p of rects) {
        g.save(); g.beginPath(); g.roundRect(p.x + 2, p.y + 2, p.w - 4, p.h - 4, Math.max(0, p.r - 2)); g.clip();
        for (const m of p.m) {
          if (!reduced) { m.t += m.v * dt * (p.lead ? 1.25 : 1); if (m.t > 1) { m.t -= 1; m.u = Math.random(); } }
          const sway = Math.sin(now / 1400 + m.ph) * 0.03;
          const fade = Math.min(1, m.t * 6, (1 - m.t) * 4);
          const x = dir === 'up' ? p.x + (0.12 + (m.u + sway) * 0.76) * p.w : p.x + m.t * p.w;
          const y = dir === 'up' ? p.y + p.h - m.t * p.h : p.y + (0.2 + (m.u + sway) * 0.6) * p.h;
          const s = m.s * (p.lead ? 1.35 : 1) * 2.2;
          g.globalAlpha = fade * m.a * (p.lead ? 1 : 0.75);
          g.drawImage(spr, x - s, y - s, s * 2, s * 2);
        }
        g.restore();
      }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); t0.forEach(clearTimeout); };
  }, [root, canvas, accent, dir, reduced]);
}

function Group({ col, mode, legend, asked, children }: { col: PodiumColumn; mode: Mode; legend?: boolean; asked?: boolean; children?: ReactNode }) {
  const bars = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const lanes = mode === 'row' || mode === 'stack-lanes';
  useMotes(bars, cv, col.accent, lanes ? 'right' : 'up');
  const max = col.items[0]?.value || 1;
  return (
    <section className={`sk-grp${lanes ? ' is-lanes' : ''}${asked ? ' is-asked' : ''}`} data-spot-key={col.key} data-flip={col.key} style={{ '--c': col.accent, '--spot': col.accent } as CSSProperties}
      aria-label={`${col.title}: ${col.items.map((it) => `${it.label} ${formatCount(it.value)}`).join(', ')}`}>
      <header className="sk-grp__hd">
        <span className="tl-badge" aria-hidden><SceneIcon name={col.icon} /></span>
        <span className="sk-grp__t"><b>{col.title}</b><small>{col.sub}</small></span>
      </header>
      {lanes ? (
        <div className="sk-lanes" ref={bars}>
          <canvas ref={cv} className="sk-motes" aria-hidden />
          {col.items.map((it, i) => (
            <div key={it.label} className={`sk-lane${i ? '' : ' is-lead'}`} style={{ '--i': i } as CSSProperties}>
              <span className="sk-lane__nm"><em>{i + 1}</em>{it.label}</span>
              <span className="sk-lane__track"><i data-pillar={i ? 'n' : 'lead'} style={{ '--w': `${(it.value / max) * 100}%` } as CSSProperties} /></span>
              <b className="sk-lane__v"><Count v={it.value} fmt={formatCount} delay={600 + i * 70} /></b>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="sk-bars" ref={bars}>
            <span className="sk-floor" aria-hidden />
            {col.items.map((it, i) => (
              <div key={it.label} className={`sk-col${i ? '' : ' is-lead'}`} style={{ '--i': i, '--h': `${28 + (it.value / max) * 72}%` } as CSSProperties}>
                <b className="sk-val"><Count v={it.value} fmt={formatCount} delay={700 + i * 80} /></b>
                <div className="sk-pillar" data-pillar={i ? 'n' : 'lead'}>
                  {!i && <span className="sk-beam" aria-hidden />}
                  <span className="sk-rk">{i + 1}</span>
                </div>
              </div>
            ))}
            <canvas ref={cv} className="sk-motes" aria-hidden />
          </div>
          {legend ? (
            // Pillars too narrow for names: a numbered legend matching the rank on each pillar.
            <div className="sk-legend">{col.items.map((it, i) => <span key={it.label}><em>{i + 1}</em>{it.label}</span>)}</div>
          ) : (
            <div className="sk-names">{col.items.map((it) => <span key={it.label} title={it.label}>{it.label}</span>)}</div>
          )}
        </>
      )}
      {children}
    </section>
  );
}

function Skyline({ spec, box }: { spec: PodiumsSpec; box: Box }) {
  const base = modeOf(box);
  // Pillars everywhere except phones (lanes). When a pillar is too narrow for its name, names move to a legend.
  const mode: Mode = base === 'stack' && box.w < 560 ? 'stack-lanes' : base;
  const cell = mode === 'wide' ? (box.w * 0.92 / 3 - 40) / 5 : box.w / 5 - 12;
  const legend = cell < 92;
  const host = useRef<HTMLDivElement>(null);
  const { order, asked } = spotOrder(spec.columns, useOdinSpot());
  useFlip(host, order.map((c) => c.key).join() + mode, asked?.key);
  return (
    <div ref={host} className={`sk is-${mode}${legend ? ' has-legend' : ''}${asked ? ' is-spot' : ''}`} data-surface>
      {order.map((col) => <Group key={col.key} col={col} mode={mode} legend={legend} asked={col === asked} />)}
    </div>
  );
}
