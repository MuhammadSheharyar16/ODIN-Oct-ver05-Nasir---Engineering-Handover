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

**Used by**: S01 Intro load-in · V01 Executive Home · V02 Applications in Processing · V04 Outcome Distribution · V05 Processing Time Matrix · online · V06 Processing Time Matrix · centre visits · V07 Time Matrix · focus stage · V08 VAS Revenue · v1 · V09 Application Journey · v1 · V12 Centre Ranking by Time · V13 Stage Queue · online · V14 Stage Queue · centres · V15 Performance Comparison · V16 Top Countries, Nationalities & Centres · V17 Top Countries on the Globe · V18 Channels Notice · V20 Travel Purpose Mix · V21 Applicant Occupation Mix · V22 Applications (focus) · v1 · V23 Processing Time (focus) · V24 Not Available Yet · V26 Application Journey · v2 · V27 Application Outcomes · V28 VAS Revenue · v2 · V29 Applications · v2 · V30 Answer · V31 Top Countries, Nationalities & Centres · v2 · V32 VAS Revenue · v3 · V25 Didn’t Understand
