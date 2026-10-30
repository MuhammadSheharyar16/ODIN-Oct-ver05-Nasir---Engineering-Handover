# ODIN Oct ver05.4 Nasir — Release notes for engineering

**Version:** 0.5.4 · tag `odin-oct-ver05.4-nasir` · 30 Oct 2026
**Based on:** ver05.3 (`odin-oct-ver05.3-nasir`, handed over 28 Oct 2026)

ver05.4 makes ODIN work **inside a virtual desktop**. AEGI's security policy allows access to resources in its tenant only through **Azure Virtual Desktop (AVD)**, so ODIN is opened in a browser running inside an AVD session. There it went static: screens swapped without morphs, the globe and particles froze, and it was heavy on CPU. ver05.4 fixes this in the app. Screens, data, routing and voice are unchanged, and on a normal laptop with a GPU ODIN looks and behaves exactly as in ver05.3.

**Already built on ver05.3?** Apply `ver05.4-vm.patch` from the kit (section 5 has the prompt for your Claude). It touches 13 files and adds two modules and one panel.

| | What | Status |
|---|---|---|
| **New** | `?motion=on` / `VITE_ODIN_MOTION=on`: ODIN keeps animating when a remote desktop asks for reduced motion | Fixes the "static in the VM" issue |
| **New** | Automatic **lite mode** when WebGL is software-rendered or missing | Keeps ODIN smooth on AVD hosts without a GPU |
| **New** | `?perf=1` diagnostic panel | Checks any machine in seconds |
| Unchanged | Every screen and its look on hardware GPUs | As in ver05.3 (reference images unchanged) |

---

## 1. What was wrong

We reproduced it in Chrome and found two separate causes.

1. **Remote desktops ask for reduced motion.** RDP and AVD sessions switch Windows animation effects off by default, so Chrome and Edge report `prefers-reduced-motion: reduce`. ODIN honours that as an accessibility rule. It skips the morph transitions, freezes the globe and its particles, skips the intro and stops the room's drift. That is exactly the static behaviour seen in the VMs, and it happens even on a VM *with* a GPU.
2. **AVD hosts have no GPU.** WebGL is then rendered in software, or not available at all. ODIN's room, globe, spectrum and transitions are WebGL, so a GPU-less host either struggles (high CPU) or shows no 3D.

Nothing in ODIN needs a *physical* machine. A virtual GPU works the same as a physical one.

## 2. The settings

Each one can come from the URL (and is then **remembered in that browser**, so an AVD user sets it once) or from the build.

| Setting | Values | Default | Build variable |
|---|---|---|---|
| `motion` | `on` = animate even when the OS asks for reduced motion · `auto` = follow the OS | `auto` | `VITE_ODIN_MOTION` |
| `lite` | `auto` = lite when WebGL is software or missing · `on` · `off` | `auto` | `VITE_ODIN_LITE` |
| `perf` | `1` = show the diagnostic panel · `0` = hide it | `0` | — |

**For AEGI's AVD deployment, build with `VITE_ODIN_MOTION=on`.** Keep `lite` on `auto`.

## 3. What each part does

**Motion override (`src/lib/environment.ts`, `src/lib/motion.ts`)**
- `prefersReducedMotion()` (used in 17 files) now returns false when motion is forced on.
- The stylesheets' 24 `@media (prefers-reduced-motion: reduce)` rules are removed at runtime. Sheets that load later are caught too.
- `<html data-motion="on">` marks it. The one direct `matchMedia` check (`useCountUp` in `shared.tsx`) now goes through `prefersReducedMotion()`.

**GPU detection (`gpuInfo()`)**
- Reads the WebGL renderer (`WEBGL_debug_renderer_info`). Software is SwiftShader, WARP, llvmpipe or Microsoft Basic Render, or a context with a major performance caveat. None means no WebGL context at all.
- Marks `<html data-gpu="hardware|software|none">`.

**Lite mode (`isLite()`, on automatically for software or none)**
- Quality tier `low`: no bloom, vignette or SMAA.
- 3D canvas: 30 fps while something moves and 10 fps when calm, at about 0.8 million pixels (around 0.75× on a 1600 × 900 screen).
- The room's blur and depth-of-field pass is off (`backdrop.ts`).
- No live `backdrop-filter` blur and no grain (`global.css`, `html[data-lite]`). Panels keep their tint.
- Half the journey floor particles (220 per route).
- **No WebGL at all:** the room is drawn from the still plates (`.stage-static`, the exterior and interior webp). The intro still runs, and the cards, numbers, morphs, voice and 2D motion all keep working. There is no 3D globe in this case.

**Diagnostics (`src/ui/hud/PerfHud.tsx`, `?perf=1`)**
- Shows WebGL (hardware, software or none) and the renderer, the OS reduced-motion setting, whether ODIN motion is forced, lite mode, fps and pixel density, colour-coded.

## 4. Measured (Chrome, M5 Max, 1600 × 900, OS set to reduced motion)

| Case | Before (ver05.3) | ver05.4 |
|---|---|---|
| Remote desktop, GPU available | Static: no morphs, globe frozen | With `motion=on`: full motion, 60 fps |
| Software WebGL (no GPU) | Static, and heavy when animating (about 20 fps) | Lite on automatically: Home about 40 fps, V39 journey about 53 fps |
| No WebGL at all | 3D layer fails | Still room, everything else moving, no errors |
| Laptop with a GPU | 60 fps | 60 fps, unchanged (lite off) |

Software fps depends on the VM's CPU. AVD hosts with few vCPUs will be lower. For the full look inside AVD, use GPU session hosts (section 6).

## 5. Prompt for your Claude (copy and paste)

> Apply the ODIN ver05.4 virtual-desktop changes to our codebase. The reference is the ver05.4 handover (`odin-oct-ver05.4-nasir`). The diff against ver05.3 is `ver05.4-vm.patch` in the kit.
> 1. If our code is still close to ver05.3, try `git apply --3way ver05.4-vm.patch`. Otherwise add `src/lib/environment.ts`, `src/lib/environment.test.ts` and `src/ui/hud/PerfHud.tsx`, and make the edits in `motion.ts`, `main.tsx` (call `applyEnvironment()` before render), `store.ts`, `Stage.tsx`, `backdrop.ts`, `App.tsx`, `global.css`, `shared.tsx` and `FloorParticles.tsx` as in the patch.
> 2. Keep our data, backend, voice and Azure integration unchanged.
> 3. For AEGI's AVD deployment, set `VITE_ODIN_MOTION=on` in the build.
> 4. Test inside an AVD session: open ODIN with `?perf=1`. The panel should show ODIN motion "forced on"; lite on if WebGL is software; morphs between screens; the globe moving. Run the unit tests (133).

## 6. Deployment guidance for AVD

- **Minimum:** today's AVD hosts work with ver05.4 (`motion=on`, lite automatic), with a simpler but moving ODIN.
- **Full experience:** an AVD host pool on GPU VMs (Azure NV-series, for example NVadsA10 v5, which shares one GPU across several sessions). Enable the Group Policy settings:
  - "Use hardware graphics adapter for all Remote Desktop Services sessions";
  - the H.264/AVC graphics-mode policies.
  
  Check `chrome://gpu` in a session: WebGL should be "Hardware accelerated", and ODIN's `?perf=1` should show "hardware". This has cost implications for AEGI.
- **Windows animations:** turning on "Animation effects" in the session (Settings → Accessibility → Visual effects) also stops the reduced-motion request, but `motion=on` makes ODIN independent of it.

## 7. Kit and tests

- **Unit tests:** 133 pass, including 5 new ones for the settings (default follows the OS, `?motion=on` overrides and is remembered, `?motion=auto` switches back, `?lite` forces, unknown values are ignored).
- **Reference images:** unchanged from ver05.3. On a hardware GPU nothing renders differently.
- **The patch:** `ver05.4-vm.patch` in the kit is the change from ver05.3.
