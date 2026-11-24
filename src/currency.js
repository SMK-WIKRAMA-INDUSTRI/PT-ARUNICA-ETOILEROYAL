// Catalogue prices are stored in EUR (see src/data.js). Guests can display them
// in Indonesian Rupiah or US Dollars. These helpers are shared by the browser
// app and the server proxy, so keep them free of React / DOM dependencies.

export const CURRENCIES = ['IDR', 'USD'];

export const EUR_TO_IDR = 17500;
export const EUR_TO_USD = 1.08;

export function convertFromEur(eur, currency = 'IDR') {
  const value = Number(eur) || 0;
  if (currency === 'IDR') return Math.round((value * EUR_TO_IDR) / 500) * 500;
  if (currency === 'USD') return Math.round(value * EUR_TO_USD * 100) / 100;
  return value;
}

export function formatPrice(eur, currency = 'IDR') {
  if (currency === 'IDR') {
    return `Rp ${convertFromEur(eur, 'IDR').toLocaleString('id-ID')}`;
  }
  if (currency === 'USD') {
    return `$${convertFromEur(eur, 'USD').toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
  return `€${Math.round(Number(eur) || 0)}`;
}

export function currencySymbol(currency) {
  return currency === 'IDR' ? 'Rp' : currency === 'USD' ? '$' : '€';
}

// Rewrites any `€95` style amount inside prose into the active currency.
export function formatEuroText(text, currency) {
  if (typeof text !== 'string' || currency === 'EUR') return text;
  return String(text).replace(/€\s?(\d+(?:[.,]\d+)?)/g, (_, amount) => (
    formatPrice(Number(amount.replace(',', '.')), currency)
  ));
}
