# OAuth Country & Currency Integration

## Overview
This document describes the implementation of country-based currency assignment for OAuth signups (Google and Apple).

## Changes Made

### Backend (`backend/src/routes/auth.ts`)

#### New Functions

1. **`getCountryFromLocale(locale: string): string`**
   - Converts OAuth locale strings (e.g., "en-US", "de-DE") to ISO 3166-1 alpha-2 country codes
   - Uses `LOCALE_COUNTRY_MAP` for exact matches
   - Falls back to language-only matching (e.g., "en" → "en-US" → "US")
   - Default fallback: "US"

2. **`LOCALE_COUNTRY_MAP`**
   - Maps 80+ common locale strings to country codes
   - Supports language variants (e.g., Spanish, Chinese, Portuguese variants)
   - Enables intelligent country detection from browser/OAuth payload locale

#### Updated OAuth Endpoints

**POST `/auth/google`**
- Now accepts optional `locale` parameter from frontend
- Extracts country from locale using `getCountryFromLocale()`
- Initializes new users with correct currency via `initializeUserSettingsWithCurrency()`
- Logging shows: locale → country → currency determination

**POST `/auth/apple`**
- Now accepts optional `locale` parameter from frontend (since Apple doesn't provide location in token)
- Uses same country/currency logic as Google OAuth
- Requires frontend to pass locale/country

### Frontend (`frontend/src/pages/SignupPage.tsx`)

#### Enhanced Google OAuth Handler

```typescript
const handleGoogleSignup = async () => {
  // Get browser locale
  const browserLocale = navigator.language || 'en-US';

  // Send locale to backend along with idToken
  const res = await apiClient.post('/auth/google', {
    idToken: response.credential,
    locale: browserLocale
  });

  // Save currency to localStorage based on country selection from form
  const countryData = COUNTRIES_SORTED.find(c => c.code === country);
  if (countryData) {
    localStorage.setItem('userSettings', JSON.stringify({
      currency: countryData.currency,
      theme: 'light',
      language: 'en',
    }));
  }
}
```

## Workflow

### Regular Signup
1. User selects country from dropdown
2. Form submitted with `country` parameter
3. Backend uses country code to get currency via `getCurrencyForCountry()`
4. `initializeUserSettingsWithCurrency()` creates user_settings with correct currency

### Google OAuth Signup
1. User clicks "Sign up with Google"
2. Browser's locale detected: `navigator.language` (e.g., "en-US")
3. Google callback receives credential and passes locale to backend
4. Backend determines country from locale using `getCountryFromLocale()`
5. User initialized with correct currency
6. Frontend uses country selector value to save currency to localStorage

### Apple OAuth Signup
1. User clicks "Sign up with Apple"
2. Browser's locale detected and sent to backend
3. Backend determines country from locale
4. User initialized with correct currency
5. Frontend uses country selector value to save currency to localStorage

## Locale to Country Mapping Examples

| Locale | Country | Currency |
|--------|---------|----------|
| en-US | US | USD |
| en-GB | GB | GBP |
| de-DE | DE | EUR |
| fr-FR | FR | EUR |
| ja-JP | JP | JPY |
| zh-CN | CN | CNY |
| pt-BR | BR | BRL |
| es-MX | MX | MXN |
| unknown/missing | US | USD (fallback) |

## Database Impact

No schema changes required. Existing `user_settings` table is used:
- `currency` column stores ISO 4217 code (e.g., "USD", "GBP", "EUR")
- Determined from locale at signup time
- Can be changed later in Settings page

## Testing Checklist

- [ ] Google OAuth signup creates user with correct currency based on browser locale
- [ ] Apple OAuth signup creates user with correct currency based on browser locale
- [ ] Country dropdown in signup form correctly selects currency
- [ ] Regular email/password signup with country selection works
- [ ] Multiple signups from different locales produce different currencies
- [ ] Fallback to USD works when locale cannot be determined
- [ ] Dashboard displays correct currency symbol for different users
- [ ] Currency persists across page reloads

## Future Enhancements

1. **Geo-IP Detection**: Automatically detect country from user's IP on first visit
2. **Timezone Alignment**: Detect timezone and suggest appropriate country
3. **Multi-Currency Support**: Allow users to display balances in multiple currencies
4. **Smart Locale Matching**: Use more sophisticated locale matching (e.g., phonetic similarity)
5. **Locale Preferences**: Save user's preferred locale for future logins
