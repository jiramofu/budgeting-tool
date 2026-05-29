# Quick E2E Currency Testing - 15 Minute Checklist

This is a fast-track version of the full E2E test suite focusing on critical paths.

## Prerequisites
- Browser DevTools open (F12)
- One test user account created (email: test@example.com)
- Fresh login session

---

## 1. Settings Page Currency Change (3 min)

### Test 1a: Load Settings
```
☐ Login as test user
☐ Navigate to Settings page
☐ Verify page loads without errors
☐ Locate currency dropdown
```

### Test 1b: Change USD → GBP
```
☐ Click currency dropdown
☐ Select "GBP - British Pound"
☐ Click Save
☐ Verify success message
☐ Check localStorage: open DevTools > Application > localStorage > find userSettings
  Expected: "currency":"GBP"
```

---

## 2. Currency Persistence (5 min)

### Test 2a: Dashboard Shows GBP
```
☐ Navigate to Dashboard
☐ Check for £ symbol (not $)
☐ Verify all monetary values show £
☐ Example locations:
  - Total Budget
  - Total Spent
  - Remaining amount
```

### Test 2b: Budget Page Shows GBP
```
☐ Navigate to Budget Management
☐ Check category budgets show £
☐ Check budget targets show £
☐ Verify progress bar labels in GBP
```

### Test 2c: Transactions Shows GBP
```
☐ Navigate to Transactions
☐ Check transaction amounts show £
☐ Check category totals show £
```

### Test 2d: Change to EUR and Re-verify
```
☐ Go back to Settings
☐ Change currency to EUR
☐ Save
☐ Navigate to Dashboard
☐ Verify all pages show € (not £)
☐ Check all previous pages (Budget, Transactions)
```

---

## 3. Browser Refresh Persistence (2 min)

### Test 3a: Refresh Dashboard
```
☐ On Dashboard with EUR currency
☐ Press F5 to refresh
☐ After reload, verify EUR still shows (€ symbol)
☐ Check localStorage still has "currency":"EUR"
```

### Test 3b: Refresh from Different Page
```
☐ Navigate to Bills page
☐ Press F5
☐ After reload, verify EUR still shows on Bills
☐ Navigate to Goals
☐ Verify EUR persists
```

---

## 4. Signup with Country Selection (3 min)

### Test 4a: Create New User - Japan
```
☐ Logout (if logged in)
☐ Go to Signup
☐ Fill form:
  - Email: testuser-jp-[timestamp]@example.com
  - Password: TestPass123!
  - Country: Japan
☐ Submit signup
☐ After success, Dashboard should show ¥ (JPY)
☐ Check localStorage has "currency":"JPY"
```

### Test 4b: Create New User - Brazil
```
☐ Logout
☐ Go to Signup
☐ Fill form:
  - Email: testuser-br-[timestamp]@example.com
  - Password: TestPass123!
  - Country: Brazil
☐ Submit signup
☐ Dashboard should show R$ (BRL)
```

---

## 5. Number Formatting Verification (2 min)

### Test 5a: Check Formatting Examples

**For EUR (British Pound - GBP):**
```
☐ Go to Budget with amount 1,234.56
☐ Verify displays as: £1,234.56 (comma for thousands, period for decimal)
```

**For JPY (no decimals):**
```
☐ Log in as JPY user
☐ Check transaction for ¥1,234
☐ Verify NO decimal places (JPY uses whole numbers only)
```

**For currencies with different separators (if testing multiple):**
```
☐ EUR might show: €1.234,56 (period for thousands, comma for decimal in some locales)
☐ Verify this is locale-specific behavior
```

---

## 6. Critical Error Check

### Test 6a: Console Errors
```
☐ Open DevTools (F12)
☐ Go to Console tab
☐ Navigate through all pages with currency change
☐ Verify NO red error messages
☐ Note any yellow warnings (ok if minor)
```

### Test 6b: Network Errors
```
☐ Open DevTools > Network tab
☐ Change currency on Settings page
☐ Verify request completes with 200 status
☐ No 400/500 errors
```

---

## 7. Oauth Verification (Optional - if setup)

### Test 7a: Google OAuth
```
☐ If Google OAuth is configured, test signup
☐ Check browser locale is detected correctly
☐ After signup, verify currency matches locale
  (e.g., en-US → USD, de-DE → EUR)
```

---

## Troubleshooting Quick Reference

| Issue | Check |
|-------|-------|
| Currency not updating | Clear browser cache, localStorage, refresh |
| Wrong symbol showing | Verify formatCurrency is called with correct currency |
| Decimals wrong | Check currency doesn't use decimals (JPY, KRW) |
| Form not saving | Check backend /api/user-settings endpoint returns 200 |
| Component not updating | Verify useUserSettings hook is imported correctly |
| Wrong locale detected | Check navigator.language in DevTools console |

---

## Sign-Off

✅ **Quick E2E Test Complete When:**
- All tests marked with ☐ are checked
- No console errors present
- Currency displays correctly on all pages
- Refresh/navigation maintains currency
- Signup creates users with correct currency

---

## Full Test Coverage
For comprehensive testing, refer to `E2E_CURRENCY_TESTING.md` which includes:
- Export functionality tests
- Performance benchmarks
- Edge case testing
- Browser compatibility
- And 50+ additional test cases
