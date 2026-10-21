# V16 · Top Countries, Nationalities & Centres

> Three glass leaderboards in depth (nationalities in front, countries and centres set back, each reflected on the floor): a hero #1 with its share, ranks 2–5 with bars against the leader, and the top-5 share.

| | |
|---|---|
| Type | Screen |
| Opens with | “Which countries or nationalities generate the most applications?” |
| Business questions | BQ18, BQ22 |
| Feature | F08 · F10 |
| Scope status | **Green** · In October scope. |
| Template | `band` |
| Components | `podiums` |
| Effects | [E00](../../03-effects/E00-canvas-layer/SPEC.md) · [E01](../../03-effects/E01-morph/SPEC.md) · [E02](../../03-effects/E02-particles/SPEC.md) · [E03](../../03-effects/E03-globe-aura/SPEC.md) · [E06](../../03-effects/E06-environment/SPEC.md) · [E07](../../03-effects/E07-post-fx/SPEC.md) · [E08](../../03-effects/E08-count-up/SPEC.md) · [E09](../../03-effects/E09-sound/SPEC.md) · [E11](../../03-effects/E11-composer/SPEC.md) |
| Preview (reference app) | `http://localhost:5173/?view=V16` |

**Notes.** v1. Centres show counts only (attributed applications). Columns carry data-spot-key res · nat · cen. Phones stack compact panels.

## Captures

![wide.jpg](screens/wide.jpg)
![portrait.jpg](screens/portrait.jpg)
![phone.jpg](screens/phone.jpg)

## Files

`component/` holds this screen's own source (same paths as the reference app):

- `src/ui/scene/components/Tops.tsx`
- `src/ui/scene/components/tops.css`
- `src/ui/scene/SceneIcon.tsx`

**Shared** (port once, used by many screens): `src/ui/scene/components/shared.tsx`, `src/ui/scene/SceneIcon.tsx`, `src/ui/bridge.tsx`, `src/lib/format.ts`, `src/lib/homeLayout.ts`, plus the design-system CSS in `02-design-system/source`.

## Data contract

`spec.sample.json` is exactly what this screen renders (DEMO DATA). Types: `05-data-contracts/source/src/odin/types.ts` (`SceneAnswer`). Fields per component:

- `podiums` · key `podiums`: `total`, `columns`

## Morph keys

Keep these `data-morph` keys so shared elements travel between screens (E01): `podiums`

## Port it

See `06-port-kit/PORT-PROMPTS.md` → V16. Done = contract test + acceptance test (`ODIN_VIEWS=V16`) pass, motion reviewed.
