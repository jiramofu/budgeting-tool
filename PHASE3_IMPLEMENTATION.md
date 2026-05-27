# Phase 3: Search & Discovery - Spending Alerts & Email Reports

## Overview
Phase 3 implements comprehensive advanced search functionality and budget templates library, enabling users to quickly find transactions through flexible filtering and apply pre-built budget structures for faster budget creation.

## Features Implemented

### 1. Advanced Transaction Search System

#### Backend Services
- **searchService.ts** - Core search business logic
  - `searchTransactions()` - Advanced filtering by amount, date, category, and description with pagination
  - `getSearchSuggestions()` - Autocomplete suggestions from transaction history
  - `saveSearch()` - Create/update saved searches with idempotent behavior
  - `getSavedSearches()` - Retrieve user's saved searches with favorites sorting
  - `deleteSearch()` - Remove saved search queries
  - `toggleSearchFavorite()` - Mark searches as favorites for quick access
  - `getPopularSearchTerms()` - Anonymous aggregate search statistics
  - `recordSearchAnalytics()` - Background logging of search patterns

#### API Routes (search.ts)
- `POST /api/search` - Advanced transaction search with multi-criteria filtering
- `GET /api/search/suggestions` - Autocomplete suggestions with limit parameter
- `POST /api/search/saved` - Create new saved search with name and description
- `GET /api/search/saved` - Retrieve all saved searches for user
- `DELETE /api/search/saved/:searchId` - Delete saved search
- `PUT /api/search/saved/:searchId/favorite` - Toggle favorite status
- `GET /api/search/popular` - Get popular search terms across all users

#### Database Tables
- `search_queries` - Stores user-defined saved searches
  - User ID, name, description, filters_json, search_count, last_used_at, is_favorite
  - UNIQUE constraint on (user_id, name)
  
- `search_analytics` - Tracks search patterns (anonymized)
  - User ID, search_term, filters_used, results_count, search_duration_ms, timestamp
  - Indexes on user_id and timestamp for efficient querying

#### Frontend Components
- **AdvancedSearchPage.tsx** (480+ lines)
  - Multi-filter search interface with amount range, date range, categories, description
  - Real-time autocomplete suggestions as user types
  - Search results table with pagination (50 results per page by default)
  - Save/load/manage search queries
  - Favorite searches for quick re-running
  - SearchAnalytics component showing popular search terms
  - Filter presets and saved searches sidebar
  - Clear filters button with single click

- **SearchAnalytics.tsx** (100+ lines)
  - Display popular search terms with frequency bars
  - Anonymized aggregate statistics
  - Visual representation of search popularity
  - Responsive sidebar component

### 2. Budget Templates System

#### Backend Services
- **templateService.ts** - Template management and application
  - `getAllTemplates()` - Retrieve all active templates with sorting
  - `getTemplatesByType()` - Filter templates by category (minimalist, comfortable, luxury, family, student, retirement, custom)
  - `getTemplate()` - Single template retrieval
  - `applyTemplate()` - Apply template to budget with transaction support
  - `getUserTemplateApplications()` - Track template usage history
  - `createTemplate()` - Admin function to add new templates
  - `updateTemplate()` - Admin function to modify templates
  - `getOrCreateCategory()` - Auto-create categories when applying templates

#### API Routes (templates.ts)
- `GET /api/templates` - List all templates with optional type filter
- `GET /api/templates/:templateId` - Get specific template
- `POST /api/templates/:templateId/apply` - Apply template to budget
- `GET /api/templates/applications` - Get user's template applications

#### Database Tables
- `budget_templates` - Pre-built template definitions
  - ID, name, description, template_type, category_structure, target_percentages, is_default, is_active
  - UNIQUE constraint on name

- `template_applications` - Track template usage
  - User ID, template ID, budget ID, applied_at, customizations_json
  - UNIQUE constraint on (user_id, budget_id)

#### Database Seeds
- **001_budget_templates.sql** - 6 default templates:
  1. **Minimalist** (🏠) - Essential spending only (~$1,700/month example)
  2. **Comfortable** (✨) - Balanced middle-income (~$4,000/month example)
  3. **Luxury** (💎) - High-end lifestyle (~$8,000/month example)
  4. **Family** (👨‍👩‍👧‍👦) - Multi-person household (~$5,150/month example)
  5. **Student** (🎓) - Limited income (~$1,020/month example)
  6. **Retirement** (🌴) - Fixed income budget (~$2,430/month example)

- Each template includes:
  - Complete category structure with spending types (fixed/variable)
  - Target percentages that sum to 100%
  - Reasonable spending allocations for different lifestyles

#### Frontend Components
- **BudgetTemplatesDiscovery.tsx** (265+ lines)
  - Interactive template browsing with type-based filtering
  - Grid layout with template preview cards
  - Emoji indicators for visual differentiation
  - Detailed category breakdown with percentage bars
  - Apply template to selected budget
  - Preview of all categories before applying
  - Dark mode support with full accessibility
  - Error handling and loading states

### 3. Integration Updates

#### Main Application (index.ts)
- Imported search routes
- Registered `/api/search` endpoints
- Search routes available alongside other budget/transaction APIs

#### Frontend Routing
- Added `/search` route to main application
- Integrated AdvancedSearchPage into protected routes
- Added "Search" navigation link in Layout

## Architecture

### Search Flow
1. User enters search criteria (description, amount range, date range, categories)
2. Frontend sends POST /api/search with filters
3. Backend filters transactions using parameterized queries with indexes
4. Search analytics logged asynchronously
5. Results returned with total count and pagination
6. User can save search with name and description
7. Saved searches appear in sidebar with favorites starred

### Template Application Flow
1. User browses available templates
2. User filters by template type (minimalist, comfortable, etc)
3. User selects template to view details
4. Template preview shows all categories and percentages
5. User confirms and selects target budget
6. Backend applies template in transaction:
   - Creates missing categories
   - Inserts budget targets
   - Records template application
7. Budget is updated with template structure

## File Structure

### New Files Created
- `backend/database/migrations/003_add_search_and_templates.sql` (63 lines)
- `backend/database/seeds/001_budget_templates.sql` (65 lines)
- `backend/src/services/searchService.ts` (300 lines)
- `backend/src/services/templateService.ts` (377 lines)
- `backend/src/routes/search.ts` (183 lines)
- `frontend/src/pages/AdvancedSearchPage.tsx` (483 lines)
- `frontend/src/components/BudgetTemplatesDiscovery.tsx` (265 lines)
- `frontend/src/components/SearchAnalytics.tsx` (100 lines)

### Modified Files
- `backend/src/index.ts` - Added search route imports and registration
- `frontend/src/App.tsx` - Added /search route with ProtectedRoute
- `frontend/src/components/Layout.tsx` - Added Search navigation link

## Performance Considerations

### Database Optimizations
- Indexes on `user_id`, `category_id`, `template_id`, `timestamp` fields
- UNIQUE constraints prevent duplicate records
- Parameterized queries prevent SQL injection
- Search analytics in separate table to avoid impacting user queries
- Pagination prevents large result sets (default 50 per page)

### API Optimizations
- Autocomplete suggestions limited to 10 by default
- Popular search terms cached query (grouped aggregate)
- Lazy loading of templates via API
- Efficient category filtering with in-memory boolean operations

### Frontend Optimizations
- React hooks for state management (minimal re-renders)
- Debounced suggestion requests (could be added)
- Sticky template details panel for improved UX
- Lazy loading of suggestion dropdowns

## Testing Guide

### Manual Testing - Search
1. Navigate to `/search` page
2. Test description search:
   - Type a partial merchant name (e.g., "starbucks")
   - Verify suggestions appear
   - Verify results filter correctly
3. Test amount range:
   - Set min/max amounts
   - Verify only transactions in range appear
4. Test date range:
   - Set start and end dates
   - Verify results within date range
5. Test category filtering:
   - Select multiple categories
   - Verify results only show selected categories
6. Test saved searches:
   - Perform a search
   - Click "Save Search"
   - Enter name and optional description
   - Verify search appears in saved list
   - Click star to favorite
   - Delete saved search

### Manual Testing - Templates
1. Navigate to `/templates` or view template discovery component
2. Test template browsing:
   - View all templates
   - Filter by type (minimalist, comfortable, etc)
   - Verify icons display correctly
3. Test template application:
   - Click on a template
   - Verify all categories and percentages display
   - Click "Apply Template"
   - Verify budget is created with template structure
4. Test template seeding:
   - Query database directly: `SELECT * FROM budget_templates`
   - Verify all 6 default templates exist
   - Verify percentages sum to 100%

### Environment Setup
```bash
# Run database migrations
psql -U postgres -d budgeting_tool -f backend/database/migrations/003_add_search_and_templates.sql

# Seed default templates
psql -U postgres -d budgeting_tool -f backend/database/seeds/001_budget_templates.sql

# Verify setup
psql -U postgres -d budgeting_tool -c "SELECT COUNT(*) FROM budget_templates;"  # Should return 6
psql -U postgres -d budgeting_tool -c "SELECT COUNT(*) FROM search_queries WHERE user_id = 1;"  # Check saved searches
```

## Architecture Patterns

### Consistency Maintained
- Service layer pattern for business logic
- Middleware for auth and validation
- React component composition for UI
- TypeScript interfaces for type safety
- Database migrations for schema changes
- Parameterized queries for security

### API Response Format
All endpoints follow consistent JSON structure:
```json
{
  "success": true,
  "data": { /* endpoint-specific data */ },
  "error": "error message if applicable"
}
```

## Security Features

- Authentication middleware on all search/template routes
- User-scoped queries (only users see their own searches)
- Template applications linked to user IDs
- Parameterized queries prevent SQL injection
- Search analytics anonymized (no user identification)

## Future Enhancements (Phase 4+)

### Phase 4: Advanced Analytics & Spending Forecasting
1. Search-based trend analysis (category trends, merchant analysis)
2. Spend forecasting based on saved searches (e.g., "grocery" trending up 5%/month)
3. Seasonal pattern detection
4. Custom category templates

### Phase 5: Advanced Features
1. Search export to CSV
2. Scheduled saved searches (weekly digest of searches)
3. Smart search suggestions based on behavior
4. Transaction tagging for custom filtering
5. Search shortcuts/keyboard navigation

### Phase 6: Mobile & Cloud Sync
1. Mobile search app
2. Cloud sync for saved searches
3. Offline search (cached results)
4. Voice search for transactions

## Summary

Phase 3 provides comprehensive search and discovery capabilities that help users:
- **Find transactions quickly** with flexible multi-criteria filtering
- **Reuse searches** with saved searches and favorites
- **Start budgeting faster** with pre-built templates
- **Learn from patterns** with popular search analytics
- **Understand their spending** through template category structure

The implementation is:
- **Secure**: User-scoped queries, parameterized statements
- **Performant**: Indexed lookups, pagination, efficient filtering
- **User-friendly**: Autocomplete suggestions, visual template preview
- **Scalable**: Service layer pattern, separate analytics table
- **Maintainable**: Clean separation of concerns, TypeScript interfaces

Ready for Phase 4: Advanced Analytics & Spending Forecasting
