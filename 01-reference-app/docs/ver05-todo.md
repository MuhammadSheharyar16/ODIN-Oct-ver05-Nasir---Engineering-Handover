# ODIN Oct ver05 · to-do

Source: 20 Oct standup + design discussions (parts 1–3) + decisions in chat on 20 Oct.
Baseline: **ver04** (tag `odin-oct-ver04-nasir`, zip in Dev versions) = the build reviewed on 20 Oct.
Legend: `[x]` done and checked in the browser · `[ ]` to do · *decision* = agreed in chat

## Decisions
- *decision* **Answer-first.** Show only what was asked; each follow-up adds a component; "full picture" opens the full page. Highlight only when the item is already on screen (no new query).
- *decision* Application Outcomes **donut (v1) removed**; the galaxy is the outcomes screen.
- *decision* For 30 Oct: data from JSON (no Fabric/DXC); realistic waiting experience; no "Validation required" tags.
- *decision* ODIN is the spectrum; spheres are content but one family.
- *decision* Plain CEO language everywhere.

## A · Answer-first composer and components
- [x] A1 Component catalogue: every card, sphere and metric gets an ID (`C…`), with what it shows and its data cost (queries) → `src/odin/components.ts`, `docs/components.md` (C01–C18)
- [x] A2 Answer layout: renders 1, 2 or 3 asked components (hero + supporting), growing by morph as more are asked → V30; cards right then left with Home energy lines; row under the globe on tablet/phone
- [x] A3 Composer rules: single metric → its component; "and X" adds X (up to 3); "full picture / all / details" → full page; already on screen → highlight only (4+ → the full page carrying most of them)
- [x] A4 Outcome components: approved, rejected, in processing, closed, closure rate, approval rate (closed count is the closure-rate caption)
- [x] A5 Answer in the centre: the asked metric is the hero/sphere readout (closure rate shows closure rate, not total); long values scale to stay inside the globe
- [x] A6 "States" group in the question list: each screen at 1 metric, 2 metrics, 3 metrics and full page → "Answer-first states" (Outcomes, Processing, Rates, Processing time, Revenue)
- [x] A7 Tests and phrasing table updated for answer-first (117 tests)

## B · Content and scope
- [x] B1 Remove "Validation required" everywhere; revenue shows full ring, AED once, ▲/▼ delta
- [x] B2 Home capsules read as today: "Revenue today"; AED shown once; closure percentage larger
- [x] B3 Applications in Processing: "Decided today" → "Closed today"; no "since launch"; stage row retitled; re-layout
- [x] B4 Remove Application Outcomes v1 (donut); outcome questions open the galaxy
- [x] B5 Plain-language pass on every title and label (P90, median, fastest stage, …)
- [x] B6 No truncated text on any screen (e.g. "Standard visa f…")

## C · Spotlight and focus
- [x] C1 Top countries/nationalities/centres: asked card moves to the centre with glow, the other two shrink ~25%, cards morph to swap (v1 Leaderboards and v2 Skyline; in place, no new screen)
- [x] C2 ODIN spectrum wraps only the focused card (keeps the card's shape: pill, glass card)
- [x] C3 Same focus rule on other multi-metric screens (revenue breakdowns, processing capsules, time matrix): asked item lit, siblings calm, spectrum on it; ODIN says only that item

## D · Design language
- [x] D1 Audit sheet: every screen side by side → `docs/audit/index.html` (30 screens + answer states; `scripts/dev-audit.mjs`)
- [x] D2 Sphere family rules (one family, variations by meaning) written and applied → `docs/design-language.md` §2
- [x] D3 Card family matches Home's capsules (fix screens that look like another product): centre-visit journey cards → dark glass; compare rows → hero glass
- [x] D4 Re-layout cluttered screens (Outcome Distribution, oversized boxes): V04 capsule-size cards + one-row legend; V19 duel (V12/V20/V21 post-October: next)

## E · Motion
- [x] E1 Journey v2: faster application icon; ODIN doesn't speak every step (flight 1.25 → 0.82 s, stop 1.9 → 1.05 s; speaks only at approved / rejected)
- [x] E2 Morph transitions smoothed (no pauses): thinking 560 → 420 ms; ODIN speaks as the screen settles, not after the morph

## F · Waiting experience ("ODIN is working")
- [x] F1 Thinking state with spoken check-ins at 10 / 15 / 20 / 30 / 45 / 60 s and "let me try again" after 60 s (mic bar shows each line)
- [x] F2 Progressive loading: each component shows a loader until its number arrives (numbers arrive in turn; summary waits; ODIN speaks once in)
- [x] F3 Latency setting for the demo (`?latency=`) so Anupam can choose the target time (`?latency=12`, `?latency=12&progressive`)
- [x] F4 Spec for Mahmood: phrases and timings → `docs/waiting-spec.md`

## G · Release
- [x] G1 Build, lint, tests; check every screen at desktop, tablet and phone (120 tests; 30 screens at 1600×900, 1024×1366, 390×844; compare names fixed on phone)
- [x] G2 ver05: changelog, tag, zip in Dev versions, GitHub release
- [x] G3 Locked handover kit for Noman (ver05): `Dev versions/ODIN Oct ver05 Nasir - Engineering Handover` (30 goldens refreshed; composer acceptance 81 phrasings + 7 scripts pass)
