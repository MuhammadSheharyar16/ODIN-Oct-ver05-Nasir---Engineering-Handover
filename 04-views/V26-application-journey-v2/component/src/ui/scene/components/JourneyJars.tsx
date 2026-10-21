import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { JourneySpec } from '../../../odin/types';
import type { FloorStageId } from './floorJourney';
import { useOdinLayout } from '../../bridge';
import { useExperience } from '../../../odin/experience';
import { startSpeechPreview } from '../../../audio/odinAudio';
import { prefersReducedMotion } from '../../../lib/motion';
import { ApplicationGlyph, HomeDeskScene, JarGlyph, type JarIcon } from './jarIcons';
import './jars.css';

/**
 * Application journey v2 (wide): a glass board of jars in a fixed 1920×1080
 * frame scaled to fit. An application icon travels jar to jar along the
 * route; the arriving jar glows fully, its count lights up and ODIN narrates
 * the stage. Both ICP reviews lead to one ICP decision jar, then one Approved and one
 * Rejected. Routes alternate: biometric → approved, direct → approved, biometric → rejected. Jar artwork: Figma ODIN-October, node 18:34.
 */
type Tone = 'vas' | 'icp' | 'bio' | 'ok' | 'no';
type Stage = { n: string; label: string[]; icon: JarIcon; tone: Tone; x: number; y: number; card: 'full' | 'value' | 'label' | 'name' };

const JAR: Record<Tone, string> = { vas: 'blue', icp: 'violet', bio: 'amber', ok: 'green', no: 'red' };
const TONE: Record<Tone, string> = { vas: '#5aa8ff', icp: '#a77bff', bio: '#ffae3d', ok: '#3ee08f', no: '#ff5266' };
/** Saturated tones for the neon bloom (reads on the light frosted board). */
const DEEP: Record<Tone, string> = { vas: '#1f6dff', icp: '#7b3dff', bio: '#ff8a00', ok: '#00c46a', no: '#ff1f45' };

// x = jar centre, y = jar top (frame px). Jar art is 112 × 168 (dome ≈ top 95 px, base ring at 103, base ends ≈ 116).
const S: Record<FloorStageId, Stage> = {
  home: { n: '01', label: ['Home'], icon: 'home', tone: 'vas', x: 214, y: 326, card: 'name' },
  sub: { n: '02', label: ['Application', 'Submitted'], icon: 'submit', tone: 'vas', x: 405, y: 326, card: 'full' },
  pay: { n: '03', label: ['Payments'], icon: 'card', tone: 'vas', x: 595, y: 326, card: 'full' },
  vas: { n: '04', label: ['VAS Internal', 'Review'], icon: 'review', tone: 'vas', x: 791, y: 326, card: 'full' },
  toicp: { n: '05', label: ['Submission', 'to ICP'], icon: 'upload', tone: 'icp', x: 999, y: 326, card: 'full' },
  icp1: { n: '06', label: ['ICP Review', 'Before Biometric'], icon: 'bank', tone: 'icp', x: 1218, y: 326, card: 'full' },
  bio1: { n: '07', label: ['Biometric', 'Request'], icon: 'mail', tone: 'bio', x: 813, y: 604, card: 'full' },
  bio2: { n: '08', label: ['Appointment', 'Scheduled'], icon: 'calendar', tone: 'bio', x: 1005, y: 604, card: 'full' },
  bio3: { n: '09', label: ['Biometric', 'Completed'], icon: 'finger', tone: 'bio', x: 1199, y: 604, card: 'full' },
  icp2: { n: '10', label: ['ICP Review', 'After Biometric'], icon: 'bank', tone: 'icp', x: 1395, y: 604, card: 'full' },
  dec: { n: '11', label: ['ICP', 'Decision'], icon: 'bank', tone: 'icp', x: 1548, y: 452, card: 'full' },
  ok: { n: '12', label: ['Approved'], icon: 'check', tone: 'ok', x: 1716, y: 236, card: 'label' },
  no: { n: '13', label: ['Rejected'], icon: 'cross', tone: 'no', x: 1716, y: 584, card: 'label' },
};
const ORDER = Object.keys(S) as FloorStageId[];

/** Drawn connectors (static light paths with arrowheads). */
type Link = { a: FloorStageId; b: FloorStageId; d: string };
const row = (a: FloorStageId, b: FloorStageId): Link => {
  const y = S[a].y + 52;
  return { a, b, d: `M${S[a].x + 60} ${y} L${S[b].x - 62} ${y}` };
};
const LINKS: Link[] = [
  row('home', 'sub'), row('sub', 'pay'), row('pay', 'vas'), row('vas', 'toicp'), row('toicp', 'icp1'),
  // ICP review before biometric → ICP decision (no biometric) and → the biometric branch.
  { a: 'icp1', b: 'dec', d: 'M1280 356 C1396 356 1420 504 1486 504' },
  { a: 'icp1', b: 'bio1', d: 'M1280 398 C1356 406 1356 572 1246 572 L882 572 C838 572 813 582 813 598' },
  row('bio1', 'bio2'), row('bio2', 'bio3'), row('bio3', 'icp2'),
  // ICP review after biometric → the same ICP decision.
  { a: 'icp2', b: 'dec', d: 'M1456 646 C1490 646 1458 540 1486 540' },
  // One decision → one Approved, one Rejected.
  { a: 'dec', b: 'ok', d: 'M1610 490 C1640 490 1626 288 1654 288' },
  { a: 'dec', b: 'no', d: 'M1610 540 C1640 540 1626 636 1654 636' },
];
const PILLS = [
  { text: 'No Biometric Required', x: 1380, y: 390, tone: 'icp' as Tone },
  { text: 'Biometric Required', x: 1060, y: 572, tone: 'bio' as Tone },
];

/** The application's flight between jars: an arc from dome top to dome top. */
const hover = (id: FloorStageId) => ({ x: S[id].x, y: S[id].y - 28 });
function flight(a: FloorStageId, b: FloorStageId) {
  const A = hover(a), B = hover(b);
  if (a === 'icp1' && b === 'bio1') return `M${A.x} ${A.y} C1400 ${A.y + 10} 1180 ${B.y - 40} ${B.x} ${B.y}`;
  // Quadratic peak = half the lift: adjacent hops clear the subtitle.
  const lift = Math.abs(B.x - A.x) > 300 ? 150 : 50;
  return `M${A.x} ${A.y} Q${(A.x + B.x) / 2} ${Math.min(A.y, B.y) - lift} ${B.x} ${B.y}`;
}

const MAIN: FloorStageId[] = ['home', 'sub', 'pay', 'vas', 'toicp', 'icp1'];
const BIO: FloorStageId[] = ['bio1', 'bio2', 'bio3', 'icp2'];
const ROUTES: FloorStageId[][] = [
  [...MAIN, ...BIO, 'dec', 'ok'],
  [...MAIN, 'dec', 'ok'],
  [...MAIN, ...BIO, 'dec', 'no'],
];
const FLY_MS = 820;
/** ODIN speaks only where the journey ends (approved, rejected); every other stop just lights up. */
const SPEAK_AT = new Set<FloorStageId>(['ok', 'no']);
const DWELL_MS = 1050;

const fmt = (n: number) => n.toLocaleString('en-US');

export function JourneyJars({ spec }: { spec: JourneySpec }) {
  const { width, height } = useOdinLayout();
  const k = Math.min(width / 1920, height / 1080);
  const data = spec.floor!;
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const root = useRef<HTMLDivElement>(null);
  const doc = useRef<HTMLDivElement>(null);
  const trail = useRef<SVGPathElement>(null);
  // Neon pulse riding the connector under the flying application (one per link: tail + head).
  const pulses = useRef<(SVGPathElement | null)[]>([]);
  const [tour, setTour] = useState({ route: 0, stop: 0, flying: false });

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const sceneId = () => el.closest<HTMLElement>('[data-scene]')?.dataset.scene;
    const isActive = () => {
      const st = useExperience.getState();
      return st.active?.id === sceneId() && st.leaving === undefined;
    };
    const spoken = new Set<FloorStageId>(['home']); // the opening stop is the scene's own answer
    let route = 0, stop = 0, phase: 'dwell' | 'fly' | 'gap' = 'dwell', t0 = performance.now(), dwell = 2200;
    let len = 0;
    const place = (x: number, y: number, s = 1, o = 1) => {
      if (doc.current) {
        doc.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${s})`;
        doc.current.style.opacity = String(o);
      }
    };
    const arrive = () => {
      const id = ROUTES[route][stop];
      setTour({ route, stop, flying: false });
      const say = data[id]?.say;
      const speak = SPEAK_AT.has(id) && !spoken.has(id) && !!say && isActive();
      if (speak) { spoken.add(id); startSpeechPreview(say); }
      dwell = speak ? Math.max(2200, say.split(/\s+/).length * 320 + 600) : DWELL_MS;
      if (doc.current) doc.current.style.setProperty('--doc-tone', TONE[S[id].tone]);
    };
    arrive();
    let raf = 0;
    const frame = (now: number) => {
      const el2 = now - t0;
      const r = ROUTES[route];
      if (!isActive()) { t0 = now - Math.min(el2, phase === 'dwell' ? dwell : 0); raf = requestAnimationFrame(frame); return; }
      if (phase === 'dwell') {
        const h = hover(r[stop]);
        place(h.x, h.y + (reduced ? 0 : Math.sin(now / 420) * 4));
        if (el2 > dwell) {
          t0 = now;
          if (stop >= r.length - 1) { phase = 'gap'; }
          else {
            phase = 'fly';
            // The trail path (in the DOM) doubles as the flight path for measuring.
            const t = trail.current!;
            t.setAttribute('d', flight(r[stop], r[stop + 1]));
            len = t.getTotalLength();
            t.style.strokeDasharray = `${len} ${len}`;
            t.style.strokeDashoffset = String(len);
            setTour({ route, stop, flying: true });
          }
        }
      } else if (phase === 'fly') {
        const p = reduced ? 1 : Math.min(1, el2 / FLY_MS);
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        const pt = trail.current!.getPointAtLength(len * e);
        place(pt.x, pt.y, 1 + Math.sin(Math.PI * e) * 0.18);
        if (trail.current) trail.current.style.strokeDashoffset = String(len * (1 - e));
        // The connector lights in step: a neon comet runs along it with the application.
        const li = LINKS.findIndex((l) => l.a === r[stop] && l.b === r[stop + 1]);
        for (const k of [0, 1]) {
          const pe = pulses.current[li * 2 + k];
          if (!pe) continue;
          const L = pe.getTotalLength();
          const seg = k === 0 ? 150 : 34;
          pe.style.strokeDasharray = `${seg} ${L + seg}`;
          pe.style.strokeDashoffset = String(seg - e * (L + seg * 0.4));
        }
        if (p >= 1) { stop++; phase = 'dwell'; t0 = now; arrive(); }
      } else {
        const p = Math.min(1, el2 / 700);
        const h = hover(r[stop]);
        place(h.x, h.y - p * 30, 1 - p * 0.4, 1 - p);
        if (p >= 1) { route = (route + 1) % ROUTES.length; stop = 0; phase = 'dwell'; t0 = now; arrive(); }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [data, reduced]);

  const r = ROUTES[tour.route];
  const here = r[tour.stop];
  const stateOf = (id: FloorStageId) => {
    const i = r.indexOf(id);
    if (i < 0) return 'is-off';
    if (id === here && !tour.flying) return 'is-active';
    return i <= tour.stop ? 'is-reached' : 'is-ahead';
  };
  const linkState = (l: Link) => {
    const ia = r.indexOf(l.a), ib = r.indexOf(l.b);
    if (ia < 0 || ib !== ia + 1) return 'is-off';
    return ib <= tour.stop ? 'is-reached' : tour.flying && ia === tour.stop ? 'is-live' : 'is-ahead';
  };

  return (
    <div className="jj" ref={root} style={{ '--k': k } as CSSProperties}>
      <div className="jj__frame">
        <div className="jj__board">
          {/* ODIN's speaking spectrum wraps the whole board, targeted just inside its edge so the rings stay clear of the chrome. */}
          <span className="jj__aura" data-aura="" data-surface />
          {spec.heading && (
            <header className="jj__head">
              <h2>{spec.heading.title}</h2>
              <p>{spec.heading.subtitle}</p>
            </header>
          )}
        </div>

        <svg className="jj__links" viewBox="0 0 1920 1080" aria-hidden>
          <defs>
            {(Object.keys(TONE) as Tone[]).map((t) => (
              <marker key={t} id={`jj-arrow-${t}`} viewBox="0 0 16 16" refX="11.5" refY="8" markerWidth="16" markerHeight="16" markerUnits="userSpaceOnUse" orient="auto">
                <path d="M3 2.5 12 8 3 13.5" fill="none" stroke={TONE[t]} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
                <path d="M3 2.5 12 8 3 13.5" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            ))}
            {LINKS.map((l, i) => (
              <linearGradient key={i} id={`jj-g${i}`} gradientUnits="userSpaceOnUse" x1={S[l.a].x} y1="0" x2={S[l.b].x} y2="0">
                <stop offset="0.2" stopColor={TONE[S[l.a].tone]} />
                <stop offset="1" stopColor={TONE[S[l.b].tone]} />
              </linearGradient>
            ))}
            {LINKS.map((l, i) => (
              <linearGradient key={`d${i}`} id={`jj-d${i}`} gradientUnits="userSpaceOnUse" x1={S[l.a].x} y1="0" x2={S[l.b].x} y2="0">
                <stop offset="0.2" stopColor={DEEP[S[l.a].tone]} />
                <stop offset="1" stopColor={DEEP[S[l.b].tone]} />
              </linearGradient>
            ))}
          </defs>
          {LINKS.map((l, i) => (
            <g key={i} className={`jj__link ${linkState(l)}`}>
              {/* Neon tube: wide bloom → glow → coloured core → white-hot filament, plus ambient energy flow. */}
              <path className="jj__link-shade" d={l.d} />
              <path className="jj__link-bloom" d={l.d} stroke={`url(#jj-d${i})`} />
              <path className="jj__link-glow" d={l.d} stroke={`url(#jj-d${i})`} />
              <path className="jj__link-core" d={l.d} stroke={`url(#jj-g${i})`} markerEnd={`url(#jj-arrow-${S[l.b].tone})`} />
              <path className="jj__link-hot" d={l.d} />
              <path className="jj__link-flow" d={l.d} />
              <path ref={(el) => { pulses.current[i * 2] = el; }} className="jj__link-pulse is-tail" d={l.d} stroke={DEEP[S[l.b].tone]} />
              <path ref={(el) => { pulses.current[i * 2 + 1] = el; }} className="jj__link-pulse is-head" d={l.d} />
            </g>
          ))}
          <path ref={trail} className={`jj__trail${tour.flying ? ' is-on' : ''}`} d="M0 0" />
        </svg>

        {PILLS.map((p) => (
          <span key={p.text} className="jj__pill" style={{ left: p.x, top: p.y, '--t': TONE[p.tone] } as CSSProperties}>{p.text}</span>
        ))}

        {ORDER.map((id) => {
          const s = S[id];
          const d = data[id];
          const up = (d?.delta ?? 0) >= 0;
          return (
            <div key={id} className={`jj__stage ${stateOf(id)} tone-${s.tone}`} style={{ left: s.x, top: s.y, '--t': TONE[s.tone] } as CSSProperties}>
              <div className="jj__jar">
                <span className="jj__flash" aria-hidden />
                <img src={`/journey/jar-${JAR[s.tone]}.webp`} alt="" width={112} height={168} draggable={false} />
                <span className="jj__n">{s.n}</span>
                {id === 'home' ? (
                  // Home: a girl at her desk; applications rise from the laptop and fade.
                  <span className="jj__home">
                    <HomeDeskScene />
                    {[0, 1, 2].map((i) => <i key={i} className="jj__home-doc" style={{ '--d': `${i * 0.9}s` } as CSSProperties} />)}
                  </span>
                ) : (
                  <span className="jj__icon"><JarGlyph icon={s.icon} /></span>
                )}
              </div>
              <div className={`jj__card is-${s.card}`}>
                {(s.card === 'full' || s.card === 'name' || s.card === 'label') && <div className="jj__label">{s.label.map((l) => <span key={l}>{l}</span>)}</div>}
                {s.card !== 'name' && d && (
                  <div className="jj__value" aria-label={`${s.label.join(' ')}: ${fmt(d.metric)}, ${up ? 'up' : 'down'} ${Math.abs(d.delta).toFixed(1)} percent`}>
                    <b>{fmt(d.metric)}</b>
                    <em className={up ? 'is-up' : 'is-down'}><span aria-hidden>{up ? '▲' : '▼'}</span> {Math.abs(d.delta).toFixed(1)}%</em>
                  </div>
                )}
                {d?.split && (
                  // One outcome, both routes: how many came without / after biometrics.
                  <ul className="jj__split">
                    {d.split.map((x) => <li key={x.label} style={{ '--d': TONE[x.tone] } as CSSProperties}><span>{x.label}</span><b>{fmt(x.value)}</b></li>)}
                  </ul>
                )}
              </div>
            </div>
          );
        })}

        <div ref={doc} className="jj__doc" aria-hidden>
          <span className="jj__doc-glow" />
          <ApplicationGlyph />
        </div>
      </div>
    </div>
  );
}
