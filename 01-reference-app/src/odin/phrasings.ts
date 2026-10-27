import type { ResponsePlan } from './composer';

/**
 * Phrasing table: how a CEO might ask, and the screen, depth and spotlight
 * ODIN answers with. Source of truth for the composer tests and the
 * acceptance table for engineering's LLM classifier (handover E12).
 *   [question, view, depth, item?]
 * Answer-first: a single metric opens the answer view (V30 · glance) and the
 * item is the asked metric(s), joined by "+". On a full page (context) the
 * item is the spotlighted element.
 */
export type PhrasingRow = [string, string, ResponsePlan['depth'], string?];

export const PHRASINGS: PhrasingRow[] = [
  // ── In processing (BQ01) ──
  ['How many applications are in processing?', 'V30', 'glance', 'in_processing'],
  ['How many are being processed right now?', 'V30', 'glance', 'in_processing'],
  ['How many visa applications are in progress', 'V30', 'glance', 'in_processing'],
  ['How big is the backlog?', 'V30', 'glance', 'in_processing'],
  ['How many are still pending?', 'V30', 'glance', 'in_processing'],
  ['Just the number of applications in processing', 'V30', 'glance', 'in_processing'],
  ['Quickly, how many are pending?', 'V30', 'glance', 'in_processing'],
  ['In processing, briefly', 'V30', 'glance', 'in_processing'],
  ['Give me the full picture of applications in processing', 'V02', 'context', 'hero'],
  ['Show me everything on applications in processing', 'V02', 'context', 'hero'],
  ['Where are the applications in processing?', 'V09', 'explore'],
  ['How many applications from India are in processing?', 'V30', 'glance', 'in_processing'],
  ['How many applications are being processed in Mumbai?', 'V30', 'glance', 'in_processing'],
  // ── Entered today ──
  ['How many new applications came in today?', 'V30', 'glance', 'entered_today'],
  ['How many applications were submitted today?', 'V30', 'glance', 'entered_today'],
  ['Just the number of new applications today', 'V30', 'glance', 'entered_today'],
  // ── Total applications ──
  ['How many applications do we have?', 'V30', 'glance', 'applications_total'],
  ['Total applications', 'V30', 'glance', 'applications_total'],
  ['How many visas have we had since launch?', 'V30', 'glance', 'applications_total'],
  ['Just give me the total', 'V30', 'glance', 'applications_total'],
  ['Applications, in a word', 'V30', 'glance', 'applications_total'],
  ['How many applications from India?', 'V30', 'glance', 'applications_total'],
  ['How many tourist visa applications?', 'V30', 'glance', 'applications_total'],
  ['Break down applications by status', 'V04', 'explore'],
  ['Tell me more about the applications', 'V04', 'explore'],
  // ── Outcomes (BQ02, BQ03) ──
  ['How many visas have been approved?', 'V30', 'glance', 'approved'],
  ['How many were granted?', 'V30', 'glance', 'approved'],
  ['How many were rejected?', 'V30', 'glance', 'rejected'],
  ['How many applications got refused?', 'V30', 'glance', 'rejected'],
  ['Only the number of rejections', 'V30', 'glance', 'rejected'],
  ['What are the outcomes?', 'V27', 'context'],
  ['Show me the decisions', 'V27', 'context'],
  ['Break down the outcomes', 'V04', 'explore'],
  ['Approved applications from India', 'V30', 'glance', 'approved'],
  ['How many approvals in more detail', 'V04', 'explore', 'approved'],
  // ── Approval rate ──
  ['What is the approval rate?', 'V30', 'glance', 'approval_rate'],
  ['What percentage of applications are approved?', 'V30', 'glance', 'approval_rate'],
  ['Success rate, quickly', 'V30', 'glance', 'approval_rate'],
  ['Approval rate for Pakistan', 'V30', 'glance', 'approval_rate'],
  // ── Closure (BQ26) ──
  ['What percentage of visa applications have been closed?', 'V30', 'glance', 'closure_rate'],
  ['What is the closure rate?', 'V30', 'glance', 'closure_rate'],
  ['Just the closure rate', 'V30', 'glance', 'closure_rate'],
  ['Closure rate for India', 'V30', 'glance', 'closure_rate'],
  ['Closure rate in more detail', 'V27', 'explore', 'closed'],
  // ── Processing time (BQ04, BQ07) ──
  ['How long does it take to process a visa?', 'V30', 'glance', 'processing_time'],
  ['What is the average processing time?', 'V30', 'glance', 'processing_time'],
  ['What is the turnaround?', 'V30', 'glance', 'processing_time'],
  ['Show me the time matrix', 'V05', 'context', 'core'],
  ['Turnaround time, quickly', 'V30', 'glance', 'processing_time'],
  ['How long for India?', 'V30', 'glance', 'processing_time'],
  ['How long do tourist visas take?', 'V30', 'glance', 'processing_time'],
  ['Which stage takes the longest?', 'V05', 'context', 'stages'],
  ['How long is each stage?', 'V05', 'context', 'stages'],
  ['Stage times in detail', 'V09', 'explore'],
  // ── Journey ──
  ['Show the online visa journey', 'V09', 'context'],
  ['Walk me through the pipeline', 'V09', 'context'],
  ['Where are the online applications?', 'V09', 'explore'],
  ['Show me the funnel', 'V09', 'context'],
  // ── Where from (BQ18, BQ22) ──
  ['Which countries generate the most applications?', 'V16', 'context', 'res'],
  ['Where do applicants come from?', 'V16', 'context', 'res'],
  ['Top countries', 'V16', 'context', 'res'],
  ['Break down applications by country', 'V17', 'explore'],
  ['Which nationalities apply the most?', 'V16', 'context', 'nat'],
  ['Top nationalities', 'V16', 'context', 'nat'],
  ['Which centres are busiest?', 'V16', 'context', 'cen'],
  ['Which centres have the most applications?', 'V16', 'context', 'cen'],
  // ── Revenue (BQ05, BQ27) ──
  ['What is our revenue?', 'V30', 'glance', 'revenue'],
  ['How much money have we made?', 'V30', 'glance', 'revenue'],
  ['Just the revenue number', 'V30', 'glance', 'revenue'],
  ['Revenue by country', 'V32', 'explore', 'countries'],
  ['Break down revenue', 'V32', 'explore', 'countries'],
  ['Which countries bring in the most revenue?', 'V32', 'context', 'countries'],
  // ── Periods (BQ14–BQ17) ──
  ["How does today's performance compare with yesterday?", 'V15', 'context', 'today'],
  ['How are we trending this week?', 'V15', 'context', 'today'],
  ['Last 7 days performance', 'V15', 'context', 'today'],
  // ── Answer-first: two or three metrics in one question; four or more → full page ──
  ['How many were approved and rejected?', 'V30', 'glance', 'approved+rejected'],
  ['Approved, rejected and in processing', 'V30', 'glance', 'approved+rejected+in_processing'],
  ['What is the approval rate and the closure rate?', 'V30', 'glance', 'approval_rate+closure_rate'],
  ['Approved, rejected, in processing and entered today', 'V27', 'context', 'approved'],
  // ── Compare ──
  ['Compare India and Pakistan', 'V24', 'explore'],
  ['India vs Nepal', 'V24', 'explore'],
];

/** Voice follow-up scripts: each line is asked after the previous answer. */
export const FOLLOW_UP_SCRIPTS: { name: string; steps: [string, string, ResponsePlan['depth'], string?][] }[] = [
  { name: 'Answer, then add, then full picture', steps: [['How many were rejected?', 'V30', 'glance', 'rejected'], ['And approved?', 'V30', 'glance', 'rejected+approved'], ['What about in processing?', 'V30', 'glance', 'rejected+approved+in_processing'], ['Full picture', 'V27', 'context']] },
  { name: 'A fourth metric opens the full page', steps: [['Approved and rejected', 'V30', 'glance', 'approved+rejected'], ['Also in processing', 'V30', 'glance', 'approved+rejected+in_processing'], ['And entered today as well', 'V27', 'context']] },
  { name: 'A new question replaces the answer', steps: [['How many were rejected?', 'V30', 'glance', 'rejected'], ['What is the closure rate?', 'V30', 'glance', 'closure_rate']] },
  { name: 'Already on screen → highlight only', steps: [['Give me the full picture of applications in processing', 'V02', 'context'], ['How many came in today?', 'V02', 'context']] },
  { name: 'More, more, less, less', steps: [['How many applications are in processing?', 'V30', 'glance'], ['Tell me more', 'V02', 'context'], ['More detail', 'V09', 'explore'], ['Less detail', 'V02', 'context'], ['Just the number', 'V30', 'glance']] },
  { name: 'Glance, then more', steps: [['Just the closure rate', 'V30', 'glance'], ['Tell me more', 'V04', 'context']] },
  { name: 'Filter keeps the subject', steps: [['How many were rejected?', 'V30', 'glance', 'rejected'], ['And for India?', 'V30', 'glance', 'rejected']] },
];
