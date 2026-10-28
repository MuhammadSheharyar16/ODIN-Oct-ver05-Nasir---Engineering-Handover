# Ready-to-paste requests for your Claude

Put the kit at the root of your repo as `odin-handover/`. Start with Discovery once, then Foundation, then any screens in any order.

### 0 · Discovery (once)

```
Read odin-handover/06-port-kit/CLAUDE.md, then do Step 1 (Discovery) for this repo and write odin-handover/DISCOVERY.md. Do not change any code.
```

### 1 · Foundation (once)

```
Using odin-handover/06-port-kit/CLAUDE.md, plan the ODIN foundation for this app: E00 canvas layer, E11 bridge,
E01 morph, E06 environment, E03 globe, E07 post-FX, plus an /odin-preview/:id route. Write INTEGRATION-PLAN.md and wait for approval.
```

### 2 · Response composer (once, after the first screens)

```
Using odin-handover/06-port-kit/CLAUDE.md and odin-handover/03-effects/E12-response-composer/, plan how free-text and voice
questions reach ODIN screens in this app: our LLM returns a Query (LLM-PROMPT.md, query.schema.json), a port of plan()/respond()
picks screen, depth and spotlight, picker questions stay direct. Write INTEGRATION-PLAN.md and wait for approval; then implement,
add data-spot-key to ported screens, and run odin.composer.test.ts.
```

### Any effect on its own

```
Using odin-handover/06-port-kit/CLAUDE.md, integrate effect <E-id> as specified in odin-handover/03-effects/<E-id>-*/SPEC.md.
Plan first and wait for approval; then implement and show it side by side with the reference app.
```

## Screens

### V01 · Executive Home

```
Using the ODIN port kit in ./odin-handover (read odin-handover/06-port-kit/CLAUDE.md first),
port V01 "Executive Home" into this app.
Effects it needs: E00, E03, E05, E06, E07, E08, E10 (skip any already integrated).
Follow steps 2–5: write INTEGRATION-PLAN.md and wait for my approval; then port the screen,
write its adapter from our data (fields in odin-handover/04-views/V01-executive-home/spec.sample.json),
add it to the ODIN preview route, and run the contract and acceptance tests with ODIN_VIEWS=V01.
```

### V02 · Applications in Processing

```
Using the ODIN port kit in ./odin-handover (read odin-handover/06-port-kit/CLAUDE.md first),
port V02 "Applications in Processing" into this app.
Effects it needs: E00, E01, E02, E03, E04, E05, E06, E07, E08, E09, E11 (skip any already integrated).
Follow steps 2–5: write INTEGRATION-PLAN.md and wait for my approval; then port the screen,
write its adapter from our data (fields in odin-handover/04-views/V02-applications-in-processing/spec.sample.json),
add it to the ODIN preview route, and run the contract and acceptance tests with ODIN_VIEWS=V02.
```

### V04 · Outcome Distribution

```
Using the ODIN port kit in ./odin-handover (read odin-handover/06-port-kit/CLAUDE.md first),
port V04 "Outcome Distribution" into this app.
Effects it needs: E00, E01, E02, E03, E04, E06, E07, E08, E09, E11 (skip any already integrated).
Follow steps 2–5: write INTEGRATION-PLAN.md and wait for my approval; then port the screen,
write its adapter from our data (fields in odin-handover/04-views/V04-outcome-distribution/spec.sample.json),
add it to the ODIN preview route, and run the contract and acceptance tests with ODIN_VIEWS=V04.
```

### V05 · Processing Time Matrix · online

```
Using the ODIN port kit in ./odin-handover (read odin-handover/06-port-kit/CLAUDE.md first),
port V05 "Processing Time Matrix · online" into this app.
Effects it needs: E00, E01, E02, E03, E05, E06, E07, E08, E09, E11 (skip any already integrated).
Follow steps 2–5: write INTEGRATION-PLAN.md and wait for my approval; then port the screen,
write its adapter from our data (fields in odin-handover/04-views/V05-processing-time-matrix-online/spec.sample.json),
add it to the ODIN preview route, and run the contract and acceptance tests with ODIN_VIEWS=V05.
```

### V09 · Application Journey

```
Using the ODIN port kit in ./odin-handover (read odin-handover/06-port-kit/CLAUDE.md first),
port V09 "Application Journey" into this app.
Effects it needs: E00, E01, E02, E03, E04, E06, E07, E08, E09, E11 (skip any already integrated).
Follow steps 2–5: write INTEGRATION-PLAN.md and wait for my approval; then port the screen,
write its adapter from our data (fields in odin-handover/04-views/V09-application-journey/spec.sample.json),
add it to the ODIN preview route, and run the contract and acceptance tests with ODIN_VIEWS=V09.
```

### V12 · Centre Ranking by Time

```
Using the ODIN port kit in ./odin-handover (read odin-handover/06-port-kit/CLAUDE.md first),
port V12 "Centre Ranking by Time" into this app.
Effects it needs: E00, E01, E02, E03, E06, E07, E08, E09, E11 (skip any already integrated).
Follow steps 2–5: write INTEGRATION-PLAN.md and wait for my approval; then port the screen,
write its adapter from our data (fields in odin-handover/04-views/V12-centre-ranking-by-time/spec.sample.json),
add it to the ODIN preview route, and run the contract and acceptance tests with ODIN_VIEWS=V12.
```

### V15 · Performance Comparison

```
Using the ODIN port kit in ./odin-handover (read odin-handover/06-port-kit/CLAUDE.md first),
port V15 "Performance Comparison" into this app.
Effects it needs: E00, E01, E02, E03, E04, E06, E07, E08, E09, E11 (skip any already integrated).
Follow steps 2–5: write INTEGRATION-PLAN.md and wait for my approval; then port the screen,
write its adapter from our data (fields in odin-handover/04-views/V15-performance-comparison/spec.sample.json),
add it to the ODIN preview route, and run the contract and acceptance tests with ODIN_VIEWS=V15.
```

### V16 · Top Countries, Nationalities & Centres

```
Using the ODIN port kit in ./odin-handover (read odin-handover/06-port-kit/CLAUDE.md first),
port V16 "Top Countries, Nationalities & Centres" into this app.
Effects it needs: E00, E01, E02, E03, E06, E07, E08, E09, E11 (skip any already integrated).
Follow steps 2–5: write INTEGRATION-PLAN.md and wait for my approval; then port the screen,
write its adapter from our data (fields in odin-handover/04-views/V16-top-countries-nationalities-and-centres/spec.sample.json),
add it to the ODIN preview route, and run the contract and acceptance tests with ODIN_VIEWS=V16.
```

### V17 · Top Countries on the Globe

```
Using the ODIN port kit in ./odin-handover (read odin-handover/06-port-kit/CLAUDE.md first),
port V17 "Top Countries on the Globe" into this app.
Effects it needs: E00, E01, E02, E03, E04, E06, E07, E08, E09, E11 (skip any already integrated).
Follow steps 2–5: write INTEGRATION-PLAN.md and wait for my approval; then port the screen,
write its adapter from our data (fields in odin-handover/04-views/V17-top-countries-on-the-globe/spec.sample.json),
add it to the ODIN preview route, and run the contract and acceptance tests with ODIN_VIEWS=V17.
```

### V22 · Applications (focus) · v1

```
Using the ODIN port kit in ./odin-handover (read odin-handover/06-port-kit/CLAUDE.md first),
port V22 "Applications (focus) · v1" into this app.
Effects it needs: E00, E01, E02, E03, E06, E07, E08, E09, E11 (skip any already integrated).
Follow steps 2–5: write INTEGRATION-PLAN.md and wait for my approval; then port the screen,
write its adapter from our data (fields in odin-handover/04-views/V22-applications-focus-v1/spec.sample.json),
add it to the ODIN preview route, and run the contract and acceptance tests with ODIN_VIEWS=V22.
```

### V23 · Processing Time (focus)

```
Using the ODIN port kit in ./odin-handover (read odin-handover/06-port-kit/CLAUDE.md first),
port V23 "Processing Time (focus)" into this app.
Effects it needs: E00, E01, E02, E03, E06, E07, E08, E09, E11 (skip any already integrated).
Follow steps 2–5: write INTEGRATION-PLAN.md and wait for my approval; then port the screen,
write its adapter from our data (fields in odin-handover/04-views/V23-processing-time-focus/spec.sample.json),
add it to the ODIN preview route, and run the contract and acceptance tests with ODIN_VIEWS=V23.
```

### V24 · Not Available Yet

```
Using the ODIN port kit in ./odin-handover (read odin-handover/06-port-kit/CLAUDE.md first),
port V24 "Not Available Yet" into this app.
Effects it needs: E00, E01, E02, E03, E06, E07, E08, E09, E11 (skip any already integrated).
Follow steps 2–5: write INTEGRATION-PLAN.md and wait for my approval; then port the screen,
write its adapter from our data (fields in odin-handover/04-views/V24-not-available-yet/spec.sample.json),
add it to the ODIN preview route, and run the contract and acceptance tests with ODIN_VIEWS=V24.
```

### V27 · Application Outcomes

```
Using the ODIN port kit in ./odin-handover (read odin-handover/06-port-kit/CLAUDE.md first),
port V27 "Application Outcomes" into this app.
Effects it needs: E00, E01, E02, E03, E06, E07, E08, E09, E11 (skip any already integrated).
Follow steps 2–5: write INTEGRATION-PLAN.md and wait for my approval; then port the screen,
write its adapter from our data (fields in odin-handover/04-views/V27-application-outcomes/spec.sample.json),
add it to the ODIN preview route, and run the contract and acceptance tests with ODIN_VIEWS=V27.
```

### V29 · Applications · v2

```
Using the ODIN port kit in ./odin-handover (read odin-handover/06-port-kit/CLAUDE.md first),
port V29 "Applications · v2" into this app.
Effects it needs: E00, E01, E02, E03, E06, E07, E08, E09, E11 (skip any already integrated).
Follow steps 2–5: write INTEGRATION-PLAN.md and wait for my approval; then port the screen,
write its adapter from our data (fields in odin-handover/04-views/V29-applications-v2/spec.sample.json),
add it to the ODIN preview route, and run the contract and acceptance tests with ODIN_VIEWS=V29.
```

### V30 · Answer

```
Using the ODIN port kit in ./odin-handover (read odin-handover/06-port-kit/CLAUDE.md first),
port V30 "Answer" into this app.
Effects it needs: E00, E01, E02, E03, E06, E07, E08, E09, E11, E12 (skip any already integrated).
Follow steps 2–5: write INTEGRATION-PLAN.md and wait for my approval; then port the screen,
write its adapter from our data (fields in odin-handover/04-views/V30-answer/spec.sample.json),
add it to the ODIN preview route, and run the contract and acceptance tests with ODIN_VIEWS=V30.
```

### V32 · VAS Revenue

```
Using the ODIN port kit in ./odin-handover (read odin-handover/06-port-kit/CLAUDE.md first),
port V32 "VAS Revenue" into this app.
Effects it needs: E00, E01, E02, E03, E06, E07, E08, E09, E11 (skip any already integrated).
Follow steps 2–5: write INTEGRATION-PLAN.md and wait for my approval; then port the screen,
write its adapter from our data (fields in odin-handover/04-views/V32-vas-revenue/spec.sample.json),
add it to the ODIN preview route, and run the contract and acceptance tests with ODIN_VIEWS=V32.
```

### V39 · Online Visa Journey v4.5

```
Using the ODIN port kit in ./odin-handover (read odin-handover/06-port-kit/CLAUDE.md first),
port V39 "Online Visa Journey v4.5" into this app.
Effects it needs: E00, E01, E02, E03, E04, E06, E07, E08, E09, E11 (skip any already integrated).
Follow steps 2–5: write INTEGRATION-PLAN.md and wait for my approval; then port the screen,
write its adapter from our data (fields in odin-handover/04-views/V39-online-visa-journey-v4-5/spec.sample.json),
add it to the ODIN preview route, and run the contract and acceptance tests with ODIN_VIEWS=V39.
```

### V40 · Top 10 Countries v2

```
Using the ODIN port kit in ./odin-handover (read odin-handover/06-port-kit/CLAUDE.md first),
port V40 "Top 10 Countries v2" into this app.
Effects it needs: E00, E01, E02, E03, E04, E06, E07, E08, E09, E11 (skip any already integrated).
Follow steps 2–5: write INTEGRATION-PLAN.md and wait for my approval; then port the screen,
write its adapter from our data (fields in odin-handover/04-views/V40-top-10-countries-v2/spec.sample.json),
add it to the ODIN preview route, and run the contract and acceptance tests with ODIN_VIEWS=V40.
```

### V25 · Didn’t Understand

```
Using the ODIN port kit in ./odin-handover (read odin-handover/06-port-kit/CLAUDE.md first),
port V25 "Didn’t Understand" into this app.
Effects it needs: E00, E01, E02, E03, E06, E07, E08, E09, E11 (skip any already integrated).
Follow steps 2–5: write INTEGRATION-PLAN.md and wait for my approval; then port the screen,
write its adapter from our data (fields in odin-handover/04-views/V25-didnt-understand/spec.sample.json),
add it to the ODIN preview route, and run the contract and acceptance tests with ODIN_VIEWS=V25.
```
