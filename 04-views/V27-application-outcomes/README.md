# V27 · Application Outcomes

> Outcomes as a spiral galaxy in a dark glass portal (arms sized by share), each metric on a glossy glass card glowing in its colour; ODIN spotlights one outcome at a time.

| | |
|---|---|
| Type | Screen |
| Opens with | “How many visas have been approved?” |
| Business questions | BQ02, BQ03 |
| Feature | F06 |
| Scope status | **Green** · In October scope. |
| Template | `galaxy` |
| Components | `donut` |
| 3D objects (E04) | donut |
| Effects | [E00](../../03-effects/E00-canvas-layer/SPEC.md) · [E01](../../03-effects/E01-morph/SPEC.md) · [E02](../../03-effects/E02-particles/SPEC.md) · [E03](../../03-effects/E03-globe-aura/SPEC.md) · [E06](../../03-effects/E06-environment/SPEC.md) · [E07](../../03-effects/E07-post-fx/SPEC.md) · [E08](../../03-effects/E08-count-up/SPEC.md) · [E09](../../03-effects/E09-sound/SPEC.md) · [E11](../../03-effects/E11-composer/SPEC.md) |
| Preview (reference app) | `http://localhost:5173/?view=V27` |

**Notes.** v2 of V03. Wide screens; phones and portrait use the v1 layout.

## Captures

![wide.jpg](screens/wide.jpg)
![portrait.jpg](screens/portrait.jpg)
![phone.jpg](screens/phone.jpg)

## Files

`component/` holds this screen's own source (same paths as the reference app):

- `src/ui/scene/components/Donut.tsx`
- `src/ui/scene/components/donutGeometry.ts`
- `src/ui/scene/components/OutcomeGalaxy.tsx`
- `src/ui/scene/components/galaxy.css`
- `src/ui/scene/HeroGlass.tsx`
- `src/ui/scene/hero-glass.css`
- `src/ui/scene/components/OutcomeBoard.tsx`
- `src/ui/scene/components/outboard.css`
- `src/ui/scene/components/AppCore.tsx`
- `src/ui/scene/components/appcore.css`

**Shared** (port once, used by many screens): `src/ui/scene/components/shared.tsx`, `src/ui/scene/SceneIcon.tsx`, `src/ui/bridge.tsx`, `src/lib/format.ts`, `src/lib/homeLayout.ts`, plus the design-system CSS in `02-design-system/source`.

## Data contract

`spec.sample.json` is exactly what this screen renders (DEMO DATA). Types: `05-data-contracts/source/src/odin/types.ts` (`SceneAnswer`). Fields per component:

- `donut` · key `donut`: `total`, `totalLabel`, `basis`, `variant`, `closure`, `segments`

## Morph keys

Keep these `data-morph` keys so shared elements travel between screens (E01): `donut`

## Port it

See `06-port-kit/PORT-PROMPTS.md` → V27. Done = contract test + acceptance test (`ODIN_VIEWS=V27`) pass, motion reviewed.
