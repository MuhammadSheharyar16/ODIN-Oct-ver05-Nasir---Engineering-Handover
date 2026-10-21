# ODIN transitions (answer-first)

Source of truth: `src/odin/transitions.ts` (dev hook `__odinTransitions()`). The director picks one with `transitionFor(prev, next)` and plays it in `answerTransition()` (`src/odin/director.ts`). Review any one with `?transition=T03`, or set `window.__odinTransition = 'T03'`.

The answer sphere is the hinge: cards are born from it, full pages unfold from it, and everything gathers back into it. A number that stays on screen never recounts (`Count memo`).

| ID | Name | When | Length | Particles |
|---|---|---|---|---|
| T01 | Grow | Answer → answer with one more metric ("and approved?") | 1.4 s | style 1 |
| T02 | Regroup | Answer → answer with fewer metrics ("less detail") | 1.2 s | style 1 |
| T03 | Expand | Answer → its full page ("full picture"), or any screen opened from an answer | 1.6 s | style 4 |
| T04 | Gather | A full page (or Home) → an answer (a single-number question) | 1.7 s | style 1 |
| T05 | Swap | Answer → answer with a new lead metric ("what is the closure rate?") | 1.4 s | style 5 |
| T06 | Spotlight | The asked item is already on the open screen (no new screen) | 0.9 s | style 0 |

## ODIN's spectrum during transitions
- On a new screen, ODIN's spectrum **appears in place**: around the sphere, the asked card or the composition. It never travels in from where it was on the previous screen. The director measures the target at the new screen's final layout and snaps the spectrum there the moment ODIN starts speaking. A hidden spectrum always snaps.
- It glides only while it is already showing, on the same screen: from one metric to the next as ODIN speaks (answer beats) and in-place spotlights (T06).
- An asked item inside a sphere (its number) gets the spectrum around the sphere, never hidden inside it.

## Storyboards

### T01 · Grow
Answer → answer with one more metric ("and approved?").

- 0.00 The sphere stays, breathes once (scale 0.97 → 1).
- 0.00 Cards that stay glide to their new place (0.9 s, expo in-out).
- 0.15 Light streams out of the sphere towards the new card.
- 0.30 The new card is born from the sphere: it travels out along its energy line, growing from 12% with a blur that clears (1.1 s, expo out).
- 0.60 Its energy line draws in.

### T02 · Regroup
Answer → answer with fewer metrics ("less detail").

- 0.00 The removed card is drawn back into the sphere (0.7 s, power2 in), shrinking to 15%.
- 0.10 Light streams from the card into the sphere.
- 0.20 Cards that stay glide to their new place (0.9 s).
- 0.70 The sphere pulses as it absorbs the card (scale 1.04 → 1).

### T03 · Expand
Answer → its full page ("full picture"), or any screen opened from an answer.

- 0.00 The answer sphere swells and dissolves (scale 1.5, blur 14 px, 0.75 s).
- 0.00 Its cards drift outwards and fade (0.6 s).
- 0.15 Light bursts from the sphere to every part of the full page.
- 0.35 The full page unfolds from the sphere's centre: each part grows from 30% and travels out to its place, nearest first (1.05 s, expo out, 0.06 s apart).

### T04 · Gather
A full page (or Home) → an answer (a single-number question).

- 0.00 Everything on screen is pulled towards the centre and vanishes into a point (0.7 s, power2 in), outer parts last.
- 0.10 Light streams from every part into the centre.
- 0.45 The answer sphere forms from that point (scale 0.3 → 1, back out, 1.0 s).
- 0.75 The number rises into the sphere.
- 0.90 Cards are born from the sphere (as T01).

### T05 · Swap
Answer → answer with a new lead metric ("what is the closure rate?").

- 0.00 The old number rolls up and blurs out (0.45 s).
- 0.10 The sphere contracts and springs back (scale 0.86 → 1, elastic, 1.0 s) while light swirls around it.
- 0.35 The new number rolls up from below (0.8 s, expo out).
- 0.30 New cards are born from the sphere; cards no longer asked return into it.

### T06 · Spotlight
The asked item is already on the open screen (no new screen).

- 0.00 The screen stays. The asked item glows; its neighbours calm (opacity 0.72).
- 0.00 On Top countries the asked panel glides to the centre (FLIP, 0.9 s) and the others step back to 75%.
- 0.95 ODIN's spectrum moves to the asked item.

## Screen morphs (any other screen → screen)
| ID | Name | What happens |
|---|---|---|
| M01 | Depth | Old screen recedes into depth with blur; the new one comes forward from depth. |
| M02 | Vortex | Old parts spiral into the centre; new parts spiral out. |
| M03 | Sweep | Old parts sweep left with a skew; new parts sweep in from the right. |
| M04 | Rise | Old parts rise and tilt away; new parts rise from below. |
| M05 | Scatter | Old parts scatter towards the viewer; new parts gather from far away. |
| M06 | Helix | Old parts turn away like a helix; new parts turn in. |

M01–M06 rotate so two in a row never look the same. Each pairs a DOM exit and entrance with a particle path through ODIN.
