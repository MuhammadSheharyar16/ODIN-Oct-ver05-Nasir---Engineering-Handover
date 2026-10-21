# E10 · Intro load-in

**How it connects to your app.** Mount `<IntroDirector />` once. Tag elements with `data-intro="chrome | capsule | readout | hud"`. `?nointro` skips.

**Libraries.** `gsap`

**Source** (in `source/`, same paths as the reference app): `src/ui/IntroDirector.tsx`, `src/ui/intro.css`, `src/lib/intro.ts`

**What it is.** First appearance: light floods the room as the camera eases in, a beam rises from the floor ring, particles converge into ODIN, capsules materialise, energy draws on, figures count up, the HUD settles. Starts when the environment textures are ready.

| t (s) | Step | Duration · ease |
|---|---|---|
| 0 | Loader fades out | 0.7 · power2.inOut |
| 0 | Room reveal (dark & soft → as supplied) | 2.1 · power2.out |
| 0 | Camera ease-in | 2.8 · power3.out |
| 0.5 | Floor beam | 1.1 · power2.inOut |
| 0.85 | Globe forms | 1.9 · expo.out |
| 1.2 | Chrome (logo, date) from y −12 | 0.9 |
| 1.6 | Capsules from scale .8 + blur 12px, stagger 0.12 | 1.0 |
| 1.85 | Energy streams draw on | 1.5 · power2.out |
| 1.95 | Globe readout from scale .88 | 0.9 |
| 2.0 | Figures released (count-up) | — |
| 2.35 | HUD (summary, mic bar) from y +26, stagger 0.14 | 0.9 |

Default ease power3.out. Intro sound at start (E09). Reduced motion: skipped.

**Used by**: S01 Intro load-in · V01 Executive Home
