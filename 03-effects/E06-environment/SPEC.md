# E06 · Environment: room, backdrop blur (none / depth of field / full), camera push

**How it connects to your app.** Mount inside the Stage (E00). The room is sharp by default. Blur is a function: `setBackdropBlur('dof' | 'full' | 'none' | null)` from `src/lib/backdrop.ts`, or declare `backdrop` on a screen (SceneAnswer.backdrop). Set `envView.target` for the camera push (`floorView()` for the online journey).

**Libraries.** `three`, `@react-three/fiber`, `@react-three/drei`

**Source** (in `source/`, same paths as the reference app): `src/scene/EnvironmentLayers.tsx`, `src/lib/backdrop.ts`, `src/scene/CameraRig.tsx`, `src/lib/envFit.ts`, `src/lib/intro.ts`

**What it is.** The daylight ODIN interior as two real depth layers: exterior waterfront plate (depth 15) behind, interior arch with true alpha (depth 10) in front. Pixels as supplied, no regrade. Cover-fitted with 7% overscan for parallax; artwork aspect 7600 × 4652. Sky and water shimmer drift; skyline stays put. Variant by screen pixels: 1600 / 2560 / 3840 px WebP (+ pre-blurred copies).

**Backdrop blur (decided 21 Oct).** Default: the room stays **sharp and at Home exposure** behind every screen. Two blur functions are available when a screen needs one (`src/lib/backdrop.ts`):

| Mode | Call | What it does |
|---|---|---|
| none (default) | `setBackdropBlur('none')` | Sharp room |
| dof · depth of field | `setBackdropBlur('dof')` | Interior sharp; exterior (skyline, water, sky) gets a light lens blur: 12 taps, radius 0.0016 UV (≈3 px at 1920) |
| full · background blur | `setBackdropBlur('full')` | The previous style: interior and exterior both blurred (exterior 0.85, interior 0.45 towards the pre-blurred plates) |

`setBackdropBlur(null)` hands control back to the screen; a screen can declare its own mode with `SceneAnswer.backdrop` (the director applies it on open). Changes ease at rate 6/s (≈0.4 s). Keyboard (review): **F** toggles depth of field, **G** toggles the full blur. URL: `?blur=dof`, `?blur=1`. Dimming is separate and off by default (`?dim=1`: exterior dim 0.78 / saturation 0.82, interior 0.72 / 0.85, eased with screen focus at 3.2/s).

**Camera.** Slow drift parallax (rate 1.6/s). Online journey (V09, wide): push onto the floor so the bottom ~61% of the artwork fills the screen (`FLOOR_CY 0.696`), panned so the journey is centred.

**Fallback (recommended).** CSS: two stacked `<img>` layers; depth of field = `filter: blur(3px)` on the exterior only; full = `blur()` on both at the values above, transitioned ~400 ms.

**Used by**: S01 Intro load-in · V01 Executive Home · V02 Applications in Processing · V04 Outcome Distribution · V05 Processing Time Matrix · online · V09 Application Journey · V12 Centre Ranking by Time · V15 Performance Comparison · V16 Top Countries, Nationalities & Centres · V17 Top Countries on the Globe · V22 Applications (focus) · v1 · V23 Processing Time (focus) · V24 Not Available Yet · V27 Application Outcomes · V29 Applications · v2 · V30 Answer · V32 VAS Revenue · V25 Didn’t Understand
