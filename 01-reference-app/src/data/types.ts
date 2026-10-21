/**
 * Answer/data contracts for the creative build. Mirrors the scene contract
 * proposed in Magic Box 04 so engineering can map it to the real API.
 */
export type DataState = 'valid' | 'zero' | 'unavailable' | 'stale' | 'error';

export type KpiFormat = 'count' | 'percent' | 'currency';

export type Delta = {
  value: number;
  unit: 'count' | 'pp' | 'percent';
  /** Plain-language comparison basis, always shown with the delta. */
  basis: string;
};

export type Kpi = {
  id: string;
  label: string;
  value: number | null;
  format: KpiFormat;
  currency?: string;
  state: DataState;
  delta?: Delta;
  /** Short qualifier under the label, e.g. period or population. */
  qualifier?: string;
  /** Shown instead of a value when state is unavailable. */
  unavailableReason?: string;
  /** Status note shown under the value when there is no delta (e.g. "Validation required"). */
  note?: string;
  /** Secondary line shown under the value when there is no delta. */
  detail?: string;
  featureIds: string[];
  kpiIds: string[];
};
