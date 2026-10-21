# Changelog

## ODIN Oct ver05 Nasir — 20 Oct 2026 (`odin-oct-ver05-nasir`)

Everything agreed in the 20 Oct design review (standup and design discussion, parts 1–3). Checklist: `docs/ver05-todo.md`.

- **Answer-first:** ODIN shows only what was asked. One metric opens the answer view (V30): the number sits inside ODIN's globe, with two facts beside it.
  - "And approved?", "what about…" and "also…" add a card beside the globe by morph (right, then left), up to three.
  - "Full picture" opens the full page that carries most of what was asked. Four or more metrics open it too.
  - When the item is already on screen, ODIN highlights it in place.
  - Closure rate answers with the closure rate, not the total.
- **Component catalogue:** every card, sphere and metric has an ID (C01–C18), with what it shows and its data cost (`src/odin/components.ts`, `docs/components.md`).
- **Answer-first states** in the question list: Outcomes, Processing, Rates, Processing time and Revenue, each at 1, 2 and 3 metrics and as the full picture.
- **Spotlight:**
  - ODIN's spectrum wraps only the focused card and keeps its shape.
  - On Top countries (v1 and v2) the asked breakdown glides to the centre with glow, and the other two step back about 25% smaller.
  - ODIN says only the asked item.
- **Content:**
  - No "Validation required" tags.
  - Home reads as today: "Revenue today", AED once, a larger closure rate.
  - Applications in Processing says "Closed today" and drops "since launch".
  - The Application Outcomes donut is retired; the galaxy is used everywhere.
  - Plain CEO language on every title and label, with no truncated labels.
- **Motion:**
  - The Journey v2 icon hops in 0.82 s, and ODIN speaks only at the end stops.
  - Morphs flow straight into speech.
- **Waiting experience:**
  - `?latency=N` makes ODIN think for N seconds, with spoken check-ins at 10/15/20/30/45/60 s and a retry at 60 s.
  - Adding `&progressive` shows the screen at once, with a loader on each number until it arrives.
  - Spec for the AI team: `docs/waiting-spec.md`.
- **Design language:**
  - Audit sheet of every screen (`docs/audit/index.html`) and sphere and card family rules (`docs/design-language.md`).
  - Outcome Distribution re-laid out: capsule-size cards and a one-row legend.
  - Centre-visit journey cards move to dark glass.
  - Compare becomes duel rows with split bars.
- **Tests:** 120 unit tests (vitest): phrasing table, follow-up scripts, answer-first, spotlight, catalogue and waiting.

### Updated 21 Oct 2026 (same version, re-tagged)
- **The room:** behind every answer it stays sharp and at Home exposure, with no blur and no dimming. Titles get a feathered lens and a stronger halo so they stay AA on the sky. Review flags: `?blur=1` (old blur), `?blur=dof` (light depth of field on the exterior only), `?dim=1` (old darkening).
- **Answer view:**
  - The sphere is now the Applications v2 sphere (deep-blue glass, status lights; gold for revenue).
  - It stands where Home's globe stands, above the floor ring, with Home's beam and rays. Tablet and phone put the cards in a row under the title and stand the sphere on the ring.
  - Two metrics are balanced: the asked metric's own fact on the left, the second metric on the right.
- **ODIN's spectrum:**
  - It circles the sphere while ODIN speaks, then moves to each card as ODIN reaches it.
  - On every new screen it appears in place and never travels in from the previous screen.
  - When the asked item sits inside a sphere, the spectrum circles the sphere.
- **Transitions with IDs:** answer states use T01 Grow, T02 Regroup, T03 Expand, T04 Gather, T05 Swap and T06 Spotlight, and other screens use the screen morphs M01–M06. A number that stays on screen never recounts. Docs: `docs/transitions.md`; handover E13.
- **Courteous copy for H.E.:**
  - "The figure you asked for · the full picture is available whenever you wish".
  - "I'm sorry, I don't have that information yet".
  - Waiting check-ins that thank him for his patience.
- **VAS Revenue v3 (V32, REV-V3):** the gold core in the centre on its beam, with two breakdown panels on each side.
- **Time matrix:** the links meet the sphere's glass edge. The layout is calmer: six equal cards, a smaller sphere, and a slimmer step strip moved up.
- **Tools:** `scripts/dev-states.mjs` takes a high-res screenshot of every screen and every answer-first state.
- **Backdrop blur as a function (still ver05):**
  - `setBackdropBlur('dof' | 'full' | 'none')` (`src/lib/backdrop.ts`), or `backdrop` on a screen.
  - `dof` is depth of field (interior sharp, light lens blur on the exterior); `full` is the previous blur on both layers.
  - Keyboard: **F** toggles depth of field, **G** toggles the full blur. The default stays sharp.
- **Design pass (21 Oct, still ver05):**
  - **Outcome Distribution:** a thin status ring, as on Applications, around a much larger particle sphere.
  - **VAS Revenue v1** (pillars and the breakdown): the Applications particle sphere instead of ODIN's globe.
  - **Today Compared With Earlier:** the jars and their stats panels are ODIN glossy glass, with a neon rim, glint and halo. The crown text has a dark lens; the passports show through.
  - **Top Nationalities/Countries/Centres and Top Countries (top 10):** glossy glass panels and cards.
  - **Glass a step darker everywhere**, so text stays readable on the bright, undimmed room while staying translucent.
  - **Spheres more glass than solid:** the Applications sphere, the time-matrix sphere, the revenue core, the outcome galaxy portal and the 3D glass orb all let the room show through softly.
- **Application Journey** (both versions; renamed from Online Visa Journey):
  - Both ICP reviews, before and after biometrics, lead to one **ICP decision** stage, which splits into a single **Approved** and a single **Rejected**. Each shows its total and its without / after biometric split.
  - The ICP decision is an existing element in each version: a violet jar in v2, a floor plinth in v1. Every other stage, visual and effect is unchanged.
  - Tours: biometric → approved, direct → approved, biometric → rejected.
- **Retired screens:** Centre Visit Journey (V10, redesign planned, maybe v6), Application Journey Map (V11), and Compare Side by Side (V19, engineering's geography globe covers it). Their questions now get a courteous notice that points to the screen that answers them.
- **Tests:** 122.

## ODIN Oct ver04 Nasir — 20 Oct 2026 (`odin-oct-ver04-nasir`)

The build reviewed with the team on 20 Oct: response composer, the v2 screens and the cinematic pass. Version 5 carries the changes agreed in that review.

- **Response composer (E12):** any phrasing of a question gets the right screen at the right depth. ODIN turns the question into a small Query (measure, filters, cues, follow-up) and plans the answer: **glance** ("just the number", "quickly"), **context** (default: the measure's screen with the asked item spotlit) or **explore** ("break it down", "in detail", "where are…"). ODIN opens with the direct answer, read from the screen's own data. Follow-ups are voice only: "tell me more" goes deeper, "less detail" goes back, "and for India?" keeps the subject. Picker questions still open their catalogue screen directly.
- **Glance answer (V30):** the asked number inside ODIN's globe with two facts on hero-glass capsules.
- **Spotlight:** the asked item glows and breathes; its neighbours calm slightly (text stays AA). The outcome galaxy locks onto the asked outcome.
- **Handover for the composer:** LLM classifier prompt with few-shot examples, Query and ResponsePlan JSON Schemas, measure × depth registry, 76-phrasing acceptance table (+ follow-up scripts) and a vitest acceptance test for engineering's classifier.
- **v2 screens (kept beside their v1s):** Online visa journey v2 (glass jars, neon connectors, girl at her laptop at Home) · Application outcomes v2 (outcome galaxy) · VAS revenue v2 (gold revenue core, four full breakdowns) · Applications v2 (application core with rate gauges).
- **Refinements:** Outcome distribution ring centre answers the closure rate; time matrix gets its own constellation sphere; revenue v1 with thin cinematic streams; summary strip more translucent; UI never moves with the cursor (only the room does).
- **Application core everywhere:** Outcomes v1 keeps its 3D donut with the status-light core in the centre and four hero-glass cards (desktop, laptop, tablet, phone); Outcome Distribution, Applications in Processing (glass sphere, deeper blue) and Revenue v1 gain the same particle sphere.
- **Top countries, nationalities & centres:** v1 leaderboards standing on the floor with reflections (camera tilts down); v2 skyline of glass pillars with rising particles, leaders glowing.
- **Top countries on the globe:** day-side light, atmosphere, particle sphere, light dust, lifted arcs with particle streams, origin pulses and a UAE ripple.
- **Floor beam:** Home-style beam with hairline white rays from the floor ring into each screen's central object (intensity per screen); Home gains the side rays.
- **Connecting lines:** Home's energy links on Revenue v1 and v2 and Applications v2, landing on each sphere's outer edge.
- **Fixes:** question list no longer blinks while scrolling; galaxy spins anticlockwise; Still open capsule aligned; beam stops at the sphere.
- **Tests:** 104 unit tests (vitest) for the composer and parity.

## ODIN Oct ver03 Nasir — 16 Oct 2026 (`odin-oct-ver03-nasir`)

Engineering handover release, plus the visual work since ver02.

- **Engineering handover kit:** every UI numbered (S01–S05 system states, V01–V25 screens) with captures (wide, portrait, phone), its own source, a data sample and README; effects E00–E11 with exact SPECs, source, morph videos and frames; data contracts (types, JSON Schema, question → screen → data table); a port kit for engineering's Claude (instructions, ready prompts, @playwright/test acceptance tests with golden frames, vitest contract tests).
- **Engineering stack:** rebuilt on engineering's versions (React 19.2, three 0.180, R3F 9.3, drei 10.7, Vite 7, TypeScript 5.8, ESLint 9, vitest, @playwright/test); tested at the oldest and newest versions of their ranges; unused packages removed.
- **Decoupled screens:** screens read follow-ups and layout from one bridge (`OdinBridgeProvider`), Home takes its data as props; nothing in a screen imports stores or mock data. `?view=V05` opens any screen directly.
- **Card system:** A capsule (live pulse: Home, Applications in Processing) · B tile (analysis) · C hero glass, the default for headline cards that carry a chart (Outcome Distribution, Time Matrix, Journey Map, Centre journey).
- **Home:** thinner, calmer capsules; energy links rebuilt as layered VFX (bloom, filament, drifting dust, eased comet with a white-hot head).
- **Screens:** online visa journey on the ODIN floor (traveller walks, stages light up, camera push, auto blur); Applications in Processing as a Home-style board around a glass orb; Outcome Distribution and the online Processing Time Matrix to the approved references.
- **Sound:** supplied intro pulse on first load; supplied bass / woosh picked at random on each morph.

## ODIN Oct ver02 Nasir — 15 Oct 2026 (`odin-oct-ver02-nasir`)

Scope v2 (Data and Delivery Plan v2, call 8) and the premium visual pass.

- **Scope v2:** all applications are submitted online (DXC); the channel question answers with a notice. Centre journey is now a **Centre Visit Journey** (appointment → arrival *not available* → payment at centre → biometrics → interview) with unconfirmed stages labelled. Revenue (F13a/b) is shown with **Validation required** on Home and in the revenue view. Processing time (F11) is live. The question list statuses match v2.
- **Accessible light glass:** every internal card uses the custom-report frosted glass with dark navy ink (WCAG AA+), semantic deltas that pass on white with ▲/▼ kept, glass-chip ring callouts, dark lenses behind numbers on the globe, a deeper summary strip and readable unspoken words. Reduced motion is respected throughout.
- **3D:** crystal stage objects (refractive accent glass tiles with luminous icons); grounded pedestals.
- **Cinematic finish:** selective bloom, vignette, grain, SMAA; colour-accurate shaders under post-processing; NaN-safe shaders; adaptive quality tiers (`?tier=high|medium|low`, auto-adjusts to hold frame rate; `?fx=0` disables effects).
- **Hero moments:** gold light arcs from each country into the UAE on the Earth; data streams rising from the revenue pillars into the core; aging heat in the stage-queue jars; count-up reveals on every number.
- **Sound:** six synthesised morph cues, one per morph choreography (press M to mute, `?sfx=0` to disable).

## ODIN Oct ver01 Nasir — 15 Oct 2026 (`odin-oct-ver01-nasir`)

First October review build.

- **Home:** ODIN presence globe, four glass KPI capsules, summary strip that shows what ODIN says, moving clouds, adaptive layouts (desktop, tablet, phone, landscape phone).
- **Navigation:** typed questions (voice-ready); runtime-composed scenes; any state to any state through 3D morphs; six morph choreographies (depth, vortex, sweep, rise, scatter, helix) with matching particle paths.
- **Question picker:** the full business-question catalogue (BQ01–BQ31 plus design views), grouped by area, with status (live, pending validation, design preview · mock, out of scope), live search and keyboard selection.
- **Views (v1 designs):** online and physical-centre journeys on 3D pedestals, journey map, outcomes donut and outcome distribution ring, processing time matrix (online, centre, focus stage), submission channels, visa performance comparison, stage queue / aging, VAS revenue (“Not available” and labelled design preview), top countries / nationalities / centres, 3D Earth ranking, purpose and applicant mix, comparisons, rankings, out-of-scope notices.
- **ODIN spectrum:** wraps single-object answers; for compositions (journeys, jar rows) it becomes a floor ring around everything with a voice curtain behind it.
- **Data:** mock VAS data, clearly labelled; no causal claims; deltas vs yesterday.
