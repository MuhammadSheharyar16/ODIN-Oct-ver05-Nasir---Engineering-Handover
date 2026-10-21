# ODIN design system

Premium glass on a daylight interior, with readability first: white ink at WCAG AA or better on every surface, checked on phone and desktop.

## Tokens (`source/src/styles/tokens.css`)

| Group | Tokens |
|---|---|
| Ink | `--ink-strong #fff` · `--ink .92` · `--ink-soft .74` · `--ink-faint .52` (decorative only, never body text) · text shadow `--ink-shadow` |
| Glass | `--glass-fill` · `--glass-tint` · `--glass-edge` · blur 22 reference px |
| Semantic | `--up #4ee0a8` · `--down #ff8a7a` · `--neutral` · `--unavailable` |
| Type | Inter Variable · label tracking 0.14em · tabular numerals for every figure |
| Motion | `--ease-out cubic-bezier(.16,1,.3,1)` · `--ease-in-out cubic-bezier(.65,0,.35,1)` · 200 / 650 / 1100 ms (1 ms with reduced motion) |
| Frame | `--px` = one pixel of the 1920 × 1080 reference frame, scaled to the viewport |

## Colour by meaning

| Meaning | Colour |
|---|---|
| VAS / applications | blue `#4f9cff` |
| ICP stages | violet `#9b7bff` |
| Biometrics | amber `#f5ac45` |
| Approved / OK | green `#2fd69a` |
| Rejected | red `#f2566a` |
| Rates / time | cyan `#4fd6ff` |

One hue per object, used for its rim, glow, chart and particles. Never colour alone: every state also has a label or icon.

## Card system: one glass family, three roles

| | Role | Where | Recipe |
|---|---|---|---|
| **A · Capsule** ![](card-A-capsule.jpg) | ODIN's live pulse | Home (V01), Applications in Processing (V02) | `home.css` `.capsule*` + `KpiCapsule.tsx`: clear tinted glass stadium, thin neon tube rim, curved sheen, soft halo; accent mixed 36% toward `#c9d6ee` |
| **B · Tile** ![](card-B-tile.jpg) | Analysis and support detail | Every other answer card | `cards.css`: navy glass `linear-gradient(rgba(40,62,118,.5), rgba(14,26,62,.64))`, blur 20px, 1px accent edge, icon badge, chevron follow-up |
| **C · Hero glass** ![](card-C-hero-glass.jpg) | Headline cards that carry a chart | Outcome Distribution (V04), Time Matrix (V05–V07), Journey Map (V11), Centre journey (V10) | `hero-glass.css` + `HeroGlass.tsx`: capsule glass in card shape, rim glint travelling every 11 s, dark optical centre for AA ink, luminous line/bar chart with "now" lit |

Rules: a page's headline cards use **C**, supporting cards **B**, live-pulse boards **A**. Charts never contradict the card's delta. The online visa journey (V09) keeps its own light-glass cards.

## Scope language (part of the design)

"Validation required" (revenue) · "Not available" + reason (SLA, uncaptured events) · "Design preview" (biometric split) · deltas "vs yesterday" · "Longest stage", never "bottleneck" · no causal claims · DEMO DATA label on every screen until live.

## Accessibility

- Contrast target: white ink on glass ≥ 4.5:1 (body) and ≥ 3:1 (large figures); glass gets a darker optical centre where the backdrop is bright sky.
- Every follow-up control is a real `<button>` with an `aria-label` that says the question it asks; `:focus-visible` outline 2px white.
- `prefers-reduced-motion`: morphs become fades, particles and comet animations stop, count-ups show final values.
- The ODIN summary strip is `aria-live="polite"`, so screen readers hear what ODIN says.

`source/` holds the CSS and small shared components exactly as in the reference app.
