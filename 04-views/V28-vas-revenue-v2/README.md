# V28 · VAS Revenue · v2

> Gold revenue core, fed by neon streams from four full breakdowns of the same total (country and centre in scope; service and nationality as post-October previews).

| | |
|---|---|
| Type | Screen |
| Opens with | “Show the VAS revenue v2” |
| Business questions | BQ05, BQ27 |
| Feature | F13a · F13b |
| Scope status | **Green** · In October scope. |
| Template | `revenue` |
| Components | `revenue` |
| 3D objects (E04) | plinths |
| Effects | [E00](../../03-effects/E00-canvas-layer/SPEC.md) · [E01](../../03-effects/E01-morph/SPEC.md) · [E02](../../03-effects/E02-particles/SPEC.md) · [E03](../../03-effects/E03-globe-aura/SPEC.md) · [E06](../../03-effects/E06-environment/SPEC.md) · [E07](../../03-effects/E07-post-fx/SPEC.md) · [E08](../../03-effects/E08-count-up/SPEC.md) · [E09](../../03-effects/E09-sound/SPEC.md) · [E11](../../03-effects/E11-composer/SPEC.md) |
| Preview (reference app) | `http://localhost:5173/?view=V28` |

**Notes.** v2 of V08. Every panel sums to the total.

## Captures

![wide.jpg](screens/wide.jpg)
![portrait.jpg](screens/portrait.jpg)
![phone.jpg](screens/phone.jpg)

## Files

`component/` holds this screen's own source (same paths as the reference app):

- `src/ui/scene/components/Jars.tsx`
- `src/ui/scene/components/RevenueCore.tsx`
- `src/ui/scene/components/revcore.css`

**Shared** (port once, used by many screens): `src/ui/scene/components/shared.tsx`, `src/ui/scene/SceneIcon.tsx`, `src/ui/bridge.tsx`, `src/lib/format.ts`, `src/lib/homeLayout.ts`, plus the design-system CSS in `02-design-system/source`.

## Data contract

`spec.sample.json` is exactly what this screen renders (DEMO DATA). Types: `05-data-contracts/source/src/odin/types.ts` (`SceneAnswer`). Fields per component:

- `revenue` · key `revenue`: `preview`, `validation`, `amount`, `delta`, `dims`, `breakdowns`

## Morph keys

Keep these `data-morph` keys so shared elements travel between screens (E01): `revenue`

## Port it

See `06-port-kit/PORT-PROMPTS.md` → V28. Done = contract test + acceptance test (`ODIN_VIEWS=V28`) pass, motion reviewed.
