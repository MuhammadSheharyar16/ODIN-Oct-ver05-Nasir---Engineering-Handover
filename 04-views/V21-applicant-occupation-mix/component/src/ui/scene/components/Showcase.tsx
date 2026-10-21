import { Check, ChevronRight, X } from 'lucide-react';
import type { GeoSpec, JourneySpec, PodiumsSpec, RingSpec } from '../../../odin/types';
import type { Box } from '../../../lib/homeLayout';
import { SceneIcon } from '../SceneIcon';
import { Bars, Count, DeltaTag, Plinth, css, flag, kfmt, useProxy } from './shared';
import { HeroGlassFx } from '../HeroGlass';

// ───────────────────────────── Triple podium ranking ─────────────────────────────
/** Design: "Top Countries + Nationalities + Centres". */
export function Podiums({ spec, box }: { spec: PodiumsSpec; box: Box }) {
  const narrow = box.w / box.h < 1.2;
  return (
    <div className={`pod${narrow ? ' is-narrow' : ''}`} data-surface>
      {spec.columns.map((c, ci) => (
        <div key={c.key} className="pod__col" data-spot-key={c.key} style={css({ '--accent': c.accent, '--spot': c.accent, '--ci': ci })}>
          <div className="pod__panel">
            <span className="pod__badge">
              <SceneIcon name={c.icon} />
            </span>
            <div className="pod__title">{c.title}</div>
            <div className="pod__sub">{c.sub}</div>
            <ol className="pod__steps">
              {c.items.map((it, i) => (
                <li key={it.label} className="pod__step" style={css({ '--i': i, '--w': `${100 - i * 9}%` })}>
                  <span className="pod__rank">{i + 1}</span>
                  <span className="pod__plate">
                    {it.code ? <span className="pod__flag">{flag(it.code)}</span> : <span className="pod__glyph"><SceneIcon name={c.icon} /></span>}
                    <span className="pod__name">
                      {it.label}
                      <b><Count v={it.value} delay={600 + i * 90} /></b>
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="pod__base" />
        </div>
      ))}
      <div className="pod__odin" data-presence="0.5" data-aura="" />
    </div>
  );
}

// ───────────────────────────── Earth geo ranking ─────────────────────────────
/** Top five in an arc around the globe (framing it, never covering it). */
const TOP_SLOTS = [
  { x: 50, y: -2 },
  { x: 27, y: 14 },
  { x: 73, y: 14 },
  { x: 21, y: 38 },
  { x: 79, y: 38 },
];
const BOTTOM_X = [16, 33, 50, 67, 84];

/** Module-level so React keeps its state (count-up) across Geo re-renders. */
const GeoCard = ({ it, rank, big }: { it: GeoSpec['items'][number]; rank: number; big?: boolean }) => (
  <div className={`geo-card hglass${big ? ' is-big' : ''}`} style={css({ '--i': rank, '--hg-i': rank % 4 })}>
    <HeroGlassFx />
    <span className="geo-card__rank">{rank}</span>
    <span className="geo-card__flag">{flag(it.code)}</span>
    <span className="geo-card__body">
      <span className="geo-card__name">{it.name}</span>
      <b><Count v={it.value} delay={500 + rank * 70} /></b>
      <DeltaTag value={it.delta} />
    </span>
  </div>
);

/** Design: "Top countries by visas processed" — 3D Earth with floating cards. */
export function Geo({ spec, box }: { spec: GeoSpec; box: Box }) {
  const narrow = box.w / box.h < 1.2;
  const plinths = useProxy(`plinths:${spec.key}`, 'plinths');
  const pins = spec.items.map((it, i) => ({ lat: it.lat, lon: it.lon, value: it.value, accent: i < 5 ? '#ffd28a' : '#9fd0ff' }));
  const earth = useProxy(`earth:${spec.key}`, 'earth', { pins, focusLon: 55, focusLat: 22 });
  const top = spec.items.slice(0, 5);
  const rest = spec.items.slice(5, 10);
  if (narrow) {
    return (
      <div className="geo is-narrow" data-surface ref={plinths}>
        <div className="geo__earth" ref={earth} data-aura="" />
        <div className="geo__list">
          {spec.items.slice(0, 8).map((it, i) => (
            <GeoCard key={it.code} it={it} rank={i + 1} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="geo" data-surface ref={plinths}>
      {/* The scene title already names the screen and its basis: no second heading here. */}
      <div className="geo__earth" ref={earth} data-aura="" />
      {top.map((it, i) => (
        <div key={it.code} className="geo__slot" style={css({ left: `${TOP_SLOTS[i].x}%`, top: `${TOP_SLOTS[i].y}%` })}>
          <GeoCard it={it} rank={i + 1} big={i === 0} />
        </div>
      ))}
      {rest.map((it, i) => (
        <div key={it.code} className="geo__base" style={css({ left: `${BOTTOM_X[i]}%` })}>
          <Bars values={[3, 6, 4, 9, 5, 8, 6, 10, 7].map((v) => v * (0.6 + it.value / spec.items[0].value))} accent="#7fc0ff" className="geo__spikes" />
          <GeoCard it={it} rank={i + 6} />
          <Plinth accent="#4f9cff" noBloom style={css({ width: '76%' })} />
        </div>
      ))}
    </div>
  );
}

// ───────────────────────────── Flat glowing ring donut ─────────────────────────────
/** Callout positions around the ring, pushed apart per side so small neighbours never collide. */
function spreadLabels<T extends { mid: number }>(arcs: T[]) {
  // Two callout columns either side of ODIN's spectrum, never over it.
  const pts = arcs.map((a) => {
    const right = Math.cos(a.mid) >= 0;
    const x = 50 + Math.cos(a.mid) * 70;
    return { a, right, x: right ? Math.max(x, 114) : Math.min(x, -14), y: Math.min(94, Math.max(6, 50 + Math.sin(a.mid) * 60)) };
  });
  for (const side of [true, false]) {
    const s = pts.filter((p) => p.right === side).sort((p, q) => p.y - q.y);
    for (let i = 1; i < s.length; i++) if (s[i].y - s[i - 1].y < 24) s[i].y = s[i - 1].y + 24;
    const over = s.length ? s[s.length - 1].y - 96 : 0;
    if (over > 0) s.forEach((p) => (p.y = Math.max(4, p.y - over)));
  }
  return pts;
}

/** Design: "6 for any donut charts" — flat glowing ring with callouts. */
export function Ring({ spec, box }: { spec: RingSpec; box: Box }) {
  const total = spec.segments.reduce((a, s) => a + s.count, 0) || 1;
  const narrow = box.w / box.h < 1.05 || box.w < 560;
  const R = 40;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const arcs = spec.segments.map((s) => {
    const len = (s.count / total) * C;
    const a = { ...s, len, off: acc, mid: ((acc + len / 2) / C) * Math.PI * 2 - Math.PI / 2, share: (s.count / total) * 100 };
    acc += len;
    return a;
  });
  return (
    <div className={`ring2${narrow ? ' is-narrow' : ''}`} data-surface>
      <div className="ring2__stage" data-aura="" style={{ borderRadius: '50%' }}>
        <svg viewBox="0 0 100 100" className="ring2__svg" aria-hidden>
          <defs>
            <filter id="ring2glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="50" cy="50" r={R} className="ring2__track" />
          <g transform="rotate(-90 50 50)" filter="url(#ring2glow)">
            {arcs.map((a, i) => (
              <circle
                key={a.key}
                cx="50"
                cy="50"
                r={R}
                className="ring2__seg"
                stroke={a.accent}
                strokeDasharray={`${Math.max(0, a.len - 0.8)} ${C}`}
                strokeDashoffset={-a.off}
                style={css({ '--i': i })}
              />
            ))}
          </g>
          <circle cx="50" cy="50" r="30" className="ring2__inner" />
        </svg>
        <div className="ring2__center">
          <b><Count v={spec.total} /></b>
          <span>{spec.totalLabel}</span>
        </div>
        {!narrow &&
          spreadLabels(arcs).map(({ a, x, y, right }) => {
            return (
              <div key={a.key} className={`ring2__label${right ? ' is-r' : ' is-l'}`} style={css({ left: `${x}%`, top: `${y}%`, '--accent': a.accent })}>
                <b>{a.share.toFixed(1)}%</b>
                <span>{kfmt(a.count)}</span>
                <em>{a.label}</em>
              </div>
            );
          })}
      </div>
      {narrow && (
        <ul className="ring2__legend">
          {arcs.map((a) => (
            <li key={a.key} style={css({ '--accent': a.accent })}>
              <i /> {a.label} <b>{kfmt(a.count)}</b> <em>{a.share.toFixed(1)}%</em>
            </li>
          ))}
        </ul>
      )}
      <div className="ring2__basis">{spec.basis}</div>
    </div>
  );
}

// ───────────────────────────── Journey map (orbs) ─────────────────────────────
/** Design: "3.2 journey map secondary option" — glass orbs on pedestals along a ribbon. */
export function JourneyOrbs({ spec, box }: { spec: JourneySpec; box: Box }) {
  const ref = useProxy(`plinths:orbs:${spec.key}`, 'plinths');
  const narrow = box.w / box.h < 1.2;
  const all = [
    ...spec.stages.map((s) => ({ key: s.key, label: s.label, icon: s.icon as string, accent: s.accent, count: s.count, days: s.days, delta: s.delta, kind: 'stage' })),
    { key: 'approved', label: 'Approved', icon: 'approved', accent: '#33d69a', count: spec.approved.count, days: spec.approved.days, delta: spec.approved.delta, kind: 'out' },
  ];
  const n = all.length;
  // Every station stands on the same floor line (gentle arc toward the viewer mid-journey).
  const ys = all.map((_, i) => 40 + 4 * Math.sin((i / (n - 1)) * Math.PI));
  // The slowest stage keeps a brighter orb; ODIN's floor spectrum covers the whole map.
  const slowest = all.slice(0, -1).reduce((b, s, i, a) => (s.days > a[b].days ? i : b), 0);
  const xs = all.map((_, i) => 8 + (i * 84) / (n - 1));
  const ribbon = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i] - 2}`).join(' ');
  return (
    <div className={`jorbs${narrow ? ' is-narrow' : ''}`} data-surface ref={ref}>
      {!narrow && <span className="floor-aura" data-aura="floor" data-aura-from="plinths" data-rise="0.2" />}
      {!narrow && (
        <svg className="jorbs__ribbon" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <path d={ribbon} className="jorbs__ribbon-glow" />
          <path d={ribbon} className="jorbs__ribbon-core" />
        </svg>
      )}
      {all.map((s, i) => (
        <div key={s.key} className="jorb" style={narrow ? css({ '--i': i }) : css({ left: `${xs[i]}%`, top: `${ys[i]}%`, '--i': i, '--accent': s.accent })}>
          <div className={`jorb__orb${i === slowest ? ' is-focus' : ''}`} style={css({ '--accent': s.accent })}>
            <SceneIcon name={s.icon as never} />
          </div>
          <div className="jorb__card" style={css({ '--accent': s.accent })}>
            <span className="jorb__label">{s.label}</span>
            <b><Count v={s.count} delay={500 + i * 110} /></b>
            <DeltaTag value={s.delta ?? null} />
            <span className="jorb__days">Avg. {s.days.toFixed(1)} days</span>
          </div>
          {!narrow && <Plinth accent={s.accent} noBloom style={css({ width: '70%' })} />}
          {!narrow && i < n - 1 && <ChevronRight className="jorb__chev" />}
        </div>
      ))}
      <div className="jorbs__rej" style={css({ '--accent': '#ff4f63' })}>
        <X /> Rejected <b>{kfmt(spec.rejected.count)}</b>
      </div>
      <span hidden>
        <Check />
      </span>
    </div>
  );
}
