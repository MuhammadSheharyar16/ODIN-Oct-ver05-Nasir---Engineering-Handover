# ODIN stack vs engineering stack

ODIN ver03 was rebuilt and tested on **engineering's own version ranges** (supplied 16 Oct 2026). Tested means type check (`tsc -b`), production build, ESLint (engineering's plugin set) and every 3D screen rendered in Chrome, at both the **newest** versions those ranges resolve to and the **oldest** (exact lower bounds).

## Shared libraries: already in your app, no change

| Library | Your range | ODIN ver03 | Tested at |
|---|---|---|---|
| react / react-dom | ~19.2.0 | ~19.2.0 | 19.2.0 · 19.2.9 |
| three | ^0.180.0 | ^0.180.0 | 0.180.0 |
| @react-three/fiber | ^9.3.0 | ^9.3.0 | 9.3.0 · 9.8.x |
| @react-three/drei | ^10.7.0 | ^10.7.0 | 10.7.0 · 10.7.9 |
| xstate / @xstate/react | ^5.20.0 / ^6.0.0 | same | 5.20.0 · 5.33 / 6.0.0 · 6.1 |
| gsap | ^3.13.0 | ^3.13.0 | 3.13.0 · 3.15 |
| lucide-react | ^1.45.0 | ^1.45.0 | 1.45.0 · 1.58 |
| typescript | ^5.8.0 | ^5.8.0 | 5.8.2 · 5.9.3 |
| vite / @vitejs/plugin-react | ^7.1.0 / ^5.0.0 | same | 7.1.0 · 7.3 / 5.0.0 · 5.2 |
| vitest · @playwright/test | ^3.2.0 · ^1.55.0 | same | used by the port-kit tests |
| eslint + typescript-eslint + react-hooks | ^9.30 · ^8.35 · ^5.2 | same | ODIN source passes with 0 errors |

`three ^0.180.0` locks to 0.180.x (caret on 0.x). ODIN is pinned the same way, so 3D code is version-identical.

## Libraries ODIN adds (only when you port what needs them)

| Add | Version | Needed by | Skip if |
|---|---|---|---|
| `@react-three/postprocessing` + `postprocessing` | ^3.2.0 · ^6.39.5 | E07 glow/bloom (every screen's finish) | you accept the flatter look (`?fx=0` shows it) |
| `d3-geo` + `topojson-client` + `world-atlas` | ^3.1.1 · ^3.1.0 · ^2.0.2 | V17 Earth globe only (E04 earth) | you don't port V17 |
| `zustand` | ^5.0.15 | ODIN's shared state (stage focus, layout, captions, experience) | you move these small stores onto your xstate/React state (plan step) |
| `@fontsource-variable/inter` | ^5.3.0 | Inter typeface | you already load Inter |

Types for the above: `@types/d3-geo`, `@types/topojson-client`, `@types/topojson-specification` (dev).

## Creative-only tools (not for your app)

`sharp` (prepares the room imagery, `npm run assets`) and the capture scripts in `scripts/` are used to produce this kit. You don't need them.
