# Changelog

## ODIN Oct ver05.4 Nasir — 30 Oct 2026 (0.5.4, engineering handover)

Virtual desktops: AEGI allows access only through Azure Virtual Desktop (AVD), where ODIN went static (remote sessions report reduced motion) and was heavy (no GPU). Full notes: `RELEASE-NOTES-ver05.4.md`; the kit has `ver05.4-vm.patch`.

- **Motion override** (`src/lib/environment.ts`): `?motion=on` / `VITE_ODIN_MOTION=on` keeps ODIN animating when the OS asks for reduced motion; remembered per browser; removes the stylesheets' reduced-motion rules at runtime.
- **Automatic lite mode** when WebGL is software or missing: low tier (no post-FX), 30 / 10 fps 3D at ~0.8 MP, no room blur, no live glass blur or grain, half the journey particles; no WebGL → the room as still plates, everything else working.
- **`?perf=1`** diagnostic panel (`src/ui/hud/PerfHud.tsx`): renderer, OS reduced motion, ODIN motion, lite, fps, pixel density.
- 5 new unit tests (133 in total). On a hardware GPU nothing changes.

## ODIN Oct ver05.3 Nasir — 29 Oct 2026 (0.5.3, engineering handover)

Performance: the same screens as ver05.2, using far less CPU and GPU, at a steady 60 fps on 120 Hz screens. No screen, data, routing or voice change. Full notes, measurements and the integration rule for the real voice: `RELEASE-NOTES-ver05.3.md`.

- **Shared 60 fps ticker** (`src/lib/ticker.ts`, with tests): one animation clock for the app, capped at 60 fps on 120 Hz screens and stopped when the tab is hidden; every 2D animation loop runs on it (`onTick`, `requestFrame`).
- **3D canvas on demand** (`Stage.tsx`): driven by the ticker (`frameloop="never"`); full rate while something moves (ODIN speaking, the globe, a transition, a scene change, camera or room easing, the pointer), 20 fps when calm. Pixel budget of about 4 million device pixels. drei's PerformanceMonitor removed.
- **Static film grain** (`.stage-grain`, `public/fx/grain.png`) instead of the animated post-FX `Noise` pass; Bloom at half resolution.
- **V39 floor:** the particle floor at 1x and 30 fps with 440 particles a route (was 620), a little brighter; it stops while the detail view's stage hero is shown. The floor rings at 1.25x, clearing only their own box and stopping when faded.
- **Hidden layers stop working:** Home's energy streams stop when Home is off screen, its CSS animations pause (`.is-off`), and the startup loader is removed after the intro.
- **Glass:** the stage number pills have no live blur (tint .64); live blurs above 14 px are lowered to 14 px.

## ODIN Oct ver05.2 Nasir — 28 Oct 2026 (0.5.2, engineering handover)

The application journey approved by Anupam and the second Top 10 Countries layout. Full notes by screen: `RELEASE-NOTES-ver05.2.md`.

- **New V39 · Online Visa Journey v4.5:** the approved application journey. It has a stage card on the left, the all-stages strip at the bottom, equal subtler units on a particle floor, and floor light rippling from the highlighted stage. One application icon travels the route, and the detail view shows a single hero stage morphing from stage to stage with its dashboard (demo KPIs until the data team confirms them).
- **New V40 · Top 10 Countries v2:** ranks 1–5 down the left and 6–10 down the right, the Earth centred, all cards the same width.
- **Journey environment (V09, V39):** a flat floor (ODIN's floor circle sinks away on journeys; new `interior-flat-*` and `floor-ring-*` plates and a `RingLayer`) and ODIN's voice spectrum at Home's strength on the journey floor.
- **Not shipped:** the other journey design options explored on the way (v3, v4, v4.1–v4.4).

## ODIN Oct ver05.1 Nasir — 26 Oct 2026 (`odin-oct-ver05.1-nasir`)

Engineering handover. Release notes by screen: `RELEASE-NOTES-ver05.1.md`. **The journey maps (V33 Online Visa Journey v3, V34 v4) are held back while client feedback is implemented and come to engineering in ver05.2**; they live on `main`, and this handover is built from branch `handover/ver05.1`. V09 is unchanged from ver05.

Renamed from ver06 (26 Oct, Nasir): the changes are refinements, not a revamp, so this release is **ver05.1** (version 0.5.1). Commits before the rename still say "ver06".

- **V17 Top Countries on the Globe (26 Oct):**
  - **Digital neon land:** a faint cyan fill with a scan shimmer, a fine twinkling dot grid and a glowing coastline replace the solid white continents.
  - **Ocean:** translucent deep glass with a faint graticule, so the room shows through.
  - **Arcs:** blue instead of gold. A cyan core with a white pulse, a blue glow sheath and motes running blue → white into the UAE, with blue origin pulses and a cyan UAE beacon. The dust and particle shell lose their gold too.
  - **Bases 6–10:** front view (Plinth tilt 0.1), so the base's front wall shows instead of a top-down view.
  - **Bars removed:** the decorative light bars above cards 6–10 are gone.
  - **Waving flags:** each card's flag waves slowly in the wind. The flag is cut into 32 strips with a short wave (about 2.5 ripples across the flag, 2.4 s cycle) travelling from the pole side outward; the pole side moves least, and strips lighten and darken as they catch the light. It stops under reduced motion. (`WavingFlag` in Showcase.tsx, `.wflag` in v1.css.)
  - Engineering builds its own globe for this screen; treat this as the design reference.
- **Revenue-today capsule (Home) (26 Oct):** "AED" is now a small, softer prefix and the amount keeps its full size. In the tall desktop capsule AED sits on a line above the amount; in the phone pill it stays inline. The amount now fits inside the capsule on one line (previously "AED 628.4K" wrapped onto two lines at full size). Applies to any currency KPI capsule.
- **Closure-rate capsule (Home) (26 Oct):** the rate now sits fully inside its donut ring. The ring is larger (58 → 66 % of the capsule width) with a slimmer stroke (8 → 6), and the value is sized to the ring's inner circle (desktop 13.5cqw, phone 13cqh). Checked on desktop and phone.
- **Classic home sphere: silk streams replace the brush-stroke bands (26 Oct).** The 14 travelling bands were large dots of random size, jittered and fixed in place, so they read as brush strokes. They are now **silk streams**:
  - about 28,000 fine, even particles spread across soft ribbons, denser at the centre and fading at the edges;
  - the particles really glide along their arcs (positions computed in the shader), slowly;
  - each ribbon undulates gently, its ends fade in and out, and a few particles sparkle;
  - the blue and amber colours, the speed, the intro convergence and the reading lens (calmer behind the number) are unchanged.
  - Code: `buildStreams` (geometry.ts) and `streamShader` (OdinGlobe.tsx). The old `buildBands` is removed. The grid option still mutes the streams.
- **Home sphere option: grid (26 Oct).** This is a second look for ODIN's home sphere, from Nasir's "home sphere references". It drops the travelling particle bands, which read as brush strokes, and keeps only the thin grid.
  - The grid's light pulses run about 3× slower, in a cooler blue with fewer warm accents.
  - The rim is a cleaner, brighter line (refs 1 and 3), with a faint inner sparkle (ref 1) and a slow iridescent sheen across the glass (ref 4).
  - The sphere spins a little slower, and the network nodes are softer.
  - The classic sphere stays the default. Switch with `?sphere=grid`, the **O** key, or `setSphereStyle('grid')` from code (`src/lib/sphere.ts`). The change eases over about a second.

Changes after the ver05 handover:

- **Clean-up to the Build 5 approved screens (22 Oct, from Nasir's marked-up handover).** The app now has the **17 approved screens**: V01, V02, V04, V05, V09, V12, V15, V16, V17, V22, V23, V24, V25, V27, V29, V30 and V32. The 11 rejected screens are removed, and so are their code, styles and assets:
  - **Extra versions:**
    - V08 Revenue v1 and V28 Revenue v2 → **V32 is the revenue full page** (BQ05, BQ27).
    - V26 Journey v2 (jars) → V09.
    - V31 Top Countries v2 (skyline) → V16.
    - V13 / V14 Stage queue → not-available notice.
  - **Out of scope:** V18 Channels, V20 Purpose mix and V21 Occupation mix → not-available notice (V24), worded for each question.
  - **Repetition:** V06 centre matrix and V07 focus-stage matrix → V05. Stage questions highlight their stage on it.
  - **Also removed:**
    - the compare and facts panels (compare was retired on 21 Oct), the journey-map orbs and the old podium code;
    - the jar artwork;
    - about 40 KB of dead CSS, checked pixel-for-pixel against the previous build on desktop and phone;
    - the concept pages for rejected designs.
  - The question list, composer routes, component catalogue, phrasing table, design docs, audit sheet and handover scripts all follow the 17 screens.
- **Spheres 30% less see-through:** the Applications sphere (answers, V29, V04, Revenue v1), the time-matrix sphere, the gold revenue core and the 3D glass orb (Applications in Processing). Each layer's see-through share is cut by 30%: opacity 1 − 0.7 × (1 − previous). The outcome galaxy is unchanged.
- **Sphere metrics:** text shadows and the dark lenses behind the numbers are 15% lighter on every sphere (Applications, processing orb, time matrix, revenue core, Outcome Distribution). The galaxy and Home's globe are unchanged.
- **Today Compared With Earlier:** front-view glass jars in ODIN's style.
  - A bell dome with curved shoulders, a shoulder highlight and a vertical specular streak.
  - A chrome collar ring lit in the jar's colour, seated on a front-view base (the 3D pedestal can now take a view angle: `Plinth tilt`, `data-tilt`).
  - The stats are a glossy glass capsule.
  - Phone and tablet keep compact jars with the main number.
  - No bottom border: the collar ring is removed and the glass fades into the base, so the jar feels connected to it. The stats capsule's corner radius is halved.

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
