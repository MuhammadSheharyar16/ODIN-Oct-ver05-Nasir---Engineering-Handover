# E04 · 3D objects on HTML placeholders

**How it connects to your app.** Your screen renders an empty, sized `<div>` where the object belongs and registers it: `registerProxy(key, { el, kind, data })` (or the `useProxy` hook in shared.tsx). The matching 3D component inside the Stage reads that element's live rect and opacity every frame. Your layout stays yours.

**Libraries.** `three`, `@react-three/fiber`, `@react-three/drei`, `d3-geo`, `topojson-client`, `world-atlas`

**Source** (in `source/`, same paths as the reference app): `src/odin/fx.ts`, `src/ui/scene/components/shared.tsx`, `src/scene/Donut3D.tsx`, `src/scene/earth/Earth3D.tsx`, `src/scene/orb/GlassOrb3D.tsx`, `src/scene/plinth/Plinths3D.tsx`, `src/scene/journey/Journey3D.tsx`, `src/scene/journey/objects.tsx`, `src/scene/journey/CrystalIcon.tsx`

**What it is.** Real 3D objects that follow an HTML placeholder. Because they read the placeholder's rect and opacity every frame, the HTML morph (E01) drives the 3D too: move/fade the box and the object follows.

| kind | Object | Used by |
|---|---|---|
| donut | 3D outcomes donut (segments extrude, clean mode for V04) | V04 |
| pedestal | Journey pedestals with crystal icons | V09 (tablet / phone) |
| plinths | Glass plinths under the period jars and the globe's top-10 cards | V15, V17 |
| earth | 3D Earth with country arcs (d3-geo + world-atlas) | V17 |
| orb | Glass sphere for "in processing" | V02 |

Material colour rule: write uniforms through the live material ref; non-additive ShaderMaterials are decoded to linear before post-FX (see E07) so authored colours render exactly.

**Fallback.** Labels and values are HTML and render without WebGL; the empty placeholder can show a static image of the object instead (crop it from the screen captures).

**Used by**: V02 Applications in Processing · V04 Outcome Distribution · V09 Application Journey · V15 Performance Comparison · V17 Top Countries on the Globe
