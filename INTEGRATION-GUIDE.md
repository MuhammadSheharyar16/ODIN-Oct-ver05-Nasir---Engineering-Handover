# ODIN integration guide (for engineering leads)

This kit lets you take **any single ODIN screen or effect** into your existing app without replacing your core. Everything is numbered, so a request can be as small as "port V05".

## Three ways to adopt

| Path | You take | Effort | Result |
|---|---|---|---|
| **A · One screen** | One `04-views/Vxx` folder + the effects it lists | Smallest | That screen with full ODIN visuals inside your app |
| **B · Foundation + screens over time** | E00 canvas layer, E01 morph, E03 globe, E06 room, E11 bridge once; then screens one by one | Medium | The ODIN experience grows release by release |
| **C · Reference only** | SPECs, captures, data contracts | Any stack | Rebuild in your own components to the same spec |

Most teams start with **B**: the foundation is a one-time cost and every later screen is then a small, testable port.

## What your app must allow

- **One full-screen 3D canvas layer** (E00) behind your UI: one element plus three.js, which you already have. Needed for the globe, particles, glow and 3D objects. If a device or policy can't run WebGL, every effect's SPEC has a **Fallback** section (static room image, CSS glow, no particles).
- **A preview route** (e.g. `/odin-preview/:id`) that renders a screen from its `spec.sample.json`. The acceptance tests open it.

## The process (Claude-assisted)

Give your Claude `06-port-kit/CLAUDE.md`. It enforces:

1. **Discovery** — reads your repo, writes `DISCOVERY.md` (stack, state, styling, data, where layers can mount).
2. **Integration plan** — per request, `INTEGRATION-PLAN.md`: reuse / add / rebuild per item, exact dependencies, files touched, data mapping. **You approve before any code.**
3. **Foundation** — E00 + E11 + needed effects, plugged in through connection points.
4. **Port** — screen component + adapter from your API to the screen spec + preview entry.
4b. **Response composer (E12)** — your LLM classifies any phrasing into a small `Query`; a ported `plan()` picks the screen, the depth (glance · context · explore) and the item to spotlight, so free-text and voice questions get the right UI at the right depth. Follow-ups are spoken, never chips. Acceptance: 76 phrasings in `odin.composer.test.ts`.
5. **Verify** — contract test (vitest) + acceptance test (@playwright/test, golden frames) + side-by-side motion review against the reference app and videos.

Ready-made requests are in `06-port-kit/PORT-PROMPTS.md`.

## What "done" means for a screen

- [ ] Contract test passes (adapter output covers `spec.sample.json`)
- [ ] Acceptance test passes (morph keys present, visual diff within tolerance)
- [ ] Motion reviewed against `01-reference-app/?view=<id>` and the E01 videos
- [ ] Reduced motion checked (OS setting), keyboard focus visible on every control
- [ ] Scope labels intact (Validation required / Not available / Design preview)
- [ ] Phone and portrait layouts checked against `screens/phone.jpg`, `screens/portrait.jpg`

## Data

Screens are pure: they render a typed spec (`05-data-contracts/source/src/odin/types.ts`) and never fetch. Your adapter builds the spec from your API. `05-data-contracts/questions.csv` maps every business question → screen → data fields, with the scope status from the v2 Excel (Green / Amber / Red / Validation / Out).

## Questions back to LogicEra

Send the generated `DISCOVERY.md` and any `INTEGRATION-PLAN.md` with open questions; we can update the kit (new version) instead of you patching around it.
