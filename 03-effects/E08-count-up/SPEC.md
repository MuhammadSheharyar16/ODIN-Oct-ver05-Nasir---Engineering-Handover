# E08 · Count-up numbers

**How it connects to your app.** Plain React. `<Count v={n} fmt={formatter} />` in screens; `<NumberRoll value format countUp />` on Home.

**Libraries.** none beyond React

**Source** (in `source/`, same paths as the reference app): `src/ui/NumberRoll.tsx`, `src/ui/scene/components/shared.tsx`, `src/lib/format.ts`

**What it is.** Numbers count up as a component morphs in, then glide to later values.

- Screen numbers (`Count` / `useCountUp`): wait 520 ms (entrance), then 0 → value over 1,150 ms, ease-out; later changes tween from the current value with no wait.
- Home figures (`NumberRoll`): 700 ms ease-out cubic; on first load they wait for the intro to release them (E10).
- Reduced motion: values appear immediately.
- Formatting (`lib/format.ts`): tabular numerals, thousands separators, `Not available` for null, days to one decimal.

**Used by**: V01 Executive Home · V02 Applications in Processing · V04 Outcome Distribution · V05 Processing Time Matrix · online · V06 Processing Time Matrix · centre visits · V07 Time Matrix · focus stage · V08 VAS Revenue · v1 · V09 Application Journey · v1 · V12 Centre Ranking by Time · V13 Stage Queue · online · V14 Stage Queue · centres · V15 Performance Comparison · V16 Top Countries, Nationalities & Centres · V17 Top Countries on the Globe · V18 Channels Notice · V20 Travel Purpose Mix · V21 Applicant Occupation Mix · V22 Applications (focus) · v1 · V23 Processing Time (focus) · V24 Not Available Yet · V26 Application Journey · v2 · V27 Application Outcomes · V28 VAS Revenue · v2 · V29 Applications · v2 · V30 Answer · V31 Top Countries, Nationalities & Centres · v2 · V32 VAS Revenue · v3 · V25 Didn’t Understand
