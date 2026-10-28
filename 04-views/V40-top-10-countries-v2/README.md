# V40 · Top 10 Countries v2

> The Earth with the top ten countries, ordered for reading on a big screen (Anupam, 27 Oct): ranks 1–5 down the left, 6–10 down the right, the globe in the centre.

| | |
|---|---|
| Type | Screen |
| Opens with | “Show top 10 countries v2” |
| Feature | F08 |
| Scope status | **Green** · In October scope. |
| Template | `stage` |
| Components | `geo` |
| 3D objects (E04) | earth + plinths |
| Effects | [E00](../../03-effects/E00-canvas-layer/SPEC.md) · [E01](../../03-effects/E01-morph/SPEC.md) · [E02](../../03-effects/E02-particles/SPEC.md) · [E03](../../03-effects/E03-globe-aura/SPEC.md) · [E04](../../03-effects/E04-3d-objects/SPEC.md) · [E06](../../03-effects/E06-environment/SPEC.md) · [E07](../../03-effects/E07-post-fx/SPEC.md) · [E08](../../03-effects/E08-count-up/SPEC.md) · [E09](../../03-effects/E09-sound/SPEC.md) · [E11](../../03-effects/E11-composer/SPEC.md) |
| Preview (reference app) | `http://localhost:5173/?view=V40` |

**Notes.** v5.2 design option for V17 (same data, cards and waving flags; V17 unchanged). Geo `layout: 'sides'`.

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

- `geo` · key `geo`: `heading`, `subheading`, `basis`, `period`, `items`, `layout`

## Morph keys

Keep these `data-morph` keys so shared elements travel between screens (E01): `geo`

## Port it

See `06-port-kit/PORT-PROMPTS.md` → V40. Done = contract test + acceptance test (`ODIN_VIEWS=V40`) pass, motion reviewed.
