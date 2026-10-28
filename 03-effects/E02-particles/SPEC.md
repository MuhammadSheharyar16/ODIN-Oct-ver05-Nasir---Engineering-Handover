# E02 · Transition particles

**How it connects to your app.** Call `burst(fromRects, toRects, via, style)` from `odin/fx.ts` at the start of a transition (rects in CSS px with an accent colour). Mount `<TransitionParticles />` inside the Stage (E00).

**Libraries.** `three`, `@react-three/fiber`

**Source** (in `source/`, same paths as the reference app): `src/scene/TransitionParticles.tsx`, `src/odin/fx.ts`, `src/lib/layout.ts`

**What it is.** 4,200 GPU particles sampled on the outline and body of the outgoing components stream along curves through ODIN and settle onto the incoming components, then fade as the real UI resolves. One progress uniform drives everything on the GPU.

**Timing.** Burst duration 1.35 s. Each particle: delay up to 35% of the duration (style-specific below), life 65% of the duration, ease in-out cubic. Size 1.6–4.2 px × DPR, swelling ×2.4 mid-flight. Colour = the source/target element's `data-accent`. Additive blending.

**Styles** (paired with the morph choreography)
| Style | Path |
|---|---|
| 0 stream | Quadratic Bézier from → ODIN → to, with a small mid-flight swirl (18–58 px). |
| 1 vortex | Spiral around ODIN: radius pulled in by 75% mid-flight, 4.5–6.5 rad of extra rotation, half clockwise. |
| 2 wave | Straight path with a travelling sine front (60–130 px), delayed left → right. |
| 3 rise | Lift like embers (160–420 px up mid-flight) with a horizontal flutter, bottom-first. |
| 4 scatter | Burst outward from each old shape (220–600 px), Bézier back onto the new shapes. |
| 5 helix | Twin strands braiding from old to new (36–66 px amplitude). |

**Fallback.** Skip particles entirely; the morph (E01) still reads well without them. Always skipped with reduced motion.

**Used by**: S04 Morph transition · V02 Applications in Processing · V04 Outcome Distribution · V05 Processing Time Matrix · online · V09 Application Journey · V12 Centre Ranking by Time · V15 Performance Comparison · V16 Top Countries, Nationalities & Centres · V17 Top Countries on the Globe · V22 Applications (focus) · v1 · V23 Processing Time (focus) · V24 Not Available Yet · V27 Application Outcomes · V29 Applications · v2 · V30 Answer · V32 VAS Revenue · V39 Online Visa Journey v4.5 · V40 Top 10 Countries v2 · V25 Didn’t Understand
