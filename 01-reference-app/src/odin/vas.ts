/**
 * MOCK VAS dataset for the creative prototype. Every value is invented and
 * internally consistent; none is a VAS fact. Shares/factors are combined
 * with the live Home feed totals so every scene agrees with Home.
 */
import { useHomeFeed } from '../data/homeFeed';

export type Channel = 'online' | 'centre';

export type Country = {
  code: string;
  name: string;
  aliases: string[];
  /** Share of all applications (by applicant nationality). */
  share: number;
  /** Share of this country's applications submitted online. */
  online: number;
  approval: number; // approved / decided
  /** Multiplier on average processing time. */
  timeFactor: number;
  lat?: number;
  lon?: number;
};

export const COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', aliases: ['india', 'indian', 'indians'], share: 0.169, online: 0.71, approval: 0.88, timeFactor: 0.94, lat: 21, lon: 78 },
  { code: 'PK', name: 'Pakistan', aliases: ['pakistan', 'pakistani', 'pakistanis'], share: 0.131, online: 0.62, approval: 0.82, timeFactor: 1.12, lat: 30, lon: 70 },
  { code: 'PH', name: 'Philippines', aliases: ['philippines', 'filipino', 'filipinos', 'philipines'], share: 0.102, online: 0.78, approval: 0.9, timeFactor: 0.9, lat: 13, lon: 122 },
  { code: 'EG', name: 'Egypt', aliases: ['egypt', 'egyptian', 'egyptians'], share: 0.082, online: 0.66, approval: 0.84, timeFactor: 1.05, lat: 26, lon: 30 },
  { code: 'BD', name: 'Bangladesh', aliases: ['bangladesh', 'bangladeshi'], share: 0.073, online: 0.55, approval: 0.79, timeFactor: 1.21, lat: 24, lon: 90 },
  { code: 'NP', name: 'Nepal', aliases: ['nepal', 'nepali', 'nepalese'], share: 0.064, online: 0.6, approval: 0.83, timeFactor: 1.08, lat: 28, lon: 84 },
  { code: 'LB', name: 'Lebanon', aliases: ['lebanon', 'lebanese'], share: 0.056, online: 0.74, approval: 0.86, timeFactor: 0.98, lat: 34, lon: 36 },
  { code: 'GB', name: 'United Kingdom', aliases: ['uk', 'united kingdom', 'britain', 'british', 'england'], share: 0.049, online: 0.93, approval: 0.95, timeFactor: 0.72, lat: 54, lon: -2 },
  { code: 'NG', name: 'Nigeria', aliases: ['nigeria', 'nigerian'], share: 0.045, online: 0.69, approval: 0.76, timeFactor: 1.26, lat: 9, lon: 8 },
  { code: 'US', name: 'United States', aliases: ['usa', 'us', 'united states', 'america', 'american'], share: 0.04, online: 0.95, approval: 0.96, timeFactor: 0.7, lat: 39, lon: -98 },
  { code: 'OT', name: 'Other nationalities', aliases: [], share: 0.189, online: 0.75, approval: 0.87, timeFactor: 1, lat: 0, lon: 0 },
];

export type VisaType = { key: string; name: string; aliases: string[]; share: number; timeFactor: number; approvalFactor: number };

export const VISA_TYPES: VisaType[] = [
  { key: 'tourist30', name: '30-day tourist', aliases: ['30 day', '30-day', 'tourist', 'tourism', 'short stay'], share: 0.42, timeFactor: 0.9, approvalFactor: 1.02 },
  { key: 'tourist60', name: '60-day tourist', aliases: ['60 day', '60-day', 'long stay'], share: 0.18, timeFactor: 1.04, approvalFactor: 0.99 },
  { key: 'business', name: 'Business', aliases: ['business', 'work trip', 'conference'], share: 0.14, timeFactor: 1.12, approvalFactor: 1.01 },
  { key: 'transit', name: 'Transit', aliases: ['transit', 'stopover'], share: 0.11, timeFactor: 0.62, approvalFactor: 1.03 },
  { key: 'visit', name: 'Family visit', aliases: ['family', 'visit visa', 'visiting'], share: 0.09, timeFactor: 1.18, approvalFactor: 0.95 },
  { key: 'medical', name: 'Medical treatment', aliases: ['medical', 'treatment', 'health', 'healthcare'], share: 0.06, timeFactor: 1.3, approvalFactor: 0.97 },
];

export type Centre = { key: string; name: string; city: string; country: string; aliases: string[]; share: number; timeFactor: number };

/** Physical centres; `share` = share of all centre-submitted applications. */
export const CENTRES: Centre[] = [
  { key: 'mum', name: 'Mumbai VAC', city: 'Mumbai', country: 'IN', aliases: ['mumbai'], share: 0.14, timeFactor: 0.92 },
  { key: 'del', name: 'New Delhi VAC', city: 'New Delhi', country: 'IN', aliases: ['delhi', 'new delhi'], share: 0.11, timeFactor: 1.0 },
  { key: 'lhe', name: 'Lahore VAC', city: 'Lahore', country: 'PK', aliases: ['lahore'], share: 0.1, timeFactor: 1.18 },
  { key: 'khi', name: 'Karachi VAC', city: 'Karachi', country: 'PK', aliases: ['karachi'], share: 0.09, timeFactor: 1.1 },
  { key: 'mnl', name: 'Manila VAC', city: 'Manila', country: 'PH', aliases: ['manila'], share: 0.1, timeFactor: 0.88 },
  { key: 'cai', name: 'Cairo VAC', city: 'Cairo', country: 'EG', aliases: ['cairo'], share: 0.09, timeFactor: 1.04 },
  { key: 'dac', name: 'Dhaka VAC', city: 'Dhaka', country: 'BD', aliases: ['dhaka'], share: 0.11, timeFactor: 1.29 },
  { key: 'ktm', name: 'Kathmandu VAC', city: 'Kathmandu', country: 'NP', aliases: ['kathmandu'], share: 0.09, timeFactor: 1.12 },
  { key: 'bey', name: 'Beirut VAC', city: 'Beirut', country: 'LB', aliases: ['beirut'], share: 0.06, timeFactor: 0.97 },
  { key: 'los', name: 'Lagos VAC', city: 'Lagos', country: 'NG', aliases: ['lagos'], share: 0.06, timeFactor: 1.33 },
  { key: 'lon', name: 'London VAC', city: 'London', country: 'GB', aliases: ['london'], share: 0.05, timeFactor: 0.74 },
];

export type StageDef = { key: string; label: string; sub?: string; icon: StageIcon; accent: string; days: number; reach: number; unavailable?: boolean };
export type StageIcon = 'submit' | 'payment' | 'review' | 'upload' | 'biometric' | 'calendar' | 'checkin' | 'documents';

/** `reach` = share of the channel cohort that has reached the stage; `days` = avg time in stage. */
export const JOURNEYS: Record<Channel, { title: string; stages: StageDef[]; endToEnd: number }> = {
  online: {
    title: 'Application Journey',
    endToEnd: 3.8,
    stages: [
      { key: 'submission', label: 'Application submission', icon: 'submit', accent: '#4f9cff', days: 0.4, reach: 1 },
      { key: 'payment', label: 'Payment', icon: 'payment', accent: '#5aa8ff', days: 0.2, reach: 0.962 },
      { key: 'vas-review', label: 'VAS internal review', icon: 'review', accent: '#6db4ff', days: 0.6, reach: 0.917 },
      { key: 'to-icp', label: 'Submission to ICP', icon: 'upload', accent: '#7cc0ff', days: 0.4, reach: 0.846 },
      { key: 'icp', label: 'ICP processing', sub: 'Biometric & review', icon: 'biometric', accent: '#9b8cff', days: 2.2, reach: 0.76 },
    ],
  },
  // F07b (v2 scope): every application is submitted online (DXC, 15 Oct). Centres
  // handle later visits only, so this is a centre *visit* journey of appointments.
  // Stages without confirmed source events are shown as "Not available".
  centre: {
    title: 'Centre Visit Journey',
    endToEnd: 1.4,
    stages: [
      { key: 'appointment', label: 'Appointment booked', icon: 'calendar', accent: '#f5ac45', days: 1.2, reach: 1 },
      { key: 'arrived', label: 'Arrived at centre', sub: 'arrival not yet captured', icon: 'checkin', accent: '#8b96ad', days: 0, reach: 0.95, unavailable: true },
      { key: 'payment', label: 'Payment at centre', sub: 'POS or cash', icon: 'payment', accent: '#f7bb5a', days: 0.1, reach: 0.62 },
      { key: 'biometrics', label: 'Biometrics captured', icon: 'biometric', accent: '#f2c46e', days: 0.1, reach: 0.9 },
      { key: 'interview', label: 'Interview', sub: 'when required', icon: 'review', accent: '#c9a3ff', days: 0.2, reach: 0.08 },
    ],
  },
};

/** v2 scope: all applications are submitted online; centres are visited later (biometrics). */
const CHANNEL_SHARE: Record<Channel, number> = { online: 1, centre: 0 };
/** Share of applications attributed to a centre (biometrics visit) — mock. */
const CENTRE_ATTRIBUTION = 0.34;
/** Share of applications closed for other reasons (withdrawn/cancelled) — mock. */
const CLOSED_OTHER_SHARE = 0.032;

export type Filters = { country?: string; visaType?: string; channel?: Channel; centre?: string };

export type Slice = {
  applications: number;
  approved: number;
  rejected: number;
  inProcessing: number;
  closedOther: number;
  closureRate: number;
  approvalRate: number;
  avgDays: number;
  stageDays: { key: string; label: string; days: number }[];
  channelSplit: { online: number; centre: number };
};

const round = Math.round;

function live() {
  const s = useHomeFeed.getState();
  return { total: s.total.value ?? 0, inProcessing: s.inProcessing };
}

export const findCountry = (code?: string) => COUNTRIES.find((c) => c.code === code);
export const findVisa = (key?: string) => VISA_TYPES.find((v) => v.key === key);
export const findCentre = (key?: string) => CENTRES.find((c) => c.key === key);

/** Compute a consistent slice for the given filters from the live totals. */
export function slice(f: Filters = {}): Slice {
  const { total, inProcessing } = live();
  const baseInProcShare = inProcessing / Math.max(1, total);

  const centre = findCentre(f.centre);
  const country = findCountry(centre?.country ?? f.country);
  const visa = findVisa(f.visaType);
  const channel: Channel | undefined = centre ? 'centre' : f.channel;

  let share = 1;
  if (country) share *= country.share;
  if (visa) share *= visa.share;
  const onlineShare = CHANNEL_SHARE.online;
  if (centre) {
    // Applications attributed to this centre (biometrics visits), within its country.
    const sameCountry = CENTRES.filter((c) => c.country === centre.country);
    const totalShare = sameCountry.reduce((a, c) => a + c.share, 0);
    share *= CENTRE_ATTRIBUTION * (centre.share / totalShare);
  }

  const applications = Math.max(0, round(total * share));
  const approvalBase = (country?.approval ?? 0.868) * (visa?.approvalFactor ?? 1);
  const approvalRate = Math.min(0.99, approvalBase);
  const inProc = round(applications * baseInProcShare * (country ? 0.92 + country.timeFactor * 0.08 : 1));
  const closedOther = round(applications * CLOSED_OTHER_SHARE);
  const decided = Math.max(0, applications - inProc - closedOther);
  const approved = round(decided * approvalRate);
  const rejected = decided - approved;

  void channel;
  const journey = JOURNEYS.online;
  const factor = (country?.timeFactor ?? 1) * (visa?.timeFactor ?? 1) * (centre?.timeFactor ?? 1);
  const stageDays = journey.stages.map((s) => ({ key: s.key, label: s.label, days: +(s.days * factor).toFixed(1) }));
  // Without a channel filter, average the two channels by volume.
  const avgDays = +(journey.endToEnd * factor).toFixed(1);

  return {
    applications,
    approved,
    rejected,
    inProcessing: inProc,
    closedOther,
    closureRate: applications ? ((applications - inProc) / applications) * 100 : 0,
    approvalRate: approvalRate * 100,
    avgDays,
    stageDays,
    channelSplit: { online: round(applications * onlineShare), centre: applications - round(applications * onlineShare) },
  };
}

/** Journey cohort counts for a channel (and optional country). Centre = visits (appointments). */
export function journeyCounts(channel: Channel, f: Filters = {}) {
  const base = slice({ ...f, channel: undefined });
  const s = channel === 'centre' ? { ...base, applications: round(base.applications * CENTRE_ATTRIBUTION) } : base;
  const def = JOURNEYS[channel];
  const factor = (findCountry(f.country)?.timeFactor ?? 1) * (findVisa(f.visaType)?.timeFactor ?? 1) * (findCentre(f.centre)?.timeFactor ?? 1);
  // MOCK same-time-yesterday comparison (F14a): deterministic per stage/channel.
  const seed = (k: string) => [...`${channel}${k}${f.country ?? ''}`].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);
  const pctDelta = (k: string, lo = -9, hi = 14) => +(lo + ((seed(k) % 1000) / 1000) * (hi - lo)).toFixed(1);
  return {
    total: s.applications,
    totalDelta: pctDelta('total', 2, 13),
    endToEnd: +(def.endToEnd * factor).toFixed(1),
    endToEndDelta: +(-0.1 - (seed('e2e') % 5) / 10).toFixed(1),
    /** Applications entering processing per hour today (mock), for the mini chart. */
    hourly: Array.from({ length: 10 }, (_, i) => Math.round(8 + 22 * Math.sin((i / 9) * Math.PI * 0.9 + 0.3) + (seed(`h${i}`) % 9))),
    stages: def.stages.map((st) => ({ ...st, count: round(s.applications * st.reach), days: +(st.days * factor).toFixed(1), delta: st.unavailable ? undefined : pctDelta(st.key) })),
    ...(channel === 'centre'
      ? {
          // Completed visits; missed/rescheduled needs arrival events (not yet captured).
          approved: { count: round(s.applications * 0.86), days: +(def.endToEnd * factor).toFixed(1), delta: pctDelta('approved', 3, 12) },
          rejected: { count: 0, days: 0, delta: undefined, unavailable: true },
        }
      : {
          approved: { count: s.approved, days: +(def.endToEnd * factor * 0.82).toFixed(1), delta: pctDelta('approved', 4, 18) },
          rejected: { count: s.rejected, days: +(def.endToEnd * factor * 0.68).toFixed(1), delta: pctDelta('rejected', -20, -2) },
        }),
    inProcessing: s.inProcessing,
  };
}


// ─────────────────────────── Extended mock analytics ───────────────────────────
const dhash = (k: string) => [...k].reduce((a, c) => (a * 33 + c.charCodeAt(0)) % 100003, 11);
/** Deterministic pseudo-random in [lo, hi] for a key (stable across renders). */
export const mockBetween = (k: string, lo: number, hi: number) => lo + ((dhash(k) % 1000) / 1000) * (hi - lo);

/** Country of residence (where applicants apply from) — distinct from nationality. */
export const RESIDENCE: { code: string; name: string; share: number; lat: number; lon: number }[] = [
  { code: 'LB', name: 'Lebanon', share: 0.142, lat: 34, lon: 36 },
  { code: 'NP', name: 'Nepal', share: 0.124, lat: 28, lon: 84 },
  { code: 'IN', name: 'India', share: 0.108, lat: 21, lon: 78 },
  { code: 'PK', name: 'Pakistan', share: 0.087, lat: 30, lon: 70 },
  { code: 'EG', name: 'Egypt', share: 0.069, lat: 26, lon: 30 },
  { code: 'PH', name: 'Philippines', share: 0.061, lat: 13, lon: 122 },
  { code: 'BD', name: 'Bangladesh', share: 0.055, lat: 24, lon: 90 },
  { code: 'JO', name: 'Jordan', share: 0.048, lat: 31, lon: 36 },
  { code: 'NG', name: 'Nigeria', share: 0.041, lat: 9, lon: 8 },
  { code: 'GB', name: 'United Kingdom', share: 0.036, lat: 54, lon: -2 },
];

export const totals = () => {
  const s = useHomeFeed.getState();
  return { total: s.total.value ?? 0, inProcessing: s.inProcessing, entered: s.orbs[1].value ?? 0, approvedToday: s.orbs[2].value ?? 0 };
};

/** Processing-time statistics for a channel (mock distribution around the average). */
export function timeStats(channel: Channel | 'all', f: Filters = {}) {
  const ch: Channel = channel === 'all' ? 'online' : channel;
  const s = slice({ ...f, channel: undefined });
  const def = JOURNEYS[ch];
  const factor = (findCountry(f.country)?.timeFactor ?? 1) * (findVisa(f.visaType)?.timeFactor ?? 1);
  const stages = def.stages.filter((st) => !st.unavailable).map((st) => ({ key: st.key, label: st.label, icon: st.icon, accent: st.accent, days: +(st.days * factor).toFixed(1) }));
  const sorted = [...stages].sort((a, b) => a.days - b.days);
  const avg = ch === 'centre' ? +(def.endToEnd * factor).toFixed(1) : s.avgDays;
  return {
    applications: ch === 'centre' ? journeyCounts('centre', f).total : s.applications,
    avg,
    avgDelta: +(-mockBetween(`${channel}avgd`, 2, 9)).toFixed(1),
    median: +(avg * 0.82).toFixed(1),
    medianDelta: +mockBetween(`${channel}med`, -6, 5).toFixed(1),
    p90: +(avg * 1.63).toFixed(1),
    fastest: sorted[0],
    longest: sorted[sorted.length - 1],
    stages,
    hourly: Array.from({ length: 12 }, (_, i) => Math.round(10 + 18 * Math.abs(Math.sin(i * 0.7 + 0.4)) + (dhash(`${channel}h${i}`) % 8))),
  };
}

/** Open applications currently waiting at each stage, with age buckets (mock). */
export function queueAging(channel: Channel = 'online') {
  const j = journeyCounts(channel);
  const decided = j.approved.count + j.rejected.count;
  const stages = j.stages.filter((st) => !st.unavailable);
  return stages.map((st, i) => {
    const waiting = Math.max(0, st.count - (stages[i + 1]?.count ?? decided));
    const old = mockBetween(`${channel}${st.key}old`, 0.04, 0.2) * Math.min(2.2, st.days);
    const mid = mockBetween(`${channel}${st.key}mid`, 0.12, 0.3);
    const over3 = Math.round(waiting * Math.min(0.35, old));
    const d13 = Math.round(waiting * mid);
    return { key: st.key, label: st.label, icon: st.icon, accent: st.accent, waiting, avgWait: +(st.days * 1.08).toFixed(1), buckets: { lt1: waiting - d13 - over3, d13, gt3: over3 } };
  });
}

/** Period-over-period processed decisions (mock, consistent with Home). */
export function periods() {
  const t = totals();
  const today = t.approvedToday + Math.round(t.approvedToday * 0.12);
  const yesterday = Math.round(today / 1.08);
  const last7 = Math.round(today * 6.6);
  const prev7 = Math.round(last7 / 1.06);
  const mtd = Math.round(today * 14.6);
  const mk = (key: string, label: string, value: number, cmp: string, delta: number | null, accent: string, approval: number, days: number, apD: number | null, dD: number | null) =>
    ({ key, label, value, cmp, delta, accent, approval, days, approvalDelta: apD, daysDelta: dD });
  return [
    mk('today', 'Today', today, 'vs yesterday, same time', +(((today - yesterday) / yesterday) * 100).toFixed(1), '#4f9cff', 88.6, 3.6, 0.8, -6.2),
    mk('yesterday', 'Yesterday', yesterday, 'full day', null, '#8b6cff', 87.8, 3.8, null, null),
    mk('last7', 'Last 7 days', last7, 'vs previous 7 days', +(((last7 - prev7) / prev7) * 100).toFixed(1), '#f5ac45', 87.9, 3.8, 1.1, -4.4),
    mk('prev7', 'Previous 7 days', prev7, 'baseline', null, '#4fb6ff', 86.9, 4.0, null, null),
    mk('mtd', 'Month to date', mtd, 'since 1 Oct', null, '#33d69a', 87.4, 3.9, null, null),
  ];
}

export function channelSplit() {
  const s = slice();
  const on = s.channelSplit.online;
  const ce = s.channelSplit.centre;
  const bars = (k: string) => Array.from({ length: 14 }, (_, i) => Math.round(30 + i * 4 + (dhash(`${k}${i}`) % 14)));
  return {
    total: s.applications,
    online: { count: on, share: (on / s.applications) * 100, delta: +mockBetween('chon', 6, 15).toFixed(1), bars: bars('on') },
    centre: { count: ce, share: (ce / s.applications) * 100, delta: +mockBetween('chce', 2, 9).toFixed(1), bars: bars('ce') },
  };
}

export function topResidence(n = 10) {
  const { total } = totals();
  return RESIDENCE.slice(0, n).map((r) => ({ ...r, value: Math.round(total * r.share), delta: +mockBetween(`res${r.code}`, -4, 19).toFixed(1) }));
}

export function topNationalities(n = 5) {
  return COUNTRIES.filter((c) => c.code !== 'OT')
    .map((c) => ({ code: c.code, name: c.name, value: slice({ country: c.code }).applications }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

export function topCentres(n = 5) {
  return CENTRES.map((c) => ({ key: c.key, name: c.name, country: c.country, value: slice({ centre: c.key }).applications, days: slice({ centre: c.key }).avgDays }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

/** DESIGN PREVIEW ONLY — revenue awaits the finance definition (F13a/F13b amber). */
export function revenuePreview() {
  const { total } = totals();
  const amount = total * 1475;
  const dims = [
    { key: 'countries', label: 'Operating countries', share: 0.49, accent: '#4fb6ff', items: ['Lebanon', 'Nepal', 'India'] },
    { key: 'centres', label: 'Visa centres', share: 0.27, accent: '#8b6cff', items: ['Mumbai VAC', 'Beirut VAC', 'Dhaka VAC'] },
    { key: 'services', label: 'Service types', share: 0.17, accent: '#f5ac45', items: ['Visa fee', 'Lounge', 'Courier'] },
    { key: 'nationalities', label: 'Applicant nationalities', share: 0.07, accent: '#33d69a', items: ['Indian', 'Pakistani', 'Filipino'] },
  ];
  return {
    amount,
    delta: 18,
    dims: dims.map((d) => {
      const v = amount * d.share;
      const w = [0.38, 0.3, 0.2];
      return { ...d, value: v, bars: Array.from({ length: 9 }, (_, i) => 30 + (dhash(`${d.key}${i}`) % 70)), top: d.items.map((name, i) => ({ name, value: v * w[i] })) };
    }),
  };
}

/**
 * VAS Revenue v2: every dimension is a full breakdown of the same total
 * (top items + the rest), so each panel sums to the total. DEMO values.
 * F13b covers country and centre; service and nationality are post-October previews.
 */
export function revenueBreakdowns() {
  const { amount, delta } = revenuePreview();
  const dim = (key: string, title: string, sub: string, accent: string, rows: [string, number][], restLabel: string, preview = false) => {
    const shown = rows.reduce((a, [, s]) => a + s, 0);
    return {
      key, title, sub, accent, preview,
      rows: rows.map(([name, share]) => ({ name, share, value: amount * share })),
      rest: { label: restLabel, share: 1 - shown, value: amount * (1 - shown) },
    };
  };
  return {
    amount, delta,
    breakdowns: [
      dim('countries', 'By country', 'country of the paying applicant', '#4fb6ff', [['Lebanon', 0.19], ['Nepal', 0.15], ['India', 0.11]], 'All others'),
      dim('centres', 'By centre', 'centre where the fee was collected', '#8b6cff', [['Mumbai VAC', 0.14], ['Beirut VAC', 0.12], ['Dhaka VAC', 0.1]], 'All others'),
      dim('services', 'By service', 'fee type', '#f5ac45', [['Visa fee', 0.55], ['Lounge', 0.21], ['Courier', 0.12]], 'All others', true),
      dim('nationalities', 'By nationality', 'applicant nationality', '#33d69a', [['Indian', 0.22], ['Pakistani', 0.14], ['Filipino', 0.1]], 'All others', true),
    ],
  };
}

export const PURPOSES = [
  { key: 'tourism', label: 'Tourism', share: 0.6, accent: '#4f9cff' },
  { key: 'business', label: 'Business', share: 0.14, accent: '#f5ac45' },
  { key: 'family', label: 'Family visit', share: 0.09, accent: '#a67cff' },
  { key: 'transit', label: 'Transit', share: 0.11, accent: '#4fd6ff' },
  { key: 'medical', label: 'Medical treatment', share: 0.06, accent: '#33d69a' },
];
export const OCCUPATIONS = [
  { key: 'professional', label: 'Professionals', share: 0.31, accent: '#4f9cff' },
  { key: 'skilled', label: 'Skilled trades', share: 0.24, accent: '#f5ac45' },
  { key: 'business', label: 'Business owners', share: 0.13, accent: '#a67cff' },
  { key: 'student', label: 'Students', share: 0.11, accent: '#4fd6ff' },
  { key: 'other', label: 'Other / not stated', share: 0.21, accent: '#8796b4' },
];

/**
 * Online journey map (floor view): every stage of the online route, including
 * the ICP biometric branch. Main-route stages come from journeyCounts; the
 * biometric branch (F25, red) is a labelled design preview split of the ICP
 * cohort. Approved splits by route; totals reconcile to journeyCounts.
 */
export function onlineJourneyMap(f: Filters = {}) {
  const j = journeyCounts('online', f);
  const st = Object.fromEntries(j.stages.map((s) => [s.key, s]));
  const icp = st['icp'].count;
  const bioShare = 0.24;
  const bio1 = Math.round(icp * bioShare);
  const bio2 = Math.round(bio1 * 0.913);
  const bio3 = Math.round(bio2 * 0.963);
  const icp2 = Math.round(bio3 * 0.953);
  const okBot = Math.round(j.approved.count * 0.226);
  const d = (k: string, lo = -4, hi = 12) => +mockBetween(`ojm${k}${f.country ?? ''}`, lo, hi).toFixed(1);
  return {
    today: { count: totals().entered, delta: d('today', 2, 9) },
    submitted: { count: st['submission'].count, delta: st['submission'].delta ?? d('sub') },
    paid: { count: st['payment'].count, delta: st['payment'].delta ?? d('pay') },
    vasReview: { count: st['vas-review'].count, delta: st['vas-review'].delta ?? d('vas') },
    toIcp: { count: st['to-icp'].count, delta: st['to-icp'].delta ?? d('toicp') },
    icpReview: { count: icp, delta: st['icp'].delta ?? d('icp') },
    bioRequest: { count: bio1, delta: d('b1', 1, 6) },
    bioScheduled: { count: bio2, delta: d('b2', 1, 5) },
    bioDone: { count: bio3, delta: d('b3', 0, 5) },
    icpAfterBio: { count: icp2, delta: d('b4', 0, 4) },
    approvedDirect: { count: j.approved.count - okBot, delta: d('okd', 3, 12) },
    approvedAfterBio: { count: okBot, delta: d('okb', 2, 8) },
    rejected: { count: j.rejected.count, delta: j.rejected.delta ?? d('no', -8, -1) },
    /** Rejected by route (demo split until decisions carry the biometric flag). */
    rejectedAfterBio: Math.round(j.rejected.count * 0.3),
    approvedTotal: j.approved.count,
    endToEnd: j.endToEnd,
  };
}
export type OnlineJourneyMap = ReturnType<typeof onlineJourneyMap>;
