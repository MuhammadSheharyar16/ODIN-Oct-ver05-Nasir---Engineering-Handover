# ODIN Oct ver05.2 Nasir — Release notes for engineering

**Version:** 0.5.2 · tag `odin-oct-ver05.2-nasir` · 28 Oct 2026
**Based on:** ver05.1 (`odin-oct-ver05.1-nasir`, handed over 26 Oct 2026)

ver05.2 brings the **application journey** that ver05.1 held back, now approved by Anupam, and a second layout for the **Top 10 Countries** screen. Everything else is unchanged from ver05.1. Open any screen with `http://localhost:5173/?view=<ID>`.

**In this release:**

| | Screen | Status |
|---|---|---|
| **New** | **V39 · Online Visa Journey v4.5**: the application journey | Approved by Anupam (27–28 Oct). Build this one. |
| **New** | **V40 · Top 10 Countries v2** | Approved layout for the countries-on-the-globe screen |
| Changed | V09 · Application Journey (environment only) | Flat floor and stronger voice spectrum (section 3) |
| Unchanged | V01, V02, V04, V05, V12, V15, V16, V17, V22–V25, V27, V29, V30, V32, S01–S05 | As in ver05.1 |

> **Not in this release.** The other journey design options explored between 23 and 28 Oct (v3, v4, v4.1–v4.4, including the Home video) were stepping stones to v4.5. They are not shipped and need no work. The **centre (in-office) customer journey** is in design and comes in a later version.

---

## 1. V39 · Online Visa Journey v4.5 (new; the approved application journey)

Open it with `?view=V39` or "Show the online visa journey v4.5". On wide screens it is the journey to build. Tablets and phones fall back to the vertical journey, as V09 does. The plain question "Show the online visa journey" still opens V09, so the existing routing keeps working until V39 replaces it in your app.

**Layout (1920 × 1080 reference frame)**

- **Left:** a stage card for the stage the tour is at, with its number, its change, a short description, previous and next stage, the route being played and a progress bar. Its numbers follow the tour.
- **Centre:** the journey on the floor. There are 11 equal-size stage units (Figma "Journey v4.2 assets ver03", node 137:595) on silver plinths: Home, VAS review, Submitted to ICP, ICP review, Biometric requested, Appointment scheduled, Biometrics completed, ICP final review, ICP decision, Approved and Rejected. The colours are lighter shades of the phase colours (Home blue, VAS teal, ICP purple, biometric orange, approved green, rejected red).
- **Bottom:** a strip of all 12 stages (Home is split into Submitted and Paid), each with its live number and change. The current stage is lit.
- **Ask ODIN bar:** stays at the bottom, 26 px lower than on other screens so there is a gap above it (`html[data-journey-cinema]`, `cinema.css`).
- **Backdrop:** opens with the depth-of-field backdrop (exterior lens blur). The **F** key toggles it.

**Motion**

- **The tour:** it plays the three routes in turn: biometric → approved, direct → approved, biometric → rejected. It stops about 2.6 s at each stage (`useTour.ts`).
- **The particle floor** (`FloorParticles.tsx`, two canvases):
  - each route is a stream of soft, white-cored particles, desaturated towards white, with white arrows every 74 reference px;
  - stream width is uniform;
  - a light beam runs only on the route into the highlighted stage, at 1.8 s per pass;
  - a soft comet trail follows the application, and a pool of light and dust sits on the stage it reaches.
- **The highlighted stage** (`FloorRings.tsx`):
  - the unit lifts slightly and glows in its phase colour;
  - on the floor, a faint line of light stays at its base, and rings of light ripple outward from it and fade, like beats (three in flight, about 2.6 s each, thinner as they spread);
  - the back half is drawn under the unit and the front half over it, so the stage is never covered;
  - the rings fade out at the stage being left and fade in at the next. They never travel.
- **One application icon** travels the whole journey. It rests in front of the stage the tour is at, follows each route, and ends with ✓ (approved) or ✕ (rejected). On the VAS → ICP leg the story's folder carries the file, so the icon steps aside.
- **Home:** a pill shows the Submitted and Paid numbers. A soft box lights the step the applicant is on (submit, pay or wait).
- **Story animations** play on each stage with a short caption (`StoryFx.tsx`, `story.css`), for example typing the form, AED coins, the reviewer's magnifier, the file flying to ICP, the fingerprint scan, the stamp and the plane.
- **Voice:** ODIN speaks only the summary (the CEO's time). The stages play silently.
- **Reduced motion:** the application jumps between stages instead of travelling, the rings show one still ripple, and the camera cuts instead of gliding.

**Detail view (new)**

- **How it opens:** the **Detail view** button under the stage card, or by voice: "tell me more", "show the details", "more detail on …". It closes with "back to the journey", "hide the details" or "close details". The phrases are in `lib/journeyDetail.ts` (`detailCommand`); the director handles them only while V39 is on screen.
- **What it shows:** the tour keeps running. The stage the tour is at grows into a single hero on the left, at 2–3× (about 440 px wide at 1080p), with its story animation still playing. Everything else fades out: the other units, the floor particles, labels, numbers and the icon.
- **As the tour moves:** the camera glides (1.2 s) to the next stage while the old one fades and the new one appears, so it reads as one unit morphing from stage to stage. Stops last 4.8 s in this view so the dashboard can be read.
- **The dashboard** sits on the right and follows the stage: key figures, a breakdown, the last 7 days and stage insights. The stage strip stays at the bottom.
- **Data:** the breakdowns and insights are **demo values**, marked "Demo breakdown" on screen (`DETAIL42` in `journeyCinema/v42.ts`). The real KPIs per stage come from the data team (**Jafery and Layth**), based on Aisling's data-requirements sheet. Keep the panel's structure and swap the fields when they are confirmed.

**Files**

| What | Where |
|---|---|
| Screen | `src/ui/scene/components/journeyCinema/JourneyCinema42.tsx`, routed from `Journey.tsx` when `spec.cinema === 'v45'` |
| Layout, stage copy, routes, chips, demo detail data | `journeyCinema/v42.ts` (unit positions `UNITS42`, routes `EDGES42`, stages `STAGES42`) |
| Shared data and types | `journeyCinema/data.ts`, `v4.ts`, `v41.ts` (anchors and tones the v4.5 layout builds on) |
| Particle floor / floor ripples | `FloorParticles.tsx`, `FloorRings.tsx` |
| Tour / story beats | `useTour.ts`, `StoryFx.tsx` |
| Styles | `journey42.css` (card, strip, detail panel, hero), `cinema.css` (unit base styles, bar gap), `story.css` |
| Detail state and phrases | `src/lib/journeyDetail.ts` |
| Unit images (WebP) | `public/journey-v42/` |
| Intent | `{ type: 'journey', channel: 'online', style: 'cinema45' }` → `JourneySpec.cinema: 'v45'` |

## 2. V40 · Top 10 Countries v2 (new)

Open it with `?view=V40` or "Show top 10 countries v2".

- **Why:** Anupam found V17's zig-zag numbering hard to scan. V40 reads in one order: **1–5 down the left, 6–10 down the right**, with the Earth in the centre, larger.
- **Cards:** the same cards and waving flags as V17. All ten are the **same width**. No. 1 keeps its gold edge but is not enlarged.
- **Phone and portrait:** the same list layout as V17.
- **Code:** `GeoSpec.layout: 'sides'` (intent `{ type: 'geo', style: 'sides' }`). The layout branch is in `Showcase.tsx` (`.geo.is-sides`, `.geo__col` in `v1.css`).
- **Note:** as with V17, engineering builds its own globe. V40 is the design reference for the layout around it. V17 is unchanged.

## 3. Journey environment: flat floor and ODIN's voice (V09 and V39)

- **Flat floor:** ODIN's floor circle is hidden on journey pages, so the journey stands on a flat floor.
  - **New plates** in `public/env`: `interior-flat-{1600,2560,3840,blur}.webp` (the room without the circle) and `floor-ring-{1600,2560,3840}.webp` (the circle on its own).
  - **Layers:** the interior now uses the flat plates, and a new `RingLayer` (`EnvironmentLayers.tsx`) draws the circle over them with the same scale, camera push and parallax. Everywhere else the room looks exactly as before.
  - **Behaviour:** the director sets `floorRing.hidden` (`src/lib/floorRing.ts`) in `applyEnv` for every `env: 'floor'` screen. On a journey the circle flattens and sinks into the floor (gone about 0.7 s into the transition), and it rises back on other screens. With reduced motion it switches instantly.
- **Voice spectrum on journeys:** when ODIN speaks on a journey, the floor spectrum's voice lines are as strong as on Home, in the same line style.
  - The shader's `uFlat` uniform (`SpectrumAura.tsx`) eases to 1 while the floor is flat: ring gain goes from 0.62 to 1.15, the glow is +40 %, the white lines go from 0.22 to 0.28, and the overall gain is full.
  - The curtain is taller: `data-rise` is 0.09, up from 0.015 (`JourneyFloor.tsx` and V39).
  - The lines show only while ODIN speaks.
- **`.app` now clips overflow** (`global.css`), because the V39 detail-view camera scales the journey past the viewport.

## 4. Kit and tests

- **Question catalogue:** two new entries, `J-ONLINE-V45` and `GEO-V2`. The views catalogue has V39 and V40.
- **Tests:** 125 unit tests pass. They cover the v4.5 and Top 10 v2 phrasings and the detail-view phrases.
- **Release notes:** the kit's `00-START-HERE` links to this file.

## 5. Coming next

- **Centre (in-office) customer journey:** a 3D or 2.5D view inside a visa centre, following the work-visa flow from Anupam (SMS and booking → security → reception → cashier → document check → biometrics → interview → ICP decision). It is in design now.
- **V39 detail KPIs:** these follow once the data team confirms the fields.
