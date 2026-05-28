# Phase 8C: Route Update Guide

## Overview
All backend routes need to be updated to enforce organization-level permission checks and filter data by `organization_id`. This document lists all routes that need updates and the pattern to follow.

## Pattern for Updating Routes

### Before (Old Pattern):
```typescript
import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const result = await query('SELECT * FROM table WHERE user_id = $1', [req.userId]);
  res.json(result.rows);
});
```

### After (New Pattern):
```typescript
import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PermissionRequest, loadUserOrganizations } from '../middleware/permissions';
import { requireOrganization } from '../middleware/permissionHelper';

router.get(
  '/',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
    const result = await query(
      'SELECT * FROM table WHERE user_id = $1 AND organization_id = $2', 
      [req.userId, req.organizationId]
    );
    res.json(result.rows);
  }
);
```

## Key Changes:
1. **Imports**: Add `PermissionRequest`, `loadUserOrganizations`, and `requireOrganization`
2. **Middleware**: Add `loadUserOrganizations` and `requireOrganization` between `authenticate` and handler
3. **Type**: Change `AuthRequest` to `PermissionRequest`
4. **SQL Queries**: Add `AND organization_id = $X` to all WHERE clauses
5. **Inserts**: Add `organization_id` to all INSERT statements

## Routes Completed ✅

### Tier 1 - Critical Routes (100% Complete)
- [x] `budgets.ts` - Budget CRUD operations
- [x] `categories.ts` - Category CRUD operations
- [x] `transactions.ts` - Transaction CRUD operations
- [x] `import.ts` - CSV transaction import
- [x] `settings.ts` - User settings
- [x] `analytics.ts` - Monthly and yearly analysis
- [x] `projections.ts` - Cash flow projections
- [x] `bills.ts` - Bill management

## Routes Pending Updates

### Tier 2 - Important Routes (0% Complete)

**40 routes need updates:**

#### Financial Planning & Tracking
- [ ] `goals.ts` (6 endpoints) - Goal creation, updates, progress tracking
- [ ] `subscriptions.ts` (5 endpoints) - Subscription management
- [ ] `investments.ts` (8 endpoints) - Investment portfolio tracking
- [ ] `wellness.ts` (7 endpoints) - Financial wellness scores
- [ ] `smartRules.ts` (6 endpoints) - Smart budgeting rules

#### Reports & Analytics
- [ ] `reports.ts` (8 endpoints) - Report generation and export
- [ ] `emailReports.ts` (6 endpoints) - Email scheduling
- [ ] `search.ts` (7 endpoints) - Transaction search with filters

#### Other Features
- [ ] `alerts.ts` (6 endpoints) - Alert management
- [ ] `notifications.ts` (4 endpoints) - Notification preferences
- [ ] `templates.ts` (5 endpoints) - Budget templates
- [ ] `insights.ts` (4 endpoints) - Financial insights

### Phase 4 Routes (0% Complete)
- [ ] `phase4-analytics.ts` - Phase 4 analytics
- [ ] `phase4-projections.ts` - Phase 4 projections

### Auth & Admin Routes (Already Partially Updated)
- [x] `auth.ts` - Already scoped to single user
- [x] `auditLogs.ts` - Audit log viewing (requires organization access)
- [x] `adminDashboard.ts` - Admin dashboard (requires owner/admin role)
- [x] `organizations.ts` - Organization management (requires owner role)

## Update Checklist for Each Route

For each route file, follow this checklist:

```
Route: ___________________

Checklist:
[ ] 1. Add imports: PermissionRequest, loadUserOrganizations, requireOrganization
[ ] 2. Add middleware to ALL route handlers: loadUserOrganizations, requireOrganization
[ ] 3. Change AuthRequest to PermissionRequest in all handlers
[ ] 4. Update all SELECT queries to filter by organization_id
[ ] 5. Update all INSERT queries to include organization_id
[ ] 6. Update all UPDATE queries to filter by organization_id
[ ] 7. Update all DELETE queries to filter by organization_id
[ ] 8. Add req.organizationId check in resource ownership validation
[ ] 9. Test route with sample request
[ ] 10. Mark complete below
```

## Implementation Priority

**Week 1 (High-Traffic Routes):**
1. goals.ts (popular feature)
2. subscriptions.ts (data-sensitive)
3. investments.ts (sensitive data)

**Week 2 (Reporting Routes):**
4. reports.ts (used in exports)
5. emailReports.ts (scheduled tasks)
6. search.ts (frequently used)

**Week 3 (Remaining Routes):**
7. alerts.ts
8. notifications.ts
9. templates.ts
10. insights.ts
11. wellness.ts
12. smartRules.ts
13. phase4-analytics.ts
14. phase4-projections.ts

## Testing Strategy

For each route update:

1. **Compilation Check**: Ensure TypeScript compiles without errors
2. **Single Organization**: Test that user can only access own org's data
3. **Multiple Organizations**: Test that users with multiple orgs get correct data
4. **Cross-Org Access**: Verify users cannot access another org's data
5. **Permission Checks**: Verify requireOrganization blocks unauthenticated access

## Database Considerations

All tables need to have `organization_id` foreign key. Check migration 006 for table structures:

```sql
-- All existing tables now have:
ALTER TABLE <table_name> ADD COLUMN organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_<table_name>_organization_id ON <table_name>(organization_id);
```

## Middleware Reference

### loadUserOrganizations
- Loaded from `middleware/permissions`
- Populates `req.userOrganizations` with all organizations user belongs to
- Sets `req.organizationId` from header or first user org
- Non-blocking if user has no organizations

### requireOrganization
- Loaded from `middleware/permissionHelper`
- Blocks request if `req.organizationId` is not set
- Returns 401 Unauthorized if missing
- Must come after `loadUserOrganizations`

## Common Query Patterns

### SELECT with org filter:
```sql
SELECT * FROM table WHERE user_id = $1 AND organization_id = $2
```

### INSERT with org:
```sql
INSERT INTO table (user_id, org_id, data) VALUES ($1, $2, $3)
```

### UPDATE with org filter:
```sql
UPDATE table SET column = $1 WHERE id = $2 AND organization_id = $3
```

### DELETE with org filter:
```sql
DELETE FROM table WHERE id = $1 AND organization_id = $2
```

## Troubleshooting

**Error: "Property 'organizationId' does not exist"**
- Solution: Ensure `loadUserOrganizations` middleware comes before handler
- Check that PermissionRequest type is used instead of AuthRequest

**Error: "organization_id does not exist in table"**
- Solution: Verify migration 006 was applied to add column to table
- Check database schema

**Error: User can see other org's data**
- Solution: Verify all queries include `AND organization_id = $X`
- Check that reqresentation doesn't use cached data from other org

## Progress Tracking

- [x] Phase 8B Complete (Audit, Rate Limiting, Analytics)
- [ ] Phase 8C - Tier 1 Complete (8/8 critical routes)
- [ ] Phase 8C - Tier 2 Complete (40 remaining routes)
- [ ] Frontend Pages Complete (4/4 pages)
- [ ] Route Navigation Integration
- [ ] Testing & Validation

## Notes

- All timestamps and user_id filtering remains intact
- This adds ADDITIONAL filtering, doesn't replace existing checks
- Backward compatibility maintained for single-user accounts
- All existing business logic preserved
