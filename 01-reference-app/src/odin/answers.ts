import type { ComponentSpec, Intent, Placed, SceneAnswer } from './types';
import {
  CENTRES, COUNTRIES, JOURNEYS, VISA_TYPES, findCentre, findCountry, findVisa, journeyCounts, periods,
  queueAging, revenuePreview, revenueBreakdowns, onlineJourneyMap, slice, timeStats, topCentres, topNationalities, topResidence, totals,
  type Channel, type Filters,
} from './vas';
import { formatCount } from '../lib/format';
import { useLayout } from '../state/layout';
import { composeHomeSummary } from '../data/homeSummary';
import { useHomeFeed } from '../data/homeFeed';

/**
 * Answer engine: Intent → SceneAnswer. Every sentence is built from the same
 * numbers the components display (spoken/visual parity). Observations only:
 * no causes, forecasts or judgements (Magic Box 06).
 */

const C = {
  blue: '#4f9cff', amber: '#f5ac45', green: '#3ed6a0', violet: '#a67cff', red: '#ff5d6c', cyan: '#4fd6ff',
};

let seq = 0;
const nextId = () => `scene-${++seq}`;
const days = (n: number) => `${n.toFixed(1)} days`;
const pct = (n: number) => `${n.toFixed(1)}%`;

/** Human description of filters, e.g. "for 30-day tourist visas from India". */
function describe(f: Filters, opts: { channel?: boolean } = {}) {
  const parts: string[] = [];
  const visa = findVisa(f.visaType);
  const country = findCountry(f.country);
  const centre = findCentre(f.centre);
  if (visa) parts.push(`for ${visa.name.toLowerCase()} visas`);
  if (centre) parts.push(`at ${centre.name}`);
  else if (country) parts.push(`from ${country.name}`);
  if (opts.channel !== false && f.channel && !centre) parts.push(f.channel === 'online' ? 'submitted online' : 'submitted at centres');
  return parts.join(' ');
}

function titleSuffix(f: Filters) {
  const d = describe(f);
  return d ? ` · ${d.charAt(0).toUpperCase()}${d.slice(1)}` : '';
}

function scene(a: Omit<SceneAnswer, 'id'>): SceneAnswer {
  return { id: nextId(), ...a };
}

const place = (spec: ComponentSpec, slot: string): Placed => ({ spec, slot });

// ───────────────────────────── Journey ─────────────────────────────
function journey(channel: Channel, f: Filters, intent: Intent): SceneAnswer {
  if (channel === 'centre') return retired(intent, 'centreJourney');
  const j = journeyCounts(channel, f);
  const def = JOURNEYS[channel];
  // Applications currently waiting at each stage = reached this stage − reached next.
  const waiting = j.stages.map((s, i) => s.count - (j.stages[i + 1]?.count ?? j.approved.count + j.rejected.count));
  const maxIdx = waiting.indexOf(Math.max(...waiting));
  const busiest = j.stages[maxIdx];
  const who = describe({ ...f, channel: undefined });
  const subject = 'online applications';

  const m = onlineJourneyMap(f);
  const fc = formatCount;
  const pctOf = (n: number, d: number) => `${Math.round((n / Math.max(1, d)) * 100)} percent`;
  const floor = {
    home: { metric: m.today.count, delta: m.today.delta, say: `Every journey starts at home. ${fc(m.today.count)} applications entered processing today.` },
    sub: { metric: m.submitted.count, delta: m.submitted.delta, say: `${fc(m.submitted.count)} online applications have been submitted${who ? ` ${who}` : ''}.` },
    pay: { metric: m.paid.count, delta: m.paid.delta, say: `${fc(m.paid.count)} have paid, ${pctOf(m.paid.count, m.submitted.count)} of submissions.` },
    vas: { metric: m.vasReview.count, delta: m.vasReview.delta, say: `VAS has reviewed ${fc(m.vasReview.count)} applications.` },
    toicp: { metric: m.toIcp.count, delta: m.toIcp.delta, say: `${fc(m.toIcp.count)} files have been submitted to ICP.` },
    icp1: { metric: m.icpReview.count, delta: m.icpReview.delta, say: `ICP is reviewing ${fc(m.icpReview.count)} applications. Some need biometrics first.` },
    bio1: { metric: m.bioRequest.count, delta: m.bioRequest.delta, say: `ICP asked ${fc(m.bioRequest.count)} applicants to give biometrics.` },
    bio2: { metric: m.bioScheduled.count, delta: m.bioScheduled.delta, say: `${fc(m.bioScheduled.count)} have scheduled a biometrics appointment.` },
    bio3: { metric: m.bioDone.count, delta: m.bioDone.delta, say: `${fc(m.bioDone.count)} have completed their biometrics.` },
    icp2: { metric: m.icpAfterBio.count, delta: m.icpAfterBio.delta, say: `ICP has ${fc(m.icpAfterBio.count)} applications in final review after biometrics.` },
    dec: { metric: m.approvedTotal + m.rejected.count, delta: m.approvedDirect.delta, say: `ICP has decided ${fc(m.approvedTotal + m.rejected.count)} applications, with or without biometrics.` },
    ok: {
      metric: m.approvedTotal, delta: m.approvedDirect.delta,
      say: `${fc(m.approvedTotal)} applications have been approved: ${fc(m.approvedDirect.count)} without biometrics and ${fc(m.approvedAfterBio.count)} after biometrics.`,
      split: [{ label: 'Without biometric', value: m.approvedDirect.count, tone: 'icp' as const }, { label: 'After biometric', value: m.approvedAfterBio.count, tone: 'bio' as const }],
    },
    no: {
      metric: m.rejected.count, delta: m.rejected.delta,
      say: `${fc(m.rejected.count)} applications have been rejected: ${fc(m.rejected.count - m.rejectedAfterBio)} without biometrics and ${fc(m.rejectedAfterBio)} after biometrics.`,
      split: [{ label: 'Without biometric', value: m.rejected.count - m.rejectedAfterBio, tone: 'icp' as const }, { label: 'After biometric', value: m.rejectedAfterBio, tone: 'bio' as const }],
    },
  };
  const spoken =
    `There are ${formatCount(j.total)} ${subject}${who ? ` ${who}` : ''}. ` +
    `${busiest.label} currently holds the most, with ${formatCount(waiting[maxIdx])} waiting and an average of ${days(busiest.days)} at that stage. ` +
    `${formatCount(j.approved.count)} have been approved and ${formatCount(j.rejected.count)} rejected; end to end takes ${days(j.endToEnd)} on average.`;

  return scene({
    intent,
    template: 'floor',
    env: 'floor',
    title: def.title,
    subtitle: `From your home to a brighter tomorrow${titleSuffix({ ...f, channel: undefined })}`,
    focusKey: 'journey',
    presence: 'dissolved',
    components: [
      place(
        { kind: 'metric', key: 'total-online', label: 'Total online applications', value: j.total, format: 'count', icon: 'applications', accent: C.blue, caption: who ? `${who}` : 'to date', delta: { value: j.totalDelta, unit: 'percent', basis: 'vs yesterday' }, spark: { kind: 'bars', values: j.hourly } },
        'tl',
      ),
      place({ kind: 'metric', key: 'e2e-online', label: 'Average time to decision', value: j.endToEnd, format: 'days', icon: 'clock', accent: C.cyan, caption: 'submission to final decision', delta: { value: j.endToEndDelta, unit: 'days', basis: 'vs yesterday', goodWhen: 'down' }, spark: { kind: 'line', values: [5.1, 4.9, 4.8, 4.9, 4.5, 4.4, 4.2, 4.3, 4.0, j.endToEnd] } }, 'tr'),
      place(
        {
          kind: 'journey',
          key: 'journey',
          channel,
          stages: j.stages.map((s) => ({ key: s.key, label: s.label, sub: s.sub, icon: s.icon, accent: s.accent, count: s.count, days: s.days, delta: s.delta })),
          approved: j.approved,
          rejected: j.rejected,
          emphasisKey: busiest.key,
          floor,
        },
        'main',
      ),
    ],
    // Wide: opening line = the Home stop, then the floor tour narrates each stage.
    // Phones/portrait (vertical journey, no tour): the full summary sentence.
    spoken: useLayout.getState().home.mode === 'wide' ? floor.home.say : spoken,
    summary: useLayout.getState().home.mode === 'wide' ? {
      primary: `${formatCount(m.submitted.count)} online applications on the journey · ${formatCount(m.approvedTotal)} approved · ${formatCount(m.rejected.count)} rejected.`,
      secondary: `${formatCount(m.bioRequest.count)} took the biometric route · ${days(m.endToEnd)} end to end on average.`,
    } : {
      primary: `${busiest.label} holds the most ${subject} right now: ${formatCount(waiting[maxIdx])} waiting.`,
      secondary: `Average ${days(busiest.days)} at this stage · ${days(j.endToEnd)} end to end · ${formatCount(j.approved.count)} approved, ${formatCount(j.rejected.count)} rejected.`,
    },
  });
}


// ───────────────────────────── Outcomes ─────────────────────────────
function outcomes(f: Filters, intent: Intent): SceneAnswer {
  // The galaxy is the outcomes screen (V27).
  const s = slice(f);
  const who = describe(f);
  const spoken =
    `Of ${formatCount(s.applications)} applications${who ? ` ${who}` : ''}, ${formatCount(s.approved)} have been approved and ${formatCount(s.rejected)} rejected. ` +
    `${formatCount(s.inProcessing)} are still in processing, which puts the closure rate at ${pct(s.closureRate)}.`;
  return scene({
    intent,
    template: 'galaxy',
    title: 'Application Outcomes',
    subtitle: `Current status of every application${who ? ` ${who}` : ' to date'}`,
    focusKey: 'donut',
    // The galaxy is the centre, so ODIN's globe stays out of it.
    presence: 'dissolved',
    // One composition: the galaxy with its outcome cards (tablet / phone use the card board).
    components: [
      place(
        {
          kind: 'donut',
          key: 'donut',
          total: s.applications,
          totalLabel: 'Total applications',
          basis: 'Current status · each application counted once',
          variant: 'galaxy',
          closure: { value: s.closureRate, basis: 'closed ÷ all applications' },
          segments: [
            { key: 'approved', label: 'Approved', count: s.approved, accent: C.green },
            { key: 'processing', label: 'In processing', count: s.inProcessing, accent: C.blue },
            { key: 'rejected', label: 'Rejected', count: s.rejected, accent: C.red },
            { key: 'closed', label: 'Closed · other', count: s.closedOther, accent: C.violet },
          ],
        },
        'main',
      ),
    ],
    spoken,
    summary: {
      primary: `${formatCount(s.approved)} approved, ${formatCount(s.rejected)} rejected, ${formatCount(s.inProcessing)} in processing.`,
      secondary: `Closure rate ${pct(s.closureRate)} of ${formatCount(s.applications)} applications${who ? ` ${who}` : ''}.`,
    },
  });
}

// ───────────────────────────── Processing time ─────────────────────────────
function time(f: Filters, intent: Intent): SceneAnswer {
  const s = slice(f);
  const overall = slice({ channel: f.channel });
  const who = describe(f) || 'across all applications';
  const diff = +(s.avgDays - overall.avgDays).toFixed(1);
  const hasSlice = !!(f.country || f.visaType || f.centre);
  const ch: Channel = f.centre ? 'centre' : f.channel ?? 'online';
  const longest = [...s.stageDays].sort((a, b) => b.days - a.days)[0];

  const spoken =
    `Applications ${who} take ${days(s.avgDays)} on average from submission to decision` +
    (hasSlice ? `, ${Math.abs(diff).toFixed(1)} days ${diff >= 0 ? 'longer' : 'shorter'} than the overall average of ${days(overall.avgDays)}. ` : '. ') +
    `The longest stage is ${longest.label}, at ${days(longest.days)}.`;

  const components: Placed[] = [
    place(
      {
        kind: 'metric', key: 'avg-time', label: 'Average processing time', value: s.avgDays, format: 'days', icon: 'clock', accent: C.cyan, hero: true,
        caption: who,
        delta: hasSlice ? { value: diff, unit: 'days', basis: `vs overall ${days(overall.avgDays)}`, goodWhen: 'down' } : undefined,
      },
      'hero',
    ),
    place(
      { kind: 'bars', key: 'stage-times', title: `Time at each stage · ${ch === 'online' ? 'online' : 'centre'} journey`, basis: 'average days per stage', format: 'days', accent: C.violet, items: s.stageDays.map((d) => ({ key: d.key, label: d.label, value: d.days })) },
      'right',
    ),
    place({ kind: 'metric', key: 'apps-slice', label: 'Applications', value: s.applications, format: 'count', icon: 'applications', accent: C.blue, caption: hasSlice ? who : 'to date' }, 'left1'),
    place({ kind: 'metric', key: 'in-proc-slice', label: 'In processing now', value: s.inProcessing, format: 'count', icon: 'processing', accent: C.amber, caption: 'awaiting decision' }, 'left2'),
  ];
  return scene({
    intent,
    template: 'focus',
    title: 'Processing Time',
    subtitle: `Average time from submission to final decision${titleSuffix(f)}`,
    focusKey: 'avg-time',
    presence: 'dissolved',
    components,
    spoken,
    summary: {
      primary: `${days(s.avgDays)} average processing time ${who}.`,
      secondary: `Longest stage: ${longest.label} (${days(longest.days)})${hasSlice ? ` · overall average ${days(overall.avgDays)}` : ''}.`,
    },
  });
}

// ───────────────────────────── Counts ─────────────────────────────
function count(f: Filters, intent: Intent): SceneAnswer {
  if (intent.type === 'count' && intent.style === 'core') return countCore(f, intent);
  const s = slice(f);
  const who = describe(f) || 'to date';
  const spoken =
    `There are ${formatCount(s.applications)} applications ${who}. ${formatCount(s.inProcessing)} are in processing, ` +
    `${formatCount(s.approved)} approved and ${formatCount(s.rejected)} rejected.`;
  return scene({
    intent,
    template: 'focus',
    title: 'Applications',
    subtitle: `Application volume${titleSuffix(f)}`,
    focusKey: 'apps-hero',
    presence: 'dissolved',
    components: [
      place({ kind: 'metric', key: 'apps-hero', label: 'Applications', value: s.applications, format: 'count', icon: 'applications', accent: C.blue, hero: true, caption: who }, 'hero'),
      place(
        { kind: 'bars', key: 'status-bars', title: 'Current status', basis: 'applications', format: 'count', accent: C.green, items: [
          { key: 'processing', label: 'In processing', value: s.inProcessing },
          { key: 'approved', label: 'Approved', value: s.approved },
          { key: 'rejected', label: 'Rejected', value: s.rejected },
          { key: 'closed', label: 'Closed · other', value: s.closedOther },
        ] },
        'right',
      ),
      place({ kind: 'metric', key: 'in-proc', label: 'In processing', value: s.inProcessing, format: 'count', icon: 'processing', accent: C.cyan, caption: 'awaiting a final decision' }, 'left1'),
      place({ kind: 'metric', key: 'approval-rate', label: 'Approval rate', value: s.approvalRate, format: 'percent', icon: 'approved', accent: C.green, caption: 'of decided applications' }, 'left2'),
    ],
    spoken,
    summary: {
      primary: `${formatCount(s.applications)} applications ${who}.`,
      secondary: `${formatCount(s.inProcessing)} in processing · ${formatCount(s.approved)} approved · ${formatCount(s.rejected)} rejected.`,
    },
  });
}

/** Applications v2: the application core with rates and the status breakdown (sums to the total). */
function countCore(f: Filters, intent: Intent): SceneAnswer {
  const s = slice(f);
  const who = describe(f) || 'to date';
  const decided = s.approved + s.rejected;
  const closed = s.applications - s.inProcessing;
  return scene({
    intent,
    template: 'appcore',
    title: 'Applications',
    subtitle: `Application volume${titleSuffix(f)}${f.country || f.centre || f.visaType ? '' : ' to date'}`,
    focusKey: 'appcore',
    presence: useLayout.getState().home.mode === 'wide' ? 'dissolved' : 'core',
    components: [
      place({
        kind: 'appcore', key: 'appcore', total: s.applications, caption: who,
        segments: [
          { key: 'processing', label: 'In processing', count: s.inProcessing, accent: C.blue },
          { key: 'approved', label: 'Approved', count: s.approved, accent: C.green },
          { key: 'rejected', label: 'Rejected', count: s.rejected, accent: C.red },
          { key: 'closed', label: 'Closed · other', count: s.closedOther, accent: C.violet },
        ],
        approval: { rate: s.approvalRate, approved: s.approved, decided },
        closure: { rate: s.closureRate, closed },
      }, 'stage'),
    ],
    spoken:
      `There are ${formatCount(s.applications)} applications ${who}. ${formatCount(s.inProcessing)} are in processing, ` +
      `${formatCount(s.approved)} approved and ${formatCount(s.rejected)} rejected. The approval rate is ${pct(s.approvalRate)} of decided applications.`,
    summary: {
      primary: `${formatCount(s.applications)} applications ${who}.`,
      secondary: `${formatCount(s.inProcessing)} in processing · approval rate ${pct(s.approvalRate)} · closure rate ${pct(s.closureRate)}.`,
    },
  });
}

// ───────────────────────────── Rankings ─────────────────────────────
function ranking(intent: Extract<Intent, { type: 'ranking' }>): SceneAnswer {
  const { dimension, measure, order, filters } = intent;
  type Row = { key: string; code?: string; label: string; sub?: string; value: number };
  let rows: Row[] = [];
  if (dimension === 'country') {
    rows = COUNTRIES.filter((c) => c.code !== 'OT').map((c) => {
      const s = slice({ ...filters, country: c.code });
      return { key: c.code, code: c.code, label: c.name, value: measure === 'applications' ? s.applications : measure === 'approvalRate' ? s.approvalRate : s.avgDays, sub: `${formatCount(s.applications)} applications` };
    });
  } else if (dimension === 'centre') {
    rows = CENTRES.map((c) => {
      const s = slice({ centre: c.key });
      const country = findCountry(c.country)!;
      return { key: c.key, code: country.code, label: c.name, value: measure === 'applications' ? s.applications : measure === 'approvalRate' ? s.approvalRate : s.avgDays, sub: `${country.name} · ${formatCount(s.applications)} applications` };
    });
  } else {
    rows = VISA_TYPES.map((v) => {
      const s = slice({ ...filters, visaType: v.key });
      return { key: v.key, label: v.name, value: measure === 'applications' ? s.applications : measure === 'approvalRate' ? s.approvalRate : s.avgDays, sub: `${formatCount(s.applications)} applications` };
    });
  }
  rows.sort((a, b) => (order === 'desc' ? b.value - a.value : a.value - b.value));
  const top = rows.slice(0, dimension === 'visaType' ? 6 : 8);
  const dimName = dimension === 'country' ? 'nationalities' : dimension === 'centre' ? 'centres' : 'visa types';
  const measureName = measure === 'applications' ? 'applications' : measure === 'approvalRate' ? 'approval rate' : 'average processing time';
  const orderWord =
    measure === 'avgDays' ? (order === 'desc' ? 'slowest first' : 'fastest first') : order === 'desc' ? 'highest first' : 'lowest first';
  const fmt = measure === 'applications' ? 'count' : measure === 'approvalRate' ? 'percent' : 'days';
  const val = (n: number) => (fmt === 'count' ? formatCount(n) : fmt === 'percent' ? pct(n) : days(n));
  const who = describe(filters);
  const lead = top[0];
  const second = top[1];
  const spoken =
    `Ranked by ${measureName}${who ? ` ${who}` : ''}, ${lead.label} ${measure === 'avgDays' ? (order === 'desc' ? 'is the slowest' : 'is the fastest') : order === 'desc' ? 'leads' : 'is lowest'} at ${val(lead.value)}, ` +
    `followed by ${second.label} at ${val(second.value)}.` +
    (measure === 'avgDays' ? ' This ranks observed processing times; it does not explain why they differ.' : '');

  return scene({
    intent,
    template: 'focus',
    title: `${dimension === 'country' ? 'Nationalities' : dimension === 'centre' ? 'Centres' : 'Visa types'} by ${measureName}`,
    subtitle: `${dimName.charAt(0).toUpperCase()}${dimName.slice(1)} ranked by ${measureName}, ${orderWord}${who ? ` · ${who}` : ''}`,
    focusKey: 'ranking',
    presence: 'dissolved',
    components: [
      place({ kind: 'ranking', key: 'ranking', title: `Top ${top.length} ${dimName}`, basis: `${measureName} · ${orderWord}`, format: fmt, items: top, highlight: 0, accent: measure === 'avgDays' ? C.violet : C.blue }, 'hero'),
      place({ kind: 'metric', key: 'rank-lead', label: measure === 'avgDays' ? (order === 'desc' ? 'Slowest' : 'Fastest') : order === 'desc' ? 'Leading' : 'Lowest', value: lead.value, format: fmt, icon: 'ranking', accent: C.green, caption: lead.label }, 'left1'),
      place({ kind: 'metric', key: 'rank-second', label: 'Next', value: second.value, format: fmt, icon: dimension === 'centre' ? 'centre' : 'globe', accent: C.cyan, caption: second.label }, 'left2'),
    ],
    spoken,
    summary: {
      primary: `${lead.label}: ${val(lead.value)} — ${measureName}, ${orderWord}.`,
      secondary: `Then ${second.label} (${val(second.value)})${top[2] ? ` and ${top[2].label} (${val(top[2].value)})` : ''}.`,
    },
  });
}

// ───────────────────────────── Unavailable / unsupported ─────────────────────────────
export const SUGGESTIONS = [
  'Show the online visa journey',
  'How many visa applications are being processed?',
  'What are the application outcomes?',
  'How long do tourist visas from India take?',
  'Top countries by applications',
  'Which centres are slowest?',
  'What is our revenue?',
];

/** VAS revenue: one screen (V32 · BQ05, BQ27). The v1 pillars (V08) and the v2 core-over-row layout (V28) were extra versions. */
function revenue(intent: Extract<Intent, { type: 'revenue' }>): SceneAnswer {
  return revenueCore(intent);
}

/**
 * VAS Revenue (V32): the gold revenue core in the centre, fed by Home's energy links from
 * two breakdown panels on each side (country and centre in scope; service and nationality
 * as labelled post-October previews). Every panel sums to the total.
 */
function revenueCore(intent: Extract<Intent, { type: 'revenue' }>): SceneAnswer {
  const r = revenuePreview();
  const v = revenueBreakdowns();
  const [country, centre] = v.breakdowns;
  const fmtShort = (n: number) => (n >= 1e6 ? `AED ${(n / 1e6).toFixed(1)} million` : `AED ${Math.round(n / 1e3)} thousand`);
  return scene({
    intent,
    template: 'revenue',
    title: 'VAS Revenue',
    subtitle: 'Total and breakdown by country, centre, service and nationality',
    focusKey: 'revenue',
    presence: useLayout.getState().home.mode === 'wide' ? 'dissolved' : 'core',
    components: [place({ kind: 'revenue', key: 'revenue', preview: true, validation: false, amount: r.amount, delta: r.delta, dims: r.dims, breakdowns: v.breakdowns }, 'stage')],
    spoken:
      `VAS revenue stands at ${fmtAED(r.amount)}, ${r.delta >= 0 ? 'up' : 'down'} ${Math.abs(r.delta).toFixed(1)} percent on the previous period. ` +
      `${country.rows[0].name} is the largest country at ${fmtShort(country.rows[0].value)}, and ${centre.rows[0].name} the largest centre at ${fmtShort(centre.rows[0].value)}.`,
    summary: {
      primary: `VAS revenue ${fmtAED(r.amount)} · ${r.delta >= 0 ? '+' : '−'}${Math.abs(r.delta).toFixed(1)}% vs previous period.`,
      secondary: `Largest: ${country.rows[0].name} (country), ${centre.rows[0].name} (centre).`,
    },
  });
}

const fmtAED = (n: number) => (n >= 1e6 ? `AED ${(n / 1e6).toFixed(1)} million` : `AED ${Math.round(n / 1e3)} thousand`);

function unsupported(intent: Intent): SceneAnswer {
  return scene({
    intent,
    template: 'notice',
    title: 'How I Can Help',
    subtitle: 'Applications, journeys, outcomes and processing times',
    focusKey: 'notice',
    presence: 'dissolved',
    components: [place({ kind: 'notice', key: 'notice', title: 'I don’t have that information yet', text: 'I can tell you about applications, the online visa journey, outcomes, processing times, revenue and where applicants come from.', suggestions: SUGGESTIONS.slice(0, 5) }, 'hero')],
    spoken: 'I’m sorry, I don’t have that information yet. I would be glad to tell you about applications, journeys, outcomes or processing times.',
    summary: { primary: 'I don’t have that information yet.', secondary: 'I can help with applications, journeys, outcomes and processing times.' },
  });
}

// ───────────────────────────── Processing now (BQ01) ─────────────────────────────
function processing(intent: Intent): SceneAnswer {
  const t = totals();
  const enteredDiff = t.entered - 294;
  // Closed today: approvals from the Home feed; rejections and other closures mock (same-day ratios).
  const rejectedToday = Math.round(t.approvedToday * 0.155);
  const decided = t.approvedToday + rejectedToday;
  const net = t.entered - decided;
  // Where the open applications are now (stage queue, reconciled to the in-processing total).
  const q = queueAging('online');
  const qSum = q.reduce((a, x) => a + x.waiting, 0) || 1;
  let left = t.inProcessing;
  const stages = q.map((x, i) => {
    const n = i === q.length - 1 ? left : Math.round((x.waiting / qSum) * t.inProcessing);
    left -= n;
    return { key: x.key, label: x.label, count: n, share: n / Math.max(1, t.inProcessing), accent: /icp/i.test(x.key) ? C.violet : C.blue };
  });
  const top = stages.reduce((b, x) => (x.count > b.count ? x : b), stages[0]);
  stages.forEach((x) => { (x as { top?: boolean }).top = x === top; });
  const share = (t.inProcessing / Math.max(1, t.total)) * 100;
  return scene({
    intent,
    template: 'board',
    title: 'Applications in Processing',
    subtitle: 'Applications awaiting a final decision, and today’s movement',
    focusKey: 'board',
    // The glass sphere stands in for ODIN's globe here; ODIN stays present as its voice spectrum.
    presence: 'dissolved',
    components: [
      place({
        kind: 'board', key: 'board',
        hero: { value: t.inProcessing, label: 'In processing now', delta: net, deltaBasis: 'since the start of today', caption: 'Awaiting a final decision' },
        orb: 'glass',
        capsules: [
          { id: 'entered-today', label: 'Entered processing today', value: t.entered, format: 'count', accent: '#4f9cff', icon: 'entered', delta: { value: enteredDiff, unit: 'count', basis: 'vs yesterday, same time' } },
          { id: 'closed-today', label: 'Closed today', value: decided, format: 'count', accent: '#3ed6a0', icon: 'approved', detail: `${formatCount(t.approvedToday)} approved · ${formatCount(rejectedToday)} rejected` },
          { id: 'most-waiting', label: `Most waiting · ${top.label}`, value: top.count, format: 'count', accent: '#a67cff', icon: 'revenue', detail: `${Math.round(top.share * 100)}% of open applications` },
          { id: 'open-share', label: 'Still open', value: +share.toFixed(1), format: 'percent', accent: '#4fd6ff', icon: 'closure', detail: `of all ${formatCount(t.total)} applications` },
        ],
        stagesTitle: 'Where they are now',
        stages,
      }, 'main'),
      // Phones / portrait: the compact focus arrangement.
      place({ kind: 'metric', key: 'in-proc-hero', label: 'In processing now', value: t.inProcessing, format: 'count', icon: 'processing', accent: C.blue, hero: true, caption: 'awaiting a final decision' }, 'hero'),
      place({ kind: 'metric', key: 'entered-today', label: 'Entered processing today', value: t.entered, format: 'count', icon: 'applications', accent: C.cyan, delta: { value: enteredDiff, unit: 'count', basis: 'vs yesterday, same time' } }, 'left1'),
      place({ kind: 'metric', key: 'closed-today', label: 'Closed today', value: decided, format: 'count', icon: 'approved', accent: C.green, caption: `${formatCount(t.approvedToday)} approved · ${formatCount(rejectedToday)} rejected` }, 'left2'),
    ],
    spoken: `${formatCount(t.inProcessing)} applications are in processing. ${formatCount(t.entered)} entered today and ${formatCount(decided)} were closed, so the queue is ${net >= 0 ? 'up' : 'down'} ${formatCount(Math.abs(net))} since this morning. ${top.label} holds the most, ${formatCount(top.count)}.`,
    summary: { primary: `${formatCount(t.inProcessing)} applications in processing now.`, secondary: `${formatCount(t.entered)} entered today · ${formatCount(decided)} closed · ${top.label} holds the most.` },
  });
}

// ───────────────────────────── Time matrix (V05 · BQ04, BQ07; BQ08–BQ10 highlight a stage) ─────────────────────────────

function timeMatrix(intent: Extract<Intent, { type: 'timeMatrix' }>): SceneAnswer {
  // One time-matrix screen (V05, online). Stage questions highlight their stage on it; there is no separate centre matrix.
  const st = timeStats('online', intent.filters);
  const who = describe(intent.filters);
  // The five reporting stages of the approved matrix design. Biometric-branch splits of ICP
  // time are a design preview (F25 red) until ICP events are mapped.
  const d = Object.fromEntries(st.stages.map((x) => [x.key, x.days]));
  const r1 = (n: number) => +n.toFixed(1);
  const icp = d['icp'] ?? 2.2;
  st.stages = [
    { key: 'subpay', label: 'Submission & Payment', icon: 'submit', accent: C.blue, days: r1((d['submission'] ?? 0.4) + (d['payment'] ?? 0.2)) },
    { key: 'vas-review', label: 'VAS Internal Review', icon: 'review', accent: C.blue, days: r1((d['vas-review'] ?? 0.6) * 0.85) },
    { key: 'icp-pre', label: 'ICP Pre-Biometric', icon: 'checkin', accent: C.violet, days: r1((d['to-icp'] ?? 0.4) + icp * 0.18) },
    { key: 'bio', label: 'Applicant Biometric Window', icon: 'biometric', accent: C.blue, days: r1(icp * 0.23) },
    { key: 'icp-final', label: 'ICP Final Review', icon: 'documents', accent: C.violet, days: r1(icp * 0.64) },
  ];
  st.longest = st.stages.reduce((b, x) => (x.days > b.days ? x : b), st.stages[0]);
  const stageKey: Record<string, string> = { 'to-icp': 'icp-pre', icp: 'icp-final', biometrics: 'bio' };
  const focus = intent.stage ? st.stages.find((x) => x.key === (stageKey[intent.stage!] ?? intent.stage)) : undefined;
  const tabs = [
    { label: 'All Online Visas', ask: 'online visa processing time matrix', active: !intent.filters.country },
    { label: 'By Country', ask: 'which countries are slowest' },
    { label: 'By centre', ask: 'which centres are slowest' },
  ];
  const stageSentence = focus
    ? `${focus.label} averages ${days(focus.days)}, out of ${days(st.avg)} end to end.`
    : `The slowest step is ${st.longest.label}, at ${days(st.longest.days)}; the quickest is ${st.fastest.label}, at ${days(st.fastest.days)}.`;
  return scene({
    intent,
    template: 'matrix',
    title: 'How Long Online Visas Take',
    subtitle: `From application to decision, and the time at each step${who ? ` · ${who}` : ''}`,
    focusKey: 'tm',
    // Wide: the matrix draws its own data sphere, so ODIN's globe dissolves; compact keeps the globe in its core.
    presence: useLayout.getState().home.mode === 'wide' ? 'dissolved' : 'core',
    components: [
      place(
        {
          kind: 'timeMatrix', key: 'tm', scopeLabel: who || 'online applications',
          avg: st.avg, avgDelta: st.avgDelta, median: st.median, medianDelta: st.medianDelta, p90: st.p90, applications: st.applications,
          hourly: st.hourly, fastest: st.fastest, longest: st.longest, stages: st.stages, focusStage: focus?.key, tabs,
          // SLA threshold not yet agreed (scope): shown as Not available.
          sla: null,
          previewNote: 'Biometric stage split · design preview',
        },
        'stage',
      ),
    ],
    spoken: `Online applications${who ? ` ${who}` : ''} take ${days(st.avg)} on average from application to decision; half of them finish within ${days(st.median)} and 9 in 10 within ${days(st.p90)}. ${stageSentence}`,
    summary: {
      primary: focus ? `${focus.label}: ${days(focus.days)} on average.` : `${days(st.avg)} on average from application to decision.`,
      secondary: `Half finish within ${days(st.median)} · 9 in 10 within ${days(st.p90)} · slowest step ${st.longest.label} (${days(st.longest.days)}).`,
    },
  });
}


// ───────────────────────────── Period comparison (BQ14–BQ17) ─────────────────────────────
function periodsScene(intent: Intent): SceneAnswer {
  const items = periods();
  const [today, yesterday, last7] = items;
  return scene({
    intent,
    template: 'stage',
    title: 'Today Compared With Earlier',
    subtitle: 'Visas processed today, yesterday, this week and this month',
    focusKey: 'periods',
    presence: 'dissolved',
    components: [place({ kind: 'periods', key: 'periods', items }, 'stage')],
    spoken: `Today ${formatCount(today.value)} visas have been processed, ${Math.abs(today.delta ?? 0).toFixed(1)} percent ${(today.delta ?? 0) >= 0 ? 'more' : 'fewer'} than yesterday at the same time. Over the last seven days ${formatCount(last7.value)} were processed, up ${(last7.delta ?? 0).toFixed(1)} percent on the previous seven days. Yesterday closed at ${formatCount(yesterday.value)}.`,
    summary: { primary: `Today: ${formatCount(today.value)} processed (${(today.delta ?? 0) >= 0 ? '+' : ''}${(today.delta ?? 0).toFixed(1)}% vs yesterday).`, secondary: `Last 7 days ${formatCount(last7.value)} · approval ${today.approval.toFixed(1)}% today.` },
  });
}

// ───────────────────────────── Submission channels (BQ21) ─────────────────────────────

// ───────────────────────────── Triple ranking (BQ18, BQ22) ─────────────────────────────
function tops(intent: Intent): SceneAnswer {
  const res = topResidence(5);
  const nat = topNationalities(5);
  const cen = topCentres(5);
  const NAT: Record<string, string> = { IN: 'Indian', PK: 'Pakistani', PH: 'Filipino', EG: 'Egyptian', BD: 'Bangladeshi', NP: 'Nepali', LB: 'Lebanese', GB: 'British', NG: 'Nigerian', US: 'American' };
  return scene({
    intent,
    template: 'band',
    title: 'Top Countries, Nationalities & Centres',
    subtitle: 'Where applications come from · residence, nationality and attributed centre, to date',
    focusKey: 'podiums',
    presence: 'dissolved',
    // Tilt the camera down a little so the leaderboards stand on the floor with their reflections.
    env: 'low' as const,
    components: [
      place(
        {
          kind: 'podiums',
          key: 'podiums',
          total: totals().total,
          columns: [
            { key: 'res', title: 'Top countries', sub: 'by applications · residence', icon: 'globe', accent: '#f5ac45', share: true, items: res.map((r) => ({ label: r.name, code: r.code, value: r.value })) },
            { key: 'nat', title: 'Top nationalities', sub: 'by applications', icon: 'people', accent: '#8b6cff', share: true, items: nat.map((n) => ({ label: NAT[n.code] ?? n.name, value: n.value })) },
            { key: 'cen', title: 'Top centres', sub: 'applications linked to each centre', icon: 'centre', accent: '#33d69a', items: cen.map((c) => ({ label: c.name, value: c.value })) },
          ],
        },
        'main',
      ),
    ],
    spoken: `By country of residence, ${res[0].name} leads with ${formatCount(res[0].value)} applications. By nationality, ${NAT[nat[0].code] ?? nat[0].name} applicants lead with ${formatCount(nat[0].value)}. ${cen[0].name} has the most applications of any centre, ${formatCount(cen[0].value)}.`,
    summary: { primary: `${res[0].name} leads by residence; ${NAT[nat[0].code] ?? nat[0].name} by nationality.`, secondary: `${cen[0].name} has the most centre applications (${formatCount(cen[0].value)}).` },
  });
}

// ───────────────────────────── Earth geo ranking (BQ18) ─────────────────────────────
function geo(intent: Intent): SceneAnswer {
  const items = topResidence(10).map((r) => ({ code: r.code, name: r.name, value: r.value, delta: r.delta, lat: r.lat, lon: r.lon }));
  return scene({
    intent,
    template: 'stage',
    title: 'Top Countries',
    subtitle: 'Applications by country of residence to date',
    focusKey: 'geo',
    presence: 'dissolved',
    components: [place({ kind: 'geo', key: 'geo', heading: 'Top Countries', subheading: 'By applications', basis: 'Country of residence', period: 'To date', items }, 'stage')],
    spoken: `${items[0].name} has the most applications, ${formatCount(items[0].value)}, followed by ${items[1].name} with ${formatCount(items[1].value)} and ${items[2].name} with ${formatCount(items[2].value)}. Countries are by applicant residence, not nationality.`,
    summary: { primary: `${items[0].name} leads with ${formatCount(items[0].value)} applications.`, secondary: `Then ${items[1].name} (${formatCount(items[1].value)}) and ${items[2].name} (${formatCount(items[2].value)}) · by residence.` },
  });
}

// ───────────────────────────── Outcome distribution ring (BQ26) ─────────────────────────────
function outcomeDist(intent: Intent): SceneAnswer {
  const s = slice();
  const t = totals();
  // Same demo basis as the processing board (yesterday's approvals: 252).
  const rejectedToday = Math.round(t.approvedToday * 0.155);
  const segs = [
    { key: 'approved', label: 'Approved', count: s.approved, accent: C.green },
    { key: 'processing', label: 'In processing', count: s.inProcessing, accent: C.blue },
    { key: 'rejected', label: 'Rejected', count: s.rejected, accent: C.red },
    { key: 'closed', label: 'Closed · other', count: s.closedOther, accent: C.violet },
  ];
  const sum = segs.reduce((a, x) => a + x.count, 0) || 1;
  const asks: Record<string, string> = {
    approved: 'How many visas have been approved?',
    processing: 'How many visa applications are being processed?',
    rejected: 'How many applications have been rejected, and what are the outcomes?',
    closed: 'What percentage of visa applications have been closed?',
  };
  return scene({
    intent,
    template: 'ringCards',
    title: 'Outcome Distribution',
    subtitle: 'Current status of every application — approvals, rejections, closures and processing',
    focusKey: 'ring',
    presence: 'dissolved',
    components: [
      // The ring answers the question (closure); the total lives once, on the left card.
      place({ kind: 'donut', key: 'ring', total: s.applications, totalLabel: 'Total applications', basis: 'Current status · each application counted once', segments: segs, clean: true, centre: { value: s.closureRate, label: 'Closure rate', caption: `${formatCount(s.applications - s.inProcessing)} of ${formatCount(s.applications)} closed` } }, 'main'),
      place({ kind: 'legend', key: 'legend', items: segs.map((x) => ({ ...x, share: x.count / sum, ask: x.key === 'processing' ? asks.processing : undefined })) }, 'legend'),
      place({ kind: 'metric', key: 'total-applications', tile: true, card: 'hero', label: 'Total applications', value: s.applications, format: 'count', icon: 'applications', accent: C.blue, caption: 'to date', spark: { kind: 'line', values: [3, 4, 4, 5, 6, 6, 7, 8, 8, 9] }, ask: 'Which countries or nationalities generate the most applications?' }, 'tl'),
      place({ kind: 'metric', key: 'in-proc', tile: true, card: 'hero', label: 'In processing', value: s.inProcessing, format: 'count', icon: 'clock', accent: '#3d84f7', caption: 'awaiting decision', spark: { kind: 'bars', values: [4, 5, 7, 6, 8, 9, 7, 10] }, ask: asks.processing }, 'bl'),
      place({ kind: 'metric', key: 'approved-today', tile: true, card: 'hero', label: 'Approved today', value: t.approvedToday, format: 'count', icon: 'approved', accent: C.green, delta: { value: t.approvedToday - 252, unit: 'count', basis: 'vs yesterday' }, spark: { kind: 'bars', values: [3, 4, 5, 5, 6, 7, 8, 9] }, ask: "How does today's performance compare with yesterday?" }, 'tr'),
      place({ kind: 'metric', key: 'rejected-today', tile: true, card: 'hero', label: 'Rejected today', value: rejectedToday, format: 'count', icon: 'rejected', accent: C.red, delta: { value: rejectedToday - Math.round(252 * 0.155), unit: 'count', basis: 'vs yesterday', goodWhen: 'none' }, spark: { kind: 'bars', values: [5, 4, 6, 5, 6, 7, 6, 7] }, ask: 'How many applications have been rejected, and what are the outcomes?' }, 'br'),
    ],
    spoken: `Of ${formatCount(s.applications)} applications, ${formatCount(s.approved)} are approved, ${formatCount(s.rejected)} rejected, ${formatCount(s.closedOther)} closed for other reasons and ${formatCount(s.inProcessing)} still in processing. The closure rate is ${pct(s.closureRate)}.`,
    summary: { primary: `Closure rate ${pct(s.closureRate)}.`, secondary: `${formatCount(s.approved)} approved · ${formatCount(s.rejected)} rejected · ${formatCount(s.inProcessing)} in processing.` },
  });
}


/**
 * Screens not in the Build 5 approved set (22 Oct) answer with the not-available notice (V24):
 * stage queue (F12b), submission channel (F09: all online) and purpose / occupation mix (F27/F28).
 */
const NOT_IN_BUILD: Record<'queue' | 'channels' | 'purpose' | 'occupation', { bq: string; title: string; reason: string }> = {
  queue: { bq: 'BQ13', title: 'Where applications are waiting', reason: 'Stage waiting times (bottlenecks) are planned after October.' },
  channels: { bq: 'BQ21', title: 'Submission channel', reason: 'Every application is submitted online; centres handle later visits such as biometrics, so there is no online-versus-centre split.' },
  purpose: { bq: 'BQ19', title: 'Travel purpose', reason: 'Recorded visa purpose is planned after October.' },
  occupation: { bq: 'BQ20', title: 'Applicant types', reason: 'Recorded applicant occupation is planned after October.' },
};
const notInBuild = (k: keyof typeof NOT_IN_BUILD) => outOfScope({ type: 'outOfScope', ...NOT_IN_BUILD[k] });

function outOfScope(intent: Extract<Intent, { type: 'outOfScope' }>): SceneAnswer {
  return scene({
    intent,
    template: 'notice',
    title: intent.title,
    subtitle: `${intent.bq} · planned for a later release`,
    focusKey: 'notice',
    presence: 'dissolved',
    components: [place({ kind: 'notice', key: 'notice', title: 'Coming in a later release', text: intent.reason, suggestions: ['What are the application outcomes?', 'Show the online visa journey'] }, 'hero')],
    spoken: `I’m sorry, that isn’t available yet. ${intent.reason}`,
    summary: { primary: `${intent.title} will be available in a later release.`, secondary: intent.reason },
  });
}

/**
 * Retired screens (21 Oct): the centre visit journey (redesign planned, maybe v6), the application
 * journey map, and side-by-side compare (engineering's geography globe covers it). Their questions get a
 * courteous notice that points to what answers them now.
 */
const RETIRED = {
  centreJourney: { title: 'Centre Visit Journey', reason: 'The centre visit journey is being redesigned and will return in a later release.', next: ['Show the online visa journey', 'How many visa applications are being processed?'] },
  journeyMap: { title: 'Application Journey Map', reason: 'The journey is now shown as the online visa journey.', next: ['Show the online visa journey', 'How long does it take to process a visa?'] },
  compare: { title: 'Country Comparison', reason: 'Countries are compared on the geography globe.', next: ['Show top countries on the globe', 'Which countries or nationalities generate the most applications?'] },
} as const;
function retired(intent: Intent, key: keyof typeof RETIRED): SceneAnswer {
  const r = RETIRED[key];
  return scene({
    intent,
    template: 'notice',
    title: r.title,
    subtitle: 'Shown another way in this release',
    focusKey: 'notice',
    presence: 'dissolved',
    components: [place({ kind: 'notice', key: 'notice', title: 'Shown another way', text: r.reason, suggestions: [...r.next] }, 'hero')],
    spoken: `${r.reason} Would you like to see ${r.next[0].replace(/^Show /, '').replace(/\?$/, '').toLowerCase()}?`,
    summary: { primary: r.reason, secondary: `Try: ${r.next.join(' · ')}` },
  });
}

export function homeSpoken() {
  return composeHomeSummary(useHomeFeed.getState()).spoken;
}

/** Build the scene for an intent. `null` means Home. */
/** v2: every application is online, so an "online" filter adds nothing. */
const onlineOnly = (f: Filters): Filters => (f.channel === 'online' ? { ...f, channel: undefined } : f);

export function answer(intent: Intent): SceneAnswer | null {
  switch (intent.type) {
    case 'home':
    case 'back':
      return null;
    case 'journey':
      return journey(intent.channel, intent.filters, intent);
    case 'outcomes':
      if (intent.filters.channel === 'centre') return notInBuild('channels');
      return outcomes(onlineOnly(intent.filters), intent);
    case 'time':
      if (intent.filters.channel === 'centre') return notInBuild('channels');
      return time(onlineOnly(intent.filters), intent);
    case 'count':
      if (intent.filters.channel === 'centre') return notInBuild('channels');
      return count(onlineOnly(intent.filters), intent);
    case 'ranking':
      return ranking(intent);
    case 'compare':
      if (intent.entities.some((e) => e.kind === 'channel')) return notInBuild('channels');
      return retired(intent, 'compare');
    case 'revenue':
      return revenue(intent);
    case 'processing':
      return processing(intent);
    case 'timeMatrix':
      return timeMatrix(intent);
    case 'queue':
      return notInBuild('queue');
    case 'periods':
      return periodsScene(intent);
    case 'channels':
      return notInBuild('channels');
    case 'tops':
      return tops(intent);
    case 'geo':
      return geo(intent);
    case 'outcomeDist':
      return outcomeDist(intent);
    case 'mix':
      return notInBuild(intent.dim === 'purpose' ? 'purpose' : 'occupation');
    case 'journeyMap':
      return retired(intent, 'journeyMap');
    case 'outOfScope':
      return outOfScope(intent);
    default:
      return unsupported(intent);
  }
}
