# ODIN component catalogue (answer-first)

Source of truth: `src/odin/components.ts` (dev hook `__odinComponents()`).

**How answers are built**
- One metric asked → its card is the hero inside ODIN's globe (V30), with two supporting facts.
- "And …" / "what about …" / "also" → the next card joins beside the globe by morph (right, then left). Up to three.
- Four or more → the full page that carries most of them.
- "Full picture" / "everything" → the full page of what was asked.
- Already on the full page → highlight the asked item there (no new query).
- Data cost = queries the component needs on its own.

| ID | Component | Metric | Shows | Screens | Queries | Query |
|---|---|---|---|---|---|---|
| C01 | Total applications | applications_total | All applications to date (or for a filter) | V30, V01, V29, V27 | 1 | count(applications) [where filter] |
| C02 | In processing | in_processing | Open applications awaiting a final decision | V30, V01, V02, V27 | 1 | count(applications where status is open) |
| C03 | Entered today | entered_today | Applications that entered processing today | V30, V01, V02 | 1 | count(applications where submitted = today) |
| C04 | Approved | approved | Applications approved to date | V30, V27, V29 | 1 | count(applications where status = approved) |
| C05 | Rejected | rejected | Applications rejected to date | V30, V27, V29 | 1 | count(applications where status = rejected) |
| C06 | Approval rate | approval_rate | Approved as a share of decided applications | V30, V29 | 2 | approved ÷ (approved + rejected) |
| C07 | Closure rate | closure_rate | Closed applications as a share of all applications | V30, V01, V04, V29 | 2 | closed ÷ count(applications) |
| C08 | Processing time | processing_time | Average days from submission to decision | V30, V05, V23 | 1 | avg(decided_at − submitted_at) over decided applications |
| C09 | VAS revenue | revenue | Total VAS revenue to date (AED) | V30, V01, V08, V28 | 1 | sum(VAS fees) |
| C10 | Status ring | — | Approved, rejected, closed (other) and in processing as one ring | V04, V29 | 1 | count(applications) group by status |
| C11 | Outcome galaxy | — | Outcomes as spiral arms sized by share, with four glass cards | V27 | 1 | count(applications) group by status |
| C12 | Processing board | — | In processing, entered today, closed today and where they wait | V02 | 3 | open count · entered today · closed today · open group by stage |
| C13 | Time matrix | — | End-to-end time, six duration cards and the stage strip | V05, V06, V07 | 2 | duration percentiles · avg duration group by stage |
| C14 | Journey | — | Each stage of the online journey with its count | V09, V26, V11 | 1 | count(applications) group by current stage |
| C15 | Leaderboard | — | Top five with the leader’s share (countries, nationalities or centres) | V16, V31, V17 | 1 | count(applications) group by dimension, top 5 |
| C16 | Revenue breakdown | — | Revenue by country, centre, service and nationality | V08, V28 | 2 | sum(VAS fees) group by country · by centre |
| C17 | Period comparison | — | Today, yesterday, last 7 days, previous 7 days, month to date | V15 | 1 | count(applications) group by period bucket |
| C18 | Side-by-side compare | — | Two entities measure by measure | V19 | 2 | the answer-card queries, once per entity |
