import type { FloorData } from '../ui/scene/components/floorJourney';
/**
 * Scene specs: the contract between the answer engine (what to show and
 * say), the composer (where it goes) and the component library (how it
 * looks). Engineering maps real AI-team payloads onto these same types.
 */
import type { Channel, Filters, StageIcon } from './vas';

export type ValueFormat = 'count' | 'days' | 'percent' | 'currency';
export type IconName =
  | 'people'
  | 'applications' | 'clock' | 'approved' | 'rejected' | 'closure' | 'processing' | 'globe' | 'centre'
  | 'revenue' | 'compare' | 'ranking' | 'online' | 'info' | StageIcon;

export type Delta = { value: number; unit: 'count' | 'pp' | 'percent' | 'days'; basis: string; /** 'none': no judgement (neutral colour), e.g. rejections. */ goodWhen?: 'up' | 'down' | 'none' };

export type MetricSpec = {
  kind: 'metric';
  key: string;
  label: string;
  value: number | null;
  format: ValueFormat;
  icon: IconName;
  accent: string;
  delta?: Delta;
  caption?: string;
  hero?: boolean;
  /** Optional mini chart drawn in the card. */
  spark?: { kind: 'bars' | 'line'; values: number[] };
  unavailableReason?: string;
  /** Tinted glass KPI tile (icon badge, white ink, chevron). */
  tile?: boolean;
  /** Follow-up question asked when the tile's chevron is pressed. */
  ask?: string;
  /** C · hero glass: glossy capsule glass carrying the chart, for a page's headline cards. */
  card?: 'hero';
};

/** Status legend grid (2×2 glass pills) under a distribution ring. */
export type LegendSpec = {
  kind: 'legend';
  key: string;
  items: { key: string; label: string; count: number; share: number; accent: string; ask?: string }[];
};

export type JourneySpec = {
  kind: 'journey';
  key: string;
  channel: Channel;
  stages: { key: string; label: string; sub?: string; icon: StageIcon; accent: string; count: number; days: number; delta?: number; unavailable?: boolean }[];
  approved: { count: number; days: number; delta?: number };
  rejected: { count: number; days: number; delta?: number; unavailable?: boolean };
  /** Outcome labels (default Approved / Rejected; centre visits: Visit completed / Missed). */
  outcomeLabels?: { good: string; bad: string; goodShort?: string; badShort?: string };
  /** Stage with the most applications currently waiting (factual emphasis). */
  emphasisKey?: string;
  /** Tag on the emphasised stage (default "Most waiting now"). */
  emphasisLabel?: string;
  /** Floor journey data (online map incl. biometric branch). Wide screens render it on the floor. */
  floor?: FloorData;
  /** Cinematic floor journey: 'v45' = Online Visa Journey v4.5 (V39). */
  cinema?: 'v45';
  /** Heading drawn inside the v2 jar board. */
  heading?: { title: string; subtitle: string };
};

export type DonutSpec = {
  kind: 'donut';
  key: string;
  total: number;
  totalLabel: string;
  segments: { key: string; label: string; count: number; accent: string }[];
  basis: string;
  /** No callouts: the legend is a separate component. */
  clean?: boolean;
  /** 'galaxy' (Application Outcomes v2, wide): spiral galaxy in a dark portal, glass metric cards.
   *  'cards' (Application Outcomes v1): 3D donut around the application core, four hero-glass cards. */
  variant?: 'galaxy' | 'cards';
  /** Replaces the total in the ring's centre (e.g. the closure rate the screen answers). */
  centre?: { value: number; label: string; caption?: string };
  /** Closure rate pill shown under the galaxy ring. */
  closure?: { value: number; basis: string };
};

export type RankingSpec = {
  kind: 'ranking';
  key: string;
  title: string;
  basis: string;
  format: ValueFormat;
  items: { key: string; code?: string; label: string; sub?: string; value: number }[];
  /** Index highlighted (e.g. the leader or the item asked about). */
  highlight?: number;
  accent: string;
};


export type BarsSpec = {
  kind: 'bars';
  key: string;
  title: string;
  basis: string;
  format: ValueFormat;
  items: { key: string; label: string; value: number }[];
  accent: string;
};


export type NoticeSpec = {
  kind: 'notice';
  key: string;
  title: string;
  text: string;
  suggestions: string[];
};

export type TimeMatrixSpec = {
  kind: 'timeMatrix';
  key: string;
  scopeLabel: string;
  avg: number;
  avgDelta: number;
  median: number;
  medianDelta: number;
  p90: number;
  applications: number;
  hourly: number[];
  fastest: { label: string; days: number };
  longest: { label: string; days: number };
  stages: { key: string; label: string; icon: StageIcon; accent: string; days: number }[];
  /** Highlighted stage (for stage-specific questions). */
  focusStage?: string;
  tabs: { label: string; ask: string; active?: boolean }[];
  /** Ring around the centre readout (0–1); decorative frame when undefined. */
  sla?: number | null;
  /** Online matrix: biometric-branch stage times are a design preview (F25 red). */
  previewNote?: string;
};


/** `share`: the column's items are shares of all applications (centres are attributed applications only, so no share). */
export type PodiumColumn = { key: string; title: string; sub: string; icon: IconName; accent: string; share?: boolean; items: { label: string; code?: string; value: number; sub?: string }[] };
/** Leaderboards (V16). `total` = all applications (for shares). */
export type PodiumsSpec = { kind: 'podiums'; key: string; columns: PodiumColumn[]; total?: number };

export type GeoSpec = {
  kind: 'geo';
  key: string;
  heading: string;
  subheading: string;
  basis: string;
  period: string;
  items: { code: string; name: string; value: number; delta: number; lat: number; lon: number }[];
  /** 'sides' = Top 10 Countries v2 (V40): ranks 1–5 down the left, 6–10 down the right, the Earth centred. */
  layout?: 'sides';
};

export type RevenueSpec = {
  kind: 'revenue';
  key: string;
  preview: boolean;
  /** v2: values shown, flagged "validation required" until AEGI Finance approves the definition. */
  validation?: boolean;
  amount: number | null;
  delta: number | null;
  dims: { key: string; label: string; share: number; accent: string; value: number | null; bars: number[]; top: { name: string; value: number }[] }[];
  /** v2 (revenue core): each dimension is a full breakdown of the same total. */
  breakdowns?: RevenueBreakdown[];
};

export type RevenueBreakdown = {
  key: string;
  title: string;
  sub: string;
  accent: string;
  /** Post-October dimension shown as a labelled design preview. */
  preview?: boolean;
  rows: { name: string; share: number; value: number }[];
  rest: { label: string; share: number; value: number };
};

export type PeriodsSpec = {
  kind: 'periods';
  key: string;
  items: { key: string; label: string; value: number; cmp: string; delta: number | null; accent: string; approval: number; days: number; approvalDelta: number | null; daysDelta: number | null }[];
};



/** Home-style board: ODIN globe readout, four capsules, stage row (Applications in processing). */
export type BoardSpec = {
  kind: 'board';
  key: string;
  hero: { value: number; label: string; delta: number; deltaBasis: string; caption: string };
  /** 'glass': a calm glass sphere replaces ODIN's globe for this answer. */
  orb?: 'glass';
  capsules: { id: string; label: string; value: number; format: 'count' | 'percent'; accent: string; icon: 'entered' | 'approved' | 'closure' | 'revenue'; delta?: { value: number; unit: 'count' | 'pp' | 'percent'; basis: string }; detail?: string }[];
  stagesTitle: string;
  stages: { key: string; label: string; count: number; share: number; accent: string; top?: boolean }[];
};

/** Glance answer (composer depth 1): one KPI inside ODIN's core, with two supporting facts. */
export type GlanceSpec = {
  kind: 'glance';
  key: string;
  label: string;
  value: number;
  format: ValueFormat;
  accent: string;
  caption?: string;
  facts: { label: string; value: string }[];
  /** Answer-first: the hero's composer measure, and the other asked metrics (cards beside ODIN). */
  item?: string;
  more?: { item: string; label: string; value: number; format: ValueFormat; accent: string; caption?: string }[];
  /** The sphere's lights (Applications v2 style): one light per application, coloured by status (gold for revenue). */
  lights?: { key: string; label: string; count: number; accent: string }[];
};

export type ComponentSpec =
  | BoardSpec | LegendSpec | MetricSpec | JourneySpec | DonutSpec | RankingSpec | BarsSpec | NoticeSpec
  | TimeMatrixSpec | PodiumsSpec | GeoSpec | RevenueSpec | PeriodsSpec | AppCoreSpec | GlanceSpec;

/** Applications v2: application core (status-coloured lights + segmented ring) with rate cards and status breakdown. */
export type AppCoreSpec = {
  kind: 'appcore';
  key: string;
  total: number;
  caption: string;
  segments: { key: string; label: string; count: number; accent: string }[];
  approval: { rate: number; approved: number; decided: number };
  closure: { rate: number; closed: number };
};

/** Where ODIN's globe goes in this scene. */
export type PresenceMode = 'home' | 'core' | 'dissolved';

export type Template = 'glance' | 'band' | 'floor' | 'galaxy' | 'revenue' | 'appcore' | 'board' | 'matrix' | 'focus' | 'notice' | 'stage' | 'ringCards';

export type Placed = { spec: ComponentSpec; slot: string };

export type Intent =
  | { type: 'home' }
  | { type: 'back' }
  | { type: 'journey'; channel: Channel; filters: Filters; /** 'cinema45' = Online Visa Journey v4.5 (V39). */ style?: 'cinema45' }
  | { type: 'outcomes'; filters: Filters; /** 'galaxy' = Application Outcomes v2. */ style?: 'galaxy' }
  | { type: 'time'; filters: Filters }
  | { type: 'count'; filters: Filters; /** 'core' = Applications v2. */ style?: 'core' }
  | { type: 'ranking'; dimension: 'country' | 'centre' | 'visaType'; measure: 'applications' | 'approvalRate' | 'avgDays'; order: 'desc' | 'asc'; filters: Filters }
  | { type: 'compare'; entities: { kind: 'country' | 'centre' | 'visaType' | 'channel'; key: string }[]; filters: Filters }
  | { type: 'revenue'; filters: Filters; preview?: boolean; breakdown?: boolean }
  | { type: 'processing' }
  | { type: 'timeMatrix'; channel: Channel | 'all'; filters: Filters; stage?: string }
  | { type: 'queue'; channel: Channel }
  | { type: 'periods' }
  | { type: 'channels' }
  | { type: 'tops' }
  /** Answer-first view (V30): only the asked metric(s), 1–3 composer measures, each read from its own screen. */
  | { type: 'answer'; items: string[]; filters: Filters }
  | { type: 'geo'; /** 'sides' = Top 10 Countries v2 (V40). */ style?: 'sides' }
  | { type: 'outcomeDist' }
  | { type: 'mix'; dim: 'purpose' | 'occupation' }
  | { type: 'journeyMap' }
  | { type: 'outOfScope'; bq: string; title: string; reason: string }
  | { type: 'unsupported'; text: string };

export type SceneAnswer = {
  id: string;
  intent: Intent;
  template: Template;
  title: string;
  subtitle: string;
  components: Placed[];
  focusKey: string;
  presence: PresenceMode;
  /** 'floor': the camera pushes onto the interior floor and the environment stays sharp.
   *  'low': a gentle tilt down so cards can stand on the floor (Top countries v1). */
  env?: 'floor' | 'low';
  /** Backdrop blur this screen asks for (src/lib/backdrop.ts): 'dof' exterior lens blur, 'full' both layers. Default sharp. */
  backdrop?: 'none' | 'dof' | 'full';
  /** Exactly what ODIN says — also what the summary strip highlights. */
  spoken: string;
  summary: { primary: string; secondary: string };
  /** Composer spotlight: the item the question asked about (screens mark items with data-spot-key). */
  spot?: string;
  /** Answer view: the spectrum follows ODIN's words, one beat per metric ('globe' = the sphere, else a card's spot key). */
  beats?: { target: string; words: number }[];
  /** Composer depth that produced this scene (free-text questions only). */
  depth?: 'glance' | 'context' | 'explore';
};
