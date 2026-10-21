# Phrasing table

81 ways a CEO might ask, with the plan ODIN produces (DEMO DATA reference app). Your classifier passes when every row gives the same screen, depth and spotlight. Machine-readable: `phrasings.json`.

| Question | Measure | Cues | Screen | Depth | Spotlight |
|---|---|---|---|---|---|
| How many applications are in processing? | in_processing | — | V30 | glance | — |
| How many are being processed right now? | in_processing | — | V30 | glance | — |
| How many visa applications are in progress | in_processing | — | V30 | glance | — |
| How big is the backlog? | in_processing | — | V30 | glance | — |
| How many are still pending? | in_processing | — | V30 | glance | — |
| Just the number of applications in processing | in_processing | less | V30 | glance | — |
| Quickly, how many are pending? | in_processing | less | V30 | glance | — |
| In processing, briefly | in_processing | less | V30 | glance | — |
| Give me the full picture of applications in processing | in_processing | full | V02 | context | board · `hero` |
| Show me everything on applications in processing | in_processing | full, show | V02 | context | board · `hero` |
| Where are the applications in processing? | in_processing | where | V26 | explore | journey |
| How many applications from India are in processing? | in_processing | — | V30 | glance | — |
| How many applications are being processed in Mumbai? | in_processing | — | V30 | glance | — |
| How many new applications came in today? | entered_today | — | V30 | glance | — |
| How many applications were submitted today? | entered_today | — | V30 | glance | — |
| Just the number of new applications today | entered_today | less | V30 | glance | — |
| How many applications do we have? | applications_total | — | V30 | glance | — |
| Total applications | applications_total | — | V30 | glance | — |
| How many visas have we had since launch? | applications_total | — | V30 | glance | — |
| Just give me the total | applications_total | less | V30 | glance | — |
| Applications, in a word | applications_total | less | V30 | glance | — |
| How many applications from India? | applications_total | — | V30 | glance | — |
| How many tourist visa applications? | applications_total | — | V30 | glance | — |
| Break down applications by status | applications_total | breakdown | V04 | explore | total-applications |
| Tell me more about the applications | applications_total | more | V04 | explore | total-applications |
| How many visas have been approved? | approved | — | V30 | glance | — |
| How many were granted? | approved | — | V30 | glance | — |
| How many were rejected? | rejected | — | V30 | glance | — |
| How many applications got refused? | rejected | — | V30 | glance | — |
| Only the number of rejections | rejected | less | V30 | glance | — |
| What are the outcomes? | outcomes | — | V27 | context | donut |
| Show me the decisions | outcomes | show | V27 | context | donut |
| Break down the outcomes | outcomes | breakdown | V04 | explore | ring |
| Approved applications from India | approved | — | V30 | glance | — |
| How many approvals in more detail | approved | more | V04 | explore | ring · `approved` |
| What is the approval rate? | approval_rate | — | V30 | glance | — |
| What percentage of applications are approved? | approval_rate | — | V30 | glance | — |
| Success rate, quickly | approval_rate | less | V30 | glance | — |
| Approval rate for Pakistan | approval_rate | — | V30 | glance | — |
| What percentage of visa applications have been closed? | closure_rate | — | V30 | glance | — |
| What is the closure rate? | closure_rate | — | V30 | glance | — |
| Just the closure rate | closure_rate | less | V30 | glance | — |
| Closure rate for India | closure_rate | — | V30 | glance | — |
| Closure rate in more detail | closure_rate | more | V27 | explore | donut · `closed` |
| How long does it take to process a visa? | processing_time | — | V30 | glance | — |
| What is the average processing time? | processing_time | — | V30 | glance | — |
| What is the turnaround? | processing_time | — | V30 | glance | — |
| Show me the time matrix | processing_time | full, show | V05 | context | tm · `core` |
| Turnaround time, quickly | processing_time | less | V30 | glance | — |
| How long for India? | processing_time | — | V30 | glance | — |
| How long do tourist visas take? | processing_time | — | V30 | glance | — |
| Which stage takes the longest? | stage_time | — | V05 | context | tm · `stages` |
| How long is each stage? | stage_time | — | V05 | context | tm · `stages` |
| Stage times in detail | stage_time | more | V26 | explore | journey |
| Show the online visa journey | journey | show | V26 | context | journey |
| Walk me through the pipeline | journey | — | V26 | context | journey |
| Where are the online applications? | in_processing | where | V26 | explore | journey |
| Show me the funnel | journey | show | V26 | context | journey |
| Which countries generate the most applications? | by_country | — | V16 | context | podiums · `res` |
| Where do applicants come from? | by_country | where | V16 | context | podiums · `res` |
| Top countries | by_country | — | V16 | context | podiums · `res` |
| Break down applications by country | by_country | breakdown | V17 | explore | geo |
| Which nationalities apply the most? | by_nationality | — | V16 | context | podiums · `nat` |
| Top nationalities | by_nationality | — | V16 | context | podiums · `nat` |
| Which centres are busiest? | by_centre | — | V16 | context | podiums · `cen` |
| Which centres have the most applications? | by_centre | — | V16 | context | podiums · `cen` |
| What is our revenue? | revenue | — | V30 | glance | — |
| How much money have we made? | revenue | — | V30 | glance | — |
| Just the revenue number | revenue | less | V30 | glance | — |
| Revenue by country | revenue_breakdown | breakdown | V28 | explore | revenue · `countries` |
| Break down revenue | revenue_breakdown | breakdown | V28 | explore | revenue · `countries` |
| Which countries bring in the most revenue? | revenue_breakdown | — | V28 | context | revenue · `countries` |
| How does today's performance compare with yesterday? | daily_comparison | compare | V15 | context | periods · `today` |
| How are we trending this week? | daily_comparison | — | V15 | context | periods · `today` |
| Last 7 days performance | daily_comparison | — | V15 | context | periods · `today` |
| How many were approved and rejected? | approved | — | V30 | glance | — |
| Approved, rejected and in processing | approved | — | V30 | glance | — |
| What is the approval rate and the closure rate? | approval_rate | — | V30 | glance | — |
| Approved, rejected, in processing and entered today | approved | — | V27 | context | donut · `approved` |
| Compare India and Pakistan | compare | compare | V24 | explore | — |
| India vs Nepal | compare | compare | V24 | explore | — |

## Voice follow-up scripts

Each line is asked after the previous answer (no chips on screen; follow-ups are spoken).

**Answer, then add, then full picture**

1. “How many were rejected?” → V30 · glance · rejected
2. “And approved?” → V30 · glance · rejected + approved
3. “What about in processing?” → V30 · glance · rejected + approved + in_processing
4. “Full picture” → V27 · context

**A fourth metric opens the full page**

1. “Approved and rejected” → V30 · glance · approved + rejected
2. “Also in processing” → V30 · glance · approved + rejected + in_processing
3. “And entered today as well” → V27 · context

**A new question replaces the answer**

1. “How many were rejected?” → V30 · glance · rejected
2. “What is the closure rate?” → V30 · glance · closure_rate

**Already on screen → highlight only**

1. “Give me the full picture of applications in processing” → V02 · context
2. “How many came in today?” → V02 · context

**More, more, less, less**

1. “How many applications are in processing?” → V30 · glance · in_processing
2. “Tell me more” → V02 · context
3. “More detail” → V26 · explore
4. “Less detail” → V02 · context
5. “Just the number” → V30 · glance · in_processing

**Glance, then more**

1. “Just the closure rate” → V30 · glance · closure_rate
2. “Tell me more” → V04 · context

**Filter keeps the subject**

1. “How many were rejected?” → V30 · glance · rejected
2. “And for India?” → V30 · glance · rejected

