# E01 · Morph transitions (six choreographies)

**How it connects to your app.** Tag morphable elements with `data-morph="<stable key>"` (and `data-accent="#hex"`); wrap each screen in `[data-scene="<id>"]` (Home: `[data-layer="home"]`). When your screen changes, keep the old screen mounted for the morph, then run the director's `go(next)` sequence (or port it: it only reads the DOM).

**Libraries.** `gsap`

**Source** (in `source/`, same paths as the reference app): `src/odin/director.ts`, `src/odin/experience.ts`, `src/lib/motion.ts`

**What it is.** Any screen → any screen. Elements whose `data-morph` key exists on both screens travel and reshape from old place to new; the rest exit into depth while the new screen assembles. A particle stream (E02) flies from old shapes, through ODIN, into new ones, with a morph sound (E09).

**Sequence (ms from the question)**
| t | Step |
|---|---|
| 0 | Phase `thinking` (mic bar echoes the question). Speech stops; running tweens are killed. |
| 560 | Measure outgoing `[data-morph]` rects. Mount next screen (both on screen). Phase `morphing`. Room blur on (E06). |
| +1 frame | Measure incoming rects. Fire particles + sound. Globe moves to its new presence (E03). |
| +0 → 550 | Outgoing: `opacity 0` + choreography *out* transform, `power2.in`, 550 ms, staggered 40 ms by the choreography's order. |
| +100 → 1100 | Shared keys: from old rect (translate + scaleX/scaleY, opacity 0.4) to new, `expo.inOut`, 1000 ms. The old copy fades in 250 ms. |
| +420 → | Incoming: from choreography *in* transform (opacity 0) to rest, 950 ms, `expo.out` (or the choreography's ease), staggered 70 ms. |
| end | Old screen unmounts. Phase `speaking`; aura wraps the focus element; ODIN speaks. |

All transforms use `transformPerspective: 1300`. Reduced motion: 80 ms think, 10 ms tweens, no particles, no sound.

**Choreographies** (picked at random, never the same twice in a row). c = screen centre, r = element centre.
| # | Name | Out | In | Order | Particles |
|---|---|---|---|---|---|
| 1 | depth | z −280, scale .86, rotX 7°, blur 12px | z −340, rotX −14°, y +26, scale .9, blur 14px | — | stream |
| 2 | vortex | rotate ±14°, scale .4, 60% toward c, blur 10px | rotate ∓18°, scale .35, 70% toward c, blur 10px; ease back.out(1.25) | outside-in | vortex |
| 3 | sweep | x −160, skewX 10°, blur 8px | x +220, skewX −12°, blur 10px | left → right | wave |
| 4 | rise | y −90, z −140, rotX 22°, blur 10px | y +140, z −120, rotX −32°, scale .94, blur 8px | bottom → top | rise |
| 5 | scatter | 35% away from c, z +160, scale 1.18, blur 16px | from 25% beyond c, z −420, scale .6, blur 12px | — | scatter |
| 6 | helix | rotY ±70°, z −220, blur 8px | rotY ∓75°, z −220, blur 8px; ease expo.out | left → right | helix |

**Connection points the director reads**: `data-scene`, `data-layer="home"`, `data-morph`, `data-accent`, `data-focus` (aura target), `data-aura`, `data-surface` (corner radius for the aura), `data-presence` (globe sits in this element). See each screen's `morphKeys` in `manifest.json`.

**If you keep your own transition system**: reproduce the table above with your animation library; the timings, eases and stagger orders are the spec.

**Used by**: S04 Morph transition · V02 Applications in Processing · V04 Outcome Distribution · V05 Processing Time Matrix · online · V09 Application Journey · V12 Centre Ranking by Time · V15 Performance Comparison · V16 Top Countries, Nationalities & Centres · V17 Top Countries on the Globe · V22 Applications (focus) · v1 · V23 Processing Time (focus) · V24 Not Available Yet · V27 Application Outcomes · V29 Applications · v2 · V30 Answer · V32 VAS Revenue · V25 Didn’t Understand
