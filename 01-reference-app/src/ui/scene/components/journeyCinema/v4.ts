/**
 * Online Visa Journey v4 (V34) layout.
 *
 * Nasir's "Journey v4 assets" (Figma, 26 Oct): eleven stage units, each with its
 * numbered plate and floor reflection baked in (public/journey-v4). The main
 * reference frame in that page is a composition guide only, not an asset:
 * Home large on the left, VAS → ICP across the top, the biometric branch along
 * the front, ICP decision on the right splitting to Approved (up) / Rejected (down).
 *
 * Reference px of the 1920×1080 floor frame (same mapping as V33).
 * `by` = where the plinth meets the floor; `ay` = that line inside the image;
 * `at` = micro-animation anchors (fractions of the image), same keys as V33.
 */
import type { FloorStageId } from '../floorJourney';
import type { CardStage, Edge, Fr, Micro, Tone } from './data';

export type UnitId = 'home' | 'vas' | 'toicp' | 'icp1' | 'bio1' | 'bio2' | 'bio3' | 'icp2' | 'dec' | 'ok' | 'no';
export type UnitDef = { img: string; tone: Tone; cx: number; by: number; w: number; aspect: number; ay: number; at: Record<string, Fr> };

export const UNITS: Record<UnitId, UnitDef> = {
  home: { img: 'home', tone: 'home', cx: 300, by: 660, w: 500, aspect: 1.047, ay: 0.565,
    // MicroFx keys (shared with V33): laptop = draft, monitor = upload, phone = payment, garden = waiting.
    at: { laptop: [0.42, 0.25], monitor: [0.41, 0.08], phone: [0.6, 0.08], garden: [0.81, 0.09] } },
  vas: { img: 'vas-review', tone: 'vas', cx: 680, by: 612, w: 180, aspect: 1.164, ay: 0.686, at: { desk: [0.55, 0.37] } },
  toicp: { img: 'submission-to-icp', tone: 'icp', cx: 900, by: 612, w: 195, aspect: 1.083, ay: 0.657, at: { from: [0.45, 0.37], to: [0.78, 0.3] } },
  icp1: { img: 'icp-review', tone: 'icp', cx: 1120, by: 618, w: 205, aspect: 1.086, ay: 0.669, at: { a: [0.42, 0.33], b: [0.79, 0.27] } },
  bio1: { img: 'biometric-request', tone: 'bio', cx: 650, by: 905, w: 210, aspect: 1.0, ay: 0.657, at: { phone: [0.42, 0.2] } },
  bio2: { img: 'appointment-scheduled', tone: 'bio', cx: 885, by: 905, w: 215, aspect: 0.844, ay: 0.73, at: { desk: [0.3, 0.17] } },
  bio3: { img: 'biometrics-completed', tone: 'bio', cx: 1115, by: 905, w: 200, aspect: 1.091, ay: 0.728, at: { scanner: [0.81, 0.28] } },
  icp2: { img: 'icp-final-review', tone: 'icp', cx: 1345, by: 905, w: 215, aspect: 0.89, ay: 0.663, at: { screen: [0.56, 0.3] } },
  dec: { img: 'icp-decision', tone: 'icp', cx: 1530, by: 680, w: 215, aspect: 1.194, ay: 0.666, at: { desk: [0.5, 0.36] } },
  ok: { img: 'approved', tone: 'ok', cx: 1760, by: 560, w: 190, aspect: 1.201, ay: 0.63, at: { person: [0.5, 0.3] } },
  no: { img: 'rejected', tone: 'no', cx: 1765, by: 895, w: 190, aspect: 1.263, ay: 0.727, at: { person: [0.5, 0.3] } },
};

/** Which unit shows each stage, and which micro-animation plays there. */
export const STAGE4: Record<FloorStageId, { unit: UnitId; micro: Micro; tone: Tone }> = {
  home: { unit: 'home', micro: 'draft', tone: 'home' },
  sub: { unit: 'home', micro: 'upload', tone: 'home' },
  pay: { unit: 'home', micro: 'tap', tone: 'home' },
  vas: { unit: 'vas', micro: 'shuffle', tone: 'vas' },
  toicp: { unit: 'toicp', micro: 'handover', tone: 'icp' },
  icp1: { unit: 'icp1', micro: 'scan', tone: 'icp' },
  bio1: { unit: 'bio1', micro: 'notify', tone: 'bio' },
  bio2: { unit: 'bio2', micro: 'booked', tone: 'bio' },
  bio3: { unit: 'bio3', micro: 'finger', tone: 'bio' },
  icp2: { unit: 'icp2', micro: 'match', tone: 'icp' },
  dec: { unit: 'dec', micro: 'stamp', tone: 'icp' },
  ok: { unit: 'ok', micro: 'joy', tone: 'ok' },
  no: { unit: 'no', micro: 'quiet', tone: 'no' },
};

/**
 * Glass metric capsules (the stage names are on the units' own plates).
 * x = centre, y = top; Home carries submissions and payments. The front row's sit
 * under their plates, keeping the lane between the rows free for the biometric branch.
 */
export const CAPS: { unit: UnitId; stages: CardStage[]; x: number; y: number; labels?: string[] }[] = [
  { unit: 'home', stages: ['sub', 'pay'], x: 300, y: 300, labels: ['Submitted', 'Paid'] },
  { unit: 'vas', stages: ['vas'], x: 680, y: 404 },
  { unit: 'toicp', stages: ['toicp'], x: 900, y: 404 },
  { unit: 'icp1', stages: ['icp1'], x: 1120, y: 404 },
  { unit: 'bio1', stages: ['bio1'], x: 650, y: 910 },
  { unit: 'bio2', stages: ['bio2'], x: 885, y: 910 },
  { unit: 'bio3', stages: ['bio3'], x: 1115, y: 910 },
  { unit: 'icp2', stages: ['icp2'], x: 1345, y: 910 },
  { unit: 'dec', stages: ['dec'], x: 1530, y: 454 },
  { unit: 'ok', stages: ['ok'], x: 1760, y: 330 },
  { unit: 'no', stages: ['no'], x: 1765, y: 896 },
];

/**
 * Light ribbons on the floor (absolute M / C only), from floor point to floor point
 * (`by` minus a little, i.e. under each plinth). They are drawn under the units and
 * foreshortened (Ribbons `flat`), so each one emerges from under a plinth, runs along
 * the floor and slips under the next, one smooth sweep per link.
 */
export const EDGES4: Edge[] = [
  { a: 'home', b: 'sub', d: 'M300,615 C300,615 300,615 300,615', c: ['home', 'home'], ribbon: false },
  { a: 'sub', b: 'pay', d: 'M300,615 C300,615 300,615 300,615', c: ['home', 'home'], ribbon: false },
  { a: 'pay', b: 'vas', d: 'M300,640 C450,640 540,606 680,606', c: ['home', 'vas'] },
  { a: 'vas', b: 'toicp', d: 'M680,606 C760,606 820,606 900,606', c: ['vas', 'icp'] },
  { a: 'toicp', b: 'icp1', d: 'M900,606 C980,606 1040,612 1120,612', c: ['icp', 'icp'] },
  { a: 'icp1', b: 'dec', d: 'M1120,600 C1270,600 1380,660 1530,660', c: ['icp', 'icp'] },
  { a: 'icp1', b: 'bio1', d: 'M1120,600 C1110,730 800,700 650,886', c: ['icp', 'bio'] },
  { a: 'bio1', b: 'bio2', d: 'M650,899 C730,899 805,899 885,899', c: ['bio', 'bio'] },
  { a: 'bio2', b: 'bio3', d: 'M885,899 C965,899 1035,899 1115,899', c: ['bio', 'bio'] },
  { a: 'bio3', b: 'icp2', d: 'M1115,899 C1195,899 1265,899 1345,899', c: ['bio', 'icp'] },
  { a: 'icp2', b: 'dec', d: 'M1345,899 C1480,899 1530,800 1530,660', c: ['icp', 'icp'] },
  { a: 'dec', b: 'ok', d: 'M1530,660 C1640,660 1690,543 1760,543', c: ['icp', 'ok'] },
  { a: 'dec', b: 'no', d: 'M1530,660 C1640,660 1690,878 1765,878', c: ['icp', 'no'] },
];

export const CHIPS4: { text: string; x: number; y: number; tone: Tone }[] = [
  { text: 'No biometric required', x: 1318, y: 596, tone: 'icp' },
  { text: 'Biometric required', x: 905, y: 706, tone: 'bio' },
];

/** Foreshortening of the floor ribbons (vertical : horizontal). */
export const FLOOR_FLAT = 0.5;

/** While VAS and ICP work the file, the applicant waits at home. */
export const WAITING4: FloorStageId[] = ['vas', 'toicp', 'icp1'];
