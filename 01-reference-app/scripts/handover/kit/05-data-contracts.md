# Data contracts

Screens are pure: each renders a typed **spec** and never fetches. Your adapter turns your API data into that spec.

| File | What it is |
|---|---|
| `source/src/odin/types.ts` | `SceneAnswer` (one screen) and every component spec (`MetricSpec`, `DonutSpec`, `TimeMatrixSpec`, `JourneySpec`, …) |
| `source/src/data/types.ts` | `Kpi` (Home capsules) |
| `scene-answer.schema.json` | JSON Schema of `SceneAnswer`, for validating API payloads or adapter output |
| `home-data.schema.json` | JSON Schema of Home's `HomeData` |
| `questions.csv` | Every business question → screen → components → sample spoken answer, with v2 scope status |
| `../04-views/*/spec.sample.json` | The exact spec each screen renders in the reference app (DEMO DATA) |

## SceneAnswer in one minute

```ts
{
  id, intent,                     // which question produced it
  template: 'focus' | 'stage' | 'journey' | 'floor' | 'matrix' | 'board' | 'outcomes' | 'ringCards' | 'notice',
  title, subtitle,
  components: [{ slot, spec: { kind, key, ...fields } }],   // key = morph key (E01)
  focusKey,                       // the component ODIN's aura wraps when speaking
  presence: 'core' | 'dissolved', // globe sits in the component's core, or dissolves
  spoken,                         // what ODIN says
  summary: { primary, secondary } // the summary strip
}
```

Values that are not available are `null` (rendered "Not available" with the reason). Deltas carry their basis (`vs yesterday`) and which direction is good (`goodWhen`).
