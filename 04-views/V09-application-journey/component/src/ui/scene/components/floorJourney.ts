import { requestFrame, cancelFrame } from '../../../lib/ticker';
/**
 * Application journey on the ODIN interior floor (imperative renderer).
 * Both ICP reviews (before and after biometrics) lead to one ICP decision, which
 * splits into a single Approved and a single Rejected (21 Oct).
 *
 * Laid out in the 1920×1080 reference frame of the floor camera push
 * (envFit.floorView) and mapped to the screen: y follows the floor exactly
 * (the push keeps the floor band proportional to screen height), x is centred
 * and compresses on narrower screens. Colour encodes meaning:
 *   blue = VAS online · violet = ICP · amber = biometric branch · green / red = outcome.
 * A traveller walks the route; the arriving stage's glass card lights up and
 * ODIN speaks that stage (onArrive).
 */

export type FloorStageId =
  | 'home' | 'sub' | 'pay' | 'vas' | 'toicp' | 'icp1'
  | 'bio1' | 'bio2' | 'bio3' | 'icp2' | 'dec' | 'ok' | 'no';
/** `split`: an outcome's total by route (without biometric / after biometric). */
export type FloorStageData = { metric: number; delta: number; say: string; split?: { label: string; value: number; tone: 'icp' | 'bio' }[] };
export type FloorData = Record<FloorStageId, FloorStageData>;

type Pt = { x: number; y: number };
type Tone = 'vas' | 'icp' | 'bio' | 'ok' | 'no';
type Def = { n?: number; title: string; icon: string; tone: Tone; p: Pt; below?: boolean; end?: 'ok' | 'no' };

const TONE: Record<Tone, [string, string, string]> = {
  vas: ['#9cc8ff', '#3d84f7', '#1d4fc4'],
  icp: ['#c9b2ff', '#8a5cf6', '#5a2fc2'],
  bio: ['#ffd99a', '#f2a33a', '#c26a12'],
  ok: ['#a6f3cf', '#22c98a', '#0f8a5c'],
  no: ['#ffb3ba', '#f24b5f', '#b8202f'],
};

const DEFS: Record<FloorStageId, Def> = {
  home: { n: 1, title: 'Home', icon: 'home', tone: 'vas', p: { x: 318, y: 840 } },
  sub: { n: 2, title: 'Application submission', icon: 'submit', tone: 'vas', p: { x: 510, y: 748 } },
  pay: { n: 3, title: 'Payments', icon: 'card', tone: 'vas', p: { x: 712, y: 706 } },
  vas: { n: 4, title: 'VAS internal review', icon: 'review', tone: 'vas', p: { x: 902, y: 676 } },
  toicp: { n: 5, title: 'Submission to ICP', icon: 'upload', tone: 'icp', p: { x: 1080, y: 646 } },
  icp1: { n: 6, title: 'ICP review · before biometric', icon: 'bank', tone: 'icp', p: { x: 1262, y: 622 } },
  bio1: { n: 7, title: 'Biometric request', icon: 'mail', tone: 'bio', p: { x: 900, y: 862 }, below: true },
  bio2: { n: 8, title: 'Appointment scheduled', icon: 'calendar', tone: 'bio', p: { x: 1120, y: 872 }, below: true },
  bio3: { n: 9, title: 'Biometric completed', icon: 'finger', tone: 'bio', p: { x: 1340, y: 864 }, below: true },
  icp2: { n: 10, title: 'ICP review · after biometric', icon: 'bank', tone: 'icp', p: { x: 1560, y: 830 }, below: true },
  dec: { n: 11, title: 'ICP decision', icon: 'bank', tone: 'icp', p: { x: 1660, y: 690 } },
  ok: { title: 'Approved', icon: 'check', tone: 'ok', p: { x: 1835, y: 560 }, end: 'ok' },
  no: { title: 'Rejected', icon: 'x', tone: 'no', p: { x: 1835, y: 880 }, end: 'no', below: true },
};

type EdgeDef = { a: FloorStageId; b: FloorStageId; c: [Tone, Tone]; label?: string; ctrl?: [Pt, Pt]; k?: number };
const EDGES: EdgeDef[] = [
  { a: 'home', b: 'sub', c: ['vas', 'vas'] },
  { a: 'sub', b: 'pay', c: ['vas', 'vas'] },
  { a: 'pay', b: 'vas', c: ['vas', 'vas'] },
  { a: 'vas', b: 'toicp', c: ['vas', 'icp'] },
  { a: 'toicp', b: 'icp1', c: ['icp', 'icp'] },
  { a: 'icp1', b: 'dec', c: ['icp', 'icp'], label: 'No biometric required', k: 0.55 },
  { a: 'icp1', b: 'bio1', c: ['icp', 'bio'], label: 'Biometric required', ctrl: [{ x: 1270, y: 760 }, { x: 960, y: 740 }] },
  { a: 'bio1', b: 'bio2', c: ['bio', 'bio'] },
  { a: 'bio2', b: 'bio3', c: ['bio', 'bio'] },
  { a: 'bio3', b: 'icp2', c: ['bio', 'icp'] },
  { a: 'icp2', b: 'dec', c: ['icp', 'icp'], ctrl: [{ x: 1640, y: 800 }, { x: 1660, y: 760 }] },
  { a: 'dec', b: 'ok', c: ['icp', 'ok'], k: 0.5 },
  { a: 'dec', b: 'no', c: ['icp', 'no'], k: 0.5 },
];
/** Tours: biometric → approved, direct → approved, biometric → rejected (both outcomes shown). */
const ROUTES: FloorStageId[][] = [
  ['home', 'sub', 'pay', 'vas', 'toicp', 'icp1', 'bio1', 'bio2', 'bio3', 'icp2', 'dec', 'ok'],
  ['home', 'sub', 'pay', 'vas', 'toicp', 'icp1', 'dec', 'ok'],
  ['home', 'sub', 'pay', 'vas', 'toicp', 'icp1', 'bio1', 'bio2', 'bio3', 'icp2', 'dec', 'no'],
];

/** Footprint of the route in the reference frame (for ODIN's floor spectrum). */
export const FLOOR_FOOTPRINT = { x0: 220, x1: 1900, y0: 470, y1: 1000 };

/** Vertical scale: follows the floor push; lifts slightly if the mic bar would cover the near row. */
export const floorScale = (H: number, floorBottom: number) => Math.min(H / 1080, (floorBottom - 12) / 985);

/** Horizontal centre of the journey's footprint (equal left/right padding). */
export const FLOOR_CX = 1065;

const depth = (y: number) => 0.62 + ((y - 500) / 420) * 0.5;
const NS = 'http://www.w3.org/2000/svg';
function hex(a: string) { const n = parseInt(a.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function mix(a: string, b: string, t: number) { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; }

const SHAPES: Record<string, string> = {
  home: '<path d="M50 12 L88 44 L82 51 L78 48 L78 86 L22 86 L22 48 L18 51 L12 44 Z"/><g fill="#ffffff" fill-opacity=".92"><rect x="40" y="56" width="9" height="9" rx="1.5"/><rect x="51" y="56" width="9" height="9" rx="1.5"/><rect x="40" y="67" width="9" height="9" rx="1.5"/><rect x="51" y="67" width="9" height="9" rx="1.5"/></g>',
  submit: '<path d="M26 8 H60 L76 24 V90 H26 Z"/><g stroke="#ffffff" stroke-opacity=".92" stroke-width="5" stroke-linecap="round"><path d="M36 38 H62"/><path d="M36 50 H58"/><path d="M36 62 H50"/></g><circle cx="70" cy="74" r="16" fill="#ffffff"/><path d="M70 83 V66 M62 73 L70 65 L78 73" stroke="var(--deep)" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  card: '<rect x="10" y="22" width="66" height="46" rx="8" transform="rotate(-9 43 45)"/><rect x="10" y="32" width="66" height="9" fill="#ffffff" fill-opacity=".55" transform="rotate(-9 43 45)"/><rect x="18" y="50" width="16" height="10" rx="2" fill="#ffd27a" transform="rotate(-9 43 45)"/><g fill="#ffd67a" stroke="#b98622" stroke-width="1.6"><ellipse cx="78" cy="86" rx="13" ry="5"/><ellipse cx="78" cy="79" rx="13" ry="5"/><ellipse cx="78" cy="72" rx="13" ry="5"/><ellipse cx="78" cy="65" rx="13" ry="5"/></g>',
  review: '<path d="M20 8 H54 L70 24 V86 H20 Z"/><g stroke="#ffffff" stroke-opacity=".92" stroke-width="5" stroke-linecap="round"><path d="M30 36 H56"/><path d="M30 48 H52"/><path d="M30 60 H42"/></g><circle cx="62" cy="64" r="15" fill="#ffffff" fill-opacity=".35" stroke="#ffffff" stroke-width="6"/><path d="M73 75 L88 90" stroke="#ffffff" stroke-width="9" stroke-linecap="round"/>',
  upload: '<path d="M28 78 A18 18 0 0 1 26 42 A24 24 0 0 1 72 36 A20 20 0 0 1 74 78 Z"/><path d="M50 84 V50 M37 62 L50 49 L63 62" stroke="#ffffff" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  bank: '<path d="M50 8 L90 30 V37 H10 V30 Z"/><g><rect x="18" y="42" width="11" height="36" rx="2"/><rect x="35" y="42" width="11" height="36" rx="2"/><rect x="54" y="42" width="11" height="36" rx="2"/><rect x="71" y="42" width="11" height="36" rx="2"/></g><rect x="8" y="80" width="84" height="10" rx="2"/><circle cx="50" cy="25" r="5" fill="#ffffff" fill-opacity=".9"/>',
  mail: '<rect x="10" y="24" width="80" height="58" rx="9"/><path d="M14 30 L50 58 L86 30" fill="none" stroke="#ffffff" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>',
  calendar: '<rect x="12" y="18" width="76" height="70" rx="10"/><rect x="12" y="18" width="76" height="17" rx="9" fill="#ffffff" fill-opacity=".45"/><g fill="#ffffff" fill-opacity=".9"><rect x="22" y="44" width="11" height="9" rx="2"/><rect x="38" y="44" width="11" height="9" rx="2"/><rect x="54" y="44" width="11" height="9" rx="2"/><rect x="70" y="44" width="9" height="9" rx="2"/><rect x="22" y="58" width="11" height="9" rx="2"/><rect x="38" y="58" width="11" height="9" rx="2"/><rect x="54" y="58" width="11" height="9" rx="2" fill="#ffd27a" fill-opacity="1"/><rect x="22" y="72" width="11" height="9" rx="2"/><rect x="38" y="72" width="11" height="9" rx="2"/></g><path d="M32 10 V26 M68 10 V26" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>',
  finger: '<rect x="16" y="10" width="68" height="80" rx="20"/><g fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round"><path d="M35 74 C31 60 33 40 50 40 C67 40 69 60 65 74"/><path d="M28 62 C25 41 35 29 50 29 C65 29 75 41 72 62"/><path d="M43 78 C41 66 43 51 50 51 C57 51 59 66 57 78"/><path d="M50 61 V80"/></g>',
  check: '<circle cx="50" cy="50" r="40"/><path d="M30 52 L45 66 L72 36" stroke="#ffffff" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  x: '<circle cx="50" cy="50" r="40"/><path d="M34 34 L66 66 M66 34 L34 66" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>',
};
let uid = 0;
function iconSVG(icon: string, tone: Tone, flat?: string) {
  const [L, M, D] = TONE[tone];
  const id = `fji${++uid}`;
  return `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow:visible;--deep:${D}" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2=".25" y2="1"><stop offset="0" stop-color="${mix(L, '#ffffff', 0.35)}"/><stop offset=".5" stop-color="${M}"/><stop offset="1" stop-color="${D}"/></linearGradient></defs>
    <g fill="${flat ?? `url(#${id})`}">${SHAPES[icon]}</g>
    ${flat ? '' : '<path d="M18 22 Q34 8 56 11" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/>'}
  </svg>`;
}

const PERSON = `
<svg viewBox="-40 -10 200 280" width="200" height="280" style="position:absolute;left:-90px;top:-262px;overflow:visible" aria-hidden="true">
  <defs>
    <linearGradient id="fjJkt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#efe6da"/><stop offset="1" stop-color="#c9bba8"/></linearGradient>
    <linearGradient id="fjJean" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a3d63"/><stop offset="1" stop-color="#1b2a48"/></linearGradient>
    <linearGradient id="fjBag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f3a4f"/><stop offset="1" stop-color="#151c2a"/></linearGradient>
    <linearGradient id="fjCase" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2d3850"/><stop offset=".5" stop-color="#1c2438"/><stop offset="1" stop-color="#2a3349"/></linearGradient>
    <radialGradient id="fjPs" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="rgba(8,16,40,.45)"/><stop offset="1" stop-color="rgba(8,16,40,0)"/></radialGradient>
  </defs>
  <ellipse cx="62" cy="262" rx="62" ry="12" fill="url(#fjPs)"/>
  <g><rect x="96" y="176" width="40" height="72" rx="8" fill="url(#fjCase)"/><path d="M104 182 V242 M128 182 V242" stroke="#3b4762" stroke-width="2"/><rect x="108" y="150" width="4" height="28" fill="#9aa3b5"/><rect x="120" y="150" width="4" height="28" fill="#9aa3b5"/><rect x="106" y="146" width="20" height="6" rx="3" fill="#1c2438"/><circle cx="102" cy="252" r="4" fill="#0e1424"/><circle cx="130" cy="252" r="4" fill="#0e1424"/></g>
  <g data-p="legB" style="transform-origin:58px 150px"><path d="M50 148 L48 242 Q48 250 56 250 L60 250 L64 150 Z" fill="url(#fjJean)"/><path d="M42 246 Q42 256 52 257 L68 257 Q72 251 64 246 Z" fill="#f2f4f7"/></g>
  <g data-p="legF" style="transform-origin:70px 150px"><path d="M62 150 L66 244 Q67 251 74 251 L78 251 L80 148 Z" fill="url(#fjJean)"/><path d="M62 248 Q62 258 72 259 L90 259 Q93 252 84 247 Z" fill="#ffffff"/></g>
  <path d="M44 74 Q46 60 64 58 Q84 60 86 76 L88 150 Q66 156 44 150 Z" fill="url(#fjJkt)"/>
  <path d="M46 150 Q66 156 88 150 L88 156 Q66 162 46 156 Z" fill="#b8a993"/>
  <g data-p="armB" style="transform-origin:48px 80px"><path d="M44 78 Q36 110 38 140 Q40 146 46 144 Q50 112 54 84 Z" fill="#ddd2c3"/><circle cx="42" cy="144" r="6" fill="#e8b994"/></g>
  <path d="M36 72 Q40 62 54 62 L62 64 L62 132 Q48 136 38 128 Q32 100 36 72 Z" fill="url(#fjBag)"/>
  <path d="M40 84 H58 M40 104 H58" stroke="#3d4a62" stroke-width="2"/>
  <path d="M56 64 Q66 68 64 120" stroke="#10151f" stroke-width="4" fill="none"/>
  <g data-p="armF" style="transform-origin:82px 80px"><path d="M78 78 Q92 102 96 126 Q98 134 104 132 Q100 104 90 78 Z" fill="#e6dccd"/><circle cx="102" cy="134" r="6" fill="#e8b994"/></g>
  <g data-p="phone" opacity="0"><path d="M80 82 Q90 96 98 104 Q102 108 106 102 Q96 90 90 78 Z" fill="#e6dccd"/><rect x="102" y="84" width="11" height="19" rx="2.5" fill="#1b2335" transform="rotate(18 107 94)"/><rect x="104" y="86.5" width="7" height="13" rx="1.5" fill="#7cc4ff" transform="rotate(18 107 94)"/></g>
  <rect x="58" y="44" width="12" height="16" rx="5" fill="#d9a882"/>
  <ellipse cx="66" cy="30" rx="17" ry="20" fill="#e8b994"/>
  <path d="M48 28 Q48 6 66 8 Q86 8 84 30 Q80 20 70 20 Q58 18 52 34 Z" fill="#1a1a22"/>
  <path d="M48 28 Q46 40 54 44 Q50 34 52 28 Z" fill="#1a1a22"/>
</svg>`;

export type FloorOptions = {
  width: number;
  height: number;
  /** Screen y the journey must stay above (top of the mic bar). */
  floorBottom: number;
  reduced: boolean;
  /** Return false to pause the tour (scene leaving / not active). */
  isActive: () => boolean;
  /** Called when the traveller arrives; `first` is the opening stop (already spoken by the director). */
  onArrive: (id: FloorStageId, say: string, first: boolean) => void;
  /** Words → dwell time estimate (ms) so the walk waits for ODIN's sentence. */
  dwellFor: (say: string) => number;
};

export function mountFloorJourney(host: HTMLElement, data: FloorData, o: FloorOptions) {
  const W = o.width, H = o.height;
  const sy = floorScale(H, o.floorBottom);
  const sx = Math.min(sy, W / 1920);
  const u = Math.min(sx, sy);
  const X = (x: number) => W / 2 + (x - FLOOR_CX) * sx;
  const Y = (y: number) => y * sy;
  const P = (p: Pt) => ({ x: X(p.x), y: Y(p.y) });

  host.innerHTML = '';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'fj__svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('aria-hidden', 'true');
  host.appendChild(svg);
  const layer = document.createElement('div');
  layer.className = 'fj__layer';
  host.appendChild(layer);
  const mk = <K extends keyof SVGElementTagNameMap>(t: K, a: Record<string, string | number>, p: Element = svg) => {
    const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, String(a[k])); p.appendChild(e); return e;
  };
  const fid = `fj${++uid}`;
  const defs = mk('defs', {});
  defs.innerHTML = `
    <filter id="${fid}g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${7 * u}"/></filter>
    <filter id="${fid}g2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${3 * u}"/></filter>
    <filter id="${fid}s" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${16 * u}"/></filter>`;

  // ── road ──
  type EdgeRT = EdgeDef & { path: SVGPathElement; len: number; parts: SVGElement[]; chev: SVGGElement };
  const edges: EdgeRT[] = [];
  const gRoad = mk('g', {});
  const gChev = mk('g', {});
  EDGES.forEach((e, i) => {
    const A = P(DEFS[e.a].p), B = P(DEFS[e.b].p);
    let d: string;
    if (e.ctrl) { const c1 = P(e.ctrl[0]), c2 = P(e.ctrl[1]); d = `M ${A.x} ${A.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${B.x} ${B.y}`; }
    else { const dx = (B.x - A.x) * (e.k ?? 0.5); d = `M ${A.x} ${A.y} C ${A.x + dx} ${A.y}, ${B.x - dx} ${B.y}, ${B.x} ${B.y}`; }
    const w = 34 * depth((DEFS[e.a].p.y + DEFS[e.b].p.y) / 2) * u;
    const c0 = TONE[e.c[0]][1], c1 = TONE[e.c[1]][1];
    const gid = `${fid}r${i}`;
    const lg = mk('linearGradient', { id: gid, gradientUnits: 'userSpaceOnUse', x1: A.x, y1: A.y, x2: B.x, y2: B.y }, defs);
    mk('stop', { offset: 0, 'stop-color': c0 }, lg); mk('stop', { offset: 1, 'stop-color': c1 }, lg);
    const lgl = mk('linearGradient', { id: gid + 'l', gradientUnits: 'userSpaceOnUse', x1: A.x, y1: A.y, x2: B.x, y2: B.y }, defs);
    mk('stop', { offset: 0, 'stop-color': mix(c0, '#ffffff', 0.55) }, lgl); mk('stop', { offset: 1, 'stop-color': mix(c1, '#ffffff', 0.55) }, lgl);
    mk('path', { d, fill: 'none', stroke: 'rgba(8,16,40,.22)', 'stroke-width': w * 1.1, 'stroke-linecap': 'round', filter: `url(#${fid}g2)`, transform: `translate(0 ${5 * u})` }, gRoad);
    const halo = mk('path', { d, fill: 'none', stroke: `url(#${gid})`, 'stroke-width': w * 1.5, 'stroke-linecap': 'round', filter: `url(#${fid}g)`, opacity: 0.3 }, gRoad);
    const edge = mk('path', { d, fill: 'none', stroke: `url(#${gid}l)`, 'stroke-width': w, 'stroke-linecap': 'round', opacity: 0.7 }, gRoad);
    const lane = mk('path', { d, fill: 'none', stroke: `url(#${gid})`, 'stroke-width': w - 5 * u, 'stroke-linecap': 'round', opacity: 0.42 }, gRoad);
    const sheen = mk('path', { d, fill: 'none', stroke: 'rgba(255,255,255,.22)', 'stroke-width': w * 0.36, 'stroke-linecap': 'round', transform: `translate(0 ${-2 * u})`, opacity: 0.5 }, gRoad);
    const path = mk('path', { d, fill: 'none', stroke: 'none' }, gRoad) as SVGPathElement;
    const chev = mk('g', {}, gChev) as SVGGElement;
    edges.push({ ...e, path, len: path.getTotalLength(), parts: [halo, edge, lane, sheen], chev });
  });
  for (const e of edges) if (e.label) {
    const direct = e.a === 'icp1' && e.b === 'dec';
    const p = e.path.getPointAtLength(e.len * (direct ? 0.5 : 0.5));
    const el = document.createElement('div');
    el.className = 'fj__tag';
    el.style.setProperty('--a', TONE[e.c[1]][1]);
    el.style.setProperty('--u', String(u));
    el.textContent = e.label;
    el.style.left = `${p.x + (direct ? -10 : -2) * u}px`;
    el.style.top = `${p.y - (direct ? 34 : 2) * u}px`;
    layer.appendChild(el);
  }
  const drawChevrons = (t: number) => {
    for (const e of edges) {
      e.chev.innerHTML = '';
      const step = 52 * u;
      for (let s = ((t * 55 * u) % step) + 22 * u; s < e.len - 22 * u; s += step) {
        const p = e.path.getPointAtLength(s), q = e.path.getPointAtLength(Math.min(e.len, s + 1));
        const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
        const k = depth(p.y / sy) * 6.5 * u;
        mk('path', { d: `M ${-k} ${-k} L 0 0 L ${-k} ${k}`, fill: 'none', stroke: 'rgba(255,255,255,.9)', 'stroke-width': 2.2 * u, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', transform: `translate(${p.x} ${p.y}) rotate(${ang})` }, e.chev);
      }
    }
  };

  // ── stage pucks, icons, cards ──
  const gDisc = mk('g', {});
  const pucks: Partial<Record<FloorStageId, SVGElement>> = {};
  const stages: Partial<Record<FloorStageId, HTMLDivElement>> = {};
  const cards: Partial<Record<FloorStageId, HTMLDivElement>> = {};
  (Object.keys(DEFS) as FloorStageId[]).forEach((id) => {
    const s = DEFS[id];
    const [L, M, D] = TONE[s.tone];
    const k = depth(s.p.y);
    const { x, y } = P(s.p);
    const rx = 66 * k * u, ry = rx * 0.3, h = 9 * k * u;
    const g = mk('g', { class: 'fj__puck is-idle' }, gDisc);
    pucks[id] = g;
    // Illumination (shown when the traveller arrives): light pool, beam, ripples.
    const pg = mk('radialGradient', { id: `${fid}p${id}` }, defs);
    mk('stop', { offset: 0, 'stop-color': '#ffffff', 'stop-opacity': 0.9 }, pg);
    mk('stop', { offset: 0.35, 'stop-color': L, 'stop-opacity': 0.75 }, pg);
    mk('stop', { offset: 1, 'stop-color': M, 'stop-opacity': 0 }, pg);
    mk('ellipse', { cx: x, cy: y + h * 0.5, rx: rx * 3.3, ry: ry * 3.6, fill: `url(#${fid}p${id})`, class: 'fj__pool' }, g);
    const bg = mk('linearGradient', { id: `${fid}b${id}`, x1: 0, y1: 1, x2: 0, y2: 0 }, defs);
    mk('stop', { offset: 0, 'stop-color': '#ffffff', 'stop-opacity': 0.85 }, bg);
    mk('stop', { offset: 0.18, 'stop-color': L, 'stop-opacity': 0.7 }, bg);
    mk('stop', { offset: 0.6, 'stop-color': M, 'stop-opacity': 0.25 }, bg);
    mk('stop', { offset: 1, 'stop-color': M, 'stop-opacity': 0 }, bg);
    const beamH = 300 * k * u;
    const beam = `M ${x - rx * 0.95} ${y} L ${x - rx * 0.62} ${y - beamH} L ${x + rx * 0.62} ${y - beamH} L ${x + rx * 0.95} ${y} A ${rx * 0.95} ${ry * 0.95} 0 0 1 ${x - rx * 0.95} ${y} Z`;
    mk('path', { d: beam, fill: `url(#${fid}b${id})`, class: 'fj__beam', filter: `url(#${fid}g2)` }, g);
    mk('path', { d: beam, fill: `url(#${fid}b${id})`, class: 'fj__beam', transform: `translate(${x} ${y}) scale(.45 1) translate(${-x} ${-y})` }, g);
    const tg = mk('radialGradient', { id: `${fid}d${id}`, cx: '50%', cy: '45%', r: '60%' }, defs);
    mk('stop', { offset: 0, 'stop-color': '#ffffff', 'stop-opacity': 0.55 }, tg);
    mk('stop', { offset: 0.55, 'stop-color': L, 'stop-opacity': 0.42 }, tg);
    mk('stop', { offset: 1, 'stop-color': M, 'stop-opacity': 0.7 }, tg);
    mk('ellipse', { cx: x, cy: y + h, rx: rx * 1.7, ry: ry * 1.9, fill: M, opacity: 0.32, filter: `url(#${fid}s)` }, g);
    mk('path', { d: `M ${x - rx} ${y} L ${x - rx} ${y + h} A ${rx} ${ry} 0 0 0 ${x + rx} ${y + h} L ${x + rx} ${y} Z`, fill: D, opacity: 0.78 }, g);
    mk('path', { d: `M ${x - rx} ${y + h} A ${rx} ${ry} 0 0 0 ${x + rx} ${y + h}`, fill: 'none', stroke: L, 'stroke-width': 2.2 * u }, g);
    mk('ellipse', { cx: x, cy: y, rx, ry, fill: `url(#${fid}d${id})` }, g);
    mk('ellipse', { cx: x, cy: y, rx, ry, fill: 'none', stroke: M, 'stroke-width': 5 * u, filter: `url(#${fid}g2)`, opacity: 0.9 }, g);
    mk('ellipse', { cx: x, cy: y, rx, ry, fill: 'none', stroke: mix(L, '#ffffff', 0.5), 'stroke-width': 2 * u }, g);
    mk('ellipse', { cx: x, cy: y, rx: rx * 0.64, ry: ry * 0.64, fill: 'none', stroke: 'rgba(255,255,255,.7)', 'stroke-width': 1.2 * u }, g);
    mk('ellipse', { cx: x, cy: y, rx: rx * 0.98, ry: ry * 0.98, fill: 'none', stroke: '#ffffff', 'stroke-width': 3.2 * u, class: 'fj__hot' }, g);
    for (let r = 0; r < 2; r++) mk('ellipse', { cx: x, cy: y, rx: rx * 1.05, ry: ry * 1.05, fill: 'none', stroke: L, 'stroke-width': 2.4 * u, class: `fj__ripple r${r}` }, g);

    const size = (s.end ? 86 : 90) * k * u;
    const iconY = y - size * 0.66;
    const box = (top: number, extra = '') => `left:${x - size / 2}px;top:${top}px;width:${size}px;height:${size}px;${extra}`;
    const refl = document.createElement('div');
    refl.className = 'fj__refl';
    refl.style.cssText = `left:${x - size / 2}px;top:${y + 8 * k * u}px;width:${size}px;height:${size * 0.45}px`;
    refl.innerHTML = `<div style="position:absolute;bottom:0;width:${size}px;height:${size}px">${iconSVG(s.icon, s.tone)}</div>`;
    layer.insertBefore(refl, layer.firstChild);
    const stage = document.createElement('div');
    stage.className = 'fj__stage is-idle';
    stage.style.setProperty('--a', M);
    stage.style.setProperty('--g', `${12 * k * u}px`);
    stage.style.setProperty('--s', `${8 * k * u}px`);
    layer.appendChild(stage);
    stages[id] = stage;
    const back = document.createElement('div');
    back.className = 'fj__ico';
    back.style.cssText = box(iconY - size / 2 + 5 * k * u, 'opacity:.95');
    back.innerHTML = iconSVG(s.icon, s.tone, D);
    stage.appendChild(back);
    const face = document.createElement('div');
    face.className = 'fj__ico fj__face';
    face.style.cssText = box(iconY - size / 2);
    face.innerHTML = iconSVG(s.icon, s.tone);
    stage.appendChild(face);

    const v = data[id];
    const up = v.delta >= 0;
    const good = s.end === 'no' ? !up : up;
    const card = document.createElement('div');
    card.className = `fj__card${s.end ? ' is-end' : ''}${s.below ? ' is-below' : ''}`;
    card.style.setProperty('--a', M);
    card.style.setProperty('--l', L);
    card.style.setProperty('--k', String((s.below ? 0.84 : Math.max(0.8, k)) * u));
    const split = v.split?.length ? `<ul class="fj__split">${v.split.map((x) => `<li style="--d:${TONE[x.tone][1]}"><span>${x.label}</span><b>${x.value.toLocaleString('en-US')}</b></li>`).join('')}</ul>` : '';
    card.innerHTML = `<b data-v="${v.metric}">${v.metric.toLocaleString('en-US')}</b><i class="${good ? 'is-g' : 'is-r'}">${up ? '▲' : '▼'} ${Math.abs(v.delta).toFixed(1)}%</i><span>${s.n ? `<em>${s.n}</em>` : ''}${s.title}</span>${split}`;
    card.setAttribute('aria-label', `${s.title}: ${v.metric.toLocaleString('en-US')}, ${up ? 'up' : 'down'} ${Math.abs(v.delta).toFixed(1)} percent versus yesterday`);
    card.style.left = `${x}px`;
    card.style.top = `${s.below ? y + 30 * k * u : iconY - size * 0.5 - 10 * k * u}px`;
    layer.appendChild(card);
    cards[id] = card;
  });
  {
    const pv = document.createElement('div');
    pv.className = 'fj__prev';
    pv.style.setProperty('--u', String(u));
    pv.textContent = 'Biometric branch · design preview';
    const b1 = P(DEFS.bio1.p);
    pv.style.left = `${b1.x - 30 * u}px`; pv.style.top = `${b1.y - 128 * u}px`;
    layer.appendChild(pv);
  }

  // ── traveller ──
  const person = document.createElement('div');
  person.className = 'fj__person';
  person.innerHTML = PERSON;
  layer.appendChild(person);
  const part = (n: string) => person.querySelector<SVGGElement>(`[data-p="${n}"]`)!;
  const legF = part('legF'), legB = part('legB'), armF = part('armF'), armB = part('armB'), phone = part('phone');
  const place = (p: Pt, left: boolean, walking: boolean, t: number, standEnd?: boolean) => {
    const k = depth(p.y / sy) * 0.86 * u;
    const sw = walking ? Math.sin(t * 9) : 0;
    legF.style.transform = `rotate(${sw * 16}deg)`;
    legB.style.transform = `rotate(${-sw * 16}deg)`;
    armB.style.transform = `rotate(${-sw * 14}deg)`;
    armF.style.transform = `rotate(${sw * 12}deg)`;
    const usePhone = !walking && !standEnd;
    armF.style.opacity = usePhone ? '0' : '1';
    phone.setAttribute('opacity', usePhone ? '1' : '0');
    const bob = walking ? Math.abs(Math.sin(t * 9)) * -4 * k : 0;
    person.style.transform = `translate(${p.x}px, ${p.y + bob}px) scale(${left ? -k : k}, ${k})`;
  };
  const stand = (id: FloorStageId): Pt => {
    const s = DEFS[id]; const k = depth(s.p.y);
    // Stand just in front-left of the puck so its illumination stays visible.
    return P(s.end ? { x: s.p.x - 140 * k, y: s.p.y + 30 * k } : { x: s.p.x - 122 * k, y: s.p.y + 34 * k });
  };

  // ── tour ──
  let route = ROUTES[0];
  let stop = 0, phase: 'stand' | 'walk' | 'gap' = 'stand', t0 = performance.now(), dwell = 3200;
  let spokenRoutes = 0;
  const setActive = (id: FloorStageId | null, upto: number) => {
    (Object.keys(DEFS) as FloorStageId[]).forEach((k) => {
      const on = k === id;
      const idx = route.indexOf(k);
      cards[k]!.classList.toggle('is-on', on);
      cards[k]!.classList.toggle('is-seen', idx >= 0 && idx < upto && !on);
      // idle (ahead) → reached (passed, stays lit) → active (traveller here, brightest)
      const state = on ? 'is-active' : idx >= 0 && idx <= upto ? 'is-reached' : 'is-idle';
      pucks[k]!.setAttribute('class', `fj__puck ${state}`);
      stages[k]!.className = `fj__stage ${state}`;
    });
    for (const e of edges) {
      const ia = route.indexOf(e.a), ib = route.indexOf(e.b);
      const done = ia >= 0 && ib === ia + 1 && ib <= upto;
      e.parts.forEach((el, n) => el.setAttribute('opacity', String(done ? [0.7, 1, 0.8, 1][n] : [0.3, 0.7, 0.42, 0.5][n])));
    }
  };
  const countUp = (id: FloorStageId) => {
    const b = cards[id]!.querySelector('b')!;
    const v = +b.dataset.v!;
    if (o.reduced) return;
    const s0 = performance.now();
    const step = (t: number) => { const k = Math.min(1, (t - s0) / 700); b.textContent = Math.round(v * (1 - Math.pow(1 - k, 3))).toLocaleString('en-US'); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const arrive = (first = false) => {
    const id = route[stop];
    setActive(id, stop);
    countUp(id);
    const speak = spokenRoutes < 2 && o.isActive();
    if (speak) o.onArrive(id, data[id].say, first);
    dwell = speak ? Math.max(2600, o.dwellFor(data[id].say)) : 2200;
  };
  arrive(true);

  let raf = 0;
  const WALK = o.reduced ? 1 : 1700;
  const frame = (now: number) => {
    const t = now / 1000;
    if (!o.reduced) drawChevrons(t);
    const el = now - t0;
    const active = o.isActive();
    if (phase === 'stand') {
      const id = route[stop];
      place(stand(id), false, false, t, !!DEFS[id].end);
      if (active && el > dwell) {
        if (stop >= route.length - 1) { phase = 'gap'; t0 = now; person.style.opacity = '0'; }
        else { phase = 'walk'; t0 = now; setActive(null, stop); }
      } else if (!active) t0 = now - Math.min(el, dwell);
    } else if (phase === 'gap') {
      if (el > 700) {
        spokenRoutes++;
        route = ROUTES[(ROUTES.indexOf(route) + 1) % ROUTES.length];
        stop = 0; phase = 'stand'; t0 = now; person.style.opacity = '1';
        arrive();
      }
    } else {
      const a = route[stop], b = route[stop + 1];
      const e = edges.find((x) => x.a === a && x.b === b)!;
      const k = Math.min(1, el / WALK);
      const ease = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const A = stand(a), B = stand(b);
      const mid = e.path.getPointAtLength(e.len * ease);
      const w = Math.sin(Math.PI * ease);
      const lin = { x: A.x + (B.x - A.x) * ease, y: A.y + (B.y - A.y) * ease };
      const p = { x: lin.x + (mid.x - lin.x) * w, y: lin.y + (mid.y - lin.y) * w };
      const ahead = e.path.getPointAtLength(Math.min(e.len, e.len * ease + 2));
      place(p, ahead.x < mid.x - 0.2, !o.reduced, t);
      if (k >= 1) { stop++; phase = 'stand'; t0 = now; arrive(); }
    }
    raf = requestFrame(frame);
  };
  raf = requestFrame(frame);

  return {
    destroy() { cancelFrame(raf); host.innerHTML = ''; },
  };
}
