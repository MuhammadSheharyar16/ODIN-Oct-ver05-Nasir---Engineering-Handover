import { create } from 'zustand';
import type { Kpi } from './types';

/**
 * MOCK fixtures for the Executive Home. Every value here is invented for the
 * creative prototype and internally consistent; none is a VAS fact.
 * A small simulator nudges the "today" counts so the live-update motion can
 * be designed — the UI labels the whole experience as demo data.
 */

export const MOCK_DATA = true;

type HomeFeed = {
  asOf: Date;
  /** Central globe metric. Definition still requires sign-off (F02). */
  total: Kpi;
  /** Exactly four supporting Home objects, in visual order L-top, L-bottom, R-top, R-bottom. */
  orbs: [Kpi, Kpi, Kpi, Kpi];
  inProcessing: number;
  tick: () => void;
};

const enteredYesterdaySameTime = 294;
const approvedYesterdaySameTime = 252;

/** Today's VAS fees so far (mock) and the same point yesterday. */
const FEE = 1475;
const REVENUE_TODAY = 312 * FEE;
const revenueYesterdaySameTime = 294 * FEE;
const pct = (v: number, base: number) => +(((v - base) / base) * 100).toFixed(1);

export const useHomeFeed = create<HomeFeed>((set, get) => ({
  asOf: new Date(),
  inProcessing: 2140,
  total: {
    id: 'total-applications',
    label: 'Total applications',
    qualifier: 'to date',
    value: 8412,
    format: 'count',
    state: 'valid',
    featureIds: ['F02', 'F05'],
    kpiIds: ['KPI01'],
  },
  orbs: [
    {
      id: 'vas-revenue',
      label: 'Revenue today',
      // F13a (VAS revenue, KPI 5) is in scope for 30 Oct. Mock value: today's fees so far.
      value: REVENUE_TODAY,
      format: 'currency',
      currency: 'AED',
      state: 'valid',
      delta: { value: pct(REVENUE_TODAY, revenueYesterdaySameTime), unit: 'percent', basis: 'vs yesterday, same time' },
      featureIds: ['F13a'],
      kpiIds: ['KPI05'],
    },
    {
      id: 'entered-today',
      label: 'Entered processing today',
      value: 312,
      format: 'count',
      state: 'valid',
      delta: { value: 312 - enteredYesterdaySameTime, unit: 'count', basis: 'vs yesterday, same time' },
      featureIds: ['F05', 'F14a'],
      kpiIds: ['KPI01', 'KPI14'],
    },
    {
      id: 'approved-today',
      label: 'Approved today',
      value: 264,
      format: 'count',
      state: 'valid',
      delta: { value: 264 - approvedYesterdaySameTime, unit: 'count', basis: 'vs yesterday, same time' },
      featureIds: ['F06', 'F14a'],
      kpiIds: ['KPI02', 'KPI14'],
    },
    {
      id: 'closure-rate',
      label: 'Closure rate',
      qualifier: 'of eligible applications',
      // Closed (approved, rejected or otherwise closed) / all applications.
      value: +(((8412 - 2140) / 8412) * 100).toFixed(1),
      format: 'percent',
      state: 'valid',
      delta: { value: 1.2, unit: 'pp', basis: 'vs yesterday' },
      featureIds: ['F06', 'F14a'],
      kpiIds: ['KPI26', 'KPI14'],
    },
  ],
  tick: () => {
    const s = get();
    const entered = Math.random() < 0.7 ? 1 + Math.floor(Math.random() * 3) : 0;
    const approved = Math.random() < 0.5 ? 1 + Math.floor(Math.random() * 2) : 0;
    if (!entered && !approved) return;
    const [rev, ent, app, clo] = s.orbs;
    const entValue = (ent.value ?? 0) + entered;
    const appValue = (app.value ?? 0) + approved;
    set({
      asOf: new Date(),
      total: { ...s.total, value: (s.total.value ?? 0) + entered },
      inProcessing: s.inProcessing + entered - approved,
      orbs: [
        { ...rev, value: (rev.value ?? 0) + entered * FEE, delta: { ...rev.delta!, value: pct((rev.value ?? 0) + entered * FEE, revenueYesterdaySameTime) } },
        { ...ent, value: entValue, delta: { ...ent.delta!, value: entValue - enteredYesterdaySameTime } },
        { ...app, value: appValue, delta: { ...app.delta!, value: appValue - approvedYesterdaySameTime } },
        { ...clo, value: +((((s.total.value ?? 0) + entered - (s.inProcessing + entered - approved)) / ((s.total.value ?? 0) + entered)) * 100).toFixed(1) },
      ],
    });
  },
}));

let timer: number | undefined;
/** Starts the demo feed simulator (idempotent). */
export function startHomeFeedSimulator() {
  if (timer) return;
  const schedule = () => {
    timer = window.setTimeout(() => {
      useHomeFeed.getState().tick();
      schedule();
    }, 5000 + Math.random() * 7000);
  };
  schedule();
}
