export type Currency = 'EUR' | 'GBP' | 'USD';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  GBP: '£',
  USD: '$'
};

export const CURRENCY_RATES: Record<Currency, number> = {
  EUR: 1.0,
  GBP: 0.85,
  USD: 1.10
};

export function getStoredCurrency(): Currency {
  if (typeof window === 'undefined') return 'EUR';
  return (localStorage.getItem('fc24_currency') as Currency) || 'EUR';
}

export function setStoredCurrency(curr: Currency) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fc24_currency', curr);
  window.dispatchEvent(new CustomEvent('fc24_settings_change'));
}

export function getStoredScoutMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('fc24_scout_mode') === 'true';
}

export function setStoredScoutMode(enabled: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fc24_scout_mode', enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('fc24_settings_change'));
}

export function formatCurrencyWithSettings(valEur: number | null | undefined, customCurrency?: Currency): string {
  if (valEur === null || valEur === undefined || isNaN(valEur)) return '€0';
  const curr = customCurrency || getStoredCurrency();
  const symbol = CURRENCY_SYMBOLS[curr] || '€';
  const rate = CURRENCY_RATES[curr] || 1.0;
  const converted = valEur * rate;

  if (converted >= 1000000) {
    return `${symbol}${(converted / 1000000).toFixed(1)}M`;
  }
  if (converted >= 1000) {
    return `${symbol}${(converted / 1000).toFixed(0)}K`;
  }
  return `${symbol}${Math.round(converted)}`;
}
