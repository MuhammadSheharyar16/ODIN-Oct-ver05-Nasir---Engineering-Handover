# E11 · Screen composer + bridge

**How it connects to your app.** Wrap ODIN screens in `<OdinBridgeProvider value={{ ask, layout }}>`: `ask(question)` routes follow-ups (chevrons, tabs, chips) to your Q&A; `layout = computeHomeLayout(innerWidth, innerHeight)`. Screens never import stores or mock data.

**Libraries.** none beyond React

**Source** (in `source/`, same paths as the reference app): `src/odin/compose.ts`, `src/ui/scene/SceneLayer.tsx`, `src/lib/homeLayout.ts`, `src/ui/bridge.tsx`, `src/odin/types.ts`

**What it is.** Places a screen's components for the current device. Each template defines slots per layout mode; any answer using those slots is laid out automatically. Slots missing on a device are dropped (ODIN's spoken answer still carries the information).

**Layout modes** (`computeHomeLayout`): `wide` (landscape desktop/TV, 1920 × 1080 reference frame), `portrait` (1080 × 1920 frame), `compact` (phones, ~430 px frame), `short` (landscape phones). Frames scale to the real viewport.

**Templates**: glance, focus, stage, journey, floor, jars, galaxy, revenue, appcore, matrix, board, outcomes, ringCards, notice. `floor`, `jars`, `galaxy`, `revenue`, `appcore`, `board` and `matrix` are full-viewport compositions on wide screens (fixed 1920 × 1080 frame scaled by `--k`).

**Screen contract.** A screen is `SceneAnswer` (see 05-data-contracts): title, subtitle, template, components (each a typed spec placed in a slot), focusKey, presence, spoken text and summary. The composer wraps each component in `[data-morph=<spec.key>]`, so spec keys are the morph keys.

**Used by**: V02 Applications in Processing · V04 Outcome Distribution · V05 Processing Time Matrix · online · V06 Processing Time Matrix · centre visits · V07 Time Matrix · focus stage · V08 VAS Revenue · v1 · V09 Application Journey · v1 · V12 Centre Ranking by Time · V13 Stage Queue · online · V14 Stage Queue · centres · V15 Performance Comparison · V16 Top Countries, Nationalities & Centres · V17 Top Countries on the Globe · V18 Channels Notice · V20 Travel Purpose Mix · V21 Applicant Occupation Mix · V22 Applications (focus) · v1 · V23 Processing Time (focus) · V24 Not Available Yet · V26 Application Journey · v2 · V27 Application Outcomes · V28 VAS Revenue · v2 · V29 Applications · v2 · V30 Answer · V31 Top Countries, Nationalities & Centres · v2 · V32 VAS Revenue · v3 · V25 Didn’t Understand
