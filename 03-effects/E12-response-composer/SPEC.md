# E12 · Response composer (any phrasing → screen, depth, spotlight)

**How it connects to your app.** Your LLM turns the transcript into a `Query` (JSON, see `query.schema.json` and `LLM-PROMPT.md`). Port `plan()` and `respond()` as plain TypeScript (no UI, no dependencies) and call them between your NLU and your screen renderer. Picker / menu questions keep opening their catalogue screen directly. Screens only need `data-spot-key` on their items.

**Libraries.** none beyond React

**Source** (in `source/`, same paths as the reference app): `src/odin/composer.ts`, `src/odin/respond.ts`, `src/odin/phrasings.ts`, `src/odin/components.ts`, `src/odin/waiting.ts`, `src/odin/composer.test.ts`, `src/odin/respond.test.ts`, `src/ui/scene/components/Glance.tsx`, `src/ui/scene/components/glance.css`, `src/lib/glance.ts`, `src/ui/scene/SceneLayer.tsx`, `src/ui/bridge.tsx`, `docs/components.md`, `docs/waiting-spec.md`

**What it is.** The same question can be asked a hundred ways, and the CEO may want a number, the picture around it, or everything. The composer decides **which screen**, **how deep** and **what to light**, from a small structured `Query`. The LLM only classifies; it never picks layouts. So the same question always looks the same and the screen always shows what ODIN says.

```
voice → transcript → LLM (or understand()) → Query → plan() → ResponsePlan → respond() → SceneAnswer → screen
```

**Query** (what the LLM returns): `measure` (one of 18, or null), `filters` (country, centre, visaType), `cues` (show, breakdown, compare, where, more, less), `followUp` ("more" / "less" with no new subject), `entities` (for compare). `passthrough` is the prototype's link to its old rules (home, back, out-of-scope, unsupported, ageing queue, rankings by speed or approval, stage-specific time, globe, mix); in your app, `measure: null` means "hand this to your existing catalogue handling".

**Answer-first (ver05, agreed 20 Oct).** Show only what was asked. Single-number measures (`SINGLE`: total, in processing, entered today, approved, rejected, approval rate, closure rate, processing time, revenue) open the **answer view (V30)**; each follow-up adds; "full picture" opens the full page.

| Depth | When | What the CEO sees |
|---|---|---|
| glance (answer) | any single-number question ("how many were rejected?"), or "just the number", "quickly" | **V30**: the asked number inside ODIN's globe + two facts. "And approved?" / "what about…" / "also…" adds a card beside the globe (right, then left) by morph, up to **3**. Four or more → the full page that carries most of them |
| context (full page) | "full picture", "everything", "dashboard", or a question that is not one number (outcomes, top countries, journey) | The measure's screen, the asked item **spotlit**, ODIN's first sentence is the direct answer |
| explore | "break down", "by country", "tell me more" from the full page, "in detail", "where are…", compare | The deeper screen (journey, distribution, globe, breakdowns) |

**Already on screen → highlight only.** If the full page that is open already shows the asked item (same screen kind, same filters), ODIN keeps the screen (no morph, no new query), moves the spotlight and says only that item. Top countries: the asked breakdown glides to the centre (0.9 s FLIP), the other two step back to 0.75.

**Components.** Answers compose components **C01–C09** (one per single measure); full pages are C10–C18. `components.ts` / `docs/components.md` list each with what it shows and its data cost (queries).

**Waiting.** `waiting.ts` / `docs/waiting-spec.md`: spoken check-ins at 10/15/20/30/45/60 s (retry at 60 s); progressive loading (a loader per number until it arrives). Demo: `?latency=12`, `?latency=12&progressive`.

**Follow-ups are voice only.** No chips on screen. "Tell me more" / "more detail" goes one depth deeper on the same measure and filters; "less detail" / "just the number" goes one shallower; a filter alone ("and for India?") keeps the measure. `ResponsePlan.followUps` holds two spoken suggestions per measure ODIN may offer.

**Spotlight.** ODIN's speaking spectrum wraps only the spotlit card (its own shape: pill, card). `SceneAnswer.spot` names the asked item; screens mark items with `data-spot-key` (AppCore: total, processing, approved, rejected, closed, approval, closure · Board: hero, entered-today, decided-today, most-waiting, open-share · Galaxy / legend: segment keys · Podiums: res, nat, cen · Revenue v2: total, countries, centres, services, nationalities · Time matrix: core, stages · Periods: today, yesterday, last7, prev7, mtd). The scene writes one CSS rule: the asked item glows (drop-shadow in its accent, `--spot`) and breathes twice (2.4 s ease-in-out, from 1.1 s); siblings go to opacity 0.72 and saturate 0.75 over 0.6 s (ink stays AA). `:has()` guards it: if nothing matches, nothing dims. The galaxy locks onto the asked outcome instead of cycling. Reduced motion: no breathing.

**Parity.** `respond()` reads the asked number **from the screen's own component spec** (never from a separate query), for both the lead sentence and the glance. ODIN opens with the direct answer unless the screen already opens with it, and never repeats a sentence.

**Glance view (V30).** Template `glance`, presence `core`: ODIN's globe moves to the centre of the slot (`glanceOrb()` in `lib/glance.ts`, shared with the component); readout label 0.085 r, value 0.42 r, caption 0.07 r; facts as C · hero-glass capsules left and right (stacked under the globe on narrow screens). Readout rises in 0.9 s, facts 0.8 s staggered 0.12 s.

**Registry and acceptance.** `REGISTRY.md` (measure × depth → screen, generated from the reference app), `PHRASINGS.md` / `phrasings.json` (answer-first phrasings, 1/2/3/4-metric questions and follow-up scripts with the expected plan; for V30 rows the item column is the asked metric(s) joined by "+"). `06-port-kit/tests/odin.composer.test.ts` runs your classifier over every phrasing and checks screen, depth and spotlight.

**Fallback.** Without an LLM, port `understand()` (regex rules) as is: it passes every phrasing and follow-up script.

**Used by**: V30 Answer
