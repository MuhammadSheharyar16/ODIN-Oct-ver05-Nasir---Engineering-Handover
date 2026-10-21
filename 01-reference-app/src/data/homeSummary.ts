import { useHomeFeed } from './homeFeed';
import { formatCount } from '../lib/format';

/**
 * Home summary sentences — the words ODIN speaks for the Executive Home.
 * Composed only from displayed values: observation, no cause, no forecast.
 */
export function composeHomeSummary(s: ReturnType<typeof useHomeFeed.getState>) {
  const [, entered, approved] = s.orbs;
  const diff = entered.delta?.value ?? 0;
  const diffText =
    diff === 0
      ? 'the same as yesterday at this time'
      : `${formatCount(Math.abs(diff))} ${diff > 0 ? 'more' : 'fewer'} than yesterday at this time`;
  const primary = `${formatCount(s.inProcessing)} applications are currently in processing.`;
  const secondary = `${formatCount(entered.value ?? 0)} entered processing today, ${diffText}. ${formatCount(
    approved.value ?? 0,
  )} have been approved today.`;
  return {
    primary,
    secondary,
    spoken: `${primary} ${secondary}`,
    compactPrimary: `${formatCount(s.inProcessing)} applications in processing now.`,
    compactSecondary: `${formatCount(entered.value ?? 0)} entered today (${diff >= 0 ? '+' : '−'}${formatCount(
      Math.abs(diff),
    )} vs yesterday) · ${formatCount(approved.value ?? 0)} approved`,
  };
}

export function useHomeSummary() {
  useHomeFeed((s) => s.asOf);
  return composeHomeSummary(useHomeFeed.getState());
}
