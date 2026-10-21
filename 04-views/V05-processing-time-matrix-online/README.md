# V05 · Processing Time Matrix · online

> End-to-end time in ODIN, six duration cards and the stage-wise strip.

| | |
|---|---|
| Type | Screen |
| Opens with | “How long does it take to process a visa?” |
| Business questions | BQ04, BQ07 |
| Feature | F11 · F12a |
| Scope status | **Green** · In October scope. |
| Template | `matrix` |
| Components | `timeMatrix` |
| Effects | [E00](../../03-effects/E00-canvas-layer/SPEC.md) · [E01](../../03-effects/E01-morph/SPEC.md) · [E02](../../03-effects/E02-particles/SPEC.md) · [E03](../../03-effects/E03-globe-aura/SPEC.md) · [E05](../../03-effects/E05-energy-streams/SPEC.md) · [E06](../../03-effects/E06-environment/SPEC.md) · [E07](../../03-effects/E07-post-fx/SPEC.md) · [E08](../../03-effects/E08-count-up/SPEC.md) · [E09](../../03-effects/E09-sound/SPEC.md) · [E11](../../03-effects/E11-composer/SPEC.md) |
| Preview (reference app) | `http://localhost:5173/?view=V05` |

**Notes.** Fixed 1920×1080 frame scaled to fit (wide). SLA shown as Not available (threshold not agreed).

## Captures

![wide.jpg](screens/wide.jpg)
![portrait.jpg](screens/portrait.jpg)
![phone.jpg](screens/phone.jpg)

## Files

`component/` holds this screen's own source (same paths as the reference app):

- `src/ui/scene/components/TimeMatrix.tsx`
- `src/ui/scene/components/TimeMatrixWide.tsx`
- `src/ui/scene/components/PlexusOrb.tsx`
- `src/ui/scene/components/matrix.css`
- `src/ui/home/EnergyStreams.tsx`
- `src/ui/scene/HeroGlass.tsx`
- `src/ui/scene/hero-glass.css`

**Shared** (port once, used by many screens): `src/ui/scene/components/shared.tsx`, `src/ui/scene/SceneIcon.tsx`, `src/ui/bridge.tsx`, `src/lib/format.ts`, `src/lib/homeLayout.ts`, plus the design-system CSS in `02-design-system/source`.

## Data contract

`spec.sample.json` is exactly what this screen renders (DEMO DATA). Types: `05-data-contracts/source/src/odin/types.ts` (`SceneAnswer`). Fields per component:

- `timeMatrix` · key `tm`: `scopeLabel`, `avg`, `avgDelta`, `median`, `medianDelta`, `p90`, `applications`, `hourly`, `fastest`, `longest`, `stages`, `tabs`, `sla`, `previewNote`

## Morph keys

Keep these `data-morph` keys so shared elements travel between screens (E01): `tm`

## Port it

See `06-port-kit/PORT-PROMPTS.md` → V05. Done = contract test + acceptance test (`ODIN_VIEWS=V05`) pass, motion reviewed.
