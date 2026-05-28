# Phase 9c Testing Guide - Comprehensive Test Plan

## 1. Manual Testing - Toast Notifications
- [ ] Success toast appears on budget creation
- [ ] Error toast appears on validation failure
- [ ] Toasts auto-dismiss after 5 seconds
- [ ] Multiple toasts stack without overlapping
- [ ] Toast position consistent on all pages
- [ ] Test on: Chrome, Firefox, Safari, Edge, Mobile

## 2. Manual Testing - Skeleton Loaders
- [ ] Skeleton displays while loading data
- [ ] Shimmer animation runs smoothly
- [ ] Skeleton transitions to content without jank
- [ ] Skeleton appears on all data-loading pages
- [ ] Test on slow network (DevTools throttling)

## 3. Manual Testing - Help Icons & Tooltips
- [ ] Tooltip appears after 300ms hover delay
- [ ] Tooltip positioned correctly (top/bottom/left/right)
- [ ] Tooltip visible on keyboard focus
- [ ] Tooltip text is clear and helpful
- [ ] Dark mode updates tooltip colors
- [ ] No overlapping or cut-off text

## 4. Manual Testing - Keyboard Shortcuts
- [ ] Cmd+K / Ctrl+K opens command palette
- [ ] Command palette works on all pages
- [ ] Navigation shortcuts (1-9) work correctly
- [ ] Shortcut hints display OS-specific modifiers
- [ ] ESC closes command palette
- [ ] Shortcuts don't interfere with form input

## 5. Manual Testing - Favorites System
- [ ] Click star icon to add to favorites
- [ ] Star fills and item appears in Favorites bar
- [ ] Click filled star to remove from favorites
- [ ] Favorites persist after page refresh
- [ ] Favorites appear across all pages
- [ ] Max 8 favorites display in bar

## 6. Manual Testing - Error Boundaries
- [ ] Component error doesn't crash entire page
- [ ] Fallback UI appears on error
- [ ] User can navigate away from error
- [ ] Page recovers when reloaded

## 7. Manual Testing - Dark Mode
- [ ] Toggle dark mode on all pages
- [ ] Colors invert appropriately
- [ ] Text remains readable in both modes
- [ ] Dark mode preference persists
- [ ] Charts are visible in dark mode
- [ ] All components update colors

## 8. Performance Testing
- [ ] Lighthouse Performance ≥ 90
- [ ] Lighthouse Accessibility ≥ 90
- [ ] Page Navigation: 50-60fps
- [ ] Toast animations: 55-60fps
- [ ] Skeleton shimmer: 55-60fps
- [ ] JS bundle: < 500KB
- [ ] CSS: < 100KB

## 9. Accessibility Testing (WCAG AA)
- [ ] Focus ring visible on all interactive elements
- [ ] Tab order is logical
- [ ] All buttons keyboard accessible
- [ ] No keyboard traps
- [ ] Color contrast minimum 4.5:1 for text
- [ ] Screen reader announces structure
- [ ] Form labels properly associated

## 10. Cross-Browser Testing
Desktop:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

Mobile:
- [ ] iPhone Safari (iOS 16+)
- [ ] Android Chrome (Android 12+)
- [ ] iPad Safari (iPad OS 16+)

## 11. Mobile-Specific Testing
- [ ] Touch targets minimum 44px
- [ ] No horizontal scrolling
- [ ] Orientation change works
- [ ] Bottom keyboard doesn't overlap buttons
- [ ] Safe area insets respected

## 12. End-to-End Workflows
- [ ] Complete budget creation flow
- [ ] Transaction import and categorization
- [ ] Dashboard data display
- [ ] Mobile-first navigation
- [ ] Dark mode toggle workflow
- [ ] Favorites management workflow

## 13. Console & Errors
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] No API errors in DevTools Network
- [ ] All network requests successful
- [ ] No memory leaks on navigation

## 14. Pre-Deployment Checklist
- [ ] All tests passed
- [ ] No critical bugs
- [ ] Performance targets met
- [ ] Accessibility audit passed
- [ ] Cross-browser tested
- [ ] Mobile tested
- [ ] Dark mode verified
- [ ] Build successful
- [ ] Ready for production

Status: Ready for execution
