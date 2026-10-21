import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight, BarChart3, Clock, FileCheck2, FileText, Rocket, ShieldCheck, TriangleAlert, UserRound, Users, Zap } from 'lucide-react';
import type { TimeMatrixSpec } from '../../../odin/types';
import type { HomeLayout } from '../../../lib/homeLayout';
import { useOdinAsk, useOdinLayout } from '../../bridge';
import { formatCount } from '../../../lib/format';
import { EnergyStreams } from '../../home/EnergyStreams';
import { Count } from './shared';
import { HERO_GLASS, HeroChart, HeroGlassFx } from '../HeroGlass';
import { PlexusOrb } from './PlexusOrb';
import './matrix.css';

/**
 * Processing time matrix, wide screens (approved design): six glass KPI cards
 * linked to ODIN by energy strands, the end-to-end average inside ODIN's globe
 * with a gradient ring, and a stage-wise strip with filter tabs. Laid out in a
 * fixed 1920×1080 frame scaled to fit, so it matches the design pixel for pixel.
 */
const STAGE_ICON: Record<string, ReactNode> = {
  subpay: <FileText />, 'vas-review': <FileText />, 'icp-pre': <ShieldCheck />, bio: <UserRound />, 'icp-final': <FileCheck2 />,
};
const d1 = (n: number) => n.toFixed(1);
const C = { blue: '#4f9cff', violet: '#9b7bff', green: '#2fd6a0', teal: '#2fd6c0', amber: '#f5ac45' };

type Slot = { x: number; y: number; w: number; h: number };
// Two calm columns of equal cards either side of the sphere; the stage strip below.
const CW = 336, CH = 136;
const ROWS = [240, 388, 536];
const L: Slot[] = ROWS.map((y) => ({ x: 324, y, w: CW, h: CH }));
const R: Slot[] = ROWS.map((y) => ({ x: 1596, y, w: CW, h: CH }));
/** `r` is the core box (ring + readout); the visible glass sphere is ORB (its edge is where links land). */
const CORE = { x: 960, y: 392, r: 240 };
const ORB = 210;

function Card({ s, accent, icon, label, children, bars, i = 0 }: { s: Slot; accent: string; icon: ReactNode; label: string; children: ReactNode; bars?: number[]; i?: number }) {
  const max = bars ? Math.max(...bars, 1) : 1;
  // Option C: the six cards are linked to ODIN like Home capsules, so all take hero glass.
  const glass = HERO_GLASS;
  return (
    <div className={`tmx-card${glass ? ' hglass' : ''}`} style={{ left: s.x - s.w / 2, top: s.y - s.h / 2, width: s.w, height: s.h, '--a': accent, '--hg-i': i } as CSSProperties}>
      {glass && <HeroGlassFx />}
      <span className="tmx-card__badge">{icon}</span>
      <div className="tmx-card__body">
        <div className="tmx-card__label">{label}</div>
        {children}
        {bars && glass && <HeroChart kind="bars" values={bars} className="hchart--inbody" />}
        {bars && !glass && (
          <div className="tmx-card__bars" aria-hidden>
            {bars.map((v, i) => <i key={i} style={{ height: `${20 + (v / max) * 80}%`, '--i': i } as CSSProperties} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function Delta({ v, unit = '%', basis = 'vs yesterday', goodWhen = 'up' }: { v: number; unit?: string; basis?: string; goodWhen?: 'up' | 'down' }) {
  const up = v > 0;
  const good = v === 0 ? true : up === (goodWhen === 'up');
  return (
    <div className={`tmx-delta${good ? '' : ' is-warn'}`}>
      <span aria-hidden>{v > 0 ? '▲' : v < 0 ? '▼' : '•'}</span> {v > 0 ? '+' : v < 0 ? '−' : ''}{Math.abs(v).toFixed(unit === 'pp' ? 1 : 0)}{unit === 'pp' ? 'pp' : unit}
      <span className="tmx-delta__basis">{basis}</span>
    </div>
  );
}

export function TimeMatrixWide({ spec }: { spec: TimeMatrixSpec }) {
  const home = useOdinLayout();
  const ask = useOdinAsk();
  const k = Math.min(home.width / 1920, home.height / 1080);
  const slots = [...L, ...R];
  const accents = [C.blue, C.blue, C.teal, C.violet, C.green, C.amber];
  const energy: HomeLayout = {
    ...home, width: 1920, height: 1080, globe: { x: CORE.x, y: CORE.y, r: ORB },
    capsules: slots.map((s) => ({ ...s, orientation: 'horizontal' as const })) as HomeLayout['capsules'],
  };
  const ring = 2 * Math.PI * 46;
  const longestKey = spec.stages.reduce((b, x) => (x.days > b.days ? x : b), spec.stages[0])?.key;
  const highlight = spec.focusStage ?? longestKey;
  const sla = spec.sla;

  return (
    <div className="tmx" style={{ '--k': k } as CSSProperties} data-surface>
      <div className="tmx__frame">
        <div className="tmx__energy"><EnergyStreams layout={energy} accents={accents} land={1.0} /></div>

        {/* The matrix has its own data sphere (constellation in deep-blue glass); ODIN's Home globe stays out. */}
        <div className="tmx__core" data-spot-key="core" style={{ left: CORE.x - CORE.r, top: CORE.y - CORE.r, width: CORE.r * 2, height: CORE.r * 2, '--orb': `${ORB * 2}px` } as CSSProperties}>
          {/* The floor beam and ODIN's spectrum use the visible sphere, not the core box. */}
          <span className="tmx__orb-hit" data-beam="#4fd6ff,#a67cff" data-beam-level="0.45" aria-hidden />
          <PlexusOrb />
          <svg className="tmx__ring" viewBox="0 0 100 100" aria-hidden>
            <defs>
              <linearGradient id="tmxg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#3ff0ff" />
                <stop offset=".45" stopColor="#4f7dff" />
                <stop offset=".75" stopColor="#a66bff" />
                <stop offset="1" stopColor="#ff8fd6" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" className="tmx__ring-track" />
            <circle cx="50" cy="50" r="46" className="tmx__ring-fill" strokeDasharray={`${(sla ?? 0.86) * ring} ${ring}`} />
          </svg>
          <div className="tmx__readout">
            <div className="tmx__big"><Count v={spec.avg} fmt={d1} delay={650} /> <small>Days</small></div>
            <div className="tmx__lbl">Average time from<br />application to decision</div>
            <Delta v={spec.avgDelta} goodWhen="down" />
          </div>
        </div>

        <Card s={L[0]} accent={C.blue} icon={<Clock />} label="Typical time">
          <div className="tmx-card__value"><Count v={spec.median} fmt={d1} /> <small>Days</small></div>
          <Delta v={spec.medianDelta} goodWhen="down" />
        </Card>
        <Card s={L[1]} accent={C.blue} icon={<Users />} label="Online applications" bars={spec.hourly} i={1}>
          <div className="tmx-card__value"><Count v={spec.applications} fmt={(n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : formatCount(n))} /></div>
        </Card>
        <Card s={L[2]} accent={C.teal} icon={<Rocket />} label="Quickest step" i={2}>
          <div className="tmx-card__stage">{spec.fastest.label}</div>
          <div className="tmx-card__value is-sm">{d1(spec.fastest.days)} <small>Days</small></div>
        </Card>
        <Card s={R[0]} accent={C.violet} icon={<BarChart3 />} label="9 in 10 finish within" i={3}>
          <div className="tmx-card__value"><Count v={spec.p90} fmt={d1} /> <small>Days</small></div>
          <div className="tmx-card__note">90% of applications</div>
        </Card>
        <Card s={R[1]} accent={C.green} icon={<Zap />} label="On target" i={0}>
          {sla === null || sla === undefined ? (
            <>
              <div className="tmx-card__value is-na">Not available</div>
              <div className="tmx-card__note">Target not agreed yet</div>
            </>
          ) : (
            <div className="tmx-card__value">{Math.round(sla * 100)}%</div>
          )}
        </Card>
        <Card s={R[2]} accent={C.amber} icon={<TriangleAlert />} label="Slowest step" i={1}>
          <div className="tmx-card__stage">{spec.longest.label}</div>
          <div className="tmx-card__value is-sm">{d1(spec.longest.days)} <small>Days</small></div>
        </Card>

        <section className="tmx__stages" data-spot-key="stages" aria-label="Average days at each step">
          <header>
            <h2>Average days at each step</h2>
            {spec.previewNote && <span className="tmx__preview">{spec.previewNote}</span>}
            <nav className="tmx__tabs">
              {spec.tabs.map((t) => (
                <button key={t.label} type="button" className={t.active ? 'is-on' : ''} onClick={() => ask(t.ask)}>{t.label}</button>
              ))}
            </nav>
          </header>
          <div className="tmx__strip">
            {spec.stages.map((s, i) => (
              <div key={s.key} className="tmx__cell">
                {i > 0 && <ArrowRight className="tmx__arrow" aria-hidden />}
                <div className={`tmx__stage${s.key === highlight ? ' is-hi' : ''}`} style={{ '--a': s.accent, '--i': i } as CSSProperties}>
                  <span className="tmx__stage-ic">{STAGE_ICON[s.key] ?? <FileText />}</span>
                  <span className="tmx__stage-body">
                    <span className="tmx__stage-nm">{s.label}</span>
                    <b><Count v={s.days} fmt={d1} delay={700 + i * 90} /> <small>d</small></b>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
