# V26 · Application Journey · v2

> The online journey on a glass board of jars: an application icon travels stage to stage, the arriving jar glows and its count lights up. Both ICP reviews lead to one ICP decision, then a single Approved and a single Rejected (each with its without / after biometric split).

| | |
|---|---|
| Type | Screen |
| Opens with | “Show the online visa journey v2” |
| Feature | F07a |
| Scope status | **Green** · In October scope. |
| Template | `jars` |
| Components | `metric`, `journey` |
| 3D objects (E04) | pedestal |
| Effects | [E00](../../03-effects/E00-canvas-layer/SPEC.md) · [E01](../../03-effects/E01-morph/SPEC.md) · [E02](../../03-effects/E02-particles/SPEC.md) · [E03](../../03-effects/E03-globe-aura/SPEC.md) · [E06](../../03-effects/E06-environment/SPEC.md) · [E07](../../03-effects/E07-post-fx/SPEC.md) · [E08](../../03-effects/E08-count-up/SPEC.md) · [E09](../../03-effects/E09-sound/SPEC.md) · [E11](../../03-effects/E11-composer/SPEC.md) |
| Preview (reference app) | `http://localhost:5173/?view=V26` |

**Notes.** v2 of V09. Jar artwork from Figma (ODIN-October, node 18:34). Wide screens; phones and portrait use the journey layout.

## Captures

![wide.jpg](screens/wide.jpg)
![portrait.jpg](screens/portrait.jpg)
![phone.jpg](screens/phone.jpg)

## Files

`component/` holds this screen's own source (same paths as the reference app):

- `src/ui/scene/components/Panels.tsx`
- `src/ui/scene/components/Journey.tsx`
- `src/ui/scene/components/journeyGeometry.ts`
- `src/ui/scene/components/JourneyJars.tsx`
- `src/ui/scene/components/jars.css`
- `src/ui/scene/components/jarIcons.tsx`
- `public/journey`

**Shared** (port once, used by many screens): `src/ui/scene/components/shared.tsx`, `src/ui/scene/SceneIcon.tsx`, `src/ui/bridge.tsx`, `src/lib/format.ts`, `src/lib/homeLayout.ts`, plus the design-system CSS in `02-design-system/source`.

## Data contract

`spec.sample.json` is exactly what this screen renders (DEMO DATA). Types: `05-data-contracts/source/src/odin/types.ts` (`SceneAnswer`). Fields per component:

- `metric` · key `total-online`: `label`, `value`, `format`, `icon`, `accent`, `caption`, `delta`, `spark`
- `metric` · key `e2e-online`: `label`, `value`, `format`, `icon`, `accent`, `caption`, `delta`, `spark`
- `journey` · key `journey`: `channel`, `stages`, `approved`, `rejected`, `emphasisKey`, `floor`, `variant`, `heading`

## Morph keys

Keep these `data-morph` keys so shared elements travel between screens (E01): `journey`

## Port it

See `06-port-kit/PORT-PROMPTS.md` → V26. Done = contract test + acceptance test (`ODIN_VIEWS=V26`) pass, motion reviewed.
