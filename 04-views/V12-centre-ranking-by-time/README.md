# V12 · Centre Ranking by Time

> Centres ranked by average processing days.

| | |
|---|---|
| Type | Screen |
| Opens with | “How efficiently are individual centres processing applications?” |
| Business questions | BQ11 |
| Feature | F26 |
| Scope status | **Red** · Design preview: data not confirmed for October. |
| Template | `focus` |
| Components | `ranking`, `metric` |
| Effects | [E00](../../03-effects/E00-canvas-layer/SPEC.md) · [E01](../../03-effects/E01-morph/SPEC.md) · [E02](../../03-effects/E02-particles/SPEC.md) · [E03](../../03-effects/E03-globe-aura/SPEC.md) · [E06](../../03-effects/E06-environment/SPEC.md) · [E07](../../03-effects/E07-post-fx/SPEC.md) · [E08](../../03-effects/E08-count-up/SPEC.md) · [E09](../../03-effects/E09-sound/SPEC.md) · [E11](../../03-effects/E11-composer/SPEC.md) |
| Preview (reference app) | `http://localhost:5173/?view=V12` |

## Captures

![wide.jpg](screens/wide.jpg)
![portrait.jpg](screens/portrait.jpg)
![phone.jpg](screens/phone.jpg)

## Files

`component/` holds this screen's own source (same paths as the reference app):

- `src/ui/scene/components/Panels.tsx`

**Shared** (port once, used by many screens): `src/ui/scene/components/shared.tsx`, `src/ui/scene/SceneIcon.tsx`, `src/ui/bridge.tsx`, `src/lib/format.ts`, `src/lib/homeLayout.ts`, plus the design-system CSS in `02-design-system/source`.

## Data contract

`spec.sample.json` is exactly what this screen renders (DEMO DATA). Types: `05-data-contracts/source/src/odin/types.ts` (`SceneAnswer`). Fields per component:

- `ranking` · key `ranking`: `title`, `basis`, `format`, `items`, `highlight`, `accent`
- `metric` · key `rank-lead`: `label`, `value`, `format`, `icon`, `accent`, `caption`
- `metric` · key `rank-second`: `label`, `value`, `format`, `icon`, `accent`, `caption`

## Morph keys

Keep these `data-morph` keys so shared elements travel between screens (E01): `ranking`, `rank-lead`, `rank-second`

## Port it

See `06-port-kit/PORT-PROMPTS.md` → V12. Done = contract test + acceptance test (`ODIN_VIEWS=V12`) pass, motion reviewed.
