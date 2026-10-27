# Measure × depth → screen

Generated from the reference app (`route()` in `src/odin/composer.ts`). Glance always reads its number from the context screen. "Filtered" = context depth with a country, centre or visa-type filter.

| Measure | Meaning | Glance | Context (default) | Explore | Filtered |
|---|---|---|---|---|---|
| `applications_total` | How many applications in total (to date, or for a filter). | V30 — | V29 Applications · v2 · appcore · `total` | V04 Outcome Distribution · total-applications | V29 · appcore · `total` |
| `in_processing` | Applications still open, awaiting a final decision (backlog, pending, in progress). | V30 — | V02 Applications in Processing · board · `hero` | V09 Application Journey · journey | V29 · appcore · `processing` |
| `entered_today` | Applications that entered processing / were submitted today. | V30 — | V02 Applications in Processing · board · `entered-today` | V15 Performance Comparison · periods · `today` | V02 · board · `entered-today` |
| `approved` | Approved / granted / issued applications. | V30 — | V27 Application Outcomes · donut · `approved` | V04 Outcome Distribution · ring · `approved` | V27 · donut · `approved` |
| `rejected` | Rejected / refused / denied applications. | V30 — | V27 Application Outcomes · donut · `rejected` | V04 Outcome Distribution · ring · `rejected` | V27 · donut · `rejected` |
| `outcomes` | The outcome split: approved, rejected, closed, in processing (decisions, results, statuses). | V30 donut | V27 Application Outcomes · donut | V04 Outcome Distribution · ring | V27 · donut |
| `approval_rate` | Approved as a share of decided applications (approval, success or acceptance rate). | V30 — | V29 Applications · v2 · appcore · `approval` | V27 Application Outcomes · donut · `approved` | V29 · appcore · `approval` |
| `closure_rate` | Closed (approved + rejected + other) as a share of all applications. | V30 — | V04 Outcome Distribution · ring | V27 Application Outcomes · donut · `closed` | V29 · appcore · `closure` |
| `processing_time` | Average time from submission to decision (how long, turnaround, time matrix). | V30 — | V05 Processing Time Matrix · online · tm · `core` | V05 Processing Time Matrix · online · tm · `stages` | V23 · avg-time |
| `stage_time` | Time at each stage of the journey; the longest or fastest stage. | V30 tm · `stages` | V05 Processing Time Matrix · online · tm · `stages` | V09 Application Journey · journey | V05 · tm · `stages` |
| `journey` | The visa journey / pipeline / funnel and where applications are in it. | V30 journey | V09 Application Journey · journey | V09 Application Journey · journey | V09 · journey |
| `by_country` | Applications by country of residence (top countries, where applicants come from). | V30 podiums · `res` | V16 Top Countries, Nationalities & Centres · podiums · `res` | V17 Top Countries on the Globe · geo | V16 · podiums · `res` |
| `by_nationality` | Applications by applicant nationality. | V30 podiums · `nat` | V16 Top Countries, Nationalities & Centres · podiums · `nat` | V16 Top Countries, Nationalities & Centres · podiums · `nat` | V16 · podiums · `nat` |
| `by_centre` | Applications by visa application centre (VAC). | V30 podiums · `cen` | V16 Top Countries, Nationalities & Centres · podiums · `cen` | V16 Top Countries, Nationalities & Centres · podiums · `cen` | V16 · podiums · `cen` |
| `revenue` | Total VAS revenue. | V30 — | V32 VAS Revenue · revenue · `total` | V32 VAS Revenue · revenue · `countries` | V32 · revenue · `total` |
| `revenue_breakdown` | Revenue split by country, centre, service or nationality. | V30 revenue · `countries` | V32 VAS Revenue · revenue · `countries` | V32 VAS Revenue · revenue · `countries` | V32 · revenue · `countries` |
| `daily_comparison` | Today vs yesterday, last 7 days, month to date, trends. | V30 periods · `today` | V15 Performance Comparison · periods · `today` | V15 Performance Comparison · periods · `last7` | V15 · periods · `today` |

`compare` (two named entities) always opens V19 at explore depth.
