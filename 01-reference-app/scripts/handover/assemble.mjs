// Engineering handover · step 2: assemble the kit from the repo + captures.
//   node scripts/handover/assemble.mjs <workDir> "<Kit folder name>" <version>
// Reads <workDir>/_capture (from capture.mjs), writes <workDir>/<Kit folder name>/.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { EFFECTS } from './effects.mjs';

import { fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const work = path.resolve(process.argv[2] ?? 'handover-out');
const KIT_NAME = process.argv[3] ?? 'ODIN Engineering Handover';
const VERSION = process.argv[4] ?? 'dev';
const CAP = path.join(work, '_capture');
const KIT = path.join(work, KIT_NAME);
const STATIC = path.join(REPO, 'scripts/handover/kit');

const read = (f) => JSON.parse(fs.readFileSync(path.join(CAP, f), 'utf8'));
const views = read('views.json');
const questions = read('questions.json');
const samples = read('samples.json');
const intents = read('intents.json');
const morphKeys = read('morph-keys.json');
const composer = fs.existsSync(path.join(CAP, 'composer.json')) ? read('composer.json') : null;
const range = (kind) => { const ids = views.filter((v) => v.kind === kind).map((v) => v.id).sort(); return `${ids[0]}–${ids[ids.length - 1]}`; };
const SCREENS = range('screen'), STATES = range('system'), FX = `${EFFECTS[0].id}–${EFFECTS[EFFECTS.length - 1].id}`;

fs.rmSync(KIT, { recursive: true, force: true });
fs.mkdirSync(KIT, { recursive: true });
const write = (rel, text) => { const f = path.join(KIT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };
const copy = (src, rel) => { const d = path.join(KIT, rel); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.cpSync(src, d, { recursive: true }); };
const copySrc = (files, relDir) => files.forEach((f) => copy(path.join(REPO, f), path.join(relDir, f)));
const slug = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const folderOf = (v) => `${v.id}-${slug(v.title)}`;
const pkg = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8'));

// ── Screen files by component kind ──
const C = 'src/ui/scene/components/';
const KIND_FILES = {
  metric: [C + 'Panels.tsx'], legend: [C + 'Panels.tsx'], ranking: [C + 'Panels.tsx'], bars: [C + 'Panels.tsx'], notice: [C + 'Panels.tsx'],
  board: [C + 'Board.tsx', C + 'board.css', 'src/ui/home/KpiCapsule.tsx', 'src/ui/home/EnergyStreams.tsx'],
  journey: [C + 'Journey.tsx', C + 'journeyGeometry.ts'],
  timeMatrix: [C + 'TimeMatrix.tsx', C + 'TimeMatrixWide.tsx', C + 'PlexusOrb.tsx', C + 'matrix.css', 'src/ui/home/EnergyStreams.tsx', 'src/ui/scene/HeroGlass.tsx', 'src/ui/scene/hero-glass.css'],
  appcore: [C + 'AppCore.tsx', C + 'appcore.css'],
  glance: [C + 'Glance.tsx', C + 'glance.css', 'src/lib/glance.ts', 'src/ui/scene/HeroGlass.tsx', 'src/ui/scene/hero-glass.css'],
  periods: [C + 'Jars.tsx'], revenue: [C + 'RevenueCore.tsx', C + 'revcore.css'],
  podiums: [C + 'Tops.tsx', C + 'tops.css', 'src/ui/scene/SceneIcon.tsx'], geo: [C + 'Showcase.tsx'],
  donut: [C + 'Donut.tsx', C + 'donutGeometry.ts'],
};
const KIND_3D = { donut: 'donut', board: 'orb', journey: 'pedestal', periods: 'plinths', geo: 'earth + plinths' };
const SHARED = [C + 'shared.tsx', 'src/ui/scene/SceneIcon.tsx', 'src/ui/bridge.tsx', 'src/lib/format.ts', 'src/lib/homeLayout.ts'];
const HOME_FILES = ['src/ui/home/HomeComposition.tsx', 'src/ui/home/KpiCapsule.tsx', 'src/ui/home/EnergyStreams.tsx', 'src/ui/home/home.css', 'src/ui/NumberRoll.tsx', 'src/ui/icons.tsx', 'src/lib/layout.ts'];
const SYSTEM_FILES = {
  S01: ['src/ui/IntroDirector.tsx', 'src/ui/intro.css', 'src/lib/intro.ts'],
  S02: ['src/ui/hud/MicBar.tsx', 'src/ui/hud/QuestionPicker.tsx', 'src/ui/hud/hud.css', 'src/odin/questions.ts'],
  S03: ['src/ui/hud/MicBar.tsx', 'src/ui/hud/hud.css'],
  S04: ['src/odin/director.ts', 'src/odin/fx.ts', 'src/scene/TransitionParticles.tsx'],
  S05: ['src/ui/hud/InsightStrip.tsx', 'src/ui/hud/hud.css', 'src/state/caption.ts', 'src/scene/SpectrumAura.tsx'],
};
const VIS_TOL = { V01: 0.08, V02: 0.05, V09: 0.2 };

function screenInfo(v) {
  const spec = samples[v.id];
  const comps = spec?.components ?? [];
  const kinds = [...new Set(comps.map((c) => c.spec.kind))];
  let files = kinds.flatMap((k) => KIND_FILES[k] ?? []);
  const journey = comps.find((c) => c.spec.kind === 'journey')?.spec;
  if (spec?.template === 'floor') files.push(C + 'JourneyFloor.tsx', C + 'floorJourney.ts', C + 'floor.css');
  if (spec?.template === 'galaxy') files.push(C + 'OutcomeGalaxy.tsx', C + 'galaxy.css', 'src/ui/scene/HeroGlass.tsx', 'src/ui/scene/hero-glass.css');
  if (spec?.template === 'galaxy') files.push(C + 'OutcomeBoard.tsx', C + 'outboard.css', C + 'donutGeometry.ts', C + 'AppCore.tsx', C + 'appcore.css');
  if (comps.some((c) => c.spec.card === 'hero')) files.push('src/ui/scene/HeroGlass.tsx', 'src/ui/scene/hero-glass.css');
  if (v.id === 'V01') files = HOME_FILES;
  if (v.kind === 'system') files = SYSTEM_FILES[v.id] ?? [];
  const objects3d = [...new Set(kinds.map((k) => (k === 'journey' && spec?.template === 'floor' ? null : KIND_3D[k])).filter(Boolean))];
  let effects = [...v.effects];
  if (effects.some((e) => ['E02', 'E03', 'E04', 'E06', 'E07'].includes(e))) effects.unshift('E00');
  effects = [...new Set(effects)].sort();
  const fields = comps.map((c) => ({ kind: c.spec.kind, key: c.spec.key, fields: Object.keys(c.spec).filter((k) => !['kind', 'key'].includes(k)) }));
  return { spec, kinds, files: [...new Set(files)], objects3d, effects, fields };
}

// ── Question → screen mapping ──
// One time-matrix screen (V05): stage questions highlight a stage on it.
const sig = (i) => (i ? [i.type, i.type === 'timeMatrix' ? '' : i.channel ?? ''].join('|') : '');
const viewBySig = new Map();
for (const v of views) {
  const q = questions.find((q) => q.q === v.question);
  if (q) viewBySig.set(sig(intents[q.id]), v.id);
}
const qRows = questions.map((q) => {
  const i = intents[q.id];
  // Not in Build 5 (queue, channels, mix) and out-of-scope questions answer with the notice; answer states with V30.
  const vid = ['outOfScope', 'queue', 'channels', 'mix'].includes(i?.type) ? 'V24' : i?.type === 'answer' ? 'V30' : viewBySig.get(sig(i)) ?? '';
  const v = views.find((x) => x.id === vid);
  const spec = vid ? samples[vid] : null;
  return { bq: q.id, category: q.category, question: q.q, status: q.status, feature: q.feature, screen: vid, screenTitle: v?.title ?? '', components: spec ? [...new Set(spec.components.map((c) => c.spec.kind))].join(' + ') : '', spoken: spec?.spoken ?? '' };
});

// ── Manifest ──
const manifest = {
  name: KIT_NAME, version: VERSION, generated: new Date().toISOString(), referenceApp: '01-reference-app', previewUrl: 'http://localhost:5173/?view={id}',
  effects: EFFECTS.map((e) => ({ id: e.id, title: e.title, folder: `03-effects/${e.id}-${e.slug}`, deps: e.deps, files: e.files })),
  views: views.map((v) => {
    const info = screenInfo(v);
    return {
      id: v.id, title: v.title, kind: v.kind, folder: `04-views/${folderOf(v)}`, question: v.question ?? null, bq: v.bq, feature: v.feature, status: v.status,
      purpose: v.purpose, notes: v.notes ?? null, template: info.spec?.template ?? null, components: info.kinds, objects3d: info.objects3d, effects: info.effects,
      files: info.files, shared: v.kind === 'screen' && v.id !== 'V01' ? SHARED : [], morphKeys: morphKeys[v.id] ?? [], dataFields: info.fields,
      visualTolerance: VIS_TOL[v.id] ?? 0.03,
    };
  }),
};
write('manifest.json', JSON.stringify(manifest, null, 2));

// ── 01 reference app (tracked files only, design explorations removed) ──
{
  const dest = path.join(KIT, '01-reference-app');
  fs.mkdirSync(dest, { recursive: true });
  execSync(`git -C "${REPO}" archive HEAD | tar -x -C "${dest}"`);
  for (const junk of ['src/direction', 'scripts/dev']) fs.rmSync(path.join(dest, junk), { recursive: true, force: true });
  for (const f of fs.readdirSync(dest)) if (/^direction-.*\.html$/.test(f)) fs.rmSync(path.join(dest, f));
}

// ── 02 design system ──
{
  const css = ['src/styles/tokens.css', 'src/styles/global.css', 'src/ui/scene/scene.css', 'src/ui/scene/v1.css', 'src/ui/scene/glass.css', 'src/ui/scene/cards.css', 'src/ui/scene/hero-glass.css', 'src/ui/home/home.css', 'src/ui/chrome.css', 'src/ui/hud/hud.css'];
  copySrc(css, '02-design-system/source');
  copySrc(['src/ui/scene/SceneIcon.tsx', 'src/ui/icons.tsx', 'src/ui/scene/HeroGlass.tsx', 'src/ui/home/KpiCapsule.tsx', 'src/ui/scene/components/Panels.tsx', 'src/lib/format.ts'], '02-design-system/source');
  for (const [id, name] of [['V01', 'card-A-capsule'], ['V12', 'card-B-tile'], ['V04', 'card-C-hero-glass']]) copy(path.join(CAP, 'screens', id, 'wide.jpg'), `02-design-system/${name}.jpg`);
  write('02-design-system/README.md', fs.readFileSync(path.join(STATIC, '02-design-system.md'), 'utf8'));
}

// ── 03 effects ──
for (const e of EFFECTS) {
  const dir = `03-effects/${e.id}-${e.slug}`;
  const usedBy = manifest.views.filter((v) => v.effects.includes(e.id)).map((v) => `${v.id} ${v.title}`);
  write(`${dir}/SPEC.md`, `# ${e.id} · ${e.title}\n\n**How it connects to your app.** ${e.connect}\n\n**Libraries.** ${e.deps.length ? e.deps.map((d) => `\`${d}\``).join(', ') : 'none beyond React'}\n\n**Source** (in \`source/\`, same paths as the reference app): ${e.files.map((f) => `\`${f}\``).join(', ')}\n${e.spec}\n**Used by**: ${usedBy.join(' · ') || '—'}\n`);
  copySrc(e.files, `${dir}/source`);
}
// E12 · response composer: registry, phrasing table, LLM prompt, schemas.
if (composer) {
  const dir = '03-effects/E12-response-composer';
  const sp = (x) => (x ? `${x.component ?? ''}${x.item ? ` · \`${x.item}\`` : ''}` : '—');
  const title = (id) => views.find((v) => v.id === id)?.title ?? id;
  write(`${dir}/REGISTRY.md`, ['# Measure × depth → screen', '', 'Generated from the reference app (`route()` in `src/odin/composer.ts`). Glance always reads its number from the context screen. "Filtered" = context depth with a country, centre or visa-type filter.', '',
    '| Measure | Meaning | Glance | Context (default) | Explore | Filtered |', '|---|---|---|---|---|---|',
    ...composer.routes.map((r) => `| \`${r.measure}\` | ${r.info} | ${r.glance.view} ${sp(r.glance.spotlight)} | ${r.context.view} ${title(r.context.view)} · ${sp(r.context.spotlight)} | ${r.explore.view} ${title(r.explore.view)} · ${sp(r.explore.spotlight)} | ${r.filtered.view} · ${sp(r.filtered.spotlight)} |`),
    '', '`compare` (two named entities) always opens V19 at explore depth.', ''].join('\n'));
  const clean = (q) => { const { passthrough, ...rest } = q; return passthrough ? { ...rest, measure: null } : rest; };
  write(`${dir}/phrasings.json`, JSON.stringify({ rows: composer.rows.map((r) => ({ question: r.question, query: clean(r.query), expected: r.expected })), scripts: composer.scripts.map((s) => ({ name: s.name, steps: s.steps.map((x) => ({ question: x.question, view: x.view, depth: x.depth, items: x.items ?? null })) })) }, null, 2));
  write(`${dir}/PHRASINGS.md`, ['# Phrasing table', '', `${composer.rows.length} ways a CEO might ask, with the plan ODIN produces (DEMO DATA reference app). Your classifier passes when every row gives the same screen, depth and spotlight. Machine-readable: \`phrasings.json\`.`, '',
    '| Question | Measure | Cues | Screen | Depth | Spotlight |', '|---|---|---|---|---|---|',
    ...composer.rows.map((r) => `| ${r.question} | ${r.measure ?? '—'} | ${r.query.cues.join(', ') || '—'} | ${r.view} | ${r.depth} | ${sp(r.spotlight)} |`),
    '', '## Voice follow-up scripts', '', 'Each line is asked after the previous answer (no chips on screen; follow-ups are spoken).', '',
    ...composer.scripts.flatMap((s) => [`**${s.name}**`, '', ...s.steps.map((x, i) => `${i + 1}. “${x.question}” → ${x.view} · ${x.depth}${x.items ? ` · ${x.items.join(' + ')}` : ''}`), '']), ''].join('\n'));
  const pick = composer.rows.filter((_, i) => i % 3 === 0).slice(0, 24);
  write(`${dir}/LLM-PROMPT.md`, [
    '# LLM classifier prompt · ODIN response composer', '',
    'Use this as the system prompt for the model that turns a transcript into a `Query`. The model only **classifies**. It never answers, never picks screens and never invents numbers: `plan()` and `respond()` do that from your data. Validate the output against `query.schema.json`; on invalid JSON, retry once, then fall back to `understand()`.', '',
    '## System prompt', '', '```text',
    'You are the intent classifier for ODIN, an executive intelligence assistant for UAE visa application services (VAS).',
    'Read the executive\'s question (a voice transcript, possibly informal) and return ONE JSON object that matches the Query schema. Return JSON only.',
    '', 'Fields:',
    '- measure: the single best measure from the list below, or null when the question is navigation (home, go back), not about VAS data, outside the list, or a bare follow-up.',
    '- filters: { country?, centre?, visaType? } using the codes in the reference lists you are given. Only set a filter the question names. Never guess.',
    '- cues: every cue that applies (list below). Use [] when none.',
    '- followUp: "more", "less" or "full" ONLY when the question has no subject of its own ("tell me more", "less detail", "just the number", "full picture"); then measure is null. Otherwise null.',
    '- measures: every single-number measure the question names, in the order said ("approved and rejected" → ["approved","rejected"]). measure is the first of them.',
    '- additive: true when the question adds to the answer on screen ("and approved?", "what about in processing?", "also revenue", "… as well"). Otherwise false.',
    '- entities: only for measure "compare": the two named things, e.g. [{"kind":"country","key":"IN"},{"kind":"country","key":"PK"}].',
    '', 'Measures:', ...Object.entries(Object.fromEntries(composer.routes.map((r) => [r.measure, r.info]))).map(([k, v]) => `- ${k}: ${v}`), '- compare: Two named entities side by side (e.g. India vs Pakistan).',
    '', 'Cues:', ...Object.entries(composer.cues).map(([k, v]) => `- ${k}: ${v}`),
    '', 'Rules:',
    '- "And for India?" / "what about Nepal?" (a filter with no measure): measure null, filters set. The planner keeps the previous measure.',
    '- Answer-first: a single-number question opens only that number; "and X?" adds X (additive true); "full picture" / "everything" is cue full.',
    '- "Where are the applications?" means where in the journey: measure in_processing with cue where.',
    '- Approval rate / success rate is approval_rate, not approved.',
    '- Revenue questions that name a split (by country, centre, service, nationality) are revenue_breakdown.',
    '- Do not add causes, judgements or forecasts. You are classifying, not answering.',
    '```', '',
    '## Input', '', 'Send the transcript and the previous Query (or null):', '', '```json', JSON.stringify({ question: 'And for India?', previous: clean(composer.rows.find((r) => r.question === 'How many were rejected?')?.query ?? {}) }, null, 2), '```', '',
    '## Examples (few-shot)', '', 'From the phrasing table; the full set is `phrasings.json`.', '',
    ...pick.flatMap((r) => [`**“${r.question}”** → ${r.view} · ${r.depth}`, '', '```json', JSON.stringify(clean(r.query)), '```', '']),
    '## Acceptance', '', 'Register your classifier in `06-port-kit/tests/odin-adapters.ts` (`classify`) and your port of `plan()` (`planner`), then run `06-port-kit/tests/odin.composer.test.ts`. Every phrasing must give the expected screen, depth and spotlight.', '',
  ].join('\n'));
  for (const [type, file] of [['Query', 'query.schema.json'], ['ResponsePlan', 'response-plan.schema.json']]) {
    execSync(`npx -y ts-json-schema-generator@2 --path src/odin/composer.ts --type ${type} --tsconfig tsconfig.app.json --no-type-check -o "${path.join(KIT, dir, file)}"`, { cwd: REPO, stdio: 'ignore' });
    copy(path.join(KIT, dir, file), `05-data-contracts/${file}`);
  }
}
const vid = (f) => path.join(CAP, 'video', f);
if (fs.existsSync(path.join(CAP, 'video'))) {
  for (const f of fs.readdirSync(path.join(CAP, 'video'))) {
    const to = f.startsWith('S04') ? '03-effects/E01-morph/video' : f.startsWith('S01') ? '03-effects/E10-intro/video' : '04-views/' + folderOf(views.find((v) => v.id === 'V09')) + '/video';
    copy(vid(f), `${to}/${f}`);
  }
}
copy(path.join(CAP, 'screens', 'S04'), '03-effects/E01-morph/frames');

// ── 04 views ──
const statusNote = { Green: 'In October scope.', Amber: 'In scope with known data gaps (see notes).', Red: 'Design preview: data not confirmed for October.', Validation: 'Values need validation before go-live.', Out: 'Out of scope: honest “not available” notice.', System: 'System state.' };
for (const mv of manifest.views) {
  const v = views.find((x) => x.id === mv.id);
  const dir = mv.folder;
  copy(path.join(CAP, 'screens', v.id), `${dir}/screens`);
  if (mv.files.length) copySrc(mv.files, `${dir}/component`);
  if (samples[v.id]) write(`${dir}/spec.sample.json`, JSON.stringify(samples[v.id], null, 2));
  const order = (s) => (s === 'wide.jpg' ? 0 : s.startsWith('wide') ? 1 : s === 'portrait.jpg' ? 2 : s === 'phone.jpg' ? 3 : 4);
  const shots = fs.readdirSync(path.join(CAP, 'screens', v.id)).sort((a, b) => order(a) - order(b) || a.localeCompare(b, 'en', { numeric: true }));
  const md = [
    `# ${v.id} · ${v.title}`,
    '',
    `> ${v.purpose}`,
    '',
    `| | |`, `|---|---|`,
    `| Type | ${v.kind === 'system' ? 'System state' : 'Screen'} |`,
    v.question ? `| Opens with | “${v.question}” |` : null,
    v.bq.length ? `| Business questions | ${v.bq.join(', ')} |` : null,
    `| Feature | ${v.feature} |`,
    `| Scope status | **${v.status}** · ${statusNote[v.status]} |`,
    mv.template ? `| Template | \`${mv.template}\` |` : null,
    mv.components.length ? `| Components | ${mv.components.map((k) => `\`${k}\``).join(', ')} |` : null,
    mv.objects3d.length ? `| 3D objects (E04) | ${mv.objects3d.join(', ')} |` : null,
    `| Effects | ${mv.effects.map((e) => `[${e}](../../03-effects/${EFFECTS.find((x) => x.id === e).id}-${EFFECTS.find((x) => x.id === e).slug}/SPEC.md)`).join(' · ') || '—'} |`,
    v.kind === 'screen' ? `| Preview (reference app) | \`http://localhost:5173/?view=${v.id}\` |` : null,
    '',
    v.notes ? `**Notes.** ${v.notes}\n` : null,
    '## Captures',
    '',
    ...shots.map((s) => `![${s}](screens/${s})`),
    '',
    mv.files.length ? '## Files\n\n`component/` holds this screen\'s own source (same paths as the reference app):\n\n' + mv.files.map((f) => `- \`${f}\``).join('\n') + '\n' : null,
    mv.shared.length ? '**Shared** (port once, used by many screens): ' + mv.shared.map((f) => `\`${f}\``).join(', ') + ', plus the design-system CSS in `02-design-system/source`.\n' : null,
    samples[v.id] ? '## Data contract\n\n`spec.sample.json` is exactly what this screen renders (DEMO DATA). Types: `05-data-contracts/source/src/odin/types.ts` (`SceneAnswer`). Fields per component:\n\n' + mv.dataFields.map((f) => `- \`${f.kind}\` · key \`${f.key}\`: ${f.fields.map((x) => `\`${x}\``).join(', ')}`).join('\n') + '\n' : null,
    v.id === 'V01' ? '## Data contract\n\nHome takes `HomeData` as props (`HomeComposition({ data, current, visible })`): `total` (Kpi), `orbs` (four Kpi: VAS revenue, entered processing today, approved today, closure rate), `asOf`. Schema: `05-data-contracts/home-data.schema.json`.\n' : null,
    mv.morphKeys.length ? '## Morph keys\n\nKeep these `data-morph` keys so shared elements travel between screens (E01): ' + mv.morphKeys.map((k) => `\`${k}\``).join(', ') + '\n' : null,
    v.kind === 'screen' ? `## Port it\n\nSee \`06-port-kit/PORT-PROMPTS.md\` → ${v.id}. Done = contract test + acceptance test (\`ODIN_VIEWS=${v.id}\`) pass, motion reviewed.\n` : null,
  ].filter((x) => x !== null).join('\n');
  write(`${dir}/README.md`, md);
}

// ── 05 data contracts ──
{
  copySrc(['src/odin/types.ts', 'src/data/types.ts', 'src/ui/scene/components/floorJourney.ts'], '05-data-contracts/source');
  for (const f of ['scene-answer.schema.json', 'home-data.schema.json']) if (fs.existsSync(path.join(CAP, f))) copy(path.join(CAP, f), `05-data-contracts/${f}`);
  // SceneAnswer schema regenerated from the current types (new components, spot, depth).
  execSync(`npx -y ts-json-schema-generator@2 --path src/odin/types.ts --type SceneAnswer --tsconfig tsconfig.app.json --no-type-check -o "${path.join(KIT, '05-data-contracts/scene-answer.schema.json')}"`, { cwd: REPO, stdio: 'ignore' });
  copySrc(['src/odin/composer.ts'], '05-data-contracts/source');
  const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
  if (composer) write('05-data-contracts/phrasings.csv', ['Question,Measure,Cues,Screen,Depth,Spotlight component,Spotlight item,Asked items', ...composer.rows.map((r) => [r.question, r.measure ?? '', r.query.cues.join(' '), r.view, r.depth, r.spotlight?.component ?? '', r.spotlight?.item ?? '', (r.items ?? []).join(' + ')].map(esc).join(','))].join('\n'));
  write('05-data-contracts/questions.csv', ['BQ,Category,Question,Status,Feature,Screen,Screen title,Components,Sample spoken answer (demo data)', ...qRows.map((r) => [r.bq, r.category, r.question, r.status, r.feature, r.screen, r.screenTitle, r.components, r.spoken].map(esc).join(','))].join('\n'));
  write('05-data-contracts/README.md', fs.readFileSync(path.join(STATIC, '05-data-contracts.md'), 'utf8') + '\n\n## Free-text questions (E12 response composer)\n\nPicker questions open the screens below directly. Anything else (voice, typed) goes through the composer: the LLM returns a `Query` (`query.schema.json`), `plan()` returns a `ResponsePlan` (`response-plan.schema.json`). `phrasings.csv` lists ' + (composer ? composer.rows.length : 0) + ' phrasings with the screen, depth and spotlight each must produce. See `03-effects/E12-response-composer/`.\n\n## Question → screen → data\n\n| BQ | Question | Status | Screen | Components |\n|---|---|---|---|---|\n' + qRows.map((r) => `| ${r.bq} | ${r.question} | ${r.status} | ${r.screen} ${r.screenTitle} | ${r.components} |`).join('\n') + '\n');
}

// ── 06 port kit ──
{
  copy(path.join(STATIC, '06-port-kit'), '06-port-kit');
  const screens = manifest.views.filter((v) => v.kind === 'screen');
  const prompt = (v) => `### ${v.id} · ${v.title}\n\n\`\`\`\nUsing the ODIN port kit in ./odin-handover (read odin-handover/06-port-kit/CLAUDE.md first),\nport ${v.id} "${v.title}" into this app.\nEffects it needs: ${v.effects.join(', ')} (skip any already integrated).\nFollow steps 2–5: write INTEGRATION-PLAN.md and wait for my approval; then port the screen,\nwrite its adapter from our data (fields in odin-handover/${v.folder}/spec.sample.json),\nadd it to the ODIN preview route, and run the contract and acceptance tests with ODIN_VIEWS=${v.id}.\n\`\`\`\n`;
  write('06-port-kit/PORT-PROMPTS.md', [
    '# Ready-to-paste requests for your Claude', '',
    'Put the kit at the root of your repo as `odin-handover/`. Start with Discovery once, then Foundation, then any screens in any order.', '',
    '### 0 · Discovery (once)', '', '```\nRead odin-handover/06-port-kit/CLAUDE.md, then do Step 1 (Discovery) for this repo and write odin-handover/DISCOVERY.md. Do not change any code.\n```', '',
    '### 1 · Foundation (once)', '', '```\nUsing odin-handover/06-port-kit/CLAUDE.md, plan the ODIN foundation for this app: E00 canvas layer, E11 bridge,\nE01 morph, E06 environment, E03 globe, E07 post-FX, plus an /odin-preview/:id route. Write INTEGRATION-PLAN.md and wait for approval.\n```', '',
    '### 2 · Response composer (once, after the first screens)', '', '```\nUsing odin-handover/06-port-kit/CLAUDE.md and odin-handover/03-effects/E12-response-composer/, plan how free-text and voice\nquestions reach ODIN screens in this app: our LLM returns a Query (LLM-PROMPT.md, query.schema.json), a port of plan()/respond()\npicks screen, depth and spotlight, picker questions stay direct. Write INTEGRATION-PLAN.md and wait for approval; then implement,\nadd data-spot-key to ported screens, and run odin.composer.test.ts.\n```', '',
    '### Any effect on its own', '', '```\nUsing odin-handover/06-port-kit/CLAUDE.md, integrate effect <E-id> as specified in odin-handover/03-effects/<E-id>-*/SPEC.md.\nPlan first and wait for approval; then implement and show it side by side with the reference app.\n```', '',
    '## Screens', '', ...screens.map(prompt),
  ].join('\n'));
}

// ── 07 assets ──
copy(path.join(REPO, 'public/env'), '07-assets/env');
copy(path.join(REPO, 'public/sfx'), '07-assets/sfx');
write('07-assets/README.md', '# Assets\n\n- `env/` — ODIN interior and exterior plates at 1600 / 2560 / 3840 px (WebP) plus pre-blurred copies used for the focus state (E06).\n- `sfx/` — intro pulse and the two morph sounds (E09).\n- Font — Inter Variable, loaded from `@fontsource-variable/inter` (OFL licence).\n');

// ── Root docs ──
copy(path.join(STATIC, 'STACK.md'), 'STACK.md');
copy(path.join(STATIC, 'INTEGRATION-GUIDE.md'), 'INTEGRATION-GUIDE.md');
const changelog = fs.readFileSync(path.join(REPO, 'CHANGELOG.md'), 'utf8');
write('CHANGELOG.md', changelog);
// Release notes for this version (what changed since the last handover, by screen).
const notes = fs.readdirSync(REPO).filter((n) => /^RELEASE-NOTES-.*\.md$/.test(n));
for (const n of notes) copy(path.join(REPO, n), n);
write('00-START-HERE.md', startMd());
write('00-START-HERE.html', startHtml());
console.log(`assembled ${KIT}`);

function startMd() {
  const row = (v) => `| [${v.id}](${encodeURI(v.folder)}/README.md) | ${v.title} | ${v.status} | ${v.bq.join(', ') || '—'} | ${v.effects.join(' ')} |`;
  return [
    `# ${KIT_NAME}`, '', `Version ${VERSION} · generated ${new Date().toISOString().slice(0, 10)} · ODIN reference app ${pkg.version}`, '',
    'Everything an engineering team needs to take ODIN screens and effects into its own app, one at a time, without replacing its core.', '',
    ...notes.map((n) => `0. What changed in this version: \`${n}\`.`),
    '1. Open `00-START-HERE.html` for the visual catalogue.',
    '2. Read `INTEGRATION-GUIDE.md` (leads) and `STACK.md` (versions, already matched to your stack).',
    '3. Give your Claude `06-port-kit/CLAUDE.md` and a request from `06-port-kit/PORT-PROMPTS.md`.', '',
    '| Folder | Contents |', '|---|---|',
    '| `01-reference-app/` | Runnable ODIN prototype (`npm ci && npm run dev`, `?view=V05`) |',
    '| `02-design-system/` | Tokens, card system A/B/C, type, colour by meaning |',
    `| \`03-effects/\` | ${FX}: SPEC, source, videos/frames (E12: response composer, LLM prompt, phrasing table) |`,
    `| \`04-views/\` | ${STATES} system states, ${SCREENS} screens: README, component, spec.sample.json, captures |`,
    '| `05-data-contracts/` | Types, JSON Schema, question → screen → data |',
    '| `06-port-kit/` | Claude instructions, prompts, contract + acceptance tests, golden frames |',
    '| `07-assets/` | Room imagery, sounds |',
    '| `manifest.json` | Machine-readable map of all of the above |', '',
    '## Screens and states', '', '| ID | Title | Status | Business questions | Effects |', '|---|---|---|---|---|', ...manifest.views.map(row), '',
    '## Effects', '', ...EFFECTS.map((e) => `- [${e.id} · ${e.title}](03-effects/${e.id}-${e.slug}/SPEC.md)`), '',
  ].join('\n');
}

function startHtml() {
  const S = { Green: '#3ed6a0', Amber: '#f5ac45', Red: '#ff8a8a', Validation: '#f5ac45', Out: '#a9b6cc', System: '#9fd0ff' };
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const card = (v) => {
    const shots = fs.readdirSync(path.join(CAP, 'screens', v.id)).sort();
    const thumb = shots.includes('wide.jpg') ? 'wide.jpg' : shots[Math.floor(shots.length / 2)];
    return `<a class="card" href="${encodeURI(v.folder)}/README.md">
  <img src="${encodeURI(v.folder)}/screens/${thumb}" alt="${esc(v.title)} capture" loading="lazy">
  <div class="meta"><span class="id">${v.id}</span><span class="st" style="--s:${S[v.status]}">${v.status}</span></div>
  <h3>${esc(v.title)}</h3><p>${esc(v.purpose)}</p>
  <div class="chips">${v.bq.slice(0, 4).map((b) => `<span>${b}</span>`).join('')}${v.bq.length > 4 ? `<span>+${v.bq.length - 4}</span>` : ''}${v.effects.map((e) => `<span class="e">${e}</span>`).join('')}</div></a>`;
  };
  const effects = EFFECTS.map((e) => `<a class="eff" href="03-effects/${e.id}-${e.slug}/SPEC.md"><b>${e.id}</b><span>${esc(e.title)}</span></a>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ODIN Handover</title>
<style>
:root{--bg:#0b1424;--panel:rgba(30,48,92,.55);--line:rgba(160,190,255,.28);--ink:#fff;--ink2:#d5e0f5;--ink3:#aab9d4;--acc:#7fb6ff}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(120% 80% at 50% -10%,#1d3566,var(--bg) 60%);color:var(--ink);font:16px/1.5 Inter,-apple-system,system-ui,sans-serif}
main{max-width:1320px;margin:0 auto;padding:48px 24px 80px}h1{font-size:clamp(28px,4vw,44px);margin:0 0 6px;letter-spacing:-.02em}h2{margin:48px 0 16px;font-size:22px}
.lead{color:var(--ink2);max-width:780px}.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-top:24px}
.step{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:16px 18px}.step b{color:var(--acc)}.step p{margin:4px 0 0;color:var(--ink2);font-size:14px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px}
.card{display:block;text-decoration:none;color:inherit;background:var(--panel);border:1px solid var(--line);border-radius:20px;overflow:hidden;transition:transform .2s,border-color .2s}
.card:hover,.card:focus-visible{transform:translateY(-3px);border-color:var(--acc);outline:none}.card img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#16233f}
.meta{display:flex;justify-content:space-between;align-items:center;padding:12px 16px 0}.id{font-weight:700;color:var(--acc);font-variant-numeric:tabular-nums}
.st{font-size:12px;font-weight:650;padding:2px 10px;border-radius:999px;color:var(--s);border:1px solid var(--s)}
.card h3{margin:6px 16px 4px;font-size:17px}.card p{margin:0 16px;color:var(--ink2);font-size:14px}
.chips{display:flex;flex-wrap:wrap;gap:6px;padding:12px 16px 16px}.chips span{font-size:11px;padding:2px 8px;border-radius:8px;background:rgba(255,255,255,.08);color:var(--ink2)}.chips .e{color:#cfe3ff;background:rgba(79,156,255,.18)}
.effects{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}.eff{display:flex;gap:12px;align-items:center;padding:12px 16px;border-radius:14px;background:var(--panel);border:1px solid var(--line);color:inherit;text-decoration:none}.eff b{color:var(--acc)}.eff:hover,.eff:focus-visible{border-color:var(--acc);outline:none}
footer{margin-top:56px;color:var(--ink3);font-size:13px}code{background:rgba(255,255,255,.08);padding:1px 6px;border-radius:6px}
@media (max-width:600px){main{padding:28px 16px 60px}}
</style></head><body><main>
<h1>${esc(KIT_NAME)}</h1>
<p class="lead">Every ODIN screen and effect, numbered so engineering can take one at a time into its own app without replacing its core. Version ${esc(VERSION)} · reference app ${esc(pkg.version)} · stack matched to engineering (React 19.2, three 0.180, Vite 7, TS 5.8).</p>
${notes.map((n) => `<p class="lead">What changed in this version: <code>${esc(n)}</code></p>`).join('')}
<div class="steps">
<div class="step"><b>1 · Read</b><p><code>INTEGRATION-GUIDE.md</code> and <code>STACK.md</code></p></div>
<div class="step"><b>2 · Pick</b><p>A screen below (${SCREENS}) or an effect (${FX})</p></div>
<div class="step"><b>3 · Port</b><p>Give your Claude <code>06-port-kit/CLAUDE.md</code> + a prompt from <code>PORT-PROMPTS.md</code></p></div>
<div class="step"><b>4 · Verify</b><p>Contract + acceptance tests in <code>06-port-kit/tests</code></p></div>
</div>
<h2>Screens</h2><div class="grid">${manifest.views.filter((v) => v.kind === 'screen').map(card).join('')}</div>
<h2>System states</h2><div class="grid">${manifest.views.filter((v) => v.kind === 'system').map(card).join('')}</div>
<h2>Effects</h2><div class="effects">${effects}</div>
<footer>DEMO DATA · not live. LogicEra for AEGI / EIX. Generated ${new Date().toISOString().slice(0, 10)}.</footer>
</main></body></html>`;
}
