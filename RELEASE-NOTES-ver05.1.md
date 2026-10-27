# ODIN Oct ver05.1 Nasir — Release notes for engineering

**Version:** 0.5.1 · tag `odin-oct-ver05.1-nasir` · 26 Oct 2026
**Based on:** ver05 (`odin-oct-ver05-nasir`, handed over 21 Oct 2026)

ver05.1 is a refinement release, not a revamp. This page lists every change since ver05, grouped by screen. Open any screen with `http://localhost:5173/?view=<ID>`.

> **Journey maps are not in this release.** The application journey work (new journey designs and refinements) is still in progress with client feedback, and it comes to engineering in **ver05.2**. In ver05.1, **V09 Application Journey is unchanged from ver05**; the only difference is that the retired V26 jar variant has been removed (see section 1).

---

## 1. Screen set: cleaned up to the 17 Build 5 approved screens

The app now has exactly the **17 approved screens**: V01, V02, V04, V05, V09, V12, V15, V16, V17, V22, V23, V24, V25, V27, V29, V30, V32 (plus system states S01–S05).

The table shows where each removed screen's questions are now answered.

| Removed | Was | Questions now go to |
|---|---|---|
| V06 | Processing Time Matrix · centre visits | **V05**; the stage is highlighted |
| V07 | Time Matrix · focus stage (BQ08, BQ09, BQ10) | **V05**; the asked stage is highlighted |
| V08 | VAS Revenue · v1 | **V32 VAS Revenue** (BQ05, BQ27) |
| V28 | VAS Revenue · v2 | **V32** |
| V13 / V14 | Stage Queue · online / centres (BQ13) | **V24 Not Available Yet** |
| V18 | Channels notice (BQ21) | **V24**, worded for the question |
| V20 / V21 | Travel purpose / occupation mix (BQ19, BQ20) | **V24**, worded for the question |
| V26 | Application Journey · v2 (jars) | **V09** |
| V31 | Top Countries · v2 (skyline) | **V16** |

- **Removed with them:** their code, styles and assets (jar artwork, concept pages, journey-map orbs, old podium code, compare/facts panels), plus about 40 KB of dead CSS. The removal was checked pixel-for-pixel on desktop and phone, so the remaining screens did not change.
- **Kept in step:** the question catalogue, composer routes, component catalogue, phrasing table, design docs, audit sheet and handover kit all follow the 17 screens.
- **Revenue capsule follow-ups:** the follow-up items are now revenue → entered today → in processing, and the full page is V32.

## 2. V01 · Executive Home

- **Home sphere, classic look: silk streams replace the brush-stroke bands.**
  - **What changed:** the 14 travelling bands (large, jittered dots that read as brush strokes) are now about 28,000 fine, even particles on soft ribbons. The particles are denser at the centre and fade at the edges.
  - **Motion:** they glide slowly along their arcs, with positions computed in the shader. Each ribbon undulates gently, its ends fade in and out, and a few particles sparkle.
  - **Unchanged:** colours (blue and amber), speed, intro convergence and the reading lens behind the number.
  - **Code:** `buildStreams` (`src/scene/globe/geometry.ts`) and `streamShader` (`src/scene/globe/OdinGlobe.tsx`). The old `buildBands` is removed.
- **New home sphere option: grid.**
  - **The look:** no particle bands, a thin grid with light pulses about 3× slower and cooler blue, a clean bright rim, a faint inner sparkle and a slow iridescent sheen. The sphere spins slightly slower and the network nodes are softer.
  - **Default:** the classic sphere stays the default.
  - **How to switch:** `?sphere=grid`, the **O** key, or `setSphereStyle('grid')` (`src/lib/sphere.ts`). The switch eases over about 1 s.
- **Revenue-today capsule:** "AED" is a small, softer prefix and the amount keeps its full size.
  - **Desktop:** AED sits above the amount.
  - **Phone:** AED stays inline.
  - **Why:** the amount now fits on one line (before, "AED 628.4K" wrapped).
  - **Scope:** this applies to every currency KPI capsule (`KpiCapsule.tsx`, `home.css`).
- **Closure-rate capsule:** the rate now sits fully inside its donut ring.
  - **Ring:** larger (58 → 66 % of the capsule width), with a slimmer stroke (8 → 6).
  - **Value:** sized to the ring's inner circle (desktop 13.5cqw, phone 13cqh).

## 3. Spheres: less see-through, lighter metric lenses

This affects V02 (3D glass orb), V04 / V29 / V30 (Applications sphere), V05 / V23 (time-matrix sphere) and V32 (gold revenue core).

- **Opacity:** each sphere layer is **30 % less see-through**, using opacity = 1 − 0.7 × (1 − previous).
- **Metric readability:** text shadows and the dark lenses behind the numbers are **15 % lighter**.
- **Unchanged:** the outcome galaxy (V27) and the Home globe.

## 4. V15 · Performance Comparison (Today compared with earlier)

- **Jars:** front-view glass jars in ODIN's style. Each is a bell dome with curved shoulders, a shoulder highlight and a vertical specular streak, sitting on a front-view base.
- **Pedestal angle:** the 3D pedestal now takes a view angle: `Station.tilt` in `Journey3D.tsx`, set through `Plinth tilt` / `data-tilt`.
- **No bottom border:** there is no collar ring. The glass fades into the base, so the jar feels connected to it.
- **Stats capsule:** glossy glass, with the corner radius halved.
- **Phone and tablet:** compact jars with the main number.

## 5. V17 · Top Countries on the Globe

- **Land:** digital neon, translucent. A faint cyan fill with a scan shimmer, a fine twinkling dot grid and a glowing coastline replace the solid white continents.
- **Ocean:** translucent deep glass with a faint graticule, so the room shows through.
- **Arcs:** blue instead of gold. A cyan core with a white pulse and a blue glow sheath; motes run blue → white into the UAE, with blue origin pulses and a cyan UAE beacon. The dust and particle shell lose their gold too.
- **Bases 6–10:** front view (Plinth tilt 0.1), so the base's front wall shows.
- **Light bars removed:** the decorative bars above cards 6–10 are gone.
- **Waving flags:**
  - **The wave:** each card's flag waves slowly in the wind. It is cut into 32 strips with about 2.5 ripples across and a 2.4 s cycle, travelling outward from the pole side.
  - **Shading:** the pole side moves least, and strips lighten and darken as they catch the light.
  - **Reduced motion:** the wave stops.
  - **Code:** `WavingFlag` in `Showcase.tsx`, `.wflag` in `v1.css`.
- **Note:** engineering builds its own globe for this screen. Treat this as the **design reference**.

## 6. Screens with no change in ver05.1

These screens look and behave as in ver05, apart from the sphere opacity in section 3 where it applies:

- V05, V09, V12, V16, V22, V23, V24, V25, V27, V29, V30, V32
- system states S01–S05

## 7. Coming in ver05.2

- **Application journey maps:** the new journey designs and the client-feedback round. Until then, build V09 as in ver05.
