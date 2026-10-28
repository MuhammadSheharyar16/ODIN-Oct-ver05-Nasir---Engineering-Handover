/**
 * Online Visa Journey v4.1 (V35) layout: Nasir's "Journey v4.2 assets ver02" (Figma
 * node 94:488, 27 Oct), the v4 stage units without the neon (Anupam, 26 Oct).
 * Same composition as V34 (v4.ts, unchanged), but (Nasir, 27 Oct) the stages are
 * about 18 % larger to show their detail and the animations, spread a little wider,
 * and Home sits down on the floor; so V35 keeps its own ribbons, chips and capsules.
 * `at` keys are the StoryFx vocabulary (fractions of the image; may sit outside it,
 * e.g. the file leaves from the VAS unit on its way into ICP).
 */
import type { CardStage, Edge, Tone } from './data';
import type { UnitDef, UnitId } from './v4';

export const UNITS41: Record<UnitId, UnitDef> = {
  home: { img: 'home', tone: 'home', cx: 290, by: 690, w: 500, aspect: 0.968, ay: 0.68,
    // the floating cards above the room: Apply online · Submit · Make payment · Wait
    at: { laptop: [0.47, 0.3], upload: [0.39, 0.16], pay: [0.6, 0.17], wait: [0.82, 0.12], cap: [0.5, 0.25] } },
  vas: { img: 'vas-review', tone: 'vas', cx: 700, by: 612, w: 212, aspect: 1.205, ay: 0.638, at: { desk: [0.52, 0.4] } },
  toicp: { img: 'submission-to-icp', tone: 'icp', cx: 950, by: 612, w: 230, aspect: 1.183, ay: 0.632, at: { from: [-0.62, 0.3], to: [0.6, 0.36] } },
  icp1: { img: 'icp-review', tone: 'icp', cx: 1200, by: 618, w: 242, aspect: 1.004, ay: 0.676, at: { screen: [0.47, 0.37], list: [0.82, 0.38] } },
  bio1: { img: 'biometric-request', tone: 'bio', cx: 610, by: 915, w: 248, aspect: 1.071, ay: 0.647, at: { phone: [0.53, 0.37] } },
  bio2: { img: 'appointment-scheduled', tone: 'bio', cx: 875, by: 915, w: 254, aspect: 0.999, ay: 0.627, at: { calendar: [0.3, 0.3] } },
  bio3: { img: 'biometrics-completed', tone: 'bio', cx: 1140, by: 915, w: 236, aspect: 1.139, ay: 0.631, at: { scanner: [0.5, 0.18] } },
  icp2: { img: 'icp-final-review', tone: 'icp', cx: 1405, by: 915, w: 254, aspect: 0.957, ay: 0.636, at: { screen: [0.5, 0.36] } },
  dec: { img: 'icp-decision', tone: 'icp', cx: 1560, by: 690, w: 245, aspect: 1.2, ay: 0.625, at: { desk: [0.52, 0.42] } },
  ok: { img: 'approved', tone: 'ok', cx: 1775, by: 560, w: 210, aspect: 1.125, ay: 0.688, at: { hero: [0.55, 0.3], cap: [0.5, 0.92] } },
  no: { img: 'rejected', tone: 'no', cx: 1775, by: 900, w: 210, aspect: 1.29, ay: 0.634, at: { hero: [0.5, 0.32] } },
};

/** Metric capsules (x = centre, y = top), clear of the larger units. */
export const CAPS41: { unit: UnitId; stages: CardStage[]; x: number; y: number; labels?: string[] }[] = [
  { unit: 'home', stages: ['sub', 'pay'], x: 290, y: 300, labels: ['Submitted', 'Paid'] },
  { unit: 'vas', stages: ['vas'], x: 700, y: 366 },
  { unit: 'toicp', stages: ['toicp'], x: 950, y: 366 },
  { unit: 'icp1', stages: ['icp1'], x: 1200, y: 366 },
  { unit: 'bio1', stages: ['bio1'], x: 610, y: 916 },
  { unit: 'bio2', stages: ['bio2'], x: 875, y: 916 },
  { unit: 'bio3', stages: ['bio3'], x: 1140, y: 916 },
  { unit: 'icp2', stages: ['icp2'], x: 1405, y: 916 },
  { unit: 'dec', stages: ['dec'], x: 1560, y: 436 },
  { unit: 'ok', stages: ['ok'], x: 1775, y: 312 },
  { unit: 'no', stages: ['no'], x: 1775, y: 900 },
];

/** Floor ribbons (same style as V34: floor point to floor point, one smooth sweep each). */
export const EDGES41: Edge[] = [
  { a: 'home', b: 'sub', d: 'M290,645 C290,645 290,645 290,645', c: ['home', 'home'], ribbon: false },
  { a: 'sub', b: 'pay', d: 'M290,645 C290,645 290,645 290,645', c: ['home', 'home'], ribbon: false },
  { a: 'pay', b: 'vas', d: 'M290,670 C460,670 560,606 700,606', c: ['home', 'vas'] },
  { a: 'vas', b: 'toicp', d: 'M700,606 C790,606 860,606 950,606', c: ['vas', 'icp'] },
  { a: 'toicp', b: 'icp1', d: 'M950,606 C1040,606 1110,612 1200,612', c: ['icp', 'icp'] },
  { a: 'icp1', b: 'dec', d: 'M1200,600 C1340,600 1420,670 1560,670', c: ['icp', 'icp'] },
  { a: 'icp1', b: 'bio1', d: 'M1200,600 C1190,740 820,700 610,896', c: ['icp', 'bio'] },
  { a: 'bio1', b: 'bio2', d: 'M610,909 C700,909 785,909 875,909', c: ['bio', 'bio'] },
  { a: 'bio2', b: 'bio3', d: 'M875,909 C965,909 1050,909 1140,909', c: ['bio', 'bio'] },
  { a: 'bio3', b: 'icp2', d: 'M1140,909 C1230,909 1315,909 1405,909', c: ['bio', 'icp'] },
  { a: 'icp2', b: 'dec', d: 'M1405,909 C1530,909 1560,810 1560,670', c: ['icp', 'icp'] },
  { a: 'dec', b: 'ok', d: 'M1560,670 C1660,670 1705,543 1775,543', c: ['icp', 'ok'] },
  { a: 'dec', b: 'no', d: 'M1560,670 C1660,670 1705,883 1775,883', c: ['icp', 'no'] },
];

export const CHIPS41: { text: string; x: number; y: number; tone: Tone }[] = [
  { text: 'No biometric required', x: 1390, y: 594, tone: 'icp' },
  { text: 'Biometric required', x: 905, y: 710, tone: 'bio' },
];
