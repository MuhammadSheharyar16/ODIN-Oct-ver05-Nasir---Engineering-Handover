# E03 · ODIN globe + speaking aura

**How it connects to your app.** Mount both inside the Stage (E00). Drive them with three plain objects: `presence.target` {x, y, r, form} (where the globe sits; form 0 = dissolved), `setAuraTarget(shape)` (what the spectrum wraps), and `odinAudio.level / speaking` (ODIN's output audio level 0–1).

**Libraries.** `three`, `@react-three/fiber`

**Source** (in `source/`, same paths as the reference app): `src/scene/globe/OdinGlobe.tsx`, `src/scene/globe/geometry.ts`, `src/scene/SpectrumAura.tsx`, `src/lib/aura.ts`, `src/odin/experience.ts`, `src/audio/odinAudio.ts`

**What it is.** ODIN's presence. The globe (particle sphere with energy arcs) lives at Home's centre and travels into each screen's core, or dissolves when a screen has no core. While ODIN speaks, a spectrum hugs the object being discussed.

**Globe.** Eases toward `presence.target` (x, y, radius in CSS px; `form` 1 = sphere, 0 = dissolved into particles). Energy follows ODIN's output level (rate 10/s). On screens with `presence: 'core'`, the globe sits in the element marked `data-presence="k"` with radius = k × its short side.

**Speaking aura.** Driven only by ODIN's *output* audio (never the user's mic). Two forms that morph into each other (rate 4/s):
- **wrap** — concentric vibrating rings, radial spikes and a waveform around one object's silhouette (rounded-box SDF: circle, capsule or card; the corner radius comes from the target's CSS `border-radius`).
- **floor** — a perspective ring on the floor around a whole composition (the journey, the row of period jars) with a voice curtain rising behind it. Used when ODIN speaks about everything on screen at once.
Fades in/out with speech (rate 4/s); level smoothing 14/s.

**Fallback.** Static globe image/video loop in the Home centre; aura as a CSS glow ring (`box-shadow`) pulsing on the focus card while speaking.

**Used by**: S01 Intro load-in · S04 Morph transition · S05 Speaking + summary · V01 Executive Home · V02 Applications in Processing · V04 Outcome Distribution · V05 Processing Time Matrix · online · V09 Application Journey · V12 Centre Ranking by Time · V15 Performance Comparison · V16 Top Countries, Nationalities & Centres · V17 Top Countries on the Globe · V22 Applications (focus) · v1 · V23 Processing Time (focus) · V24 Not Available Yet · V27 Application Outcomes · V29 Applications · v2 · V30 Answer · V32 VAS Revenue · V25 Didn’t Understand
