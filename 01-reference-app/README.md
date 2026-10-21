# ODIN — Executive Intelligence (AEGI / EIX, VAS)

Creative prototype of ODIN, the voice-first CEO experience for AEGI/EIX on VAS data, by LogicEra.
ODIN answers business questions by morphing the environment into purpose-built 3D views; its
presence is the voice-reactive spectrum that wraps whatever it is talking about.

**Current version:** ODIN Oct ver03 Nasir (`odin-oct-ver03-nasir`) — see [CHANGELOG.md](CHANGELOG.md).

## Run

```bash
npm install
npm run dev        # http://localhost:5173  (add ?nointro to skip the load-in)
npm run build      # production build in dist/
npm run lint       # ESLint (engineering's rule set)
```

Review flags: `?view=V05` opens any screen by catalogue ID (`src/odin/views.ts`), `?q=<question>` asks a
question, `?nointro` skips the load-in, `?still` freezes the simulated live feed, `?fx=0` turns post-FX off,
`?sfx=0` mutes, `?cards=b` shows the previous tile cards.

Click the mic bar to type a question, or open the question list (October scope / all business
questions) and pick one. Voice is simulated until the ElevenLabs feed is wired; data is mock and
labelled “Demo data · not live”.

## Stack

Matched to engineering's stack: React 19.2 · three 0.180 · @react-three/fiber 9 / drei 10 · GSAP 3 · xstate 5 ·
Vite 7 · TypeScript 5.8 · ESLint 9 · vitest · @playwright/test. ODIN adds @react-three/postprocessing, zustand and
d3-geo + world-atlas (Earth only).

## Structure

- `src/odin/` — data model (`vas.ts`), question catalogue (`questions.ts`), NLU, answer builders, scene composer, morph director
- `src/scene/` — WebGL: environment, ODIN globe, spectrum aura, journey pedestals, plinths, Earth, transition particles
- `src/ui/` — Home, scene components (journey, time matrix, jars, podiums, geo, ring), HUD (mic bar, question picker, summary).
  Screens read follow-ups and layout only from `src/ui/bridge.tsx` (`OdinBridgeProvider`), so each can be lifted on its own.
- `scripts/handover/` — builds the engineering handover kit: `capture.mjs` (captures, samples, videos) then
  `assemble.mjs` (catalogue, effect SPECs, data contracts, port kit, golden frames via the kit's acceptance test)

## Versioning

Each review build is an annotated git tag and a GitHub release named `ODIN <Month> ver<NN> <Owner>`
(tag: lower-case, hyphenated, e.g. `odin-oct-ver01-nasir`). A matching full-project zip is kept in
`ODIN + Custom Report/Dev versions/`.
