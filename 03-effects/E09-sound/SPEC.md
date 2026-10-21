# E09 · Sound

**How it connects to your app.** Call `playIntro()` when ODIN first appears and `playMorph()` at each transition. `odinAudio` exposes ODIN's output `level` (0–1) and `speaking` for E03/E05; replace the simulated speech preview with your TTS output analyser.

**Libraries.** none beyond React

**Source** (in `source/`, same paths as the reference app): `src/audio/morphSfx.ts`, `src/audio/odinAudio.ts`

**What it is.** Interface sound under ODIN's voice (Web Audio, so timing is exact).

| Sound | When | Gain |
|---|---|---|
| intro-pulse.m4a | ODIN first appears (Home load-in) | 0.7 |
| morph-bass.m4a / morph-woosh.m4a | every morph, one picked at random | 0.6 / 0.55 |

Browsers block audio until the first gesture: if the page loads silent, the intro pulse plays on the first click/key **within 6 s** of load, otherwise it is skipped. `?sfx=0` or the **M** key mutes.

**ODIN's voice level.** `odinAudio.level` feeds the globe energy, aura and energy streams; in the prototype it comes from a simulated speech preview. Connect it to an `AnalyserNode` on your real TTS output.

**Used by**: S01 Intro load-in · S04 Morph transition · S05 Speaking + summary · V02 Applications in Processing · V04 Outcome Distribution · V05 Processing Time Matrix · online · V06 Processing Time Matrix · centre visits · V07 Time Matrix · focus stage · V08 VAS Revenue · v1 · V09 Application Journey · v1 · V12 Centre Ranking by Time · V13 Stage Queue · online · V14 Stage Queue · centres · V15 Performance Comparison · V16 Top Countries, Nationalities & Centres · V17 Top Countries on the Globe · V18 Channels Notice · V20 Travel Purpose Mix · V21 Applicant Occupation Mix · V22 Applications (focus) · v1 · V23 Processing Time (focus) · V24 Not Available Yet · V26 Application Journey · v2 · V27 Application Outcomes · V28 VAS Revenue · v2 · V29 Applications · v2 · V30 Answer · V31 Top Countries, Nationalities & Centres · v2 · V32 VAS Revenue · v3 · V25 Didn’t Understand
