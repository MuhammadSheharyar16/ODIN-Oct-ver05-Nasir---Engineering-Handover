import type { Measure } from './composer';

/**
 * Component catalogue (answer-first). Every card, sphere and metric ODIN can
 * show has an ID. The answer view composes C01–C09 (one to three of them); the
 * full pages are made of the rest. `queries` is the data cost: how many
 * queries against the applications data the component needs on its own
 * (shared queries are counted once per screen by engineering).
 */
export type ComponentEntry = {
  id: string;
  name: string;
  /** The single metric it answers (answer cards only). */
  measure?: Measure;
  shows: string;
  /** Screens it appears on (V… ids, see views.ts). */
  on: string[];
  queries: number;
  /** What the query is, in plain terms. */
  query: string;
};

export const COMPONENTS: ComponentEntry[] = [
  // ── Answer cards: the hero (inside ODIN's globe) or a supporting card beside it ──
  { id: 'C01', name: 'Total applications', measure: 'applications_total', shows: 'All applications to date (or for a filter)', on: ['V30', 'V01', 'V29', 'V27'], queries: 1, query: 'count(applications) [where filter]' },
  { id: 'C02', name: 'In processing', measure: 'in_processing', shows: 'Open applications awaiting a final decision', on: ['V30', 'V01', 'V02', 'V27'], queries: 1, query: 'count(applications where status is open)' },
  { id: 'C03', name: 'Entered today', measure: 'entered_today', shows: 'Applications that entered processing today', on: ['V30', 'V01', 'V02'], queries: 1, query: 'count(applications where submitted = today)' },
  { id: 'C04', name: 'Approved', measure: 'approved', shows: 'Applications approved to date', on: ['V30', 'V27', 'V29'], queries: 1, query: 'count(applications where status = approved)' },
  { id: 'C05', name: 'Rejected', measure: 'rejected', shows: 'Applications rejected to date', on: ['V30', 'V27', 'V29'], queries: 1, query: 'count(applications where status = rejected)' },
  { id: 'C06', name: 'Approval rate', measure: 'approval_rate', shows: 'Approved as a share of decided applications', on: ['V30', 'V29'], queries: 2, query: 'approved ÷ (approved + rejected)' },
  { id: 'C07', name: 'Closure rate', measure: 'closure_rate', shows: 'Closed applications as a share of all applications', on: ['V30', 'V01', 'V04', 'V29'], queries: 2, query: 'closed ÷ count(applications)' },
  { id: 'C08', name: 'Processing time', measure: 'processing_time', shows: 'Average days from submission to decision', on: ['V30', 'V05', 'V23'], queries: 1, query: 'avg(decided_at − submitted_at) over decided applications' },
  { id: 'C09', name: 'VAS revenue', measure: 'revenue', shows: 'Total VAS revenue to date (AED)', on: ['V30', 'V01', 'V08', 'V28'], queries: 1, query: 'sum(VAS fees)' },
  // ── Full-page components ──
  { id: 'C10', name: 'Status ring', shows: 'Approved, rejected, closed (other) and in processing as one ring', on: ['V04', 'V29'], queries: 1, query: 'count(applications) group by status' },
  { id: 'C11', name: 'Outcome galaxy', shows: 'Outcomes as spiral arms sized by share, with four glass cards', on: ['V27'], queries: 1, query: 'count(applications) group by status' },
  { id: 'C12', name: 'Processing board', shows: 'In processing, entered today, closed today and where they wait', on: ['V02'], queries: 3, query: 'open count · entered today · closed today · open group by stage' },
  { id: 'C13', name: 'Time matrix', shows: 'End-to-end time, six duration cards and the stage strip', on: ['V05', 'V06', 'V07'], queries: 2, query: 'duration percentiles · avg duration group by stage' },
  { id: 'C14', name: 'Journey', shows: 'Each stage of the online journey with its count', on: ['V09', 'V26'], queries: 1, query: 'count(applications) group by current stage' },
  { id: 'C15', name: 'Leaderboard', shows: 'Top five with the leader’s share (countries, nationalities or centres)', on: ['V16', 'V31', 'V17'], queries: 1, query: 'count(applications) group by dimension, top 5' },
  { id: 'C16', name: 'Revenue breakdown', shows: 'Revenue by country, centre, service and nationality', on: ['V08', 'V28'], queries: 2, query: 'sum(VAS fees) group by country · by centre' },
  { id: 'C17', name: 'Period comparison', shows: 'Today, yesterday, last 7 days, previous 7 days, month to date', on: ['V15'], queries: 1, query: 'count(applications) group by period bucket' },
];

export const componentFor = (m: Measure) => COMPONENTS.find((c) => c.measure === m);
