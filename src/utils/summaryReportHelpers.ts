import type { CurrencyMode, Transaction } from '../types/finance';

export const SHORT_KHMER_MONTHS = [
  'មករា',
  'កុម្ភៈ',
  'មីនា',
  'មេសា',
  'ឧសភា',
  'មិថុនា',
  'កក្កដា',
  'សីហា',
  'កញ្ញា',
  'តុលា',
  'វិច្ឆិកា',
  'ធ្នូ',
];

export const REPORT_PALETTE = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f43f5e', // rose
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
  '#0ea5e9', // sky
];

/**
 * Converts a transaction amount to the active CurrencyMode, or null if excluded by USD_ONLY / KHR_ONLY.
 */
export function convertTxValue(
  t: Transaction,
  mode: CurrencyMode,
  exchangeRate: number
): number | null {
  const safeRate = exchangeRate > 0 ? exchangeRate : 4000;
  if (mode === 'USD_ONLY') return t.currency === 'USD' ? t.amount : null;
  if (mode === 'KHR_ONLY') return t.currency === 'KHR' ? t.amount : null;
  if (mode === 'MERGED_USD') {
    return t.currency === 'USD' ? t.amount : t.amount / safeRate;
  }
  return t.currency === 'KHR' ? t.amount : t.amount * safeRate;
}

/**
 * Formats an amount according to CurrencyMode.
 */
export function formatReportMoney(val: number, mode: CurrencyMode): string {
  const isUSD = mode === 'MERGED_USD' || mode === 'USD_ONLY';
  if (isUSD) {
    const sign = val < 0 ? '-' : '';
    return `${sign}$${Math.abs(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${Math.round(val).toLocaleString()} ៛`;
}

/**
 * Compact format for chart axes and dense multi-month matrix cells.
 */
export function formatCompactMoney(val: number, mode: CurrencyMode): string {
  if (val === 0) return '0';
  const isUSD = mode === 'MERGED_USD' || mode === 'USD_ONLY';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';

  if (isUSD) {
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`;
    return `${sign}$${abs.toFixed(0)}`;
  }
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}k`;
  return `${sign}${Math.round(abs)}`;
}

/**
 * Calculates percentage change from prev to curr, returning null if prev is 0.
 */
export function calcGrowthPct(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}
