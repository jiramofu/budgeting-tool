// Currency formatting utility
import { getCountryByCode, getCurrencyByCountry } from './countries';

export interface CurrencyFormat {
  symbol: string;
  code: string;
  position: 'before' | 'after';
  separator: string;
}

const CURRENCY_FORMATS: { [key: string]: CurrencyFormat } = {
  USD: { symbol: '$', code: 'USD', position: 'before', separator: ',' },
  EUR: { symbol: '€', code: 'EUR', position: 'after', separator: '.' },
  GBP: { symbol: '£', code: 'GBP', position: 'before', separator: ',' },
  JPY: { symbol: '¥', code: 'JPY', position: 'before', separator: ',' },
  INR: { symbol: '₹', code: 'INR', position: 'before', separator: ',' },
  BRL: { symbol: 'R$', code: 'BRL', position: 'before', separator: ',' },
  CAD: { symbol: 'C$', code: 'CAD', position: 'before', separator: ',' },
  AUD: { symbol: 'A$', code: 'AUD', position: 'before', separator: ',' },
  NGN: { symbol: '₦', code: 'NGN', position: 'before', separator: ',' },
  ZAR: { symbol: 'R', code: 'ZAR', position: 'before', separator: ',' },
  CHF: { symbol: 'CHF', code: 'CHF', position: 'before', separator: ',' },
  SEK: { symbol: 'kr', code: 'SEK', position: 'after', separator: ',' },
  NOK: { symbol: 'kr', code: 'NOK', position: 'after', separator: ',' },
  DKK: { symbol: 'kr', code: 'DKK', position: 'after', separator: ',' },
  CNY: { symbol: '¥', code: 'CNY', position: 'before', separator: ',' },
  HKD: { symbol: 'HK$', code: 'HKD', position: 'before', separator: ',' },
  MYR: { symbol: 'RM', code: 'MYR', position: 'before', separator: ',' },
  SGD: { symbol: 'S$', code: 'SGD', position: 'before', separator: ',' },
  KRW: { symbol: '₩', code: 'KRW', position: 'before', separator: ',' },
  THB: { symbol: '฿', code: 'THB', position: 'before', separator: ',' },
  VND: { symbol: '₫', code: 'VND', position: 'before', separator: ',' },
  IDR: { symbol: 'Rp', code: 'IDR', position: 'before', separator: ',' },
  PHP: { symbol: '₱', code: 'PHP', position: 'before', separator: ',' },
  MXN: { symbol: '$', code: 'MXN', position: 'before', separator: ',' },
  ARS: { symbol: '$', code: 'ARS', position: 'before', separator: ',' },
  CLP: { symbol: '$', code: 'CLP', position: 'before', separator: ',' },
  COP: { symbol: '$', code: 'COP', position: 'before', separator: ',' },
  CZK: { symbol: 'Kč', code: 'CZK', position: 'after', separator: ',' },
  HUF: { symbol: 'Ft', code: 'HUF', position: 'after', separator: ',' },
  PLN: { symbol: 'zł', code: 'PLN', position: 'after', separator: ',' },
  RON: { symbol: 'lei', code: 'RON', position: 'after', separator: ',' },
  EGP: { symbol: 'E£', code: 'EGP', position: 'before', separator: ',' },
  SAR: { symbol: '﷼', code: 'SAR', position: 'before', separator: ',' },
  AED: { symbol: 'د.إ', code: 'AED', position: 'before', separator: ',' },
  ILS: { symbol: '₪', code: 'ILS', position: 'before', separator: ',' },
  NZD: { symbol: 'NZ$', code: 'NZD', position: 'before', separator: ',' },
  TWD: { symbol: 'NT$', code: 'TWD', position: 'before', separator: ',' },
};

/**
 * Format a number as currency with proper symbol and localization
 * @param amount - The amount to format
 * @param currencyCode - ISO 4217 currency code (e.g., 'USD', 'EUR')
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string (e.g., '$1,234.56')
 */
export const formatCurrency = (
  amount: number | string,
  currencyCode: string = 'USD',
  decimals: number = 2
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return '0.00';
  }

  const format = CURRENCY_FORMATS[currencyCode] || CURRENCY_FORMATS.USD;

  // Format the number with thousands separator and decimals
  const formatted = numAmount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  // Position symbol before or after
  if (format.position === 'before') {
    return `${format.symbol}${formatted}`;
  } else {
    return `${formatted} ${format.symbol}`;
  }
};

/**
 * Format a number as compact currency (e.g., $1.2K, $1.5M)
 * @param amount - The amount to format
 * @param currencyCode - ISO 4217 currency code
 * @returns Formatted compact currency string
 */
export const formatCurrencyCompact = (amount: number, currencyCode: string = 'USD'): string => {
  const format = CURRENCY_FORMATS[currencyCode] || CURRENCY_FORMATS.USD;

  let compact: string;
  if (amount >= 1000000) {
    compact = (amount / 1000000).toFixed(1) + 'M';
  } else if (amount >= 1000) {
    compact = (amount / 1000).toFixed(1) + 'K';
  } else {
    compact = amount.toFixed(2);
  }

  if (format.position === 'before') {
    return `${format.symbol}${compact}`;
  } else {
    return `${compact} ${format.symbol}`;
  }
};

/**
 * Get currency symbol from currency code
 */
export const getCurrencySymbol = (currencyCode: string): string => {
  return CURRENCY_FORMATS[currencyCode]?.symbol || currencyCode;
};

/**
 * Get currency code from country code
 */
export const getCurrencyFromCountry = (countryCode: string): string => {
  return getCurrencyByCountry(countryCode);
};
