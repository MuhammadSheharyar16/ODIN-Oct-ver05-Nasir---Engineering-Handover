import { useEffect, useState, type ReactNode } from 'react';
import { Building2, CalendarDays, Clock, CloudUpload, Globe2, Receipt, ShieldCheck, UserRound, ChevronRight, Info } from 'lucide-react';
import type { ChannelsSpec, PeriodsSpec, QueueSpec, RevenueSpec } from '../../../odin/types';
import type { Box, HomeLayout } from '../../../lib/homeLayout';
import { SceneIcon } from '../SceneIcon';
import { Bars, Count, DeltaTag, Plinth, css, kfmt, useProxy } from './shared';
import { Lights } from './AppCore';
import { EnergyStreams } from '../../home/EnergyStreams';
import { useOdinLayout } from '../../bridge';
import './appcore.css';
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
      <div className="jar__glass">
        <div className="jar__crown">{crown}</div>
        {children}
      </div>
    </div>
  );
}

const fmtAED = (n: number) => (n >= 1e6 ? `AED ${(n / 1e6).toFixed(1)}M` : `AED ${(n / 1e3).toFixed(0)}K`);

// ───────────────────────────── Submission channels ─────────────────────────────
export function Channels({ spec, box }: { spec: ChannelsSpec; box: Box }) {
  const ref = useProxy(`plinths:${spec.key}`, 'plinths');
  const narrow = box.w / box.h < 1.2;
  const side = (k: 'online' | 'centre') => {
    const d = spec[k];
    const accent = k === 'online' ? '#4f9cff' : '#f5ac45';
    return (
      <div className={`ch-col is-${k}`}>
        <Jar accent={accent} i={k === 'online' ? 0 : 2} crown={
          <>
            <span className="jar__icon">{k === 'online' ? <CloudUpload /> : <Building2 />}</span>
            <span className="jar__title">{k === 'online' ? 'Online' : 'Centre'}</span>
            <span className="jar__value"><Count v={d.count} /></span>
            <span className="jar__sub">{d.share.toFixed(1)}% of total</span>
            <span className="jar__rule" />
            <DeltaTag value={d.delta} basis="vs yesterday" className="jar__delta" />
          </>
        }>
          <Bars values={d.bars} accent={accent} className="jar__bars" />
        </Jar>
        <Plinth accent={accent} style={css({ width: '92%' })} noBloom />
      </div>
    );
  };
  return (
    <div className={`chs${narrow ? ' is-narrow' : ''}`} data-surface ref={ref}>
      {side('online')}
      <div className="ch-core">
        <div className="ch-core__orb" data-presence="0.5" data-aura="">
          <div className="ch-core__text">
            <span>Total applications</span>
            <b><Count v={spec.total} /></b>
          </div>
        </div>
        <Plinth accent="#7fb6ff" noBloom style={css({ width: '56%' })} />
      </div>
      {side('centre')}
      {spec.status === 'amber' && (
        <div className="pending-tag">
          <Info /> Channel field pending data-team validation (F09)
        </div>
      )}
    </div>
  );
}

// ───────────────────────────── Period comparison ─────────────────────────────
export function Periods({ spec, box }: { spec: PeriodsSpec; box: Box }) {
  const ref = useProxy(`plinths:${spec.key}`, 'plinths');
  const narrow = box.w / box.h < 1.2;
  const items = narrow ? spec.items.filter((p) => p.key !== 'prev7') : spec.items;
  return (
    <div className={`jars${narrow ? ' is-narrow' : ''}`} data-surface ref={ref}>
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
          <Plinth accent={p.accent} object="passports" scale={0.78} style={css({ width: '88%' })} />
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

// ───────────────────────────── Queue / aging ─────────────────────────────
export function Queue({ spec, box }: { spec: QueueSpec; box: Box }) {
  const ref = useProxy(`plinths:${spec.key}`, 'plinths');
  const narrow = box.w / box.h < 1.2;
  const max = Math.max(...spec.items.map((q) => q.waiting), 1);
  return (
    <div className={`jars is-queue${narrow ? ' is-narrow' : ''}`} data-surface ref={ref}>
      {!narrow && <span className="floor-aura" data-aura="floor" data-aura-from="plinths" data-rise="0.22" />}
      {spec.items.map((q, i) => (
        <div key={q.key} className="jar-col" style={css({ '--i': i, '--accent': q.accent })}>
          <Jar accent={q.accent} i={i} highlight={q.waiting === max} tall={0.82 + 0.26 * (q.waiting / max)} heat={q.waiting ? q.buckets.gt3 / q.waiting : 0} crown={
            <>
              <span className="jar__icon"><SceneIcon name={q.icon} /></span>
              <span className="jar__title">{q.label}</span>
              <span className="jar__value"><Count v={q.waiting} /></span>
              <span className="jar__sub">waiting now</span>
            </>
          } />
          <Plinth accent={q.accent} object="docStack" stack={q.waiting / max} scale={0.78} style={css({ width: '88%' })} />
          <div className="jar-stats is-aging">
            <div className="jar-stats__head">
              <span>Avg. waiting time</span>
              <b>{q.avgWait.toFixed(1)} days</b>
            </div>
            <div className="age"><i className="is-g" /> &lt; 1 day <b>{kfmt(q.buckets.lt1)}</b></div>
            <div className="age"><i className="is-a" /> 1–3 days <b>{kfmt(q.buckets.d13)}</b></div>
            <div className="age"><i className="is-r" /> &gt; 3 days <b>{kfmt(q.buckets.gt3)}</b></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ───────────────────────────── Revenue ─────────────────────────────
const SINGULAR: Record<string, string> = { countries: 'Country', centres: 'Centre', services: 'Service', nationalities: 'Nationality' };
const DIM_ICON: Record<string, ReactNode> = { countries: <Globe2 />, centres: <Building2 />, services: <Receipt />, nationalities: <UserRound /> };

/**
 * Cinematic revenue streams (v1): measured from each pillar's top to the
 * globe's lower rim, in real pixels, re-measured after the morph and on resize.
 */
function useRevenueStreams(root: HTMLElement | null, enabled: boolean) {
  const [geo, setGeo] = useState<{ w: number; h: number; core: { x: number; y: number; r: number }; jars: { x: number; y: number; w: number; h: number }[] } | null>(null);
  useEffect(() => {
    if (!root || !enabled) return;
    const measure = () => {
      const R = root.getBoundingClientRect();
      const k = R.width / (root.offsetWidth || 1);
      const core = root.querySelector('.rev__core')?.getBoundingClientRect();
      const jars = Array.from(root.querySelectorAll('.rev__col .jar'), (e) => e.getBoundingClientRect());
      if (!core || !jars.length || k <= 0) return;
      const cx = (core.left + core.width / 2 - R.left) / k, cy = (core.top + core.height / 2 - R.top) / k, r = core.width / 2 / k;
      // Each jar's crown (top third) is the capsule the energy leaves from.
      const caps = jars.map((j) => ({ x: (j.left + j.width / 2 - R.left) / k, y: (j.top - R.top) / k + (j.height / k) * 0.16, w: (j.width / k) * 0.9, h: (j.height / k) * 0.32 }));
      setGeo({ w: root.offsetWidth, h: root.offsetHeight, core: { x: cx, y: cy, r }, jars: caps });
    };
    measure();
    const t = [500, 1400, 2600].map((ms) => window.setTimeout(measure, ms));
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => { t.forEach(clearTimeout); ro.disconnect(); };
  }, [root, enabled]);
  return geo;
}

export function Revenue({ spec, box }: { spec: RevenueSpec; box: Box }) {
  const home = useOdinLayout();
  const ref = useProxy(`plinths:${spec.key}`, 'plinths');
  // Landscape phones: core on the left, compact cards on the right (no room for the 3D jars).
  const side = box.h < 320 && box.w / box.h > 2.2;
  const narrow = box.w / box.h < 1.2 || side;
  const na = !spec.preview;
  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null);
  const geo = useRevenueStreams(rootEl, !narrow);
  // Core diameter in px (matches .rev__core: 48cqh wide, 30cqh narrow).
  const coreSize = Math.round(box.h * (side ? 0.8 : narrow ? 0.3 : 0.48));
  return (
    <div className={`rev${narrow ? ' is-narrow' : ''}${side ? ' is-side' : ''}${na ? ' is-na' : ''}`} data-surface ref={(el) => { ref.current = el; setRootEl(el); }}>
      {/* The scene title already names the screen: no second heading here. */}
      <div className="rev__core" data-aura="" data-beam={spec.dims.map((d) => d.accent).join(',')} data-beam-level="0.35">
        {/* The Applications v2 sphere: deep-blue glass filled with revenue lights in the four breakdown colours. */}
        <div className="apc-core__orb rev__orb" aria-hidden />
        <div className="rev__lights"><Lights segments={spec.dims.map((d) => ({ key: d.key, label: d.label, count: Math.max(1, Math.round(d.share * 1000)), accent: d.accent }))} size={coreSize} gain={1.2} fill={0.98} /></div>
        {/* Fine gradient halo around ODIN's globe */}
        <svg className="rev__halo" viewBox="0 0 100 100" aria-hidden>
          <defs>
            <linearGradient id="rev-halo" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7fe8ff" /><stop offset=".5" stopColor="#7f9dff" /><stop offset="1" stopColor="#d08cff" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="49" className="rev__halo-track" />
          <circle cx="50" cy="50" r="49" className="rev__halo-arc" stroke="url(#rev-halo)" pathLength={1} />
        </svg>
        <div className="rev__core-text">
          <span>Total VAS revenue</span>
          <b>{na ? 'Not available' : <Count v={spec.amount ?? 0} fmt={fmtAED} />}</b>
          {na ? <em>Awaiting finance definition</em> : <DeltaTag value={spec.delta} basis="vs previous period" />}
        </div>
      </div>
      {!narrow && geo && (
        // Same energy links as Home: braided strands, drifting dust and eased comets into the core.
        <div className="rev__energy">
          <EnergyStreams
            layout={{ ...home, width: geo.w, height: geo.h, globe: geo.core, capsules: geo.jars.map((j) => ({ ...j, orientation: 'vertical' as const })) as HomeLayout['capsules'] }}
            accents={spec.dims.map((d) => d.accent)}
            land={1.02}
          />
        </div>
      )}
      {narrow ? (
        // Tablet portrait / phone: compact glass cards (the 3D jars don't fit two rows under the core).
        <div className="rev__cards">
          {spec.dims.map((d, i) => (
            <section key={d.key} className="rev__card" style={css({ '--accent': d.accent, '--i': i })} aria-label={`${d.label}: ${na ? 'not available' : fmtAED(d.value ?? 0)}`}>
              <header><span className="rev__card-ic" aria-hidden>{DIM_ICON[d.key]}</span><span>{d.label}</span></header>
              <div className="rev__card-v"><b>{na ? '—' : <Count v={d.value ?? 0} fmt={fmtAED} delay={700} />}</b><em>{na ? '' : `${(d.share * 100).toFixed(0)}%`}</em></div>
              {d.top.map((t, k) => (
                <div key={t.name} className="rev__top-row">
                  <span>{na ? `${SINGULAR[d.key] ?? 'Item'} ${k + 1}` : t.name}</span>
                  <i style={css({ '--w': `${na ? 0 : (t.value / d.top[0].value) * 100}%`, '--accent': d.accent })} />
                  <b>{na ? '—' : fmtAED(t.value)}</b>
                </div>
              ))}
            </section>
          ))}
        </div>
      ) : (
      <div className="rev__pillars">
        {spec.dims.map((d, i) => (
          <div key={d.key} className="rev__col" style={css({ '--accent': d.accent })}>
            <Jar accent={d.accent} i={i} crown={
              <>
                <span className="jar__icon">{DIM_ICON[d.key]}</span>
                <span className="jar__title">{d.label}</span>
                <span className="jar__value is-money">{na ? '—' : <Count v={d.value ?? 0} fmt={fmtAED} delay={700} />}</span>
                <span className="jar__sub">{na ? 'not available' : `${(d.share * 100).toFixed(0)}%`}</span>
              </>
            }>
              <Bars values={d.bars} accent={d.accent} className="jar__bars" />
            </Jar>
            <Plinth accent={d.accent} noBloom style={css({ width: '90%' })} />
            <div className="rev__top">
              <div className="rev__top-h">Top 3 {d.label.split(' ').pop()?.toLowerCase()}</div>
              {d.top.map((t, k) => (
                <div key={t.name} className="rev__top-row">
                  <span>{na ? `${SINGULAR[d.key] ?? 'Item'} ${k + 1}` : t.name}</span>
                  <i style={css({ '--w': `${na ? 0 : (t.value / d.top[0].value) * 100}%`, '--accent': d.accent })} />
                  <b>{na ? '—' : fmtAED(t.value)}</b>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      )}
      {/* Scope note only when it applies (30 Oct: revenue is in scope, no validation tag). */}
      {(spec.validation || na) && (
        <div className="pending-tag">
          <Info />
          {spec.validation ? 'Validation required · awaiting AEGI Finance approval · demo values' : 'Revenue awaits the finance definition'}
        </div>
      )}
    </div>
  );
}
