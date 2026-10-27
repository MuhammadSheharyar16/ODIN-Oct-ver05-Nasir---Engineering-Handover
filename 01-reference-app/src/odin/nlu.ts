import type { Intent } from './types';
import { CENTRES, COUNTRIES, VISA_TYPES, type Channel, type Filters } from './vas';

/**
 * Lightweight intent parser for the prototype (typed or transcribed text).
 * Production swaps this for the AI team's NLU; the output Intent stays the same.
 * Follow-ups ("and for India?", "what about rejected?") inherit context.
 */

const has = (t: string, re: RegExp) => re.test(t);

function findAll<T extends { aliases: string[] }>(t: string, list: T[], extra?: (x: T) => string[]) {
  const hits: { item: T; at: number }[] = [];
  for (const item of list) {
    for (const a of [...item.aliases, ...(extra ? extra(item) : [])]) {
      if (!a) continue;
      const re = new RegExp(`(^|[^a-z])${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`);
      const m = re.exec(t);
      if (m) {
        hits.push({ item, at: m.index });
        break;
      }
    }
  }
  return hits.sort((a, b) => a.at - b.at).map((h) => h.item);
}

function channelOf(t: string): Channel | undefined {
  if (has(t, /\b(online|digital|portal|web|e-?visa)\b/)) return 'online';
  if (has(t, /\b(cent(re|er)s?|physical|in[- ]person|offline|vac|walk[- ]in|branch)\b/)) return 'centre';
  return undefined;
}

export function extractFilters(t: string): Filters & { countries: string[]; centres: string[]; visas: string[] } {
  const countries = findAll(t, COUNTRIES.filter((c) => c.code !== 'OT')).map((c) => c.code);
  const centres = findAll(t, CENTRES).map((c) => c.key);
  const visas = findAll(t, VISA_TYPES).map((v) => v.key);
  const channel = channelOf(t);
  return {
    country: countries[0],
    centre: centres[0],
    visaType: visas[0],
    channel,
    countries,
    centres,
    visas,
  };
}

export function parse(raw: string, last?: Intent): Intent {
  const t = ` ${raw.toLowerCase().replace(/[?!.,]/g, ' ').replace(/\s+/g, ' ')} `;
  const f = extractFilters(t);
  const filters: Filters = { country: f.country, centre: f.centre, visaType: f.visaType, channel: f.channel };
  const clean = (x: Filters) => Object.fromEntries(Object.entries(x).filter(([, v]) => v !== undefined)) as Filters;

  if (has(t, /\b(go )?(home|start over|overview|main screen|start again)\b/) && !has(t, /journey/)) return { type: 'home' };
  if (has(t, /\b(go back|back|previous|undo)\b/)) return { type: 'back' };

  if (has(t, /\b(revenue|income|collections?|earn|money|fees?)\b/))
    return { type: 'revenue', filters: clean(filters), preview: has(t, /\b(preview|mock|design)\b/), ...(has(t, /\b(v2|version 2|version two)\b/) ? { style: 'core' as const } : {}) };

  // ── Design views (v1) ──
  if (has(t, /journey map/)) return { type: 'journeyMap' };
  if (has(t, /\b(time matrix|processing matrix|median|p90|percentile)\b/))
    return { type: 'timeMatrix', channel: f.channel ?? 'online', filters: clean({ country: f.country, visaType: f.visaType }) };
  if (has(t, /\b(vas to icp|submit\w* to icp|send\w* to icp|submission to icp)\b/)) return { type: 'timeMatrix', channel: 'online', filters: {}, stage: 'to-icp' };
  if (has(t, /\b(with icp|icp time|icp take|icp processing|remain with icp)\b/)) return { type: 'timeMatrix', channel: 'online', filters: {}, stage: 'icp' };
  if (has(t, /\bbiometric\w*\b/) && has(t, /\b(long|time|take|days)\b/)) return { type: 'timeMatrix', channel: 'centre', filters: {}, stage: 'biometrics' };
  if (has(t, /\b(queue|aging|ageing|waiting|delayed|delays?|bottleneck\w*|held up|stuck|need attention)\b/)) return { type: 'queue', channel: f.channel ?? 'online' };
  if (has(t, /\b(yesterday|last 7|previous 7|this week|earlier in the week|week|month|monthly|period|trend\w*|increasing|decreasing|over time)\b/) && !f.country)
    return { type: 'periods' };
  if (has(t, /\b(closure|closed|close rate|distribution)\b/)) return { type: 'outcomeDist' };
  if (has(t, /\b(purpose|tourism|why .*travel|travelling for|healthcare)\b/)) return { type: 'mix', dim: 'purpose' };
  if (has(t, /\b(occupation|profession|types of applicants|kind of applicants|what applicants)\b/)) return { type: 'mix', dim: 'occupation' };
  if ((has(t, /\bonline\b/) && has(t, /\b(cent(re|er)s?|physical|offline)\b/)) || has(t, /\b(channel|channels|submission channel)\b/))
    if (!has(t, /journey/) && !f.country) return { type: 'channels' };
  if (has(t, /\b(globe|world|map)\b/) && has(t, /\b(countr\w*|top)\b/)) return { type: 'geo' };
  const topsV2 = has(t, /\b(v2|version 2|version two|skyline)\b/) ? { style: 'skyline' as const } : {};
  if (has(t, /\bnationalit\w*\b/) && !f.country && !has(t, /compare/)) return { type: 'tops', ...topsV2 };
  if (has(t, /\b(top|most|highest)\b/) && has(t, /\bcountr\w*\b/) && has(t, /\bcent(re|er)s?\b/)) return { type: 'tops', ...topsV2 };
  if (has(t, /\b(being processed|in processing|processing now|currently processing|in progress)\b/) && !f.country && !f.visaType) return { type: 'processing' };

  // Comparisons: two entities, or explicit compare words.
  const compareWord = has(t, /\b(compare|comparison|vs|versus|against|difference between)\b/);
  const ents = [
    ...f.countries.map((k) => ({ kind: 'country' as const, key: k })),
    ...f.centres.map((k) => ({ kind: 'centre' as const, key: k })),
    ...f.visas.map((k) => ({ kind: 'visaType' as const, key: k })),
  ];
  if (compareWord && has(t, /\bonline\b/) && has(t, /\b(cent(re|er)s?|physical|offline)\b/))
    return { type: 'compare', entities: [{ kind: 'channel', key: 'online' }, { kind: 'channel', key: 'centre' }], filters: clean({ country: f.country }) };
  if ((compareWord || has(t, / and /)) && ents.length >= 2 && !has(t, /journey/))
    return { type: 'compare', entities: ents.slice(0, 2), filters: {} };

  if (has(t, /\b(journey|stages?|pipeline|funnel|flow|where (are|is) (the )?(online |centre |center )?applications)\b/)) {
    const channel = f.channel ?? (last?.type === 'journey' ? last.channel : 'online');
    return { type: 'journey', channel, filters: clean({ country: f.country, centre: f.centre, visaType: f.visaType }) };
  }

  // Rankings: top / most / slowest / under- or well-performing.
  const rankWord = has(t, /\b(top|most|highest|largest|biggest|rank|ranking|best|worst|lowest|least|fewest|slowest|fastest|under ?perform\w*|over ?perform\w*|well ?perform\w*|perform\w*|leading|which (country|countries|centre|centres|center|centers|nationalit\w*|visa))\b/);
  if (rankWord && f.countries.length + f.centres.length < 1) {
    const dimension = has(t, /\b(cent(re|er)s?|vac)\b/) ? 'centre' : has(t, /\b(visa types?|types? of visa|categor\w*)\b/) ? 'visaType' : 'country';
    let measure: 'applications' | 'approvalRate' | 'avgDays' = 'applications';
    let order: 'asc' | 'desc' = 'desc';
    if (has(t, /\b(slow\w*|fast\w*|quick\w*|time|days|long|turnaround|speed)\b/)) {
      measure = 'avgDays';
      order = has(t, /\b(fast\w*|quick\w*|best|well)\b/) ? 'asc' : 'desc';
    } else if (has(t, /\b(approv\w*|reject\w*|success)\b/)) {
      measure = 'approvalRate';
      order = has(t, /\b(reject\w*|lowest|worst|under)\b/) ? 'asc' : 'desc';
    } else if (has(t, /\b(under ?perform\w*|worst|poor\w*)\b/)) {
      measure = 'avgDays';
      order = 'desc';
    } else if (has(t, /\b(well ?perform\w*|best|over ?perform\w*)\b/)) {
      measure = 'avgDays';
      order = 'asc';
    } else if (has(t, /\b(lowest|least|fewest)\b/)) order = 'asc';
    return { type: 'ranking', dimension, measure, order, filters: clean({ channel: dimension === 'centre' ? undefined : f.channel, visaType: f.visaType }) };
  }

  if (has(t, /\b(how long|processing time|time|days|duration|turnaround|fast|slow|speed|take)\b/))
    return { type: 'time', filters: clean(filters) };

  if (has(t, /\b(outcomes?|approv\w*|reject\w*|closure|closed|decisions?|status|success rate)\b/))
    return { type: 'outcomes', filters: clean(filters), ...(has(t, /\b(v2|version 2|version two|galaxy)\b/) ? { style: 'galaxy' as const } : {}) };

  const appsV2 = has(t, /\b(v2|version 2|version two)\b/) ? { style: 'core' as const } : {};
  if (has(t, /\b(how many|number of|volume|count|applications?|visas?)\b/) && (ents.length || f.channel))
    return { type: 'count', filters: clean(filters), ...appsV2 };

  // Follow-up with only an entity: inherit the previous question.
  if (last && (ents.length || f.channel)) {
    const inherit = { ...('filters' in last ? last.filters : {}), ...clean(filters) };
    switch (last.type) {
      case 'journey':
        return { type: 'journey', channel: f.channel ?? last.channel, filters: clean({ ...inherit, channel: undefined }) };
      case 'outcomes':
      case 'time':
      case 'count':
      case 'revenue':
        return { ...last, filters: inherit } as Intent;
      case 'ranking':
        return { ...last, filters: clean({ ...last.filters, channel: f.channel }) };
      default:
        break;
    }
    return { type: 'count', filters: clean(filters) };
  }

  if (has(t, /\b(how many|applications?|processing|in progress|visas?)\b/)) return { type: 'count', filters: clean(filters), ...appsV2 };
  return { type: 'unsupported', text: raw };
}
