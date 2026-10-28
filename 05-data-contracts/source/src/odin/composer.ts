/**
 * ODIN response composer (F17 visual orchestration).
 *
 *   voice → text → understand() → Query → plan() → ResponsePlan → answer() → screen
 *
 * understand() turns any phrasing into a small Query: the measure, filters,
 * cues (show / break down / compare / where / more / less) and whether it is a
 * follow-up. In production engineering's LLM produces this Query (same JSON);
 * understand() is the deterministic stand-in and the reference for its prompt.
 *
 * plan() is pure rules: it picks the depth (answer · context · explore), the
 * screen for that measure and depth, what to spotlight, and spoken follow-ups.
 *
 * ANSWER-FIRST (20 Oct review): a single-number question shows only what was
 * asked (the "answer" view, V30: 1–3 metrics). "And approved?" adds a metric,
 * "full picture" opens the full page, "break it down" goes deeper. When the
 * asked item is already on the full page that is open, ODIN highlights it
 * there (no new query). The LLM never picks layouts, so the same question
 * always looks the same and the screen always shows what ODIN says.
 * (Depth id 'glance' = the answer view, kept for compatibility.)
 */
import type { Filters } from './vas';
import type { Intent } from './types';
import { extractFilters, parse } from './nlu';

export type Measure =
  | 'applications_total' | 'in_processing' | 'entered_today'
  | 'approved' | 'rejected' | 'outcomes' | 'approval_rate' | 'closure_rate'
  | 'processing_time' | 'stage_time' | 'journey'
  | 'by_country' | 'by_nationality' | 'by_centre'
  | 'revenue' | 'revenue_breakdown' | 'daily_comparison' | 'compare';
/** What each measure means (also the LLM classifier's catalogue, handover E12). */
export const MEASURE_INFO: Record<Measure, string> = {
  applications_total: 'How many applications in total (to date, or for a filter).',
  in_processing: 'Applications still open, awaiting a final decision (backlog, pending, in progress).',
  entered_today: 'Applications that entered processing / were submitted today.',
  approved: 'Approved / granted / issued applications.',
  rejected: 'Rejected / refused / denied applications.',
  outcomes: 'The outcome split: approved, rejected, closed, in processing (decisions, results, statuses).',
  approval_rate: 'Approved as a share of decided applications (approval, success or acceptance rate).',
  closure_rate: 'Closed (approved + rejected + other) as a share of all applications.',
  processing_time: 'Average time from submission to decision (how long, turnaround, time matrix).',
  stage_time: 'Time at each stage of the journey; the longest or fastest stage.',
  journey: 'The visa journey / pipeline / funnel and where applications are in it.',
  by_country: 'Applications by country of residence (top countries, where applicants come from).',
  by_nationality: 'Applications by applicant nationality.',
  by_centre: 'Applications by visa application centre (VAC).',
  revenue: 'Total VAS revenue.',
  revenue_breakdown: 'Revenue split by country, centre, service or nationality.',
  daily_comparison: 'Today vs yesterday, last 7 days, month to date, trends.',
  compare: 'Two named entities side by side (e.g. India vs Pakistan).',
};
export const MEASURE_LIST = Object.keys(MEASURE_INFO) as Measure[];

/** What each cue means. */
export const CUE_INFO: Record<Cue, string> = {
  show: 'Show / display / open / take me to.',
  breakdown: 'Break down / split / by country, stage, status… → explore depth.',
  compare: 'Compare / versus.',
  where: '"Where are…" → explore (the journey) for applications in processing.',
  more: 'More detail / tell me more / go deeper → one depth deeper.',
  full: 'Full picture / everything / the whole view → the full page (context).',
  less: 'Just the number / quickly / briefly / headline → glance depth.',
};

export type Cue = 'show' | 'breakdown' | 'compare' | 'where' | 'more' | 'less' | 'full';
export type Depth = 'glance' | 'context' | 'explore';
export const DEPTHS: Depth[] = ['glance', 'context', 'explore'];

export type CompareEntity = { kind: 'country' | 'centre' | 'visaType' | 'channel'; key: string };

/** What the LLM must return for any utterance (see handover: E12 Response composer). */
export type Query = {
  measure: Measure | null;
  filters: Filters;
  cues: Cue[];
  /** "Tell me more" / "less detail" with no new measure: change depth of the last answer. */
  followUp: 'more' | 'less' | 'full' | null;
  /** Every single-number measure named, in order ("approved and rejected" → both). */
  measures?: Measure[];
  /** "And …?" / "what about …?" / "also …": add to the answer on screen. */
  additive?: boolean;
  entities?: CompareEntity[];
  /** Questions outside the measure catalogue (out of scope, unsupported, home/back, post-October views). */
  passthrough?: Intent;
};

export type Spotlight = { component?: string; item?: string };

export type ResponsePlan = {
  query: Query;
  measure: Measure | null;
  depth: Depth;
  /** Catalogue screen ID (V-ids in views.ts; V30 is the glance answer). */
  view: string;
  /** Intent passed to the answer builders. Glance: the context screen it is read from (same numbers). */
  intent: Intent;
  spotlight?: Spotlight;
  /** Spoken suggestions ODIN may offer (voice only; not drawn on screen). */
  followUps: string[];
  /** Why this plan (for QA and the handover table). */
  reason: string;
};

// ───────────────────────── understand(): phrasing → Query ─────────────────────────
const norm = (raw: string) => ` ${raw.toLowerCase().replace(/[?!.,;:’']/g, ' ').replace(/\s+/g, ' ')} `;
const has = (t: string, re: RegExp) => re.test(t);

const CUES: [Cue, RegExp][] = [
  ['less', /^ (just|only) |\b((just|only) (give me )?(the )?(number|figure|total|count|rate|percentage)|quick(ly)?|briefly|in short|in a word|at a glance|less detail|fewer details|simpler|simplify|headline|bottom line|top line)\b/],
  ['more', /\b(more detail|tell me more|go deeper|deeper|expand|in detail|details|show more|more about)\b/],
  ['full', /\b(full picture|whole picture|full view|the whole|everything|all of it|full page|overall picture|complete picture|time matrix|dashboard|full screen|all the details)\b/],
  ['breakdown', /\b(break( it)? down|breakdown|split|across|per (country|centre|center|stage)|by (country|nationality|centre|center|stage|status|service|type))\b/],
  ['compare', /\b(compare|compared|versus|vs)\b/],
  ['where', /\bwhere\b/],
  ['show', /\b(show|display|open|bring up|let me see|visuali[sz]e|take me to)\b/],
];

/** Ordered: the first match wins (more specific measures first). */
const MEASURES: [Measure, RegExp][] = [
  ['revenue_breakdown', /\b(revenue|income|earn\w*|fees?)\b.*\b(by|per|breakdown|break( it)? down|split|countr\w*|centres?|centers?|services?|nationalit\w*)\b|\b(by|per|break( it)? down|breakdown|split)\b.*\b(revenue|income)\b|\b(countr\w*|centres?|centers?)\b.*\b(generate|bring|earn)\w*\b.*\b(revenue|income|money)\b/],
  ['revenue', /\b(revenue|income|earn\w*|money|fees? collected|sales|takings)\b/],
  ['daily_comparison', /\b(yesterday|day on day|daily|this week|last (7|seven) days|month to date|this month|trend\w*|over time|period)\b/],
  ['approval_rate', /\b(approval|success|acceptance) rate\b|\bpercent\w* (of )?(applications )?(are |were |get |got )?approved\b/],
  ['closure_rate', /\b(closure|closed|close rate|completion rate)\b/],
  ['rejected', /\b(reject\w*|refus\w*|denied|declin\w*|turned down)\b/],
  ['approved', /\b(approv\w*|granted|accepted|issued)\b/],
  ['outcomes', /\b(outcomes?|decisions?|results?|statuses|status split)\b/],
  ['stage_time', /\b((each|every|per|which|longest|slowest|fastest) stage|stage (times?|durations?|days)|time (at|in|per) (each )?stage)\b/],
  ['processing_time', /\b(time matrix|median|p90|percentile|how long|processing time|turnaround|takes? to|duration|average time|how fast|how quickly|how slow|end to end)\b/],
  ['journey', /\b(journey|pipeline|funnel|stages)\b/],
  ['by_nationality', /\b(nationalit\w*)\b/],
  ['by_centre', /\b(centres?|centers?|vacs?)\b.*\b(most|top|which|rank\w*|highest|busiest|largest|volumes?)\b|\b(most|top|which|busiest|largest)\b.*\b(centres?|centers?|vacs?)\b/],
  ['by_country', /\b(countr\w*|markets?|origin|coming from|come from|where .* from)\b/],
  ['entered_today', /\b(entered|new|received|came in|coming in|submitted|started)\b.*\btoday\b|\btoday\b.*\b(new|received|entered|submitted)\b/],
  ['in_processing', /\b(being processed|processing|in progress|pending|open applications|waiting|backlog|in the pipe|under review|ongoing)\b/],
  ['applications_total', /\b(applications?|visas?|how many|total|volume|number of)\b/],
];

/** Views the measure catalogue doesn't cover: answered as their own screen (or an honest notice). */
/** Measures that are one number: answered first on their own (the answer view). */
export const SINGLE = new Set<Measure>(['applications_total', 'in_processing', 'entered_today', 'approved', 'rejected', 'approval_rate', 'closure_rate', 'processing_time', 'revenue']);
const MAX_ITEMS = 3;

/** Every measure named, by position; earlier (more specific) patterns win overlapping text. */
function measuresIn(t: string): Measure[] {
  const taken: [number, number][] = [];
  const found: { m: Measure; at: number }[] = [];
  for (const [m, re] of MEASURES) {
    const g = new RegExp(re.source, 'g');
    let x: RegExpExecArray | null;
    while ((x = g.exec(t))) {
      const a = x.index, b = a + x[0].length;
      if (x[0].length === 0) { g.lastIndex++; continue; }
      if (taken.some(([p, q]) => a < q && b > p)) continue;
      taken.push([a, b]); found.push({ m, at: a });
    }
  }
  const list = [...new Set(found.sort((p, q) => p.at - q.at).map((f) => f.m))];
  // "applications" appears in most questions: it only counts when nothing else was named.
  return list.length > 1 ? list.filter((m) => m !== 'applications_total') : list;
}

const PASSTHROUGH: Intent['type'][] = ['home', 'back', 'outOfScope', 'unsupported', 'queue', 'channels', 'mix', 'geo', 'journeyMap', 'ranking', 'timeMatrix'];

/** The composer answers the volume rankings and plain time questions itself; specific variants stay with the catalogue. */
const passes = (i: Intent) =>
  (i.type === 'journey' && !!i.style) ||
  (PASSTHROUGH.includes(i.type) &&
  !(i.type === 'ranking' && i.measure === 'applications' && i.order === 'desc') &&
  !(i.type === 'timeMatrix' && !i.stage && !i.filters.country && !i.filters.visaType));

export function understand(raw: string, last?: Intent): Query {
  const t = norm(raw);
  const legacy = parse(raw, last);
  const f = extractFilters(t);
  const filters: Filters = Object.fromEntries(Object.entries({ country: f.country, centre: f.centre, visaType: f.visaType }).filter(([, v]) => v)) as Filters;
  const cues = CUES.filter(([, re]) => has(t, re)).map(([c]) => c);
  const entities = legacy.type === 'compare' ? legacy.entities : undefined;
  if (legacy.type === 'compare' && entities && entities.length >= 2 && !entities.some((e) => e.kind === 'channel')) {
    return { measure: 'compare', filters, cues: [...new Set<Cue>([...cues, 'compare'])], followUp: null, entities };
  }
  const measure = MEASURES.find(([, re]) => has(t, re))?.[0] ?? null;
  // "Tell me more" / "just the number" with no subject refines the previous answer.
  if (!measure && !filtered(filters) && (cues.includes('more') || cues.includes('less') || cues.includes('full')) && !['home', 'back'].includes(legacy.type)) {
    return { measure: null, filters, cues, followUp: cues.includes('less') ? 'less' : cues.includes('full') ? 'full' : 'more' };
  }
  // Out of scope / unsupported / navigation are decided by the existing catalogue rules.
  if (passes(legacy) && !(legacy.type === 'unsupported' && measure)) {
    return { measure: null, filters, cues, followUp: null, passthrough: legacy };
  }
  const additive = /^ (and|also|plus|what about|how about|and what about)\b|\bas well\b/.test(t);
  const measures = measuresIn(t).filter((m) => SINGLE.has(m));
  // Several single metrics named: the first one said leads.
  const lead = measure && SINGLE.has(measure) && measures.length ? measures[0] : measure;
  return { measure: lead, filters, cues, followUp: null, measures, additive };
}

// ───────────────────────── plan(): Query → ResponsePlan ─────────────────────────
type Route = { view: string; intent: Intent; spotlight?: Spotlight };
const filtered = (f: Filters) => !!(f.country || f.centre || f.visaType);
export const GLANCE_VIEW = 'V30';

/** Measure × depth → screen. Glance reads its number from the context screen (same data, one KPI). */
export function route(measure: Measure, depth: Depth, f: Filters, entities?: CompareEntity[], items?: Measure[]): Route {
  if (measure === 'compare') return { view: 'V24', intent: { type: 'compare', entities: entities ?? [], filters: f } };
  // Answer view: only the asked metric(s); each is read from its own screen's data.
  if (depth === 'glance' && SINGLE.has(measure)) return { view: GLANCE_VIEW, intent: { type: 'answer', items: (items?.length ? items : [measure]).slice(-MAX_ITEMS), filters: f } };
  if (depth === 'glance') return { ...route(measure, 'context', f, entities), view: GLANCE_VIEW };
  const ex = depth === 'explore';
  switch (measure) {
    case 'applications_total':
      return ex ? { view: 'V04', intent: { type: 'outcomeDist' }, spotlight: { component: 'total-applications' } }
        : { view: 'V29', intent: { type: 'count', filters: f, style: 'core' }, spotlight: { component: 'appcore', item: 'total' } };
    case 'in_processing':
      if (filtered(f)) return { view: 'V29', intent: { type: 'count', filters: f, style: 'core' }, spotlight: { component: 'appcore', item: 'processing' } };
      return ex ? { view: 'V09', intent: { type: 'journey', channel: 'online', filters: f }, spotlight: { component: 'journey' } }
        : { view: 'V02', intent: { type: 'processing' }, spotlight: { component: 'board', item: 'hero' } };
    case 'entered_today':
      return ex ? { view: 'V15', intent: { type: 'periods' }, spotlight: { component: 'periods', item: 'today' } }
        : { view: 'V02', intent: { type: 'processing' }, spotlight: { component: 'board', item: 'entered-today' } };
    case 'approved':
    case 'rejected':
    case 'outcomes': {
      const item = measure === 'outcomes' ? undefined : measure;
      if (ex) return filtered(f) ? { view: 'V29', intent: { type: 'count', filters: f, style: 'core' }, spotlight: { component: 'appcore', item } } : { view: 'V04', intent: { type: 'outcomeDist' }, spotlight: { component: 'ring', item } };
      return { view: 'V27', intent: { type: 'outcomes', filters: f, style: 'galaxy' }, spotlight: { component: 'donut', item } };
    }
    case 'approval_rate':
      return ex ? { view: 'V27', intent: { type: 'outcomes', filters: f, style: 'galaxy' }, spotlight: { component: 'donut', item: 'approved' } }
        : { view: 'V29', intent: { type: 'count', filters: f, style: 'core' }, spotlight: { component: 'appcore', item: 'approval' } };
    case 'closure_rate':
      return ex ? { view: 'V27', intent: { type: 'outcomes', filters: f, style: 'galaxy' }, spotlight: { component: 'donut', item: 'closed' } }
        : filtered(f) ? { view: 'V29', intent: { type: 'count', filters: f, style: 'core' }, spotlight: { component: 'appcore', item: 'closure' } }
          : { view: 'V04', intent: { type: 'outcomeDist' }, spotlight: { component: 'ring' } };
    case 'processing_time':
      if (filtered(f)) return { view: 'V23', intent: { type: 'time', filters: f }, spotlight: { component: 'avg-time' } };
      return { view: 'V05', intent: { type: 'timeMatrix', channel: 'online', filters: {} }, spotlight: { component: 'tm', item: ex ? 'stages' : 'core' } };
    case 'stage_time':
      return ex ? { view: 'V09', intent: { type: 'journey', channel: 'online', filters: {} }, spotlight: { component: 'journey' } }
        : { view: 'V05', intent: { type: 'timeMatrix', channel: 'online', filters: {} }, spotlight: { component: 'tm', item: 'stages' } };
    case 'journey':
      return { view: 'V09', intent: { type: 'journey', channel: 'online', filters: f }, spotlight: { component: 'journey' } };
    case 'by_country':
      return ex ? { view: 'V17', intent: { type: 'geo' }, spotlight: { component: 'geo' } } : { view: 'V16', intent: { type: 'tops' }, spotlight: { component: 'podiums', item: 'res' } };
    case 'by_nationality':
      return { view: 'V16', intent: { type: 'tops' }, spotlight: { component: 'podiums', item: 'nat' } };
    case 'by_centre':
      return { view: 'V16', intent: { type: 'tops' }, spotlight: { component: 'podiums', item: 'cen' } };
    case 'revenue':
      return { view: 'V32', intent: { type: 'revenue', filters: {} }, spotlight: { component: 'revenue', item: ex ? 'countries' : 'total' } };
    case 'revenue_breakdown':
      return { view: 'V32', intent: { type: 'revenue', filters: {}, breakdown: true }, spotlight: { component: 'revenue', item: 'countries' } };
    case 'daily_comparison':
      return { view: 'V15', intent: { type: 'periods' }, spotlight: { component: 'periods', item: ex ? 'last7' : 'today' } };
  }
}

/** Spoken next steps per measure (voice only — ODIN may offer one after answering). */
const FOLLOW_UPS: Record<Measure, string[]> = {
  applications_total: ['Where are applications coming from?', 'How many are being processed?'],
  in_processing: ['Where are they in the journey?', 'How long are they taking?'],
  entered_today: ['How does today compare with yesterday?', 'How many are being processed?'],
  approved: ['How many were rejected?', 'What is the closure rate?'],
  approval_rate: ['How many were rejected?', 'How long does processing take?'],
  rejected: ['How many were approved?', 'What is the closure rate?'],
  outcomes: ['What is the closure rate?', 'How long does processing take?'],
  closure_rate: ['How many are still in processing?', 'How many were approved?'],
  processing_time: ['Which stage takes the longest?', 'Show the journey'],
  stage_time: ['Show the journey', 'How many are being processed?'],
  journey: ['How long does each stage take?', 'How many need biometrics?'],
  by_country: ['Which nationalities apply most?', 'Which centres have the most applications?'],
  by_nationality: ['Which countries apply most?', 'Compare the top two'],
  by_centre: ['Which countries apply most?', 'How much revenue by centre?'],
  revenue: ['Break revenue down by country', 'Which centres generate the most revenue?'],
  revenue_breakdown: ['What is total revenue?', 'Which countries apply most?'],
  daily_comparison: ['How many are being processed?', 'How many were approved today?'],
  compare: ['Show top countries', 'How long do applications take?'],
};

export type PlanContext = { last?: ResponsePlan };

/** The metrics an answer view shows. */
export function itemsOf(p?: ResponsePlan): Measure[] {
  return p?.intent.type === 'answer' ? (p.intent.items as Measure[]) : p?.measure && SINGLE.has(p.measure) ? [p.measure] : [];
}
const sameFilters = (a: Filters, b: Filters) => (a.country ?? '') === (b.country ?? '') && (a.centre ?? '') === (b.centre ?? '') && (a.visaType ?? '') === (b.visaType ?? '');

/** Catalogue intent → the measure it answers (so a follow-up after a picker question has a base). */
function measureOf(i: Intent): Measure | null {
  switch (i.type) {
    case 'processing': return 'in_processing';
    case 'count': return 'applications_total';
    case 'outcomes': return 'outcomes';
    case 'outcomeDist': return 'closure_rate';
    case 'time': case 'timeMatrix': return 'processing_time';
    case 'journey': return 'journey';
    case 'tops': return 'by_country';
    case 'geo': return 'by_country';
    case 'revenue': return i.breakdown ? 'revenue_breakdown' : 'revenue';
    case 'periods': return 'daily_comparison';
    default: return null;
  }
}

/** A picker (catalogue) question: its own screen, at context depth. */
export function planFromIntent(intent: Intent): ResponsePlan {
  const filters = 'filters' in intent ? intent.filters : {};
  if (intent.type === 'answer') {
    const measure = intent.items[0] as Measure;
    return { query: { measure, filters, cues: [], followUp: null, measures: intent.items as Measure[] }, measure, depth: 'glance', view: GLANCE_VIEW, intent, followUps: FOLLOW_UPS[measure] ?? [], reason: 'catalogue answer state' };
  }
  const measure = measureOf(intent);
  return { query: { measure, filters, cues: [], followUp: null }, measure, depth: 'context', view: intent.type, intent, followUps: measure ? FOLLOW_UPS[measure] : [], reason: 'catalogue question' };
}

/** The asked metric whose full page shows the most of the asked metrics (ties: the first asked). */
function pageFor(items: Measure[], f: Filters): Measure {
  const views = items.map((m) => route(m, 'context', f).view);
  const score = (v: string) => views.filter((x) => x === v).length;
  return items.reduce((best, m, i) => (score(views[i]) > score(views[items.indexOf(best)]) ? m : best), items[0]);
}

export function plan(q: Query, ctx: PlanContext = {}): ResponsePlan {
  if (q.passthrough) {
    return { query: q, measure: null, depth: 'context', view: q.passthrough.type, intent: q.passthrough, followUps: [], reason: `catalogue rule: ${q.passthrough.type}` };
  }
  // Follow-up: change the depth of the previous answer, same measure and filters.
  if (q.followUp && ctx.last?.measure) {
    // "Full picture" always lands on the full page; more / less step one depth.
    const i = q.followUp === 'full' ? DEPTHS.indexOf('context') : DEPTHS.indexOf(ctx.last.depth) + (q.followUp === 'more' ? 1 : -1);
    const depth = DEPTHS[Math.max(0, Math.min(DEPTHS.length - 1, i))];
    const asked = itemsOf(ctx.last);
    // Leaving the answer view: the full page that carries the most of what was asked.
    const subject = ctx.last.depth === 'glance' && depth !== 'glance' && asked.length > 1 ? pageFor(asked, ctx.last.query.filters) : ctx.last.measure;
    const r = route(subject, depth, ctx.last.query.filters, ctx.last.query.entities, asked);
    return { query: { ...ctx.last.query, followUp: q.followUp }, measure: subject, depth, ...r, followUps: FOLLOW_UPS[subject], reason: `follow-up "${q.followUp}": ${ctx.last.depth} → ${depth}` };
  }
  // "And for India?": a filter alone keeps the previous measure.
  let measure: Measure = q.measure ?? (filtered(q.filters) ? ctx.last?.measure : null) ?? 'applications_total';
  // "Where are the applications?": where in the journey.
  if (q.cues.includes('where') && measure === 'applications_total' && !filtered(q.filters)) measure = 'in_processing';
  const single = SINGLE.has(measure);
  let depth: Depth = single ? 'glance' : 'context';
  let reason = single ? 'answer-first: only the asked metric' : 'default: the full page with the asked item spotlighted';
  if (measure === 'compare') { depth = 'explore'; reason = 'compare → explore'; }
  else if (q.cues.includes('less')) { depth = 'glance'; reason = 'cue "just the number" → answer'; }
  else if (q.cues.includes('more') || q.cues.includes('breakdown')) { depth = 'explore'; reason = `cue "${q.cues.includes('more') ? 'more' : 'break down'}" → explore`; }
  else if (q.cues.includes('full')) { depth = 'context'; reason = 'cue "full picture" → the full page'; }
  else if (q.cues.includes('where') && (measure === 'in_processing' || measure === 'applications_total')) { depth = 'explore'; reason = 'cue "where" → explore (journey)'; }
  // Already on screen: the full page that is open shows this item → highlight it there (no new query).
  // Same screen = same view id, or the same kind of screen picked from the catalogue (e.g. the Skyline v2 of Top countries).
  const here = route(measure, 'context', q.filters);
  const onScreen = !!ctx.last && ctx.last.depth === 'context' && sameFilters(ctx.last.query.filters, q.filters) && (here.view === ctx.last.view || here.intent.type === ctx.last.intent.type);
  if ((depth === 'glance' || depth === 'context') && !q.cues.includes('less') && onScreen) {
    depth = 'context'; reason = 'already on screen → highlight only';
    // Keep the open screen (its variant) and only move the spotlight.
    return { query: q, measure, depth, view: ctx.last!.view, intent: ctx.last!.intent, spotlight: here.spotlight, followUps: FOLLOW_UPS[measure], reason };
  }
  // Items for the answer view: everything named now, plus what is on screen when adding ("and rejected?").
  let items: Measure[] | undefined;
  if (depth === 'glance' && single) {
    const named = q.measures?.length ? q.measures : [measure];
    const keep = q.additive && ctx.last?.depth === 'glance' && sameFilters(ctx.last.query.filters, q.filters) ? itemsOf(ctx.last) : [];
    items = [...new Set([...keep, ...named])];
    if (items.length > MAX_ITEMS) {
      // More than three: the full page that carries the most of them.
      depth = 'context'; reason = 'more than three metrics → the full page'; measure = pageFor(items, q.filters); items = undefined;
    } else if (keep.length) reason = `added to the answer: ${named.join(', ')}`;
    else if (named.length > 1) reason = `answer-first: ${named.length} metrics asked`;
  }
  const r = route(measure, depth, q.filters, q.entities, items);
  return { query: q, measure, depth, ...r, followUps: FOLLOW_UPS[measure], reason };
}
