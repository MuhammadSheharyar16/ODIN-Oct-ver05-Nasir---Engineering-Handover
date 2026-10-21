# ODIN port kit — instructions for Claude (engineering side)

You are porting parts of **ODIN**, LogicEra's voice-first executive intelligence experience for AEGI, from a creative reference build into **this team's existing application**. Read this whole file before changing anything.

## Ground rules

1. **This codebase is the owner.** Keep its architecture, routing, state, data layer, styling conventions, lint rules and tests. Do **not** replace its core with ODIN's. ODIN effects plug in through small connection points (see `03-effects/*/SPEC.md`, "How it connects").
2. **Add, don't swap.** Only add a dependency when nothing already in this repo can do the job. Check `STACK.md` first: most of ODIN's stack is already here at compatible versions.
3. **Plan before code.** For any port, first write `INTEGRATION-PLAN.md` (template below) and stop for engineering approval.
4. **Real data, never mock.** The reference app runs on DEMO DATA. Screens receive their spec as props; build that spec from this team's API with an adapter. Never copy `src/odin/vas.ts`, `src/data/homeFeed.ts` or any mock values into production code.
5. **Fidelity is defined by the kit, not by memory.** Each screen and effect has captures, videos, a SPEC and acceptance tests. "Looks about right" is not done; the acceptance test passing is done.
6. **Scope labels are part of the design.** Keep "Validation required" (revenue), "Not available" (SLA, uncaptured events), "Design preview" (biometric split) and "vs yesterday" wording exactly. Never add causal claims ("because…") to ODIN's text.
7. **Accessibility is non-negotiable.** White ink on glass at WCAG AA or better, focus-visible on every control, `prefers-reduced-motion` honoured by every effect (each SPEC says how).

## Kit map

| Folder | Use it for |
|---|---|
| `00-START-HERE.html` | Visual catalogue of every UI (IDs S01–S05, V01–V30) |
| `01-reference-app/` | The full working prototype. `npm ci && npm run dev`, then `?view=V05` opens any screen. Source of truth for behaviour. |
| `02-design-system/` | Tokens, card system (A capsule · B tile · C hero glass), type, colour by meaning |
| `03-effects/E00…E12/` | Each effect: `SPEC.md` (exact timings, eases, layers, fallbacks), `source/`, how it connects. E12 (response composer) adds `LLM-PROMPT.md`, `REGISTRY.md`, `PHRASINGS.md`, schemas |
| `04-views/Vxx-*/` | Each screen: `README.md`, `component/` (screen-specific source), `spec.sample.json` (the data it renders), `screens/` (wide, portrait, phone) |
| `05-data-contracts/` | `types.ts`, JSON Schema, question → screen → data table |
| `06-port-kit/` | This file, prompts, acceptance + contract tests, golden frames |
| `07-assets/` | Room imagery (all sizes), sounds, fonts |
| `manifest.json` | Machine-readable map: screen → files → effects → morph keys → data fields |

## Workflow

### Step 1 · Discovery (once)
Read this repo and write `odin-handover/DISCOVERY.md`:
- framework + versions (`package.json`), router, state management, styling approach, test setup;
- whether a WebGL canvas already exists, and where full-screen layers could mount;
- how the app fetches data, and where an ODIN preview route can live;
- a stack comparison against `STACK.md` (what is present, what would be added).

### Step 2 · Integration plan (per request) → stop for approval
Write `odin-handover/INTEGRATION-PLAN.md`:
```
Request: <e.g. "Port V05 Processing Time Matrix">
Effects required (from manifest): E00, E01, …  · already integrated: …
For each effect / screen: REUSE ours | ADD from kit | REBUILD from SPEC — and why
Dependencies to add (exact versions from STACK.md): …
Files to create / change in this repo: …
Data: API fields → spec fields (adapter), gaps
Preview route: /odin-preview/<id> renders the screen from spec.sample.json
Risks / questions for engineering
```
Do not write code until engineering approves the plan.

### Step 3 · Foundation (first time any 3D/morph screen is ported)
1. **E00** canvas layer: mount `<Stage />` once, fixed, behind the UI.
2. **E11** bridge: wrap ODIN screens in `<OdinBridgeProvider value={{ ask, layout }}>`; `ask` = this app's question handler.
3. **E01** morph + **E06** environment + **E03** globe, then the rest as screens need them.
4. A **preview route** that renders any screen by ID from its `spec.sample.json` (used by the acceptance test).

### Step 3b · Response composer (E12, once)
Free-text and voice questions must reach the right screen at the right depth whatever the wording.
1. This app's LLM returns a `Query` (system prompt and examples: `03-effects/E12-response-composer/LLM-PROMPT.md`; schema `query.schema.json`). It classifies only; it never picks screens or numbers.
2. Port `plan()` and `respond()` from `src/odin/composer.ts` / `respond.ts` as plain TypeScript: depth (glance · context · explore, default context), screen per measure (`REGISTRY.md`), spotlight, voice-only follow-ups ("tell me more", "just the number"). Keep `lastPlan` per conversation.
3. Picker / menu questions keep opening their catalogue screen directly.
4. Port the glance view (V30) and add `data-spot-key` to items of every ported screen (keys in E12 SPEC).
5. Register `classify` and `planner` in `odin-adapters.ts` and pass `odin.composer.test.ts`.

### Step 4 · Port a screen
1. Copy `04-views/<id>/component/*` into this repo's structure (rename/relocate to fit conventions; keep the `data-morph`, `data-aura`, `data-focus`, `data-presence`, `data-surface` attributes).
2. Shared pieces (design-system CSS, `Panels.tsx`, `shared.tsx`, `SceneIcon.tsx`, `HeroGlass.tsx`, formatters) are listed in the screen README under "Shared"; port each once.
3. Write the adapter: this app's data → the screen spec (`05-data-contracts/source/src/odin/types.ts`). Register it in `06-port-kit/tests/odin-adapters.ts`.
4. Add the screen to the preview route.

### Step 5 · Verify and report
```
ODIN_KIT=./odin-handover npx vitest run odin-handover/06-port-kit/tests/odin.contracts.test.ts
ODIN_KIT=./odin-handover npx vitest run odin-handover/06-port-kit/tests/odin.composer.test.ts   # after E12
ODIN_KIT=./odin-handover ODIN_URL='http://localhost:<port>/odin-preview/{id}' ODIN_VIEWS=V05 \
  npx playwright test -c odin-handover/06-port-kit/tests/playwright.config.ts
```
Then compare motion side by side with the reference app (`01-reference-app`, `?view=<id>`) and the videos in `03-effects/E01-morph/video/`. Report per screen: contract ✓/✗, visual ✓/✗ (diff %), motion reviewed, open issues.

## Connection points (HTML attributes ODIN effects read)

| Attribute | Meaning |
|---|---|
| `data-scene="<id>"` | Root of one screen (Home: `data-layer="home"`) |
| `data-morph="<key>"` | Element that morphs; same key on two screens = it travels between them |
| `data-accent="#hex"` | Particle / glow colour for that element |
| `data-focus` | The element ODIN's speaking aura wraps |
| `data-aura` / `data-aura="floor"` | Aura target inside the focus element / floor-ring form around a composition |
| `data-surface` | Element whose `border-radius` shapes the aura |
| `data-spot-key="<item>"` | Item the response composer can spotlight (E12); `SceneAnswer.spot` names the asked one |
| `data-presence="k"` | ODIN's globe sits in this element, radius = k × its short side |
| `data-intro="chrome\|capsule\|readout\|hud"` | Intro load-in groups (E10) |

## When something can't be matched

If this repo's constraints make a SPEC impossible (no WebGL, performance budget, security policy), use the effect's **Fallback** section, record it in the plan, and flag it in the report. Never silently drop an effect.
