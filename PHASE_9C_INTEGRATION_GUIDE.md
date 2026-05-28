# Phase 9c Integration Guide - Week 3

Quick reference for integrating Phase 9c components into all pages.

---

## 1. Dashboard Integration

### Imports
```typescript
import { useToast } from '../hooks/useToast';
import { SkeletonCard } from '../components/ui/loaders';
import { Tooltip, HelpIcon } from '../components/ui/tooltip';
import { FavoritesBar, FavoriteButton } from '../components/ui/favorites';
```

### Add to Component
```typescript
const Dashboard: React.FC = () => {
  const { success, error: showError } = useToast();
  // ... existing code
```

### In Render (after header)
```typescript
<FavoritesBar maxVisible={6} showLabel={true} />
```

### On Metric Cards
```typescript
<div className="flex items-center justify-between">
  <span>Total Spending</span>
  <FavoriteButton
    id="metric-total-spending"
    type="dashboard"
    name="Total Spending Metric"
    size="sm"
  />
</div>
```

### Error Handling
```typescript
catch (err: any) {
  const errorMsg = 'Failed to load dashboard data';
  setError(errorMsg);
  showError(errorMsg);  // Add this
}
```

---

## 2. Reports Integration

### Imports
```typescript
import { useToast } from '../hooks/useToast';
import { Tooltip } from '../components/ui/tooltip';
import { FavoritesBar, FavoriteButton } from '../components/ui/favorites';
```

### Add to Component
```typescript
const ReportsPage: React.FC = () => {
  const { success, error: showError } = useToast();
  // ... existing code
```

### In Render (after header)
```typescript
<FavoritesBar maxVisible={6} showLabel={true} />
```

### On Summary Stats
```typescript
<Tooltip content="Explanation of metric" position="bottom">
  <div className="metric-card">
    {/* Card content */}
    <FavoriteButton
      id="stat-total-spending"
      type="report"
      name="Total Spending"
      size="sm"
    />
  </div>
</Tooltip>
```

### Export Button
```typescript
const handleExportPDF = () => {
  try {
    // ... export logic
    success('Report exported successfully');
  } catch (err) {
    showError('Failed to export report');
  }
};
```

---

## 3. Bills/Goals/Templates Pattern

### Imports
```typescript
import { useToast } from '../hooks/useToast';
import { SkeletonCard } from '../components/ui/loaders';
import { Tooltip, HelpIcon } from '../components/ui/tooltip';
```

### Add to Component
```typescript
const BillsPage: React.FC = () => {
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  // ... existing code
```

### Loading State
```typescript
if (isLoading) {
  return (
    <div className="space-y-4">
      <SkeletonCard count={3} />
    </div>
  );
}
```

### On Delete/Action
```typescript
const handleDelete = async (id: number) => {
  try {
    await apiClient.delete(`/bills/${id}`);
    success('Bill deleted successfully');
    // Refresh list
  } catch (err) {
    showError('Failed to delete bill');
  }
};
```

### On List Headers
```typescript
<div className="flex items-center gap-2">
  <h2>Bills</h2>
  <HelpIcon 
    text="Track upcoming bills and recurring payments" 
    position="right"
  />
</div>
```

---

## 4. Error Boundary Setup

### App.tsx Route Wrapping
```typescript
<Route
  path="/dashboard"
  element={
    <ErrorBoundary>
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    </ErrorBoundary>
  }
/>
```

### Or Wrap Entire App
```typescript
function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ThemeProvider>
          <Router>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </Router>
        </ThemeProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
```

---

## 5. Common Patterns

### Toast on Success
```typescript
const handleAction = async () => {
  try {
    await apiClient.post('/action');
    success('Action completed successfully');
  } catch (err) {
    showError('Action failed');
  }
};
```

### Tooltip on Complex Feature
```typescript
<Tooltip 
  content="Explains what this feature does and how to use it"
  position="right"
  delay={300}
>
  <button>Feature Name</button>
</Tooltip>
```

### Skeleton During Load
```typescript
if (isLoading) {
  return <SkeletonCard count={5} />;
}
```

### Favorite Button Placement
```typescript
<div className="flex items-center gap-2">
  <h3>{itemName}</h3>
  <FavoriteButton
    id={itemId}
    type="report"  // or "budget", "transaction", etc
    name={itemName}
    size="sm"
  />
</div>
```

---

## 6. Integration Checklist

### For Each Page:
- [ ] Add useToast hook import
- [ ] Add loading skeleton for isLoading state
- [ ] Add Tooltip/HelpIcon to complex features
- [ ] Add toast success on create/update/delete
- [ ] Add toast error on failures
- [ ] Test dark theme styling
- [ ] Test keyboard accessibility (Tab, Enter)
- [ ] Test on mobile (375px width)
- [ ] Verify no console warnings

### For Main Pages:
- [ ] Add FavoritesBar to top
- [ ] Add FavoriteButton to key items
- [ ] Wrap routes in ErrorBoundary
- [ ] Test ErrorBoundary error handling

---

## 7. Testing Each Component

### Toast Testing
```
1. Perform an action (delete, export, etc)
2. Verify toast appears in bottom-right
3. Verify it auto-dismisses after 5 seconds
4. Verify close button works
5. Verify multiple toasts stack properly
```

### Tooltip Testing
```
1. Hover over element with Tooltip
2. Verify tooltip appears after 300ms delay
3. Verify positioning is correct
4. Verify disappears on mouse leave
5. Verify works on keyboard focus
```

### Favorites Testing
```
1. Click favorite button - should fill with yellow
2. Toast should show "Added to favorites"
3. Reload page - favorite should persist
4. Click again - should toggle off
5. FavoritesBar should update in real-time
```

### ErrorBoundary Testing
```
1. Trigger an error in child component
2. Verify fallback UI shows
3. Verify error details show in dev console
4. Click "Try Again" - should reset
5. Click "Dashboard" - should navigate
```

---

## 8. Import Reference

```typescript
// Toasts
import { useToast } from '../hooks/useToast';

// Keyboard Shortcuts
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

// Favorites
import { useFavorites } from '../hooks/useFavorites';
import { FavoriteButton, FavoritesBar } from '../components/ui/favorites';

// Tooltips & Help
import { Tooltip, HelpIcon } from '../components/ui/tooltip';

// Loading States
import { SkeletonCard, SkeletonRow } from '../components/ui/loaders';

// Errors
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ErrorAlert } from '../components/ui/error';
```

---

## 9. Dark Theme Verification

All components use:
- `bg-slate-800/50` for backgrounds
- `text-slate-50` for primary text
- `text-slate-400` for secondary text
- `border-slate-700` for borders
- `bg-slate-700` for secondary backgrounds

Verify these classes are applied to any new elements.

---

## 10. Performance Checklist

- [ ] Animations run at 60fps (use Chrome DevTools Performance tab)
- [ ] No jank when scrolling
- [ ] Toast appears instantly (<50ms)
- [ ] Tooltip delay is 300ms (not too fast, not too slow)
- [ ] Skeleton loader shimmer is smooth
- [ ] No console errors or warnings
- [ ] localStorage access is <10ms
- [ ] Page loads still under 2 seconds

---

**Next**: Follow this guide for each page. Start with Dashboard, then Reports, then remaining pages.
