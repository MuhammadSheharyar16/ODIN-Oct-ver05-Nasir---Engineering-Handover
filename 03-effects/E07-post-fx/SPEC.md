# E07 · Post-FX glow

**How it connects to your app.** Mount `<PostFX />` last inside the Stage (E00), in its own `<Suspense>`. `?fx=0` turns it off.

**Libraries.** `@react-three/postprocessing`, `postprocessing`

**Source** (in `source/`, same paths as the reference app): `src/scene/PostFX.tsx`

**What it is.** The cinematic finish: selective bloom on light sources only, soft vignette, fine film grain, SMAA edges.

| Pass | Settings |
|---|---|
| Bloom | mipmapBlur, luminanceThreshold 0.985, smoothing 0.04, intensity 0.32, radius 0.6 (above the daylight plate, so cards and text stay crisp) |
| Vignette | offset 0.36, darkness 0.32 |
| Noise | opacity 0.045, soft-light, premultiplied |
| SMAA | default |

`multisampling={0}`: no MSAA / half-float targets (they render black on some GPUs). Off at quality tier *low*.

**Colour accuracy.** Custom GLSL authors colours as display (sRGB) values; the composer renders linear and encodes at the end, which would wash them out. PostFX.tsx patches plain non-additive `ShaderMaterial`s to clamp and decode their output to linear first. Keep this patch if you keep our shaders.

**Used by**: S01 Intro load-in · V01 Executive Home · V02 Applications in Processing · V04 Outcome Distribution · V05 Processing Time Matrix · online · V09 Application Journey · V12 Centre Ranking by Time · V15 Performance Comparison · V16 Top Countries, Nationalities & Centres · V17 Top Countries on the Globe · V22 Applications (focus) · v1 · V23 Processing Time (focus) · V24 Not Available Yet · V27 Application Outcomes · V29 Applications · v2 · V30 Answer · V32 VAS Revenue · V25 Didn’t Understand
