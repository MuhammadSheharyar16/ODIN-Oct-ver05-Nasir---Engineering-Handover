/**
 * Online Visa Journey v3 (V33) layout.
 *
 * Coordinates are screen px of the 1920×1080 frame captured with the V09 floor
 * push (floor scale ≈ CAPTURE_SCALE); JourneyCinema maps them through the live
 * floor scale, so the scenes stand on V09's pucks at any wide size.
 * Scene images live in public/journey-v3 (cut-out photoreal miniatures);
 * `ax`/`ay` is the plinth's bottom-centre inside the image, `at` the props the
 * micro-animations start from (fractions of the image).
 */
import type { FloorStageId } from '../floorJourney';

export const CAPTURE_SCALE = 0.982;

export type Tone = 'home' | 'vas' | 'icp' | 'bio' | 'ok' | 'no';
export const TONES: Record<Tone, string> = {
  home: '#4f9cff', vas: '#22d3b4', icp: '#a67cff', bio: '#ffa23f', ok: '#3ee08f', no: '#ff5468',
};

export type SceneId = 'home' | 'vas' | 'toicp' | 'icp1' | 'bio1' | 'bio2' | 'bio3' | 'icp2' | 'dec' | 'ok' | 'no';
export type Fr = [number, number];
export type SceneDef = { img: string; tone: Tone; cx: number; bottom: number; w: number; h: number; ax: number; ay: number; at: Record<string, Fr> };

export const SCENES: Record<SceneId, SceneDef> = {
  home: { img: 'home', tone: 'home', cx: 420, bottom: 905, w: 553.5, h: 393.5, ax: 0.5006, ay: 0.7605,
    at: { laptop: [0.228, 0.305], monitor: [0.467, 0.24], phone: [0.66, 0.285], garden: [0.88, 0.33], upload: [0.467, 0.24], pay: [0.66, 0.285], wait: [0.88, 0.33] } },
  vas: { img: 'vas-review', tone: 'vas', cx: 800, bottom: 702, w: 153, h: 155.5, ax: 0.4912, ay: 0.8288, at: { desk: [0.64, 0.29] } },
  toicp: { img: 'submission-to-icp', tone: 'icp', cx: 975, bottom: 678, w: 155, h: 183.5, ax: 0.4987, ay: 0.7514, at: { from: [0.39, 0.4], to: [0.53, 0.38] } },
  icp1: { img: 'icp-review', tone: 'icp', cx: 1152, bottom: 652, w: 166.5, h: 174, ax: 0.4912, ay: 0.8544, at: { a: [0.37, 0.42], b: [0.63, 0.34], screen: [0.37, 0.42], list: [0.63, 0.34] } },
  bio1: { img: 'biometric-notice', tone: 'bio', cx: 797, bottom: 884, w: 200, h: 197.5, ax: 0.5326, ay: 0.8424, at: { phone: [0.49, 0.275] } },
  bio2: { img: 'centre-checkin', tone: 'bio', cx: 1013, bottom: 890, w: 196.5, h: 209.5, ax: 0.5048, ay: 0.7533, at: { desk: [0.54, 0.28], calendar: [0.54, 0.28] } },
  bio3: { img: 'biometrics', tone: 'bio', cx: 1229, bottom: 884, w: 201, h: 211.5, ax: 0.5047, ay: 0.7715, at: { scanner: [0.505, 0.37] } },
  icp2: { img: 'icp-final-review', tone: 'icp', cx: 1445, bottom: 860, w: 189, h: 200.5, ax: 0.4868, ay: 0.8305, at: { screen: [0.62, 0.33] } },
  dec: { img: 'icp-decision', tone: 'icp', cx: 1544, bottom: 716, w: 158.5, h: 176.5, ax: 0.5113, ay: 0.7833, at: { desk: [0.52, 0.375] } },
  ok: { img: 'approved', tone: 'ok', cx: 1716, bottom: 586, w: 145.5, h: 194.5, ax: 0.4743, ay: 0.6878, at: { person: [0.42, 0.27], passport: [0.27, 0.05], hero: [0.42, 0.27] } },
  no: { img: 'rejected', tone: 'no', cx: 1716, bottom: 896, w: 205.5, h: 228.5, ax: 0.5395, ay: 0.6604, at: { person: [0.505, 0.31], hero: [0.505, 0.31] } },
};

/** V33 scenes drawn at this share of their size (27 Oct, Anupam: less clutter); they stay on their plinth spots. */
export const SCENE_SCALE = 0.8;

/**
 * Number medallions on the front of each plinth (`fx` = across the image).
 * `ry` = plinth ellipse depth and `side` = plinth wall height, both as a share of the plinth width.
 */
export const PLINTH: Partial<Record<SceneId, { ry: number; side: number }>> = {
  home: { ry: 0.15, side: 0.115 }, ok: { ry: 0.13, side: 0.12 }, no: { ry: 0.13, side: 0.11 },
};
export const PLINTH_DEFAULT = { ry: 0.12, side: 0.2 };
/** Plinth diameter on screen (reference px): the glass case stands on it. */
export const PLINTH_W: Record<SceneId, number> = { home: 540, vas: 150, toicp: 146, icp1: 156, bio1: 178, bio2: 178, bio3: 178, icp2: 172, dec: 140, ok: 124, no: 166 };
export const BADGES: { id: CardStage; scene: SceneId; fx: number }[] = [
  { id: 'sub', scene: 'home', fx: 0.4 }, { id: 'pay', scene: 'home', fx: 0.6 },
  { id: 'vas', scene: 'vas', fx: 0.5 }, { id: 'toicp', scene: 'toicp', fx: 0.5 }, { id: 'icp1', scene: 'icp1', fx: 0.5 },
  { id: 'bio1', scene: 'bio1', fx: 0.5 }, { id: 'bio2', scene: 'bio2', fx: 0.5 }, { id: 'bio3', scene: 'bio3', fx: 0.5 },
  { id: 'icp2', scene: 'icp2', fx: 0.5 }, { id: 'dec', scene: 'dec', fx: 0.5 }, { id: 'ok', scene: 'ok', fx: 0.5 }, { id: 'no', scene: 'no', fx: 0.5 },
];

/** Which scene shows each stage, and which micro-animation plays there. */
export type Micro = 'draft' | 'upload' | 'tap' | 'shuffle' | 'handover' | 'scan' | 'notify' | 'booked' | 'finger' | 'match' | 'stamp' | 'joy' | 'quiet';
export const STAGE: Record<FloorStageId, { scene: SceneId; micro: Micro; tone: Tone }> = {
  home: { scene: 'home', micro: 'draft', tone: 'home' },
  sub: { scene: 'home', micro: 'upload', tone: 'home' },
  pay: { scene: 'home', micro: 'tap', tone: 'home' },
  vas: { scene: 'vas', micro: 'shuffle', tone: 'vas' },
  toicp: { scene: 'toicp', micro: 'handover', tone: 'icp' },
  icp1: { scene: 'icp1', micro: 'scan', tone: 'icp' },
  bio1: { scene: 'bio1', micro: 'notify', tone: 'bio' },
  bio2: { scene: 'bio2', micro: 'booked', tone: 'bio' },
  bio3: { scene: 'bio3', micro: 'finger', tone: 'bio' },
  icp2: { scene: 'icp2', micro: 'match', tone: 'icp' },
  dec: { scene: 'dec', micro: 'stamp', tone: 'icp' },
  ok: { scene: 'ok', micro: 'joy', tone: 'ok' },
  no: { scene: 'no', micro: 'quiet', tone: 'no' },
};

/** Glass cards: label, stage badge and position (x = centre; y = top). */
/** Home has no metric (data team, 26 Oct): the home scene sets the story, numbering starts at submission. */
export type CardStage = Exclude<FloorStageId, 'home'>;
export const CARDS: Record<CardStage, { n: string; label: string; x: number; y: number; w?: number }> = {
  sub: { n: '1', label: 'Application submission', x: 360, y: 518 },
  pay: { n: '2', label: 'Payments', x: 540, y: 518 },
  vas: { n: '3', label: 'VAS internal review', x: 800, y: 500 },
  toicp: { n: '4', label: 'Submission to ICP', x: 975, y: 466 },
  icp1: { n: '5', label: 'ICP review · before biometric', x: 1152, y: 430, w: 176 },
  bio1: { n: '6', label: 'Biometric request', x: 797, y: 858 },
  bio2: { n: '7', label: 'Appointment scheduled', x: 1013, y: 864 },
  bio3: { n: '8', label: 'Biometric completed', x: 1229, y: 858 },
  icp2: { n: '9', label: 'ICP review · after biometric', x: 1445, y: 838, w: 176 },
  dec: { n: '10', label: 'ICP decision', x: 1544, y: 494 },
  ok: { n: '✓', label: 'Approved', x: 1716, y: 344 },
  no: { n: '✕', label: 'Rejected', x: 1716, y: 858 },
};

/** Route ribbons between stages (cubic paths, absolute M / C / S only). */
export type Edge = { a: FloorStageId; b: FloorStageId; d: string; c: [Tone, Tone]; ribbon?: boolean };
export const EDGES: Edge[] = [
  { a: 'home', b: 'sub', d: 'M275,714 C320,700 360,692 402,692', c: ['home', 'home'], ribbon: false },
  { a: 'sub', b: 'pay', d: 'M402,692 C440,694 470,704 508,711', c: ['home', 'home'], ribbon: false },
  { a: 'pay', b: 'vas', d: 'M508,711 C590,740 640,772 680,772 C730,760 752,680 800,672', c: ['home', 'vas'] },
  { a: 'vas', b: 'toicp', d: 'M800,672 C862,662 918,648 975,648', c: ['vas', 'icp'] },
  { a: 'toicp', b: 'icp1', d: 'M975,648 C1040,638 1092,623 1152,621', c: ['icp', 'icp'] },
  { a: 'icp1', b: 'dec', d: 'M1152,621 C1262,610 1330,662 1420,682 S1505,690 1544,688', c: ['icp', 'icp'] },
  { a: 'icp1', b: 'bio1', d: 'M1152,628 C1152,704 1062,738 962,778 S822,826 797,848', c: ['icp', 'bio'] },
  { a: 'bio1', b: 'bio2', d: 'M797,850 C870,872 940,866 1013,856', c: ['bio', 'bio'] },
  { a: 'bio2', b: 'bio3', d: 'M1013,856 C1086,846 1160,866 1229,852', c: ['bio', 'bio'] },
  { a: 'bio3', b: 'icp2', d: 'M1229,852 C1310,846 1380,836 1445,826', c: ['bio', 'icp'] },
  { a: 'icp2', b: 'dec', d: 'M1445,826 C1532,796 1558,750 1544,690', c: ['icp', 'icp'] },
  { a: 'dec', b: 'ok', d: 'M1544,684 C1602,650 1660,600 1716,562', c: ['icp', 'ok'] },
  { a: 'dec', b: 'no', d: 'M1544,694 C1602,756 1660,836 1716,862', c: ['icp', 'no'] },
];

/** Labels on the route. */
export const CHIPS: { text: string; x: number; y: number; tone: Tone }[] = [
  { text: 'No biometric required', x: 1340, y: 614, tone: 'icp' },
  { text: 'Biometric required', x: 982, y: 734, tone: 'bio' },
];

/** Tours (same as V09): biometric → approved, direct → approved, biometric → rejected. */
export const ROUTES: CardStage[][] = [
  ['sub', 'pay', 'vas', 'toicp', 'icp1', 'bio1', 'bio2', 'bio3', 'icp2', 'dec', 'ok'],
  ['sub', 'pay', 'vas', 'toicp', 'icp1', 'dec', 'ok'],
  ['sub', 'pay', 'vas', 'toicp', 'icp1', 'bio1', 'bio2', 'bio3', 'icp2', 'dec', 'no'],
];

/** While VAS and ICP work the file, the applicant waits in the garden. */
export const WAITING: FloorStageId[] = ['vas', 'toicp', 'icp1'];
