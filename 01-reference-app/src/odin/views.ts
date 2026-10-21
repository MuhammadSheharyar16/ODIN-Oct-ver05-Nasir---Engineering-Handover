/**
 * ODIN UI catalogue — every screen and system state, with a stable ID.
 * Single source for deep links (?view=V05), the engineering handover
 * (catalogue, captures, READMEs, manifest) and QA. Keep IDs stable across releases.
 */
export type ViewStatus = 'Green' | 'Amber' | 'Red' | 'Validation' | 'Out' | 'System';

export type ViewEntry = {
  id: string;
  title: string;
  kind: 'screen' | 'system';
  /** Question that opens the screen (exactly as ODIN receives it). Home has none. */
  question?: string;
  /** Business questions answered (Excel v2 IDs). */
  bq: string[];
  feature: string;
  status: ViewStatus;
  /** One line: what the CEO gets from this screen. */
  purpose: string;
  /** Effects used, see the handover's 03-effects (E01…). */
  effects: string[];
  notes?: string;
};

/** Every answer screen: morph, particles, ODIN presence, room blur, glow, count-ups, sound, composer. */
const MORPH = ['E01', 'E02', 'E03', 'E06', 'E07', 'E08', 'E09', 'E11'];

export const VIEWS: ViewEntry[] = [
  // ── System states ──
  { id: 'S01', title: 'Intro load-in', kind: 'system', bq: [], feature: '—', status: 'System', purpose: 'ODIN appears: room, globe and capsules assemble with the intro pulse.', effects: ['E03', 'E06', 'E07', 'E09', 'E10'] },
  { id: 'S02', title: 'Question composer', kind: 'system', bq: [], feature: '—', status: 'System', purpose: 'Typed question or pick from the catalogue (required / all scope).', effects: [] },
  { id: 'S03', title: 'Thinking', kind: 'system', bq: [], feature: '—', status: 'System', purpose: 'The heard question is echoed while ODIN resolves the answer.', effects: [] },
  { id: 'S04', title: 'Morph transition', kind: 'system', bq: [], feature: '—', status: 'System', purpose: 'Any screen to any screen: six choreographies, particles through ODIN, morph sound.', effects: ['E01', 'E02', 'E03', 'E09'] },
  { id: 'S05', title: 'Speaking + summary', kind: 'system', bq: [], feature: '—', status: 'System', purpose: 'ODIN speaks; the spectrum wraps the focus object and the summary strip captions it.', effects: ['E03', 'E09'] },

  // ── Screens ──
  { id: 'V01', title: 'Executive Home', kind: 'screen', bq: [], feature: 'Home', status: 'Green', purpose: 'Total applications in the globe with four live KPI capsules.', effects: ['E03', 'E05', 'E06', 'E07', 'E08', 'E10'], notes: 'Card A (capsule). Data via HomeComposition props (HomeData).' },
  { id: 'V02', title: 'Applications in Processing', kind: 'screen', question: 'How many visa applications are being processed?', bq: ['BQ01'], feature: 'F05', status: 'Green', purpose: 'Live inventory in processing, today’s movement and where the queue sits.', effects: [...MORPH, 'E04', 'E05'], notes: 'Card A (capsule) board around the glass orb.' },
  { id: 'V04', title: 'Outcome Distribution', kind: 'screen', question: 'What percentage of visa applications have been closed?', bq: ['BQ26'], feature: 'F06', status: 'Green', purpose: 'Closure rate with the full status split and four headline cards.', effects: [...MORPH, 'E04'], notes: 'Card C (hero glass) headline cards.' },
  { id: 'V05', title: 'Processing Time Matrix · online', kind: 'screen', question: 'How long does it take to process a visa?', bq: ['BQ04', 'BQ07'], feature: 'F11 · F12a', status: 'Green', purpose: 'End-to-end time in ODIN, six duration cards and the stage-wise strip.', effects: [...MORPH, 'E05'], notes: 'Fixed 1920×1080 frame scaled to fit (wide). SLA shown as Not available (threshold not agreed).' },
  { id: 'V06', title: 'Processing Time Matrix · centre visits', kind: 'screen', question: 'Show the centre processing time matrix', bq: [], feature: 'F26', status: 'Red', purpose: 'The same matrix for centre visit stages.', effects: [...MORPH, 'E05'] },
  { id: 'V07', title: 'Time Matrix · focus stage', kind: 'screen', question: 'How quickly does VAS process and submit applications to ICP?', bq: ['BQ08', 'BQ09', 'BQ10'], feature: 'F23 · F24 · F25', status: 'Red', purpose: 'The matrix with one stage highlighted (VAS→ICP, with ICP, biometrics).', effects: [...MORPH, 'E05'], notes: 'Biometric split is a design preview (F25 red).' },
  { id: 'V08', title: 'VAS Revenue · v1', kind: 'screen', question: 'How much revenue is being generated?', bq: ['BQ05', 'BQ27'], feature: 'F13a · F13b', status: 'Green', purpose: 'Revenue total and breakdown by country, centre, service and nationality.', effects: [...MORPH, 'E04'], notes: 'AED shown once; ▲/▼ delta vs yesterday.' },
  { id: 'V09', title: 'Application Journey · v1', kind: 'screen', question: 'Show the online visa journey', bq: [], feature: 'F07a', status: 'Green', purpose: 'Traveller walks the online journey on the floor; each stage lights up with its metric. Both ICP reviews lead to one ICP decision, then a single Approved and a single Rejected (each with its without / after biometric split).', effects: [...MORPH, 'E04'], notes: 'Floor camera push + auto blur. Keeps its own cards (not in the A/B/C card system yet).' },
  { id: 'V12', title: 'Centre Ranking by Time', kind: 'screen', question: 'How efficiently are individual centres processing applications?', bq: ['BQ11'], feature: 'F26', status: 'Red', purpose: 'Centres ranked by average processing days.', effects: MORPH },
  { id: 'V13', title: 'Stage Queue · online', kind: 'screen', question: 'Where are applications being delayed, and which stages need attention?', bq: ['BQ13'], feature: 'F12b', status: 'Red', purpose: 'Applications waiting at each stage with age bands.', effects: [...MORPH, 'E04'], notes: 'Shows where applications wait; makes no causal claim.' },
  { id: 'V14', title: 'Stage Queue · centres', kind: 'screen', question: 'Show the centre stage queue', bq: [], feature: 'F12b', status: 'Red', purpose: 'The stage queue for centre visits.', effects: [...MORPH, 'E04'] },
  { id: 'V15', title: 'Performance Comparison', kind: 'screen', question: 'How does today\'s performance compare with yesterday?', bq: ['BQ14', 'BQ15', 'BQ16', 'BQ17'], feature: 'F14a · F14b', status: 'Green', purpose: 'Today, yesterday, last 7 days, previous 7 days and month to date.', effects: [...MORPH, 'E04'], notes: 'Weekly/monthly comparisons (F14b) are red in scope v2.' },
  { id: 'V16', title: 'Top Countries, Nationalities & Centres', kind: 'screen', question: 'Which countries or nationalities generate the most applications?', bq: ['BQ18', 'BQ22'], feature: 'F08 · F10', status: 'Green', purpose: 'Three glass leaderboards in depth (nationalities in front, countries and centres set back, each reflected on the floor): a hero #1 with its share, ranks 2–5 with bars against the leader, and the top-5 share.', effects: MORPH, notes: 'v1. Centres show counts only (attributed applications). Columns carry data-spot-key res · nat · cen. Phones stack compact panels.' },
  { id: 'V17', title: 'Top Countries on the Globe', kind: 'screen', question: 'Show top countries on the globe', bq: [], feature: 'F08', status: 'Green', purpose: '3D Earth with the top ten countries on plinths.', effects: [...MORPH, 'E04'] },
  { id: 'V18', title: 'Channels Notice', kind: 'screen', question: 'Are customers applying through physical centres or online?', bq: ['BQ21'], feature: 'F09', status: 'Amber', purpose: 'All applications are submitted online; centres handle visits only.', effects: MORPH },
  { id: 'V20', title: 'Travel Purpose Mix', kind: 'screen', question: 'Are applicants travelling for tourism, business, healthcare or other purposes?', bq: ['BQ19'], feature: 'F27', status: 'Red', purpose: 'Share of applications by recorded visa purpose.', effects: MORPH, notes: 'Post-October feature, mock values for design review.' },
  { id: 'V21', title: 'Applicant Occupation Mix', kind: 'screen', question: 'What types of applicants are using VAS services?', bq: ['BQ20'], feature: 'F28', status: 'Red', purpose: 'Share of applications by recorded occupation.', effects: MORPH, notes: 'Post-October feature, mock values for design review.' },
  { id: 'V22', title: 'Applications (focus) · v1', kind: 'screen', question: 'How many applications from India?', bq: [], feature: 'F05 · F08', status: 'Green', purpose: 'Application count for any filter, with status bars.', effects: MORPH, notes: 'Reached by free-text questions with filters (country, centre, visa type).' },
  { id: 'V23', title: 'Processing Time (focus)', kind: 'screen', question: 'Average processing time for India', bq: [], feature: 'F11', status: 'Green', purpose: 'Average processing time for any filter vs the overall average.', effects: MORPH, notes: 'Reached by free-text questions with filters.' },
  { id: 'V24', title: 'Not Available Yet', kind: 'screen', question: 'How long do applications remain with individual reviewers?', bq: ['BQ06', 'BQ12', 'BQ23', 'BQ24', 'BQ25', 'BQ28', 'BQ29', 'BQ30', 'BQ31'], feature: '—', status: 'Out', purpose: 'Honest notice: why this question cannot be answered yet and what to ask instead.', effects: MORPH },
  { id: 'V26', title: 'Application Journey · v2', kind: 'screen', question: 'Show the online visa journey v2', bq: [], feature: 'F07a', status: 'Green', purpose: 'The online journey on a glass board of jars: an application icon travels stage to stage, the arriving jar glows and its count lights up. Both ICP reviews lead to one ICP decision, then a single Approved and a single Rejected (each with its without / after biometric split).', effects: [...MORPH], notes: 'v2 of V09. Jar artwork from Figma (ODIN-October, node 18:34). Wide screens; phones and portrait use the journey layout.' },
  { id: 'V27', title: 'Application Outcomes', kind: 'screen', question: 'How many visas have been approved?', bq: ['BQ02', 'BQ03'], feature: 'F06', status: 'Green', purpose: 'Outcomes as a spiral galaxy in a dark glass portal (arms sized by share), each metric on a glossy glass card glowing in its colour; ODIN spotlights one outcome at a time.', effects: MORPH, notes: 'v2 of V03. Wide screens; phones and portrait use the v1 layout.' },
  { id: 'V28', title: 'VAS Revenue · v2', kind: 'screen', question: 'Show the VAS revenue v2', bq: ['BQ05', 'BQ27'], feature: 'F13a · F13b', status: 'Green', purpose: 'Gold revenue core, fed by neon streams from four full breakdowns of the same total (country and centre in scope; service and nationality as post-October previews).', effects: MORPH, notes: 'v2 of V08. Every panel sums to the total.' },
  { id: 'V29', title: 'Applications · v2', kind: 'screen', question: 'Show the applications v2', bq: ['BQ01', 'BQ02', 'BQ03'], feature: 'F05 · F06', status: 'Green', purpose: 'Application core: a glass orb of status-coloured lights (one per application) with a segmented status ring, approval and closure rates as gauge cards, and the status breakdown that sums to the total.', effects: MORPH, notes: 'v2 of V22. Filters (country, centre, visa type) apply. Phones/portrait stack the core and cards.' },
  { id: 'V30', title: 'Answer', kind: 'screen', question: 'How many were rejected?', bq: ['BQ01', 'BQ02', 'BQ03', 'BQ04', 'BQ05', 'BQ26'], feature: 'F16 · F17', status: 'Green', purpose: 'Answer-first: only what was asked. One metric sits inside the answer sphere (Applications v2 style: deep-blue glass, status lights) with two supporting facts; each follow-up ("and approved?") adds its card beside the globe by morph, up to three. "Full picture" opens the full page.', effects: [...MORPH, 'E12'], notes: 'Dynamic, composed from components C01–C09 (components.ts). Four or more metrics open the full page that carries most of them. Already on the full page → highlight only. States in the picker: "Answer-first states". Transitions T01–T06 (transitions.ts).' },
  { id: 'V31', title: 'Top Countries, Nationalities & Centres · v2', kind: 'screen', question: 'Show the top countries, nationalities and centres v2', bq: ['BQ18', 'BQ22'], feature: 'F08 · F10', status: 'Green', purpose: 'Skyline: five glass pillars per breakdown standing on the floor, heights by value, light particles rising slowly inside each pillar; the leader of each breakdown glows brightest.', effects: MORPH, notes: 'v2 of V16. Phones and landscape phones use glass lanes with particles flowing along them.' },
  { id: 'V32', title: 'VAS Revenue · v3', kind: 'screen', question: 'Show the VAS revenue v3', bq: ['BQ05', 'BQ27'], feature: 'F13a · F13b', status: 'Green', purpose: 'The gold revenue core in the centre on its floor beam, with two breakdown panels on each side (country and centre left; service and nationality right) feeding it through Home’s energy links.', effects: MORPH, notes: 'v3 of V08 (layout of V28). Every panel sums to the total. Tablet and phone use the v2 stacked layout.' },
  { id: 'V25', title: 'Didn’t Understand', kind: 'screen', question: 'What is the weather in Dubai?', bq: [], feature: '—', status: 'System', purpose: 'Fallback when a question is outside ODIN’s data, with suggested questions.', effects: MORPH },
];

export const viewById = (id: string) => VIEWS.find((v) => v.id.toLowerCase() === id.toLowerCase());
