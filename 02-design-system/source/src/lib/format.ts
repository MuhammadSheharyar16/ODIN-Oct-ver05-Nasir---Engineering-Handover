import type { Delta, Kpi } from '../data/types';

const countFmt = new Intl.NumberFormat('en-US');

/** Executive-friendly number: full digits under 10K, compact above. */
export function formatCount(n: number) {
  if (Math.abs(n) < 10_000) return countFmt.format(Math.round(n));
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function formatKpiValue(kpi: Pick<Kpi, 'format' | 'currency'>, value: number) {
  switch (kpi.format) {
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'currency':
      return `${kpi.currency ?? ''} ${formatCount(value)}`.trim();
    default:
      return formatCount(value);
  }
}

export function formatDelta(delta: Delta) {
  const sign = delta.value > 0 ? '+' : delta.value < 0 ? '−' : '±';
  const abs = Math.abs(delta.value);
  if (delta.unit === 'pp') return `${sign}${abs.toFixed(1)} pp`;
  if (delta.unit === 'percent') return `${sign}${abs.toFixed(1)}%`;
  return `${sign}${countFmt.format(abs)}`;
}

const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' });
export const formatAsOf = (d: Date) => `as of ${timeFmt.format(d)} GST`;

/** Value formatting for scene components. */
export function formatValue(v: number | null, format: 'count' | 'days' | 'percent' | 'currency'): string {
  if (v === null || Number.isNaN(v)) return '—';
  if (format === 'days') return `${v.toFixed(1)}`;
  if (format === 'percent') return `${v.toFixed(1)}%`;
  if (format === 'currency') return `AED ${formatCount(v)}`;
  return formatCount(v);
}
export const unitOf = (format: 'count' | 'days' | 'percent' | 'currency') => (format === 'days' ? 'days' : '');
