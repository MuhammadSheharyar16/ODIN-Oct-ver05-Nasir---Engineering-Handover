# ODIN Oct ver05.3 Nasir — Release notes for engineering

**Version:** 0.5.3 · tag `odin-oct-ver05.3-nasir` · 29 Oct 2026
**Based on:** ver05.2 (`odin-oct-ver05.2-nasir`, handed over 28 Oct 2026)

ver05.3 is a **performance release**. The screens, data, routing, question handling and voice API are the same as in ver05.2. What changed is how much work the browser does to draw them: less CPU and GPU, and a steady 60 fps on 120 Hz screens (ProMotion and many monitors). The V39 journey went from about **37 fps to 60 fps**, and its CPU load roughly **halved**.

**If you've already built on ver05.2** (data connectors, backend, voice agent, Azure services): **don't replace your app with this build.** Apply the changes in section 3 to your code. They're all in the drawing and animation layer: about 25 files, one new module and one image. Section 5 has a ready-to-paste prompt for Claude, and section 4 the one rule that touches your voice integration.

**In this release:**

| | Screen | Status |
|---|---|---|
| Changed (performance only) | All screens, most of all **V39 journey** and its **detail view**, Home, V30, V17 and V40 | Look the same; less CPU and GPU |
| Unchanged | Screens, data, figures, voice, routing, question catalogue | As in ver05.2 |

> **Not in this release.** As in ver05.2, the other journey design options (v3, v4, v4.1–v4.4, including the Home video) and the slideshow are not shipped. The **centre (in-office) customer journey** is still in design. A further optimisation, drawing the V39 floor particles on the GPU in one batch, is planned for a later version.

---

## 1. What was wrong

We measured the ver05.2 production build on a MacBook Pro M5 Max, in Chrome at 1728 × 1117 at 2× (3456 × 2234 device pixels), switching off one suspect at a time.

| Cause | Where | Why it was expensive |
|---|---|---|
| **No frame-rate cap** | Everything | 19 animation loops and the 3D canvas each ran at the screen's refresh rate: **120 fps** on ProMotion and 120 Hz screens, twice the work for no visible gain |
| **3D canvas redrawn every frame** | All screens | The room, spectrum and post-effects re-rendered every frame at 2× (about 7.7 million pixels), even when nothing in them moved |
| **Animated film grain** | All screens | The post-FX `Noise` pass changed every pixel every frame, so the canvas could never rest and every frosted-glass panel above it had to re-blur every frame |
| **Journey floor** | V39 | About **6,600 sprite draws per frame** (11 routes × 620 particles plus dust) on full-screen retina canvases. The cost was the number of draws, not the pixels |
| **Hidden layers still working** | Every screen except Home | Home's energy streams kept rewriting 48 SVG paths a frame, about 45 hidden CSS animations kept looping, and the startup loader kept animating after it faded, so the compositor kept redrawing the screen |
| **Live blur over moving content** | V39 | The 11 stage number pills blurred the moving particle floor every frame; several blurs used 18–20 px radii |
| **Quality auto-drop** | All screens | It only lowered quality below 45 fps, so a fast machine never benefited, and on a slower one it flip-flopped |

## 2. Measured results

**How:** Chrome (headless, Metal GPU) on an M5 Max, MacBook Pro 16" size at 2×. CPU is the total of all Chrome processes for the page (browser, renderer, GPU), sampled after the screen settles and ODIN has finished speaking. Each figure is the middle of three runs, alternating ver05.2 and ver05.3. Headless Chrome runs at 60 Hz, so the 120 Hz saving (P1) isn't included. On a 120 Hz screen the real saving is larger.

| Screen | ver05.2 | ver05.3 | Change |
|---|---|---|---|
| **V39 journey** | ~206 % CPU, ~37 fps | **~95 %**, 60 fps | **About −54 %**, smooth |
| **V39 detail view** | High; the peak while the camera glides between stages | Lower; the floor no longer draws behind the hero (see note) | Lower |
| **Home** | ~53 % | ~54 % at 60 Hz | Same at 60 Hz; on 120 Hz screens the cap halves the frames drawn |
| **V40 Top 10 Countries v2** | ~337 % | ~212 % | **About −37 %** |

**Note on the detail view:** on the MacBook at 120 Hz, Activity Monitor showed Chrome's GPU process falling from about 144 % to about 97 % and its renderer from about 69 % to about 42 %. That was before the final fixes (the floor pausing behind the hero, the hidden Home layers stopping, the loader removed), which reduce it further.

**Visual check:** before and after screenshots of V39 at 1728 × 1117 at 2× match: the room, stages, streams, floor ripples, card, strip and grain. The particle streams use fewer, slightly brighter particles, so the density looks the same. The kit goldens are regenerated for ver05.3 (section 6).

## 3. The changes (apply these to your app)

They're listed in order. Each one stands alone, but **P1** must come first, because the others use it.

### P1 · One shared 60 fps animation clock (new)

**File:** `src/lib/ticker.ts`, new, with tests in `src/lib/ticker.test.ts`.

- **One** `requestAnimationFrame` loop calls every subscriber at most **60 times a second** (it skips a frame when less than about 15.5 ms has passed). It stops when nothing is subscribed or the tab is hidden.
- `onTick((now, dt) => …)` returns an unsubscribe function.
- `requestFrame(cb)` and `cancelFrame(id)` are drop-in replacements for `requestAnimationFrame` and `cancelAnimationFrame` in self-rescheduling loops.

**Moved onto it:**
- `FloorParticles`, `FloorRings`, `FloorBeam`
- `EnergyStreams`, `MicBar`, `InsightStrip`
- `PlexusOrb`, `AppCore`, `RevenueCore`, `OutcomeGalaxy`
- `floorJourney.ts`, `processingFlow.ts`

One-shot count-ups (`NumberRoll`, `shared.tsx`), the director's frame waits and the audio scheduling stay on `requestAnimationFrame`. Motion is time-based (`dt`), so speeds don't change.

### P2 · 3D canvas renders on demand

**File:** `src/scene/Stage.tsx`.

- The `<Canvas>` uses `frameloop="never"`, and a `Driver` component calls R3F's `advance()` from the ticker.
- **Full rate (60 fps)** while something moves:
  - ODIN speaking (`odinAudio.speaking`, or `odinAudio.level` > 0.002);
  - the globe on screen (`presence.followHome`, or `presence.target.form` > 0.02);
  - a transition (`fx.version` changed, for its duration plus 1.5 s);
  - a scene or store change (+3.5 s);
  - the pointer moving the parallax (+2.5 s);
  - the intro;
  - the room camera easing (`envView` not settled).
- **When calm: every third tick (20 fps).** Only the room's slow breathing drift and the water shimmer move then, too slowly to tell 20 fps from 60. It lets the browser reuse the blurs above the canvas.
- **Pixel budget (P6 in the plan):** the canvas pixel density is `min(tier DPR, √(4,000,000 / (CSS width × CSS height)), devicePixelRatio)`. That's 2× on a 1440 × 900 laptop, about 1.45× on a MacBook Pro 16", and about 1× on a 1920 × 1080 screen at 2×. The room plates are photographs and all text is HTML, so nothing looks softer.
- drei's `PerformanceMonitor` is removed. Tiers stay as they were (`?tier=`), and `?fx=0` still turns post-effects off.

### P3 · Static film grain

**Files:** `src/scene/PostFX.tsx`, `src/App.tsx`, `src/styles/global.css`, `public/fx/grain.png` (new, a 256 px grey noise tile).

- The `Noise` pass is removed from the `EffectComposer`. `Bloom` (now `resolutionScale={0.5}`), `Vignette` and `SMAA` stay.
- A `<div class="stage-grain">` directly after `<Stage />` draws the grain: a tiled PNG at 128 px, `mix-blend-mode: soft-light` and `opacity: .045`, the same strength and blend as before, but not moving.

### P4 · V39 journey floor

**Files:** `journeyCinema/FloorParticles.tsx`, `FloorRings.tsx`, `JourneyCinema42.tsx`.

- **Particle floor:**
  - The canvas is drawn at **1× pixel density** (soft glows) and at **30 fps** (every second tick). The flow moves about 1 px a frame, so it reads the same.
  - **440 particles per route** instead of 620, with particle alpha × 1.25 so the density looks the same.
  - It **stops drawing while the detail view's stage hero is shown** (`paused={hero}`), since it's hidden then.
- **Floor rings:** 1.25× pixel density. Only the ring's own area is cleared each frame, not the full screen. The loop stops once the rings have faded and restarts when the highlighted stage changes.

### P5 · Hidden layers stop working

**Files:** `HomeComposition.tsx`, `EnergyStreams.tsx`, `global.css`, `IntroDirector.tsx`.

- `EnergyStreams` takes `active`. Home passes `active={visible}`, so the stream loop stops when Home is off screen.
- The Home layer gets class `is-off` while hidden, and `.is-off, .is-off * { animation-play-state: paused !important; }` pauses its capsule float, halo, dust and comet animations.
- The intro loader is set to `display: none` when its fade ends. Before, it was only made invisible and kept animating.

### P6 · Cheaper glass

**Files:** `journey42.css`, `hud.css`.

- The V39 stage number pills (`.j42__pill`) have **no live blur**: their tint goes from .55 to .64 instead. They sit on the moving particle floor, so they were re-blurred every frame.
- Live blurs above 14 px go down to **14 px**: the Ask ODIN bar and HUD (18 px), and the journey card and detail panel (18–20 px).

## 4. Integration rule for the real voice (important)

The 3D canvas renders at full rate while ODIN speaks only because it reads **`odinAudio.speaking`** and **`odinAudio.level`** (`src/audio/odinAudio.ts`). The simulated preview sets them today.

**When you connect the real voice** (Azure Speech, ElevenLabs or another TTS):
- set `odinAudio.speaking = true` when playback starts and `false` when it ends;
- keep `odinAudio.level` (0–1) and `odinAudio.bins` filled from your audio analyser while it plays.

If they aren't set, the canvas stays at its calm 20 fps while ODIN talks, and the spectrum will look choppy.

## 5. Prompt for your Claude (copy and paste)

> Apply the ODIN ver05.3 performance changes to our codebase. The reference is the ver05.3 handover (`01-reference-app` in the kit, or the `odin-oct-ver05.3-nasir` tag). The diff against ver05.2 is in the kit as `ver05.3-performance.patch`.
> 1. If our code is still close to ver05.2, try `git apply --3way ver05.3-performance.patch`. Otherwise apply the changes by hand in this order, following `RELEASE-NOTES-ver05.3.md` section 3: P1 (add `src/lib/ticker.ts` and its test, move the listed loops onto `onTick` or `requestFrame`), P2 (`Stage.tsx`: `frameloop="never"`, the `Driver`, the pixel budget, remove `PerformanceMonitor`), P3 (static grain), P4 (journey floor), P5 (hidden layers), P6 (glass).
> 2. Keep our data, backend, voice and Azure integration unchanged. Make sure our real TTS sets `odinAudio.speaking`, `odinAudio.level` and `odinAudio.bins` while ODIN speaks (section 4).
> 3. Run the unit tests and the kit's acceptance test (`06-port-kit`) against the ver05.3 goldens. Then check V39 (journey and detail view), Home, V30 and V40 in Chrome and Safari: 60 fps steady (DevTools → Rendering → Frame rendering stats), and CPU lower than before in Activity Monitor or Task Manager.

## 6. Kit and tests

- **Tests:** 128 unit tests pass, including the new ticker tests (60 fps cap on a 120 Hz clock, the loop stops with no subscribers, `requestFrame` runs once and can be cancelled).
- **Goldens:** the kit's acceptance goldens are regenerated from this build. They differ from ver05.2 only in the details above (static grain, the lighter V39 floor, the pills without blur).
- **The patch:** `ver05.3-performance.patch` in the kit is the change from ver05.2 to ver05.3 as one file.
- **Release notes:** the kit's `00-START-HERE` links to this file and to the ver05.2 notes.

## 7. Choosing the machine that runs ODIN

ODIN is drawn by the **browser on the machine connected to the screen**, not by the server.
- **Recommended:** host ODIN on a small VM with no GPU (2 vCPU, 4–8 GB RAM, or a static web host). Drive the screen from a local PC with a modern built-in GPU, such as an Intel Core Ultra or AMD Ryzen 7 mini PC, or a Mac mini.
- **If the browser itself runs on a VM:** it must be a **GPU VM** (for example the Azure NV-series visualisation sizes; check current sizes and regions). Without a GPU the browser draws the 3D scene in software, and ODIN won't run smoothly however fast the CPU or however large the RAM.

## 8. Coming next

- The **V39 floor particles on the GPU** (one instanced draw instead of thousands of 2D draws), which removes most of the journey's remaining CPU load.
- A **lite mode** chosen automatically when the browser reports software rendering.
- The **centre (in-office) customer journey** (`docs/centre-journey-plan.md` on main).
