# End-to-End Currency Testing Plan

## Test Scope
Verify that currency selection, display, and persistence work correctly across all pages of the budgeting application.

---

## Test Suite 1: Settings Page - Currency Selection

### Test 1.1: Load Settings Page
**Steps:**
1. Log in with an existing user account
2. Navigate to Settings page
3. Locate currency selector dropdown

**Expected Result:**
- Settings page loads without errors
- Currency selector displays current currency
- All available currencies are listed

**Status:** ⏳ Pending

---

### Test 1.2: Change Currency from USD to GBP
**Steps:**
1. On Settings page, current currency is USD
2. Click currency dropdown
3. Select "GBP - British Pound"
4. Click Save/Confirm button
5. Wait for save confirmation

**Expected Result:**
- Save success message appears
- Currency selector shows "GBP"
- localStorage `userSettings.currency` = "GBP"
- Page remains on Settings

**Status:** ⏳ Pending

---

### Test 1.3: Change Currency from GBP to JPY
**Steps:**
1. On Settings page, current currency is GBP
2. Click currency dropdown
3. Select "JPY - Japanese Yen"
4. Click Save button
5. Wait for confirmation

**Expected Result:**
- Save succeeds
- Currency selector shows "JPY"
- localStorage updated to "JPY"

**Status:** ⏳ Pending

---

## Test Suite 2: Currency Persistence Across Pages

### Test 2.1: Dashboard Shows Updated Currency (USD → EUR)
**Steps:**
1. User logged in with USD currency
2. Navigate to Settings, change to EUR
3. Navigate back to Dashboard
4. Check all monetary values

**Expected Result:**
- All prices display with € symbol
- No $ symbols visible
- Formatting matches EUR (e.g., "1.234,56" in some locales or "1,234.56" based on locale)
- Re-render happens automatically

**Status:** ⏳ Pending

---

### Test 2.2: Budget Page Shows Updated Currency
**Steps:**
1. Change currency to AUD in Settings
2. Navigate to Budget Management page
3. Check:
   - Total Budget
   - Total Spent
   - Remaining amount
   - Category budget targets
   - Progress bars (values should be in AUD)

**Expected Result:**
- All values display with A$ symbol
- Currency formatting is consistent
- Numbers are formatted correctly (thousands separator, decimals)

**Status:** ⏳ Pending

---

### Test 2.3: Transactions Page Shows Updated Currency
**Steps:**
1. Currency set to CAD in Settings
2. Navigate to Transactions page
3. Check:
   - Transaction amounts
   - Category totals
   - Filter results
   - Export preview (if available)

**Expected Result:**
- All transaction amounts display in CAD (C$)
- Consistent formatting across all transaction displays
- Category summaries use CAD

**Status:** ⏳ Pending

---

### Test 2.4: Reports Page Shows Updated Currency
**Steps:**
1. Currency set to INR in Settings
2. Navigate to Reports page
3. Check:
   - Total Spending card
   - Total Income card
   - Net Change card
   - Daily Average card
   - Chart tooltips
   - Export data

**Expected Result:**
- All monetary values show ₹ symbol
- Numbers formatted with Indian number system (if applicable)
- Charts display currency correctly
- PDF/Excel export uses INR

**Status:** ⏳ Pending

---

### Test 2.5: Bills Page Shows Updated Currency
**Steps:**
1. Currency set to MXN in Settings
2. Navigate to Bills page
3. Check:
   - Summary cards (Total Upcoming, Due This Month)
   - Bill amounts in table
   - Individual bill details

**Expected Result:**
- All bill amounts display in $ (Mexican Peso)
- Summary cards use MXN formatting
- Table amounts consistent

**Status:** ⏳ Pending

---

### Test 2.6: Goals Page Shows Updated Currency
**Steps:**
1. Currency set to BRL in Settings
2. Navigate to Goals page
3. Check:
   - Total Saved summary
   - Goal amounts
   - Goal progress amounts
   - Goal targets

**Expected Result:**
- All values display in R$ (Brazilian Real)
- Formatting consistent across page
- No mixed currency symbols

**Status:** ⏳ Pending

---

## Test Suite 3: Browser Refresh Persistence

### Test 3.1: Currency Persists After Page Reload (Settings → Dashboard)
**Steps:**
1. Log in with USD
2. Change to CHF in Settings, save
3. Refresh browser (F5)
4. Navigate to Dashboard
5. Check currency display

**Expected Result:**
- After refresh, currency is still CHF
- Dashboard shows CHF symbols
- No default back to USD

**Status:** ⏳ Pending

---

### Test 3.2: Currency Persists After Multiple Page Navigation
**Steps:**
1. Currency set to SEK
2. Navigate: Dashboard → Budgets → Transactions → Reports → Bills → Goals
3. Each page should show SEK
4. Refresh browser mid-navigation
5. Check currency still SEK

**Expected Result:**
- All pages show SEK throughout navigation
- Refresh doesn't reset currency
- No flickering or loading different currency

**Status:** ⏳ Pending

---

## Test Suite 4: Signup Flow - Country Selection

### Test 4.1: Regular Signup with Country Selection (US)
**Steps:**
1. Navigate to Signup page
2. Fill form: email, password, country = "United States"
3. Submit form
4. After successful signup, check localStorage

**Expected Result:**
- User created successfully
- Redirected to Dashboard
- localStorage `userSettings.currency` = "USD"
- Dashboard displays USD

**Status:** ⏳ Pending

---

### Test 4.2: Regular Signup with Country Selection (Japan)
**Steps:**
1. Navigate to Signup page
2. Fill form: email, password, country = "Japan"
3. Submit form
4. Check currency

**Expected Result:**
- User created with JPY
- Dashboard displays ¥ symbol
- All pages show JPY

**Status:** ⏳ Pending

---

### Test 4.3: Regular Signup with Various Countries
**Test data:**
- Germany → EUR
- Brazil → BRL
- Australia → AUD
- Mexico → MXN
- South Africa → ZAR

**Steps for each:**
1. Sign up with selected country
2. Check that backend initializes correct currency
3. Verify dashboard displays correct symbol

**Expected Result:**
- Each user gets correct currency for their country
- All formatting matches currency rules

**Status:** ⏳ Pending

---

## Test Suite 5: OAuth Signup - Currency Determination

### Test 5.1: Google OAuth Signup - US Browser Locale
**Steps:**
1. Browser locale is "en-US"
2. Click "Sign up with Google"
3. Complete Google authentication
4. Check currency in Dashboard

**Expected Result:**
- User created with USD (from en-US locale)
- Dashboard shows USD
- Correct currency persists

**Status:** ⏳ Pending

---

### Test 5.2: Google OAuth Signup - German Browser Locale
**Steps:**
1. Browser locale is "de-DE"
2. Google OAuth signup
3. Check currency

**Expected Result:**
- User created with EUR
- Dashboard shows €

**Status:** ⏳ Pending

---

### Test 5.3: Google OAuth Signup - Various Locales
**Test locales:**
- ja-JP → JPY
- fr-FR → EUR
- pt-BR → BRL
- en-AU → AUD
- es-MX → MXN

**Expected Result:**
- Each locale maps to correct currency
- Backend locale mapping works correctly
- Users see appropriate symbols

**Status:** ⏳ Pending

---

### Test 5.4: Apple OAuth Signup - Browser Locale
**Steps:**
1. Browser locale is "en-US"
2. Click "Sign up with Apple"
3. Complete Apple authentication
4. Check currency

**Expected Result:**
- User created with USD
- Currency persists correctly

**Status:** ⏳ Pending

---

## Test Suite 6: Currency Number Formatting

### Test 6.1: Number Formatting - USD
**Values to check:**
- 1,000 → displays as "$1,000.00"
- 1,234.56 → displays as "$1,234.56"
- 100 → displays as "$100.00"

**Expected Result:**
- Thousands separator: comma
- Decimal separator: period
- 2 decimal places always shown

**Status:** ⏳ Pending

---

### Test 6.2: Number Formatting - EUR
**Values to check:**
- 1,000 → displays as "€1.000,00" (European format)
- 1,234.56 → displays as "€1.234,56"
- 100 → displays as "€100,00"

**Expected Result:**
- Thousands separator: period
- Decimal separator: comma
- 2 decimal places (or as per locale)

**Status:** ⏳ Pending

---

### Test 6.3: Number Formatting - JPY
**Values to check:**
- 1,000 → displays as "¥1,000" (no decimals)
- 1,234 → displays as "¥1,234"

**Expected Result:**
- No decimal places (JPY is whole numbers)
- Thousands separator: comma
- Correct symbol positioning

**Status:** ⏳ Pending

---

## Test Suite 7: Edge Cases

### Test 7.1: Component Prop Drilling - BudgetCategoryTree
**Steps:**
1. Currency set to GBP
2. Open Budget page with category tree
3. Expand categories
4. Check all BudgetBar and BudgetInput components

**Expected Result:**
- All child components receive currency prop
- BudgetBar displays GBP symbol
- BudgetInput shows GBP
- Edit inline maintains currency formatting

**Status:** ⏳ Pending

---

### Test 7.2: Rapid Currency Changes
**Steps:**
1. Change currency USD → EUR → JPY → BRL → USD in rapid succession (5 seconds)
2. Check final state on Dashboard

**Expected Result:**
- Final state is correct (USD)
- No race condition errors
- All values update correctly

**Status:** ⏳ Pending

---

### Test 7.3: Currency with Long Numbers
**Steps:**
1. Create high-value transaction (e.g., $999,999.99)
2. Change to multiple currencies
3. Check formatting

**Expected Result:**
- All currencies format large numbers correctly
- No truncation or display issues
- Thousands separators appear correctly

**Status:** ⏳ Pending

---

### Test 7.4: Missing Currency Fallback
**Steps:**
1. Manually corrupt localStorage by removing currency
2. Refresh page
3. Check what displays

**Expected Result:**
- Fallback to USD
- No errors in console
- App still functions

**Status:** ⏳ Pending

---

## Test Suite 8: Export Functionality

### Test 8.1: Excel Export - Currency in Values
**Steps:**
1. Currency set to EUR
2. Export budget/transactions to Excel
3. Open Excel file
4. Check formatting

**Expected Result:**
- Excel shows € symbols
- Numbers formatted correctly for EUR
- No broken formatting in spreadsheet

**Status:** ⏳ Pending

---

### Test 8.2: PDF Export - Currency Display
**Steps:**
1. Currency set to GBP
2. Generate PDF report
3. Open PDF
4. Check formatting

**Expected Result:**
- PDF shows £ symbols
- Numbers formatted correctly
- PDF is readable and properly formatted

**Status:** ⏳ Pending

---

## Test Suite 9: Performance

### Test 9.1: Currency Change Performance
**Steps:**
1. Navigate to Dashboard with 100+ transactions
2. Change currency
3. Measure re-render time
4. Check responsiveness

**Expected Result:**
- Re-render completes in < 2 seconds
- No UI blocking
- Smooth transition

**Status:** ⏳ Pending

---

### Test 9.2: Page Load with Non-USD Currency
**Steps:**
1. User with EUR currency
2. Clear browser cache
3. Visit Dashboard
4. Measure load time

**Expected Result:**
- Page loads in < 3 seconds
- Currency correctly applied
- No flashing wrong currency

**Status:** ⏳ Pending

---

## Test Suite 10: Browser Compatibility

### Test 10.1: Chrome - Currency Display
**Browser:** Chrome (latest)

**Steps:**
1. Log in
2. Change currency
3. Navigate pages
4. Check all formatting

**Expected Result:**
- All currencies display correctly
- No Chrome-specific issues

**Status:** ⏳ Pending

---

### Test 10.2: Firefox - Currency Display
**Browser:** Firefox (latest)

**Expected Result:**
- Same as Chrome
- No Firefox-specific issues

**Status:** ⏳ Pending

---

### Test 10.3: Safari - Currency Display
**Browser:** Safari (latest)

**Expected Result:**
- Same as Chrome/Firefox
- Currency symbols display correctly
- No layout issues

**Status:** ⏳ Pending

---

## Summary Checklist

- [ ] All settings page currency selections work
- [ ] Currency persists across all pages
- [ ] Signup flow correctly assigns currency by country
- [ ] OAuth signup correctly determines currency from locale
- [ ] Number formatting matches currency rules
- [ ] Export functionality preserves currency
- [ ] No race conditions or state bugs
- [ ] Mobile responsive layout works
- [ ] All browser compatibility verified
- [ ] Performance acceptable

---

## Notes

- Tests should be run in isolation to avoid state contamination
- Clear localStorage and cookies between test groups when appropriate
- Test with real user scenarios (multiple users, concurrent changes)
- Document any failures with screenshots and browser console errors
- Measure and record performance metrics
