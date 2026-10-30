import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { JourneySpec } from '../../../../odin/types';
import { useOdinLayout } from '../../../bridge';
import { prefersReducedMotion } from '../../../../lib/motion';
import { useJourneyDetail } from '../../../../lib/journeyDetail';
import { FLOOR_CX, FLOOR_FOOTPRINT, floorScale, type FloorStageId } from '../floorJourney';
import { CAPTURE_SCALE, ROUTES, TONES, type CardStage, type Fr, type SceneId, type Tone } from './data';
import { FLOOR_FLAT, STAGE4, WAITING4, type UnitId } from './v4';
import { CHIPS42, DETAIL42, EDGES42, FLOOR42, HOME_STEPS, NEXT42, PREV42, STAGES42, UNITS42 } from './v42';
import { FloorParticles, type Comet, type Stream } from './FloorParticles';
import { FloorRings } from './FloorRings';
import { StoryFx } from './StoryFx';
import { TRAVEL_MS, useTour } from './useTour';
import './cinema.css';
import './journey42.css';

/**
 * Online Visa Journey v4.5 (V39), from Anupam's 27 Oct reviews and Nasir's brief:
 *  · a stage card on the left whose numbers follow the tour; every stage along the bottom;
 *  · equal, smaller units in between, the route drawn by the particle floor (FloorParticles)
 *    at the home sphere's quality: silk streams, a soft trail behind the application and a pool of light
 *    on the stage it reaches; the highlighted stage glows in its phase colour, with light rippling
 *    outward on the floor from its base (FloorRings); story animations with captions (StoryFx);
 *  · Home's step cards light the step the applicant is on (submit · pay · wait);
 *  · the title and ODIN summary sit higher; the Ask ODIN bar stays below the stage strip (journey42.css);
 *  · ODIN speaks only the summary;
 *  · one application icon carries the journey: it rests on the plinth of the stage the tour
 *    is at, travels each route to the next, and ends with ✓ (approved) or ✕ (rejected); from VAS
 *    to ICP the story's folder carries the application, so the icon steps aside for that leg;
 *  · detail view ("tell me more" / the Detail view button): the stage the tour is at grows into a
 *    single hero on the left while everything else fades out; as the tour moves it glides and
 *    cross-fades into the next stage, its animation still playing, and the stage dashboard on the
 *    right follows it, until it is closed.
 */
const ASSET = `${import.meta.env.BASE_URL}journey-v42/`;
/** Phase colours, softened (Anupam: lighter shades, no heavy glow). */
const soft = (t: Tone) => `color-mix(in srgb, ${TONES[t]} 62%, #ffffff)`;
/** Stream colours: the full phase colours, so particles read on the bright floor. */
const STREAM_HEX: Record<Tone, string> = { home: '#4f9cff', vas: '#1fc6a8', icp: '#9a72ff', bio: '#ff9a3c', ok: '#2fd481', no: '#ff5468' };
/** The route streams: the same phases, desaturated toward white, so the floor glows softly (27 Oct). */
const STREAM_SOFT: Record<Tone, string> = { home: '#93bfff', vas: '#86dccc', icp: '#bfa9fb', bio: '#fcc391', ok: '#8be3b3', no: '#fb9ca6' };
const pct = (n: number, d: number) => `${Math.round((n / Math.max(1, d)) * 100)}%`;
const fmt = (n: number) => n.toLocaleString('en-US');
const ROUTE_NAMES = ['Biometric → approved', 'Direct → approved', 'Biometric → rejected'];

const UNITS = UNITS42;
const STEPS = HOME_STEPS, STEP_BOX = [0.2, 0.17];

export function JourneyCinema42({ spec }: { spec: JourneySpec }) {
  const host = useRef<HTMLDivElement>(null);
  const { width: W, height: H, mic } = useOdinLayout();
  const floorBottom = mic.y - mic.h / 2;
  const sy = floorScale(H, floorBottom);
  const sx = Math.min(sy, W / 1920);
  const kx = sx / CAPTURE_SCALE, ky = sy / CAPTURE_SCALE, u = Math.min(kx, ky);
  const X = (x: number) => W / 2 + (x - 960) * kx;
  const Y = (y: number) => y * ky;
  const pts = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number).map((v, i) => (i % 2 ? Y(v) : X(v)));
  const data = spec.floor!;
  const reduced = prefersReducedMotion();

  // Detail view: longer stops so the dashboard can be read.
  const detailOn = useJourneyDetail((s) => s.on);
  const dwell = useRef(2600);
  useEffect(() => { dwell.current = detailOn ? 4800 : 2600; }, [detailOn]);
  useEffect(() => () => useJourneyDetail.getState().set(false), []);
  // Hide the mic bar and lift the title and summary while this view is open.
  useEffect(() => {
    document.documentElement.dataset.journey42 = '1';
    return () => { delete document.documentElement.dataset.journey42; };
  }, []);

  const { tour, route, active } = useTour(host, ROUTES, data, reduced, false, dwell);
  const reached = new Set<FloorStageId>(route.slice(0, tour.stop + 1));
  const unitOf = (id: FloorStageId) => STAGE4[id].unit;
  const activeUnit = active ? unitOf(active) : null;
  const reachedUnits = new Set([...reached].map(unitOf));
  const shown: CardStage = route[tour.stop];
  const travelEdge = tour.travel ? EDGES42.find((e) => e.a === route[tour.stop] && e.b === route[tour.stop + 1]) : undefined;
  const r: readonly FloorStageId[] = route;
  const edgeDone = (a: FloorStageId, b: FloorStageId) => {
    const ia = r.indexOf(a), ib = r.indexOf(b);
    return ia >= 0 && ib === ia + 1 && ib <= tour.stop;
  };

  const at = (s: SceneId, k: string) => {
    const g = UNITS[s], h = g.w * g.aspect;
    const f: Fr = g.at[k];
    return { x: X(g.cx) + (f[0] - 0.5) * g.w * u, y: Y(g.by) + (f[1] - g.ay) * h * u };
  };
  const cap = (s: SceneId) => { const g = UNITS[s]; return g.at.cap ? at(s, 'cap') : { x: X(g.cx), y: Y(g.by) - g.ay * g.w * g.aspect * u - 2 * u }; };

  // Particle floor: streams (density = share of submissions), pool, comet.
  const streams: Stream[] = EDGES42.filter((e) => e.ribbon !== false).map((e) => ({
    id: `${e.a}-${e.b}`, p: pts(e.d), c0: STREAM_SOFT[e.c[0]], c1: STREAM_SOFT[e.c[1]],
    weight: data[e.b].metric / Math.max(1, data.sub.metric),
    state: travelEdge === e ? 'live' : edgeDone(e.a, e.b) ? 'done' : 'idle',
  }));
  const ag = activeUnit ? UNITS[activeUnit] : null;
  const pool = ag && active ? { x: X(ag.cx), y: Y(ag.by) - 6 * u, r: ag.w * 0.75 * u, c: STREAM_HEX[STAGE4[active].tone] } : null;
  // Orbit round the highlighted step only: gone while the application travels, back at the next stage.
  const orbitUnit = activeUnit;
  const og = orbitUnit ? UNITS[orbitUnit] : null;
  const orbit = og && orbitUnit ? { x: X(og.cx), y: Y(og.by) - 4 * u, rx: og.w * 0.68 * u, h: og.w * og.aspect * 0.6 * u, c: STREAM_HEX[og.tone] } : null;
  // Keep the last stage's depth while its swirl fades out (the target is null during travel).
  const [orbitZ, setOrbitZ] = useState(1000);
  useEffect(() => { if (og) setOrbitZ(Math.round(og.by) * 2); }, [og]);
  // The light beam runs only on the route into the highlighted stage (or the one being travelled).
  const beamId = travelEdge ? `${travelEdge.a}-${travelEdge.b}` : tour.stop > 0 ? `${route[tour.stop - 1]}-${route[tour.stop]}` : null;
  const [comet, setComet] = useState<Comet>(null);
  const cometKey = travelEdge ? `${tour.route}-${tour.stop}` : '';
  useEffect(() => {
    if (!travelEdge || travelEdge.ribbon === false || (travelEdge.a === 'vas' && travelEdge.b === 'toicp')) { setComet(null); return; }
    setComet({ p: pts(travelEdge.d), c: STREAM_HEX[STAGE4[travelEdge.b].tone], start: performance.now(), dur: TRAVEL_MS });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cometKey, W, H]);

  // The application icon rests on the floor just in front of the stage's plinth, clear of its name plate.
  const restAt = (id: CardStage) => {
    const g = UNITS[unitOf(id)];
    return { x: X(g.cx) + g.w * 0.3 * u, y: Y(g.by) + g.w * 0.16 * u };
  };
  const pathPx = (d: string) => { const p = pts(d); return `M${p[0]},${p[1]} C${p[2]},${p[3]} ${p[4]},${p[5]} ${p[6]},${p[7]}`; };
  // VAS → ICP is carried by the story's folder (StoryFx 'toicp'), so the icon and its trail step aside for that leg.
  const viaFolder = (tour.travel && travelEdge?.a === 'vas' && travelEdge.b === 'toicp') || (!tour.travel && shown === 'toicp');
  const appTravel = tour.travel && travelEdge && travelEdge.ribbon !== false && !viaFolder ? travelEdge : null;
  const appRest = restAt(viaFolder && tour.travel ? 'vas' : shown);
  const appTone = TONES[STAGE4[appTravel ? appTravel.b : shown].tone];
  const appHidden = viaFolder;
  const appEnd = !appTravel && (shown === 'ok' || shown === 'no') ? shown : null;

  // Home's step cards: submit → pay → wait while VAS and ICP work.
  const homeStep = shown === 'sub' ? 'submit' : shown === 'pay' ? 'pay' : WAITING4.includes(shown) ? 'wait' : null;
  const hg = UNITS.home, hh = hg.w * hg.aspect;
  const stepAt = (k: keyof typeof HOME_STEPS) => ({ x: X(hg.cx) + (STEPS[k][0] - 0.5) * hg.w * u, y: Y(hg.by) + (STEPS[k][1] - hg.ay) * hh * u });

  // Detail mode: the journey steps back to the left half (one calm move, no zoom-in).
  // Refined detail view: one hero stage on the left (the one the tour is at, kept through each travel).
  const heroUnit = unitOf(shown);
  const hgU = UNITS[heroUnit];
  const heroS = Math.min(3, Math.max(2, 440 / hgU.w));
  const heroP = { x: X(hgU.cx), y: Y(hgU.by) - 0.32 * hgU.w * hgU.aspect * u };
  const heroCam = `translate(${(X(480) - heroP.x * heroS).toFixed(1)}px, ${(Y(590) - heroP.y * heroS).toFixed(1)}px) scale(${heroS.toFixed(3)})`;
  const hero = detailOn;
  const cam = hero ? heroCam : 'none';

  const ft = FLOOR_FOOTPRINT;
  const meta = STAGES42.find((s) => s.id === shown)!;
  const sd = data[shown];
  const prev = PREV42[shown], next = NEXT42[shown];
  const tone = STAGE4[shown].tone;
  const unitStages = (id: UnitId) => STAGES42.filter((s) => unitOf(s.id) === id).map((s) => s.id);

  return (
    <div ref={host} className={`jc jc4 jc42${detailOn ? ' is-detail' : ''}${hero ? ' is-hero' : ''}`} data-surface style={{ '--u': u } as CSSProperties}>
      <span className="fj__aura" data-aura="floor" data-rise="0.09"
        style={{ left: W / 2 + (ft.x0 - FLOOR_CX) * sx, top: ft.y0 * sy, width: (ft.x1 - ft.x0) * sx, height: (ft.y1 - ft.y0) * sy }} />

      <div className={`j42__cam${reduced ? ' is-still' : ''}`} style={{ transform: cam }}>
        <FloorParticles W={W} H={H} u={u} streams={streams} pool={pool} comet={comet} beam={beamId} flat={FLOOR_FLAT} reduced={reduced} paused={hero}
          floor={{ x0: X(FLOOR42.x0), x1: X(FLOOR42.x1), y0: Y(FLOOR42.y0), y1: Y(FLOOR42.y1) }} />
        <FloorRings W={W} H={H} u={u} target={orbit} reduced={reduced} zBack={orbitZ - 1} zFront={orbitZ + 1} />

        {(Object.keys(UNITS) as UnitId[]).map((s) => {
          const g = UNITS[s], h = g.w * g.aspect;
          const state = s === activeUnit ? 'is-active' : reachedUnits.has(s) ? 'is-reached' : 'is-idle';
          const ids = unitStages(s);
          return (
            <div key={s} className="j42__unitwrap">
              <img className={`jc4__unit ${state}${s === heroUnit ? ' is-hero' : ''}`} src={`${ASSET}${g.img}.webp`} alt="" draggable={false}
                style={{ left: X(g.cx) - (g.w * u) / 2, top: Y(g.by) - g.ay * h * u, width: g.w * u, zIndex: Math.round(g.by) * 2,
                  transformOrigin: `50% ${g.ay * 100}%`, '--c': TONES[g.tone] } as CSSProperties} />
              {s === 'home' && (
                <span className={`j42__pill is-pair${ids.includes(active as CardStage) ? ' is-on' : ''}`} style={{ left: X(g.cx), top: Y(g.by) - g.ay * h * u - 6 * u, zIndex: 2190, '--c': soft(g.tone) } as CSSProperties}>
                  {ids.map((id) => (
                    <span key={id} className={id === active ? 'is-on' : ''}><em>{id === 'sub' ? 'Submitted' : 'Paid'}</em><Count v={data[id].metric} run={id === active && !reduced} /></span>
                  ))}
                </span>
              )}
              {s !== 'home' && ids.length === 1 && (
                <span className={`j42__pill${ids[0] === active ? ' is-on' : ''}`} style={{ left: X(g.cx), top: Y(g.by) - g.ay * h * u - 4 * u, zIndex: 2190, '--c': soft(g.tone) } as CSSProperties}>
                  <Count v={data[ids[0]].metric} run={ids[0] === active && !reduced} />
                </span>
              )}
            </div>
          );
        })}

        {/* Home: the step the applicant is on */}
        {homeStep && (
          <span key={homeStep} className="j42__step" style={{ left: stepAt(homeStep).x, top: stepAt(homeStep).y, width: hg.w * STEP_BOX[0] * u, height: hh * STEP_BOX[1] * u, zIndex: Math.round(hg.by) * 2 + 1 } as CSSProperties} />
        )}

        {/* The application, from home to the decision */}
        {appTravel ? (
          <span key={`t${tour.route}-${tour.stop}`} className="j42__app is-travel" style={{ offsetPath: `path('${pathPx(appTravel.d)}')`, animationDuration: `${TRAVEL_MS}ms`, '--c': appTone } as CSSProperties}>
            <AppIcon />
          </span>
        ) : (
          <span key={`r${tour.route}-${tour.stop}`} className={`j42__app${appHidden ? ' is-hidden' : ''}${reduced ? ' is-still' : ''}`}
            style={{ left: appRest.x, top: appRest.y, zIndex: 2140, '--c': appTone } as CSSProperties}>
            <AppIcon end={appEnd} />
          </span>
        )}

        <div className="jc__fx jc__fx--story">
          {active && <StoryFx key={`${tour.route}-${active}`} stage={active} tone={TONES[STAGE4[active].tone]} at={at} cap={cap(unitOf(active))} reduced={reduced} />}
          {active && !hero && WAITING4.includes(active) && <StoryFx key="wait" stage="wait" tone={TONES.home} at={at} reduced={reduced} />}
        </div>

        {CHIPS42.map((c) => (
          <span key={c.text} className="jc__chip j42__chip" style={{ left: X(c.x), top: Y(c.y), '--c': TONES[c.tone] } as CSSProperties}>{c.text}</span>
        ))}
      </div>

      {/* Left: the stage the application is at */}
      {!detailOn && (
        <aside className="j42__card" style={{ left: X(40), top: Y(262), '--u': u, '--c': soft(tone), '--k': TONES[tone] } as CSSProperties}>
          <div key={shown} className="j42__cardin">
            <div className="j42__kicker"><i />Stage {meta.plate} · {meta.phase}</div>
            <h2>{meta.label}</h2>
            <p className="j42__desc">{meta.desc}</p>
            <div className="j42__big"><Count v={sd.metric} run={!reduced} /><span>{meta.noun}</span></div>
            <div className={`j42__delta ${sd.delta >= 0 ? 'is-up' : 'is-down'}`}>{sd.delta >= 0 ? '▲' : '▼'} {Math.abs(sd.delta).toFixed(1)}% vs yesterday</div>
            <dl className="j42__rows">
              {shown !== 'sub' && <div><dt>Share of submissions</dt><dd>{pct(sd.metric, data.sub.metric)}</dd></div>}
              {prev && <div><dt>Carried on from {STAGES42.find((s) => s.id === prev)!.label.toLowerCase()}</dt><dd>{pct(sd.metric, data[prev].metric)}</dd></div>}
              {next && <div><dt>Still at this stage</dt><dd>{fmt(Math.max(0, sd.metric - data[next].metric))}</dd></div>}
              {sd.split?.map((p) => <div key={p.label}><dt><i style={{ background: soft(p.tone) }} />{p.label}</dt><dd>{fmt(p.value)}</dd></div>)}
            </dl>
            <div className="j42__route">
              {ROUTE_NAMES.map((n, i) => <span key={n} className={i === tour.route ? 'is-on' : ''}>{n}</span>)}
            </div>
            <div className="j42__prog"><i style={{ width: `${((tour.stop + 1) / route.length) * 100}%` }} /></div>
            <div className="j42__progtx">Stop {tour.stop + 1} of {route.length} on this route</div>
          </div>
          <button type="button" className="j42__btn" onClick={() => useJourneyDetail.getState().set(true)}>Detail view <b aria-hidden>→</b></button>
        </aside>
      )}

      {/* Detail view: stage dashboard on the right, following the tour */}
      {detailOn && <DetailPanel shown={shown} data={data} routeIdx={tour.route} stop={tour.stop} len={route.length} left={X(940)} top={Y(262)} u={u} reduced={reduced} />}

      {/* Bottom: every stage with its live number */}
      <div className="j42__strip" style={{ left: X(40), top: Y(888), '--u': u } as CSSProperties}>
        {STAGES42.map((s) => {
          const v = data[s.id], st = s.id === shown ? ' is-on' : reached.has(s.id) ? ' is-seen' : '';
          return (
            <div key={s.id} className={`j42__tile${st}`} style={{ '--c': soft(STAGE4[s.id].tone), '--k': TONES[STAGE4[s.id].tone] } as CSSProperties}>
              <div className="j42__tk"><em>{s.plate}</em>{s.phase}</div>
              <div className="j42__tl">{s.short}</div>
              <div className="j42__tn"><Count v={v.metric} run={s.id === shown && !reduced} /><i className={v.delta >= 0 ? 'is-up' : 'is-down'}>{v.delta >= 0 ? '▲' : '▼'}{Math.abs(v.delta).toFixed(1)}%</i></div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

/** The application: a small glass form (photo, lines, a tone-coloured header); ✓ / ✕ at the end. */
function AppIcon({ end }: { end?: 'ok' | 'no' | null }) {
  return (
    <i className="j42__doc" aria-hidden>
      <b className="j42__dochd" /><b className="j42__docph" /><b className="j42__docl" /><b className="j42__docl" /><b className="j42__docl" />
      {end && <em className={`j42__docend is-${end}`}>{end === 'ok' ? '✓' : '✕'}</em>}
    </i>
  );
}

function DetailPanel({ shown, data, routeIdx, stop, len, left, top, u, reduced }: {
  shown: CardStage; data: NonNullable<JourneySpec['floor']>; routeIdx: number; stop: number; len: number; left: number; top: number; u: number; reduced: boolean;
}) {
  const meta = STAGES42.find((s) => s.id === shown)!;
  const d = DETAIL42[shown], v = data[shown], tone = STAGE4[shown].tone;
  const prev = PREV42[shown];
  const max = Math.max(...d.mix.map((m) => m[1]));
  // 7-day trend shaped from today's count and change (demo).
  const trend = Array.from({ length: 7 }, (_, i) => v.metric * (1 - (v.delta / 100) * ((6 - i) / 6)) * (1 + Math.sin(i * 1.7 + v.metric) * 0.03));
  const lo = Math.min(...trend), hi = Math.max(...trend);
  const path = trend.map((y, i) => `${i ? 'L' : 'M'}${(i / 6) * 300},${70 - ((y - lo) / Math.max(1, hi - lo)) * 56}`).join(' ');
  return (
    <section className="j42__detail" style={{ left, top, '--u': u, '--c': soft(tone), '--k': TONES[tone] } as CSSProperties} aria-live="polite">
      <div key={shown} className="j42__din">
        <header>
          <div>
            <div className="j42__kicker"><i />Stage {meta.plate} · {meta.phase} · {ROUTE_NAMES[routeIdx]} · stop {stop + 1} of {len}</div>
            <h2>{meta.label}</h2>
            <p className="j42__desc">{meta.desc}</p>
          </div>
          <div className="j42__hd">
            <span className="j42__demo">Demo breakdown · not live</span>
            <button type="button" className="j42__close" onClick={() => useJourneyDetail.getState().set(false)}>← Back to journey</button>
          </div>
        </header>
        <div className="j42__kpis">
          <div><b><Count v={v.metric} run={!reduced} /></b><span>{meta.noun}</span></div>
          <div><b className={v.delta >= 0 ? 'is-up' : 'is-down'}>{v.delta >= 0 ? '▲' : '▼'} {Math.abs(v.delta).toFixed(1)}%</b><span>vs yesterday</span></div>
          <div><b>{pct(v.metric, data.sub.metric)}</b><span>of submissions</span></div>
          <div><b>{prev ? pct(v.metric, data[prev].metric) : d.days ? `${d.days} d` : '—'}</b><span>{prev ? 'carried on from the stage before' : 'typical time here'}</span></div>
        </div>
        <div className="j42__cols">
          <div className="j42__box">
            <h3>{d.mixTitle}</h3>
            {d.mix.map(([k, s]) => (
              <div key={k} className="j42__bar"><span>{k}</span><i><b style={{ width: `${(s / max) * 100}%` }} /></i><em>{fmt(Math.round(v.metric * s))}</em></div>
            ))}
            {v.split && <div className="j42__splitrow">{v.split.map((p) => <span key={p.label}><i style={{ background: soft(p.tone) }} />{p.label} <b>{fmt(p.value)}</b></span>)}</div>}
          </div>
          <div className="j42__box">
            <h3>Last 7 days</h3>
            <svg className="j42__spark" viewBox="0 0 300 76" preserveAspectRatio="none" aria-hidden>
              <path d={`${path} L300,76 L0,76 Z`} className="j42__sparkfill" />
              <path d={path} className="j42__sparkline" />
            </svg>
            <h3>Stage insights</h3>
            <ul className="j42__ins">
              {d.insights.map(([t, k]) => <li key={t} className={`is-${k}`}><i aria-hidden>{k === 'up' ? '↗' : k === 'warn' ? '!' : 'i'}</i>{t}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Counts up from zero each time its stage becomes active. */
function Count({ v, run }: { v: number; run: boolean }) {
  const [n, setN] = useState(v);
  useEffect(() => {
    if (!run) { setN(v); return; }
    let raf = 0; const t0 = performance.now();
    const step = (t: number) => { const k = Math.min(1, (t - t0) / 700); setN(Math.round(v * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [v, run]);
  return <b>{n.toLocaleString('en-US')}</b>;
}
