// Country to Currency mapping
export interface Country {
  name: string;
  code: string; // ISO 3166-1 alpha-2
  currency: string; // ISO 4217
  currencySymbol: string;
}

export const COUNTRIES: Country[] = [
  { name: 'United States', code: 'US', currency: 'USD', currencySymbol: '$' },
  { name: 'Canada', code: 'CA', currency: 'CAD', currencySymbol: 'C$' },
  { name: 'United Kingdom', code: 'GB', currency: 'GBP', currencySymbol: '£' },
  { name: 'Australia', code: 'AU', currency: 'AUD', currencySymbol: 'A$' },
  { name: 'New Zealand', code: 'NZ', currency: 'NZD', currencySymbol: 'NZ$' },

  // Europe - Euro
  { name: 'Austria', code: 'AT', currency: 'EUR', currencySymbol: '€' },
  { name: 'Belgium', code: 'BE', currency: 'EUR', currencySymbol: '€' },
  { name: 'Cyprus', code: 'CY', currency: 'EUR', currencySymbol: '€' },
  { name: 'Estonia', code: 'EE', currency: 'EUR', currencySymbol: '€' },
  { name: 'Finland', code: 'FI', currency: 'EUR', currencySymbol: '€' },
  { name: 'France', code: 'FR', currency: 'EUR', currencySymbol: '€' },
  { name: 'Germany', code: 'DE', currency: 'EUR', currencySymbol: '€' },
  { name: 'Greece', code: 'GR', currency: 'EUR', currencySymbol: '€' },
  { name: 'Ireland', code: 'IE', currency: 'EUR', currencySymbol: '€' },
  { name: 'Italy', code: 'IT', currency: 'EUR', currencySymbol: '€' },
  { name: 'Latvia', code: 'LV', currency: 'EUR', currencySymbol: '€' },
  { name: 'Lithuania', code: 'LT', currency: 'EUR', currencySymbol: '€' },
  { name: 'Luxembourg', code: 'LU', currency: 'EUR', currencySymbol: '€' },
  { name: 'Malta', code: 'MT', currency: 'EUR', currencySymbol: '€' },
  { name: 'Netherlands', code: 'NL', currency: 'EUR', currencySymbol: '€' },
  { name: 'Portugal', code: 'PT', currency: 'EUR', currencySymbol: '€' },
  { name: 'Slovakia', code: 'SK', currency: 'EUR', currencySymbol: '€' },
  { name: 'Slovenia', code: 'SI', currency: 'EUR', currencySymbol: '€' },
  { name: 'Spain', code: 'ES', currency: 'EUR', currencySymbol: '€' },

  // Europe - Other
  { name: 'Denmark', code: 'DK', currency: 'DKK', currencySymbol: 'kr' },
  { name: 'Czech Republic', code: 'CZ', currency: 'CZK', currencySymbol: 'Kč' },
  { name: 'Hungary', code: 'HU', currency: 'HUF', currencySymbol: 'Ft' },
  { name: 'Poland', code: 'PL', currency: 'PLN', currencySymbol: 'zł' },
  { name: 'Romania', code: 'RO', currency: 'RON', currencySymbol: 'lei' },
  { name: 'Sweden', code: 'SE', currency: 'SEK', currencySymbol: 'kr' },
  { name: 'Norway', code: 'NO', currency: 'NOK', currencySymbol: 'kr' },
  { name: 'Switzerland', code: 'CH', currency: 'CHF', currencySymbol: 'CHF' },

  // Asia
  { name: 'China', code: 'CN', currency: 'CNY', currencySymbol: '¥' },
  { name: 'Hong Kong', code: 'HK', currency: 'HKD', currencySymbol: 'HK$' },
  { name: 'India', code: 'IN', currency: 'INR', currencySymbol: '₹' },
  { name: 'Indonesia', code: 'ID', currency: 'IDR', currencySymbol: 'Rp' },
  { name: 'Japan', code: 'JP', currency: 'JPY', currencySymbol: '¥' },
  { name: 'Malaysia', code: 'MY', currency: 'MYR', currencySymbol: 'RM' },
  { name: 'Philippines', code: 'PH', currency: 'PHP', currencySymbol: '₱' },
  { name: 'Singapore', code: 'SG', currency: 'SGD', currencySymbol: 'S$' },
  { name: 'South Korea', code: 'KR', currency: 'KRW', currencySymbol: '₩' },
  { name: 'Taiwan', code: 'TW', currency: 'TWD', currencySymbol: 'NT$' },
  { name: 'Thailand', code: 'TH', currency: 'THB', currencySymbol: '฿' },
  { name: 'Vietnam', code: 'VN', currency: 'VND', currencySymbol: '₫' },

  // Middle East
  { name: 'Saudi Arabia', code: 'SA', currency: 'SAR', currencySymbol: '﷼' },
  { name: 'United Arab Emirates', code: 'AE', currency: 'AED', currencySymbol: 'د.إ' },
  { name: 'Israel', code: 'IL', currency: 'ILS', currencySymbol: '₪' },

  // Africa
  { name: 'South Africa', code: 'ZA', currency: 'ZAR', currencySymbol: 'R' },
  { name: 'Egypt', code: 'EG', currency: 'EGP', currencySymbol: 'E£' },
  { name: 'Nigeria', code: 'NG', currency: 'NGN', currencySymbol: '₦' },

  // Americas
  { name: 'Brazil', code: 'BR', currency: 'BRL', currencySymbol: 'R$' },
  { name: 'Chile', code: 'CL', currency: 'CLP', currencySymbol: '$' },
  { name: 'Colombia', code: 'CO', currency: 'COP', currencySymbol: '$' },
  { name: 'Mexico', code: 'MX', currency: 'MXN', currencySymbol: '$' },
  { name: 'Argentina', code: 'AR', currency: 'ARS', currencySymbol: '$' },
];

// Create a map for quick lookup
const countryMap = new Map<string, Country>();
COUNTRIES.forEach(country => {
  countryMap.set(country.code, country);
});

export const getCountryByCode = (code: string): Country | undefined => {
  return countryMap.get(code);
};

export const getCurrencyByCountry = (countryCode: string): string => {
  return countryMap.get(countryCode)?.currency || 'USD';
};

// Sorted by name for dropdown
export const COUNTRIES_SORTED = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
