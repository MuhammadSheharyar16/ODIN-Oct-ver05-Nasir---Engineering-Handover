import type { ComponentSpec, GlanceSpec, SceneAnswer, ValueFormat } from './types';
import { GLANCE_VIEW, route, type Measure, type ResponsePlan } from './composer';
import { answer } from './answers';
import { slice } from './vas';
import { formatCount, formatValue } from '../lib/format';

/**
 * ResponsePlan → SceneAnswer. The asked number is read from the screen's own
 * component specs, so the lead sentence, the spotlight and the glance answer
 * always match what is drawn (spoken/visual parity by construction).
 */

export type Fact = {
  label: string;
  value: number;
  format: ValueFormat;
  accent: string;
  caption?: string;
  /** One sentence that answers the question directly. */
  sentence: string;
  /** Two supporting facts (glance answer). */
  facts: { label: string; value: string }[];
};

const pct = (v: number) => `${v.toFixed(1)}%`;
const days = (v: number) => `${v.toFixed(1)} days`;
const aed = (v: number) => (v >= 1e6 ? `AED ${(v / 1e6).toFixed(1)} million` : `AED ${Math.round(v / 1e3)} thousand`);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function find(scene: SceneAnswer, component?: string): ComponentSpec | undefined {
  const specs = scene.components.map((c) => c.spec);
  return specs.find((s) => s.key === component) ?? specs.find((s) => s.kind === component) ?? specs.find((s) => s.key === scene.focusKey);
}

/** The asked metric, read from the scene the composer chose. */
export function factFor(scene: SceneAnswer, measure: Measure | null, component?: string, item?: string): Fact | null {
  const spec = find(scene, component);
  if (!spec) return null;
  switch (spec.kind) {
    case 'appcore': {
      const seg = (k: string) => spec.segments.find((s) => s.key === k);
      const proc = seg('processing')?.count ?? 0;
      const facts = [
        { label: 'In processing', value: formatCount(proc) },
        { label: 'Approval rate', value: pct(spec.approval.rate) },
      ];
      if (item === 'approval')
        return { label: 'Approval rate', value: spec.approval.rate, format: 'percent', accent: '#3ed6a0', caption: spec.caption, facts: [{ label: 'Approved', value: formatCount(spec.approval.approved) }, { label: 'Decided', value: formatCount(spec.approval.decided) }], sentence: `The approval rate is ${pct(spec.approval.rate)} of decided applications${spec.caption === 'to date' ? '' : ` ${spec.caption}`}.` };
      if (item === 'closure')
        return { label: 'Closure rate', value: spec.closure.rate, format: 'percent', accent: '#a67cff', caption: spec.caption, facts: [{ label: 'Closed', value: formatCount(spec.closure.closed) }, { label: 'In processing', value: formatCount(proc) }], sentence: `The closure rate is ${pct(spec.closure.rate)}${spec.caption === 'to date' ? '' : ` ${spec.caption}`}.` };
      const s = item ? seg(item) : undefined;
      if (s) {
        const share = (s.count / Math.max(1, spec.total)) * 100;
        return { label: s.label, value: s.count, format: 'count', accent: s.accent, caption: spec.caption, facts: [{ label: 'Share of applications', value: pct(share) }, { label: 'Total applications', value: formatCount(spec.total) }], sentence: `${formatCount(s.count)} applications ${spec.caption} are ${s.label.toLowerCase().replace('closed · other', 'closed for other reasons')}.` };
      }
      return { label: 'Applications', value: spec.total, format: 'count', accent: '#4f9cff', caption: spec.caption, facts, sentence: `There are ${formatCount(spec.total)} applications ${spec.caption}.` };
    }
    case 'board': {
      const c = spec.capsules.find((x) => x.id === item);
      const entered = spec.capsules.find((x) => x.id === 'entered-today');
      const decided = spec.capsules.find((x) => x.id === 'closed-today');
      if (c) return { label: c.label, value: c.value, format: c.format, accent: c.accent, caption: c.detail, facts: [{ label: 'In processing now', value: formatCount(spec.hero.value) }, ...(decided && decided !== c ? [{ label: decided.label, value: formatCount(decided.value) }] : [])], sentence: `${formatCount(c.value)} applications ${c.id === 'entered-today' ? 'entered processing today' : c.label.toLowerCase()}.` };
      return {
        label: spec.hero.label, value: spec.hero.value, format: 'count', accent: '#4f9cff', caption: spec.hero.caption,
        facts: [entered, decided].filter((x): x is NonNullable<typeof x> => !!x).map((x) => ({ label: x.label, value: formatCount(x.value) })),
        sentence: `${formatCount(spec.hero.value)} applications are in processing right now.`,
      };
    }
    case 'donut': {
      const total = spec.total || 1;
      const seg = spec.segments.find((s) => s.key === item);
      const closure = spec.centre?.label === 'Closure rate' ? spec.centre.value : spec.closure?.value;
      if (item === 'closed' && closure !== undefined && measure === 'closure_rate')
        return { label: 'Closure rate', value: closure, format: 'percent', accent: '#a67cff', facts: [{ label: 'Total applications', value: formatCount(spec.total) }, ...spec.segments.filter((s) => s.key === 'processing').map((s) => ({ label: 'In processing', value: formatCount(s.count) }))], sentence: `The closure rate is ${pct(closure)}.` };
      if (seg) {
        const share = (seg.count / total) * 100;
        const verb = seg.key === 'processing' ? 'are in processing' : seg.key === 'closed' ? 'were closed for other reasons' : `have been ${seg.label.toLowerCase()}`;
        return { label: seg.label, value: seg.count, format: 'count', accent: seg.accent, facts: [{ label: 'Share of applications', value: pct(share) }, { label: 'Total applications', value: formatCount(spec.total) }], sentence: `${formatCount(seg.count)} applications ${verb}, ${pct(share)} of the total.` };
      }
      if (closure !== undefined && measure === 'closure_rate') {
        const open = spec.segments.find((s) => s.key === 'processing')?.count ?? 0;
        return { label: 'Closure rate', value: closure, format: 'percent', accent: '#a67cff', facts: [{ label: 'Closed', value: `${formatCount(spec.total - open)} of ${formatCount(spec.total)}` }, { label: 'Still in processing', value: formatCount(open) }], sentence: `The closure rate is ${pct(closure)}: ${formatCount(spec.total - open)} of ${formatCount(spec.total)} applications are closed.` };
      }
      const ap = spec.segments.find((s) => s.key === 'approved');
      const rj = spec.segments.find((s) => s.key === 'rejected');
      return { label: spec.totalLabel, value: spec.total, format: 'count', accent: '#4f9cff', facts: [ap, rj].filter((x): x is NonNullable<typeof x> => !!x).map((x) => ({ label: x.label, value: formatCount(x.count) })), sentence: ap && rj ? `${formatCount(ap.count)} approved and ${formatCount(rj.count)} rejected.` : '' };
    }
    case 'timeMatrix':
      if (item === 'stages')
        return { label: `Longest stage · ${spec.longest.label}`, value: spec.longest.days, format: 'days', accent: '#a67cff', facts: [{ label: 'Average end to end', value: days(spec.avg) }, { label: `Fastest · ${spec.fastest.label}`, value: days(spec.fastest.days) }], sentence: `The longest stage is ${spec.longest.label}, at ${days(spec.longest.days)} on average.` };
      return { label: 'Average processing time', value: spec.avg, format: 'days', accent: '#4fd6ff', caption: spec.scopeLabel, facts: [{ label: 'Median', value: days(spec.median) }, { label: `Longest stage · ${spec.longest.label}`, value: days(spec.longest.days) }], sentence: `Processing takes ${days(spec.avg)} on average, submission to decision.` };
    case 'metric': {
      if (spec.value === null) return null;
      const v = spec.value;
      const sentence = spec.format === 'days' ? `${cap(spec.label)} is ${days(v)}${spec.caption ? ` ${spec.caption}` : ''}.` : `${cap(spec.label)}: ${formatValue(v, spec.format)}.`;
      const others = scene.components.map((c) => c.spec).filter((s): s is Extract<ComponentSpec, { kind: 'metric' }> => s.kind === 'metric' && s.key !== spec.key && s.value !== null).slice(0, 2);
      return { label: spec.label, value: v, format: spec.format, accent: spec.accent, caption: spec.caption, facts: others.map((o) => ({ label: o.label, value: formatValue(o.value, o.format) })), sentence };
    }
    case 'podiums': {
      const col = spec.columns.find((c) => c.key === item) ?? spec.columns[0];
      const [a, b] = col.items;
      const noun = col.key === 'nat' ? 'nationality' : col.key === 'cen' ? 'centre' : 'country';
      return { label: `Top ${noun} · ${a.label}`, value: a.value, format: 'count', accent: col.accent, facts: col.items.slice(1, 3).map((x) => ({ label: x.label, value: formatCount(x.value) })), sentence: `${a.label} leads with ${formatCount(a.value)} applications${b ? `, followed by ${b.label} with ${formatCount(b.value)}` : ''}.` };
    }
    case 'revenue': {
      const amount = spec.amount ?? 0;
      const bd = spec.breakdowns?.find((x) => x.key === item);
      const top = spec.breakdowns?.[0]?.rows[0];
      const facts = [...(spec.delta !== null ? [{ label: 'vs previous period', value: `${spec.delta >= 0 ? '+' : ''}${spec.delta.toFixed(1)}%` }] : []), ...(top ? [{ label: `Largest · ${top.name}`, value: aed(top.value) }] : [])];
      if (bd && measure === 'revenue_breakdown') {
        const lead = bd.rows[0];
        return { label: `Revenue · ${lead.name}`, value: lead.value, format: 'currency', accent: bd.accent, facts, sentence: `${lead.name} brings in the most, ${aed(lead.value)}, ${Math.round(lead.share * 100)} percent of revenue.` };
      }
      return { label: 'Total VAS revenue', value: amount, format: 'currency', accent: '#f5b342', facts, sentence: `Total VAS revenue is ${aed(amount)}.` };
    }
    case 'periods': {
      const p = spec.items.find((x) => x.key === item) ?? spec.items[0];
      const d = p.delta;
      return { label: `${p.label} · processed`, value: p.value, format: 'count', accent: p.accent, facts: [{ label: 'Approval rate', value: pct(p.approval) }, { label: 'Average time', value: days(p.days) }], sentence: `${p.label}, ${formatCount(p.value)} visas processed${d !== null ? `, ${Math.abs(d).toFixed(1)} percent ${d >= 0 ? 'more' : 'fewer'} ${p.cmp.replace(/^vs /, 'than ')}` : ''}.` };
    }
    case 'geo': {
      const [a, b] = spec.items;
      return { label: `Top country · ${a.name}`, value: a.value, format: 'count', accent: '#f5ac45', facts: spec.items.slice(1, 3).map((x) => ({ label: x.name, value: formatCount(x.value) })), sentence: `${a.name} leads with ${formatCount(a.value)} applications${b ? `, then ${b.name}` : ''}.` };
    }
    default:
      return null;
  }
}

/** The glance answer: one KPI inside ODIN's core, two facts, no chrome. */
function glanceScene(base: SceneAnswer, fact: Fact, plan: ResponsePlan): SceneAnswer {
  const spec: GlanceSpec = { kind: 'glance', key: 'glance', label: fact.label, value: fact.value, format: fact.format, accent: fact.accent, caption: fact.caption, facts: fact.facts.slice(0, 2) };
  return {
    ...base,
    id: `${base.id}-glance`,
    template: 'glance',
    title: base.title,
    subtitle: 'At a glance · ask for more detail any time',
    components: [{ spec, slot: 'hero' }],
    focusKey: 'glance',
    presence: 'core',
    env: undefined,
    spot: undefined,
    depth: plan.depth,
    spoken: fact.sentence,
    summary: { primary: fact.sentence, secondary: fact.facts.map((f) => `${f.label} ${f.value}`).join(' · ') },
  };
}

/** Read one metric from its own screen (same numbers as that screen draws). */
function readMetric(m: Measure, filters: ResponsePlan['query']['filters']) {
  const r = route(m, 'context', filters);
  const base = answer(r.intent);
  const fact = base ? factFor(base, m, r.spotlight?.component, r.spotlight?.item) : null;
  return base && fact ? { base, fact } : null;
}

/**
 * Answer-first view (V30): the first asked metric inside ODIN's globe, the
 * others as glass cards beside it (they join by morph as the CEO asks).
 */
/** Short labels for the answer cards (the full label is spoken and on the full page). */
const CARD_LABEL: Partial<Record<Measure, string>> = {
  applications_total: 'Total applications', in_processing: 'In processing', entered_today: 'Entered today', approved: 'Approved', rejected: 'Rejected',
  approval_rate: 'Approval rate', closure_rate: 'Closure rate', processing_time: 'Processing time', revenue: 'VAS revenue',
};

/** The answer sphere's lights: applications by status (as Applications v2), gold for revenue, the time palette for durations. */
function lightsFor(m: Measure, filters: ResponsePlan['query']['filters']): NonNullable<GlanceSpec['lights']> {
  if (m === 'revenue') return [{ key: 'gold', label: 'Revenue', count: 7, accent: '#f5b342' }, { key: 'gold2', label: 'Revenue', count: 3, accent: '#ffd27a' }];
  if (m === 'processing_time') return [{ key: 'time', label: 'Time', count: 6, accent: '#4fd6ff' }, { key: 'time2', label: 'Time', count: 3, accent: '#a67cff' }, { key: 'time3', label: 'Time', count: 1, accent: '#4f9cff' }];
  const s = slice(filters);
  return [
    { key: 'processing', label: 'In processing', count: s.inProcessing, accent: '#4f9cff' },
    { key: 'approved', label: 'Approved', count: s.approved, accent: '#3ed6a0' },
    { key: 'rejected', label: 'Rejected', count: s.rejected, accent: '#ff5d6c' },
    { key: 'closed', label: 'Closed · other', count: s.closedOther, accent: '#a67cff' },
  ];
}

function answerScene(plan: ResponsePlan, items: Measure[], filters: ResponsePlan['query']['filters']): SceneAnswer | null {
  const read = items.map((m) => ({ m, r: readMetric(m, filters) })).filter((x): x is { m: Measure; r: NonNullable<ReturnType<typeof readMetric>> } => !!x.r);
  if (!read.length) return null;
  const [hero, ...rest] = read;
  const f = hero.r.fact;
  const spec: GlanceSpec = {
    kind: 'glance', key: 'glance', item: hero.m, label: f.label, value: f.value, format: f.format, accent: f.accent, caption: f.caption, facts: f.facts.slice(0, rest.length ? (rest.length === 1 ? 1 : 0) : 2),
    more: rest.map((x) => ({ item: x.m, label: CARD_LABEL[x.m] ?? x.r.fact.label, value: x.r.fact.value, format: x.r.fact.format, accent: x.r.fact.accent, caption: x.r.fact.caption })),
    lights: lightsFor(hero.m, filters),
  };
  const sentences = read.map((x) => x.r.fact.sentence).filter(Boolean);
  const beats = read.filter((x) => x.r.fact.sentence).map((x, i) => ({ target: i === 0 ? 'globe' : x.m, words: x.r.fact.sentence.trim().split(/\s+/).length }));
  return {
    ...hero.r.base,
    id: `${hero.r.base.id}-answer`,
    template: 'glance',
    intent: plan.intent,
    // The page title when everything asked lives on one page; otherwise "Your Figures".
    title: read.every((x) => x.r.base.title === hero.r.base.title) ? hero.r.base.title : 'Your Figures',
    subtitle: rest.length ? 'The figures you asked for · the full picture is available whenever you wish' : 'The figure you asked for · the full picture is available whenever you wish',
    components: [{ spec, slot: 'hero' }],
    focusKey: 'glance',
    presence: 'dissolved',
    env: undefined,
    spot: undefined,
    depth: plan.depth,
    spoken: sentences.join(' '),
    beats,
    summary: { primary: sentences[0] ?? f.label, secondary: rest.length ? sentences.slice(1).join(' ') : f.facts.map((x) => `${x.label} ${x.value}`).join(' · ') },
  };
}

/** Build the scene for a composer plan. `null` = Home. */
export function respond(plan: ResponsePlan): SceneAnswer | null {
  if (plan.intent.type === 'answer') return answerScene(plan, plan.intent.items as Measure[], plan.intent.filters);
  const base = answer(plan.intent);
  if (!base || !plan.measure) return base;
  const fact = factFor(base, plan.measure, plan.spotlight?.component, plan.spotlight?.item);
  if (plan.view === GLANCE_VIEW && fact) return glanceScene(base, fact, plan);
  const target = find(base, plan.spotlight?.component);
  const out: SceneAnswer = { ...base, depth: plan.depth, spot: plan.spotlight?.item, focusKey: target?.key ?? base.focusKey };
  // Lead with the asked number unless the screen already opens with it.
  if (fact?.sentence) {
    const v = fact.format === 'count' ? formatCount(fact.value) : formatValue(fact.value, fact.format);
    const at = base.spoken.indexOf(v);
    const said = at >= 0 && at < 16;
    if (plan.reason.startsWith('already on screen')) {
      // Highlight only: the screen is already open, so ODIN says just the asked item.
      out.spoken = fact.sentence;
    } else if (!said) {
      // Drop a screen sentence the lead already says (same text or the same number), so ODIN never repeats itself.
      const rest = base.spoken.split(/(?<=\.)\s+/).filter((x) => !fact.sentence.includes(x.replace(/\.$/, '')) && !new RegExp(`(^|[^\\d.,])${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\d])`).test(x));
      out.spoken = [fact.sentence, ...rest].join(' ');
    }
  }
  return out;
}
