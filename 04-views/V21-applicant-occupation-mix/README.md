# V21 · Applicant Occupation Mix

> Share of applications by recorded occupation.

| | |
|---|---|
| Type | Screen |
| Opens with | “What types of applicants are using VAS services?” |
| Business questions | BQ20 |
| Feature | F28 |
| Scope status | **Red** · Design preview: data not confirmed for October. |
| Template | `stage` |
| Components | `ring` |
| Effects | [E00](../../03-effects/E00-canvas-layer/SPEC.md) · [E01](../../03-effects/E01-morph/SPEC.md) · [E02](../../03-effects/E02-particles/SPEC.md) · [E03](../../03-effects/E03-globe-aura/SPEC.md) · [E06](../../03-effects/E06-environment/SPEC.md) · [E07](../../03-effects/E07-post-fx/SPEC.md) · [E08](../../03-effects/E08-count-up/SPEC.md) · [E09](../../03-effects/E09-sound/SPEC.md) · [E11](../../03-effects/E11-composer/SPEC.md) |
| Preview (reference app) | `http://localhost:5173/?view=V21` |

**Notes.** Post-October feature, mock values for design review.

## Captures

![wide.jpg](screens/wide.jpg)
![portrait.jpg](screens/portrait.jpg)
![phone.jpg](screens/phone.jpg)

## Files

`component/` holds this screen's own source (same paths as the reference app):

- `src/ui/scene/components/Showcase.tsx`

**Shared** (port once, used by many screens): `src/ui/scene/components/shared.tsx`, `src/ui/scene/SceneIcon.tsx`, `src/ui/bridge.tsx`, `src/lib/format.ts`, `src/lib/homeLayout.ts`, plus the design-system CSS in `02-design-system/source`.

## Data contract

`spec.sample.json` is exactly what this screen renders (DEMO DATA). Types: `05-data-contracts/source/src/odin/types.ts` (`SceneAnswer`). Fields per component:

- `ring` · key `ring`: `total`, `totalLabel`, `basis`, `segments`

## Morph keys

Keep these `data-morph` keys so shared elements travel between screens (E01): `ring`

## Port it

See `06-port-kit/PORT-PROMPTS.md` → V21. Done = contract test + acceptance test (`ODIN_VIEWS=V21`) pass, motion reviewed.
