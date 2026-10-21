# E13 · Answer-state transitions (T01–T06) and screen morph IDs (M01–M06)

**How it connects to your app.** Call `transitionFor(prev, next)` when the scene changes; play the returned ID (T01–T05) with your animation layer, or your screen morph when it returns undefined. T06 is the in-place spotlight (same screen, new `spot`). Every animated element carries `data-morph` (answer cards: `ans:<measure>`); the sphere is `[data-answer-sphere]`.

**Libraries.** `E01`, `E12`

**Source** (in `source/`, same paths as the reference app): `src/odin/transitions.ts`, `src/odin/director.ts`, `src/ui/scene/components/Glance.tsx`, `src/ui/scene/components/glance.css`, `src/ui/scene/components/shared.tsx`, `docs/transitions.md`

**What it is.** Each change between answer states has its own named transition, so the CEO always sees *why* the screen changed: a card is born from the sphere when he adds a metric, the full page unfolds from the sphere for "full picture", and everything gathers back into it for a new single-number question.

| ID | Name | When |
|---|---|---|
| T01 | Grow | answer → answer with one more metric |
| T02 | Regroup | answer → answer with fewer metrics |
| T03 | Expand | answer → full page |
| T04 | Gather | full page / Home → answer |
| T05 | Swap | answer → answer, new lead metric |
| T06 | Spotlight | same screen, new spotlight (no new screen) |
| M01–M06 | Depth, Vortex, Sweep, Rise, Scatter, Helix | any other screen → screen |

**Rules.** The answer sphere is the hinge (born from / unfold from / gather into its centre). A metric that stays on screen keeps its number (no recount) and glides to its new place (0.9 s, expo in-out). New parts are born at 12% (cards) or 30% (full pages) with a 12 px blur that clears (1.05–1.1 s, expo out), nearest first. Light bursts follow the same direction (fx styles 1, 4, 5). Components' own CSS entrances are switched off while a transition runs. ODIN starts speaking at 62% of the timeline. Reduced motion: no transitions (instant change).

**Storyboards and timings.** `docs/transitions.md` (generated from `transitions.ts`). Review any one with `?transition=T03`.

**Used by**: —
