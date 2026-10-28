/**
 * Online Visa Journey v4.5 (V39) layout, from Anupam's 27 Oct feedback
 * and Nasir's brief: a stage card on the left, every stage along the bottom, the
 * journey as a stage in between with equal, smaller units, and the route drawn by a
 * particle system on the floor (FloorParticles) at the home sphere's quality.
 * Units: Nasir's "Journey v4.2 assets ver03" (Figma node 137:595, 27 Oct): the ICP and VAS
 * units in subtler, lighter purple on silver plinths (public/journey-v42).
 * Reference px of the 1920×1080 floor frame.
 */
import type { CardStage, Edge, Tone } from './data';
import type { UnitDef, UnitId } from './v4';
import { UNITS41 } from './v41';

/** v4.1 anchors and art direction; new floor line (`ay`) and proportions where the image changed. */
const at = (id: UnitId, cx: number, by: number, w: number, img?: { aspect: number; ay: number }): UnitDef => ({ ...UNITS41[id], ...img, cx, by, w });

/**
 * Equal units (Home a touch larger: it carries its four step cards), about 235 px apart so the
 * routes between them read; the front row sits left under the ICP row, the rows closer together,
 * Approved and Rejected drawn in from the floor's edge, a little staggered; ICP decision a little
 * left and Approved down on the floor, clear of the stairs behind it (27 Oct).
 */
export const UNITS42: Record<UnitId, UnitDef> = {
  home: at('home', 560, 600, 220),
  vas: at('vas', 800, 560, 160, { aspect: 1.241, ay: 0.679 }),
  toicp: at('toicp', 1035, 552, 160, { aspect: 1.217, ay: 0.645 }),
  icp1: at('icp1', 1270, 566, 160, { aspect: 1.028, ay: 0.709 }),
  bio1: at('bio1', 700, 780, 160),
  bio2: at('bio2', 935, 780, 160),
  bio3: at('bio3', 1170, 780, 160),
  icp2: at('icp2', 1405, 780, 160, { aspect: 1.026, ay: 0.63 }),
  dec: at('dec', 1490, 632, 160, { aspect: 1.223, ay: 0.684 }),
  ok: at('ok', 1720, 560, 155),
  no: at('no', 1720, 795, 155),
};

/** Home's step cards (fractions of the home image): the step the applicant is on is lit. */
export const HOME_STEPS: Record<'apply' | 'submit' | 'pay' | 'wait', [number, number]> = {
  apply: [0.175, 0.105], submit: [0.385, 0.09], pay: [0.6, 0.095], wait: [0.815, 0.11],
};

/** Floor routes the particles flow along (floor point to floor point, M + C only). */
export const EDGES42: Edge[] = [
  { a: 'home', b: 'sub', d: 'M560,590 C560,590 560,590 560,590', c: ['home', 'home'], ribbon: false },
  { a: 'sub', b: 'pay', d: 'M560,590 C560,590 560,590 560,590', c: ['home', 'home'], ribbon: false },
  { a: 'pay', b: 'vas', d: 'M560,612 C660,612 700,554 800,554', c: ['home', 'vas'] },
  { a: 'vas', b: 'toicp', d: 'M800,554 C880,554 955,546 1035,546', c: ['vas', 'icp'] },
  { a: 'toicp', b: 'icp1', d: 'M1035,546 C1115,546 1190,560 1270,560', c: ['icp', 'icp'] },
  { a: 'icp1', b: 'dec', d: 'M1270,560 C1370,560 1400,626 1490,626', c: ['icp', 'icp'] },
  { a: 'icp1', b: 'bio1', d: 'M1270,560 C1250,680 820,650 700,774', c: ['icp', 'bio'] },
  { a: 'bio1', b: 'bio2', d: 'M700,774 C780,774 855,774 935,774', c: ['bio', 'bio'] },
  { a: 'bio2', b: 'bio3', d: 'M935,774 C1015,774 1090,774 1170,774', c: ['bio', 'bio'] },
  { a: 'bio3', b: 'icp2', d: 'M1170,774 C1250,774 1325,774 1405,774', c: ['bio', 'icp'] },
  { a: 'icp2', b: 'dec', d: 'M1405,774 C1480,774 1490,700 1490,626', c: ['icp', 'icp'] },
  { a: 'dec', b: 'ok', d: 'M1490,626 C1590,626 1630,554 1720,554', c: ['icp', 'ok'] },
  { a: 'dec', b: 'no', d: 'M1490,626 C1590,626 1620,789 1720,789', c: ['icp', 'no'] },
];

export const CHIPS42: { text: string; x: number; y: number; tone: Tone }[] = [
  { text: 'No biometric required', x: 1295, y: 612, tone: 'icp' },
  { text: 'Biometric required', x: 1065, y: 610, tone: 'bio' },
];

/** The floor area the particle layer covers (reference px). */
export const FLOOR42 = { x0: 420, x1: 1890, y0: 470, y1: 900 };

/** Every stage the card and the strip show, in route order. `plate` = the unit's own number; `short` = the strip tile's name. */
export const STAGES42: { id: CardStage; plate: string; phase: string; label: string; short: string; noun: string; desc: string }[] = [
  { id: 'sub', plate: '1', phase: 'Home', label: 'Application submitted', short: 'Submitted', noun: 'applications submitted', desc: 'The applicant fills in the form at home and uploads the passport, photo and documents.' },
  { id: 'pay', plate: '1', phase: 'Home', label: 'Paid', short: 'Paid', noun: 'applications paid', desc: 'The fees are paid online; the application then goes to VAS.' },
  { id: 'vas', plate: '2', phase: 'VAS', label: 'VAS review', short: 'VAS review', noun: 'files reviewed', desc: 'VAS checks the documents before sending the file to ICP. Incomplete files go back to the applicant.' },
  { id: 'toicp', plate: '3', phase: 'ICP', label: 'Submitted to ICP', short: 'Sent to ICP', noun: 'files with ICP', desc: 'VAS hands the reviewed file over to ICP.' },
  { id: 'icp1', plate: '4', phase: 'ICP', label: 'ICP review', short: 'ICP review', noun: 'in ICP review', desc: 'ICP reviews the application and decides whether biometrics are needed.' },
  { id: 'bio1', plate: '5', phase: 'Biometric', label: 'Biometric requested', short: 'Bio requested', noun: 'asked for biometrics', desc: 'ICP asks the applicant to give fingerprints and a photo at a visa centre.' },
  { id: 'bio2', plate: '6', phase: 'Biometric', label: 'Appointment scheduled', short: 'Appointment', noun: 'appointments booked', desc: 'The applicant books a slot at the nearest visa centre.' },
  { id: 'bio3', plate: '7', phase: 'Biometric', label: 'Biometrics completed', short: 'Bio completed', noun: 'biometrics captured', desc: 'Fingerprints and photo are captured at the centre and sent to ICP.' },
  { id: 'icp2', plate: '8', phase: 'ICP', label: 'ICP final review', short: 'ICP final review', noun: 'in final review', desc: 'ICP matches the biometrics with the file and completes its review.' },
  { id: 'dec', plate: '9', phase: 'ICP', label: 'ICP decision', short: 'ICP decision', noun: 'decisions made', desc: 'ICP approves or rejects the application.' },
  { id: 'ok', plate: '10', phase: 'Outcome', label: 'Approved', short: 'Approved', noun: 'visas approved', desc: 'The eVisa is issued and the traveller is ready to fly.' },
  { id: 'no', plate: '11', phase: 'Outcome', label: 'Rejected', short: 'Rejected', noun: 'applications rejected', desc: 'The applicant is told why and can apply again.' },
];

/** For the card's derived rows: the stage before (conversion) and after (still here). */
export const PREV42: Partial<Record<CardStage, CardStage>> = { pay: 'sub', vas: 'pay', toicp: 'vas', icp1: 'toicp', bio1: 'icp1', bio2: 'bio1', bio3: 'bio2', icp2: 'bio3', dec: 'icp1', ok: 'dec', no: 'dec' };
export const NEXT42: Partial<Record<CardStage, CardStage>> = { sub: 'pay', pay: 'vas', vas: 'toicp', toicp: 'icp1', bio1: 'bio2', bio2: 'bio3', bio3: 'icp2' };

/**
 * Detail view: demo breakdowns and insights per stage (marked "Demo breakdown" on screen).
 * Shares are applied to the live stage count; days are a typical time at the stage.
 * Replace with the data team's fields when they are confirmed.
 */
const CATEGORY: [string, number][] = [['30-day single entry · tourist', 0.42], ['60-day single entry · tourist', 0.19], ['30-day multiple entry', 0.14], ['14-day business', 0.13], ['96-hour transit', 0.12]];
const FEES: [string, number][] = [['Visa fee', 0.46], ['Express processing', 0.21], ['Travel insurance', 0.17], ['Service charge', 0.16]];
const CENTRES: [string, number][] = [['Beirut', 0.31], ['Mumbai', 0.24], ['Manila', 0.18], ['Dhaka', 0.15], ['Cairo', 0.12]];
const NATIONS: [string, number][] = [['India', 0.27], ['Lebanon', 0.19], ['Philippines', 0.16], ['Pakistan', 0.13], ['Egypt', 0.11]];
export const DETAIL42: Record<CardStage, { mixTitle: string; mix: [string, number][]; days: number; insights: [string, 'up' | 'warn' | 'info'][] }> = {
  sub: { mixTitle: 'Visa category mix', mix: CATEGORY, days: 0.3, insights: [['Most submissions arrive between 8 pm and midnight', 'info'], ['Mobile completes 38% of applications', 'up'], ['Document upload is the slowest step of the form', 'warn']] },
  pay: { mixTitle: 'Payments by fee', mix: FEES, days: 0.1, insights: [['Payment success rate is 96.5% today', 'up'], ['Card is the most used method (81%)', 'info'], ['Failed payments mostly retry within 10 minutes', 'warn']] },
  vas: { mixTitle: 'Visa category mix', mix: CATEGORY, days: 0.4, insights: [['12 files returned to applicants for correction', 'warn'], ['Passport photo is the top correction reason', 'info'], ['Most files are cleared in under 7 hours', 'up']] },
  toicp: { mixTitle: 'Visa category mix', mix: CATEGORY, days: 0.1, insights: [['Files reach ICP within 25 minutes of VAS approval', 'up'], ['No batches stuck in transfer', 'info'], ['Handovers peak between 10 am and noon', 'info']] },
  icp1: { mixTitle: 'Visa category mix', mix: CATEGORY, days: 1.2, insights: [['About 1 in 5 files needs biometrics', 'info'], ['Business visas most often need biometrics', 'warn'], ['Median review time is 1.2 days', 'up']] },
  bio1: { mixTitle: 'Requests by visa centre', mix: CENTRES, days: 0.6, insights: [['Most applicants book within 24 hours of the request', 'up'], ['Reminders sent to 214 applicants', 'info'], ['Beirut centre has the most requests', 'warn']] },
  bio2: { mixTitle: 'Bookings by visa centre', mix: CENTRES, days: 1.4, insights: [['Next free slot is tomorrow 09:30 at most centres', 'up'], ['No-show rate is 4% this week', 'warn'], ['Saturday slots fill first', 'info']] },
  bio3: { mixTitle: 'Captures by visa centre', mix: CENTRES, days: 0.2, insights: [['Average capture time is 6 minutes', 'up'], ['Retakes needed for 2% of applicants', 'warn'], ['All captures synced to ICP', 'info']] },
  icp2: { mixTitle: 'Visa category mix', mix: CATEGORY, days: 0.6, insights: [['Biometric match confirmed for 99% of files', 'up'], ['Final review takes 0.6 days on average', 'info'], ['Few files need a second check', 'info']] },
  dec: { mixTitle: 'Visa category mix', mix: CATEGORY, days: 0.2, insights: [['Approval rate is 87% overall', 'up'], ['Transit visas are decided fastest', 'info'], ['Most decisions are issued before noon', 'info']] },
  ok: { mixTitle: 'Top nationalities', mix: NATIONS, days: 0, insights: [['The eVisa is emailed within minutes', 'up'], ['Approval rate is highest for tourist visas', 'info'], ['Most approved travellers fly within 14 days', 'info']] },
  no: { mixTitle: 'Top nationalities', mix: NATIONS, days: 0, insights: [['Incomplete documents are the top reason', 'warn'], ['Rejections after biometrics are rare', 'info'], ['Applicants can apply again once documents are fixed', 'info']] },
};
