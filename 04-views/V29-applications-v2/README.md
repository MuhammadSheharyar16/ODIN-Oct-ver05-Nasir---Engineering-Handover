# V29 · Applications · v2

> Application core: a glass orb of status-coloured lights (one per application) with a segmented status ring, approval and closure rates as gauge cards, and the status breakdown that sums to the total.

| | |
|---|---|
| Type | Screen |
| Opens with | “Show the applications v2” |
| Business questions | BQ01, BQ02, BQ03 |
| Feature | F05 · F06 |
| Scope status | **Green** · In October scope. |
| Template | `appcore` |
| Components | `appcore` |
| Effects | [E00](../../03-effects/E00-canvas-layer/SPEC.md) · [E01](../../03-effects/E01-morph/SPEC.md) · [E02](../../03-effects/E02-particles/SPEC.md) · [E03](../../03-effects/E03-globe-aura/SPEC.md) · [E06](../../03-effects/E06-environment/SPEC.md) · [E07](../../03-effects/E07-post-fx/SPEC.md) · [E08](../../03-effects/E08-count-up/SPEC.md) · [E09](../../03-effects/E09-sound/SPEC.md) · [E11](../../03-effects/E11-composer/SPEC.md) |
| Preview (reference app) | `http://localhost:5173/?view=V29` |

**Notes.** v2 of V22. Filters (country, centre, visa type) apply. Phones/portrait stack the core and cards.

## Captures

![wide.jpg](screens/wide.jpg)
![portrait.jpg](screens/portrait.jpg)
![phone.jpg](screens/phone.jpg)

## Files

`component/` holds this screen's own source (same paths as the reference app):

- `src/ui/scene/components/AppCore.tsx`
- `src/ui/scene/components/appcore.css`

**Shared** (port once, used by many screens): `src/ui/scene/components/shared.tsx`, `src/ui/scene/SceneIcon.tsx`, `src/ui/bridge.tsx`, `src/lib/format.ts`, `src/lib/homeLayout.ts`, plus the design-system CSS in `02-design-system/source`.

## Data contract

`spec.sample.json` is exactly what this screen renders (DEMO DATA). Types: `05-data-contracts/source/src/odin/types.ts` (`SceneAnswer`). Fields per component:

- `appcore` · key `appcore`: `total`, `caption`, `segments`, `approval`, `closure`

## Morph keys

Keep these `data-morph` keys so shared elements travel between screens (E01): `appcore`

## Port it

See `06-port-kit/PORT-PROMPTS.md` → V29. Done = contract test + acceptance test (`ODIN_VIEWS=V29`) pass, motion reviewed.
