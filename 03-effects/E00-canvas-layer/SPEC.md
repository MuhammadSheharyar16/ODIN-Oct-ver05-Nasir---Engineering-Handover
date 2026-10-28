# E00 · 3D canvas layer (Stage)

**How it connects to your app.** Mount `<Stage />` once, full screen, behind your UI (`position: fixed; inset: 0; z-index: 0`). Your HTML UI sits above it with a transparent background. Nothing else in your app changes.

**Libraries.** `three`, `@react-three/fiber`, `@react-three/drei`

**Source** (in `source/`, same paths as the reference app): `src/scene/Stage.tsx`, `src/state/store.ts`, `src/lib/layout.ts`, `src/lib/motion.ts`

**What it is.** The single persistent WebGL canvas behind every ODIN screen. Every 3D effect (E02, E03, E04, E06, E07) renders inside it, so there is exactly one GPU surface for the whole app.

**Layer order (back → front)**
1. Environment room (E06) · 2. ODIN speaking aura (E03) · 3. ODIN globe (E03) · 4. 3D objects (E04) · 5. Transition particles (E02) · 6. Post-FX (E07). Then the HTML UI above the canvas.

**Renderer settings.** Camera FOV 30°, at the origin. `antialias: true`, `alpha: false`, `powerPreference: high-performance`, `toneMapping: NoToneMapping`, `outputColorSpace: SRGBColorSpace`. Background `#0b1424`.

**Adaptive quality.** drei `PerformanceMonitor`, bounds 45–58 fps, 4 flip-flops: device pixel ratio tier high 2 → medium 1.5 → low 1. At tier *low*, post-FX is off. Studio reflections: procedural `Environment` (256 px, rendered once) with five Lightformers; hemisphere + two directional lights.

**Screen ↔ 3D.** Objects are placed in CSS pixels: `lib/layout.ts` converts screen px to world units at a given depth, so 3D always lines up with the HTML layout.

**Fallback (no WebGL).** Hide the canvas; set `body` to the static room image (`07-assets/env/interior-*.webp`); the UI works unchanged. 3D objects (donut, Earth, orbs) are not shown, their HTML labels still are.

**Used by**: S01 Intro load-in · S04 Morph transition · S05 Speaking + summary · V01 Executive Home · V02 Applications in Processing · V04 Outcome Distribution · V05 Processing Time Matrix · online · V09 Application Journey · V12 Centre Ranking by Time · V15 Performance Comparison · V16 Top Countries, Nationalities & Centres · V17 Top Countries on the Globe · V22 Applications (focus) · v1 · V23 Processing Time (focus) · V24 Not Available Yet · V27 Application Outcomes · V29 Applications · v2 · V30 Answer · V32 VAS Revenue · V39 Online Visa Journey v4.5 · V40 Top 10 Countries v2 · V25 Didn’t Understand
