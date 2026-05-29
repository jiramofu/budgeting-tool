# Budgeting Tool - Design System & UI Components

**Version**: 1.0  
**Last Updated**: May 28, 2026  
**Status**: Complete - Ready for Implementation

---

## Overview

This document outlines the complete design system for the budgeting application, including:
- Visual design principles and tokens
- Reusable UI components
- Page layouts and mockups
- Icon system
- Data visualization patterns
- Design patterns and best practices

---

## Design Tokens

### Color Palette

#### Primary Colors
- **Primary Blue**: `#2563eb` - Primary actions, primary states
- **Primary Dark**: `#1e40af` - Hover state for primary
- **Primary Light**: `#dbeafe` - Background for primary content

#### Status Colors
- **Success Green**: `#10b981` - On budget, successful states
- **Warning Amber**: `#f59e0b` - Warning threshold (80% of budget)
- **Error Red**: `#ef4444` - Over budget, errors
- **Info Cyan**: `#06b6d4` - Information, informational states

#### Neutral Colors
- **Gray-50**: `#f9fafb` - Lightest background
- **Gray-100**: `#f3f4f6` - Light background
- **Gray-200**: `#e5e7eb` - Light borders
- **Gray-600**: `#4b5563` - Medium text
- **Gray-900**: `#111827` - Dark text

#### Dark Mode
- **Dark-800**: `#1f2937` - Primary dark background
- **Dark-900**: `#111827` - Darker background

### Typography

```
Font Family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI'

Sizes:
  - Display Large: 32px, 600 weight (page titles)
  - Display Medium: 24px, 600 weight (major headers)
  - Heading 1: 20px, 600 weight (section titles)
  - Heading 2: 18px, 600 weight (subsection titles)
  - Body Large: 16px, 400 weight (primary body text)
  - Body: 14px, 400 weight (standard body text)
  - Small: 12px, 400 weight (secondary text, labels)
  - Tiny: 11px, 500 weight (captions, hints)

Line Heights:
  - Display: 1.1
  - Heading: 1.3
  - Body: 1.5
  - Small: 1.4
```

### Spacing Scale

```
0.5rem (8px)   - xs
1rem (16px)    - sm
1.5rem (24px)  - md
2rem (32px)    - lg
3rem (48px)    - xl
4rem (64px)    - 2xl
6rem (96px)    - 3xl
```

### Border Radius

```
Small Radius:  0.375rem (6px)   - buttons, small elements
Medium Radius: 0.5rem (8px)     - cards, inputs
Large Radius:  0.75rem (12px)   - large containers
XL Radius:     1rem (16px)      - major containers
```

### Shadows

```
Subtle:   0 1px 2px 0 rgba(0, 0, 0, 0.05)
Soft:     0 1px 3px 0 rgba(0, 0, 0, 0.1)
Base:     0 4px 6px -1px rgba(0, 0, 0, 0.1)
Medium:   0 10px 15px -3px rgba(0, 0, 0, 0.1)
Large:    0 20px 25px -5px rgba(0, 0, 0, 0.1)
```

---

## Component Library

### Buttons

#### Primary Button
- Background: Blue `#2563eb`
- Text: White
- Padding: 10px 20px
- Radius: 8px
- States: Default, Hover (dark blue), Active, Disabled

#### Secondary Button
- Background: Gray-100
- Text: Gray-900
- Padding: 10px 20px
- Radius: 8px
- Border: 1px Gray-200

#### Danger Button
- Background: Red `#ef4444`
- Text: White
- Use for: Delete, cancel operations

### Input Fields

- Border: 1px Gray-200
- Focus Border: Blue-500
- Padding: 10px 12px
- Radius: 8px
- Font Size: 14px
- States: Default, Focus, Error, Disabled, Filled

### Cards

- Background: White (light) / Gray-800 (dark)
- Border: 1px Gray-200 (light) / Gray-700 (dark)
- Padding: 24px
- Radius: 12px
- Shadow: Soft shadow

### Badges/Labels

```
Success: Green background, green text - "On Track"
Warning: Amber background, amber text - "Warning"
Error:   Red background, red text - "Over Budget"
Info:    Blue background, blue text - "Information"
```

### Progress Bars

- Height: 8px
- Radius: 4px
- Background: Gray-200
- States:
  - Success (Green): 0-80% of budget
  - Warning (Amber): 80-100% of budget
  - Error (Red): 100%+ of budget

---

## Icons

### Category Icons (SVG)

All category icons are minimal, 24x24px viewBox, designed to be:
- Recognizable at small sizes
- Scalable without loss of clarity
- Consistent in style
- Compatible with dark mode

**Available Categories**:
- Food & Dining (Fork/Spoon)
- Transportation (Car)
- Utilities (Bars)
- Entertainment (Film/Game)
- Healthcare (Medical Cross)
- Shopping (Cart)
- Home & Rent (House)
- Savings (Piggy Bank)
- Education (Graduation Cap)
- Personal Care (Beauty)
- Subscriptions (Layout)
- Income (Upward Arrow)
- Bills (Document)

**Usage**:
```tsx
import { FoodIcon, TransportationIcon } from '@/assets/icons/categories';

<FoodIcon size={24} color="#2563eb" />
```

---

## Page Layouts

### 1. Dashboard Page

**Purpose**: Overview of financial status

**Layout Structure**:
```
┌─────────────────────────────────────────┐
│ Header: Dashboard                       │
│ Subtitle: Welcome back!                 │
└─────────────────────────────────────────┘

┌─────────┬──────────┬────────────┬──────────┐
│ Total   │ Remaining│ Budget %   │ Categories
│ Spending│ Budget   │ Remaining  │ on Track
└─────────┴──────────┴────────────┴──────────┘

┌──────────────────┬──────────────────────┐
│ Overall Budget   │ Spending by Category │
│ (Progress Ring)  │ (Donut Chart)        │
└──────────────────┴──────────────────────┘

┌─────────────────────────────────────────┐
│ Spending Trend (Last 4 Months)          │
│ (Line Chart with Trend)                 │
└─────────────────────────────────────────┘

┌────────┬────────┬────────┬────────────┐
│ Food   │ Trans  │Utilities│Entertainment
│ Card   │ Card   │ Card   │ Card
└────────┴────────┴────────┴────────────┘
```

**Key Metrics Shown**:
- Total spending this month
- Remaining budget
- Budget percentage used
- Categories on/off track
- Spending trend over time
- Category breakdown

### 2. Budgets Page

**Purpose**: Create and manage monthly budgets

**Layout Structure**:
```
┌─────────────────────────────────────────┐
│ Budgets                                 │
│ [Month Selector] [Create Budget Button] │
└─────────────────────────────────────────┘

FOR EACH BUDGET CATEGORY:
┌─────────────────────────────────────────┐
│ Category | Spent | Budget | Progress    │
│ ────────────────────────────────────────│
│ Food     │ $850  │ $1000  │ ███░░ 85%  │
│ Trans    │ $450  │ $600   │ ██░░░ 75%  │
│ Utilities│ $320  │ $400   │ ████░ 80%  │
└─────────────────────────────────────────┘
```

**Features**:
- Monthly budget overview
- Category-based breakdown
- Progress visualization
- Edit/adjust budget buttons
- Historical comparison

### 3. Transactions Page

**Purpose**: View and manage all transactions

**Layout Structure**:
```
┌─────────────────────────────────────────┐
│ Transactions                            │
│ [Search] [Filter] [Add Transaction]     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Date | Description | Category | Amount  │
├─────────────────────────────────────────┤
│ 5/25 │ Coffee Shop │ Food     │ -$5.42 │
│ 5/24 │ Gas Station │ Trans    │ -$45   │
│ 5/23 │ Salary      │ Income   │ +$2000 │
└─────────────────────────────────────────┘
```

**Features**:
- Transaction list with date
- Category color coding
- Amount with +/- indicator
- Search and filtering
- Edit/delete options
- Bulk actions

### 4. Reports Page

**Purpose**: Detailed analysis and insights

**Layout Structure**:
```
┌─────────────────────────────────────────┐
│ Reports & Analytics                     │
│ [Date Range Selector]                   │
└─────────────────────────────────────────┘

┌──────────────────┬──────────────────────┐
│ Total Spending   │ Savings Rate         │
│ $2,840.50        │ 18.8%                │
└──────────────────┴──────────────────────┘

┌─────────────────────────────────────────┐
│ Monthly Trend (Last 12 Months)          │
│ [Bar Chart]                             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Category Breakdown                      │
│ [Pie Chart]                             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Insights & Recommendations              │
│ • You saved $200 this month!            │
│ • Food spending up 12% vs. last month   │
│ • 3 categories under budget             │
└─────────────────────────────────────────┘
```

**Features**:
- Customizable date ranges
- Multiple chart types
- Trend analysis
- Category comparison
- AI-generated insights
- Export functionality

### 5. Settings Page

**Purpose**: User preferences and account management

**Layout Structure**:
```
┌─────────────────────────────────────────┐
│ Settings                                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ACCOUNT                                 │
│ Profile Picture | Name | Email          │
│                                         │
│ PREFERENCES                             │
│ Theme (Light/Dark/Auto)                 │
│ Currency                                │
│ Budget Notification                     │
│                                         │
│ SECURITY                                │
│ Change Password                         │
│ Two-Factor Authentication               │
│                                         │
│ ORGANIZATION                            │
│ [Manage Members]                        │
│ [Organization Settings]                 │
└─────────────────────────────────────────┘
```

---

## Chart & Visualization Patterns

### Budget Progress Ring

- **Type**: SVG Circle Chart
- **Size**: 120px diameter
- **Colors**: Green (on track) → Amber (warning) → Red (over budget)
- **Shows**: Percentage, actual vs. budget amount
- **Interaction**: Hover for details, click to edit budget

### Spending Trend Line Chart

- **Type**: SVG Line Chart with Area
- **Data**: Last 12 months (or custom range)
- **Lines**: Actual spending (solid) vs. Budget target (dashed)
- **Colors**: Blue (actual) vs. Gray (target)
- **Features**: Hover tooltips, zoom capability

### Category Breakdown Pie/Donut

- **Type**: SVG Pie Chart
- **Segments**: One per category
- **Colors**: Unique color per category
- **Shows**: Percentage labels, legend with amounts
- **Mode**: Pie or Donut (hollow center)

### Category Bar Chart

- **Type**: Horizontal bars
- **Height**: 30px per bar
- **Features**: Category name, amount, percentage
- **Colors**: Gradient or solid per category

---

## Responsive Design

### Breakpoints

```
Mobile:      < 640px   (sm)
Tablet:      640px     (md)
Desktop:     1024px    (lg)
Wide:        1280px    (xl)
Ultra-wide:  1536px    (2xl)
```

### Mobile-First Approach

- **Mobile**: Single column, stacked cards
- **Tablet**: 2-column grid where appropriate
- **Desktop**: 3-4 column grid, full features
- **Navigation**: Hamburger menu on mobile, full nav on desktop

---

## Dark Mode

### Implementation

- CSS custom properties for color tokens
- `prefers-color-scheme` media query
- Toggle button in header for manual override
- Colors adjusted for contrast and readability

### Dark Mode Palette

```
Background Primary:    #111827 (Gray-900)
Background Secondary:  #1f2937 (Gray-800)
Text Primary:          #f9fafb (Gray-50)
Text Secondary:        #d1d5db (Gray-300)
Borders:               #374151 (Gray-700)
Cards:                 #1f2937 (Gray-800)
```

---

## Animation & Transitions

### Standard Timing Functions

```
Fast:      150ms cubic-bezier(0.4, 0, 0.2, 1)
Standard:  300ms cubic-bezier(0.4, 0, 0.2, 1)
Slow:      500ms cubic-bezier(0.4, 0, 0.2, 1)
```

### Common Animations

- **Fade In**: 300ms opacity
- **Slide Down**: 300ms translateY
- **Scale**: 300ms transform scale
- **Progress Update**: 300ms width change (smooth bars)
- **Chart Updates**: 300ms smooth transitions

---

## Implementation Guide

### Using Components

**Icons**:
```tsx
import { FoodIcon } from '@/assets/icons/categories';

<FoodIcon size={24} color="#2563eb" className="w-6 h-6" />
```

**Charts**:
```tsx
import { BudgetProgressChart } from '@/components/Charts/BudgetProgressChart';

<BudgetProgressChart spent={850} budget={1000} label="Food & Dining" />
```

**Dashboard**:
```tsx
import { Dashboard } from '@/components/Dashboard/DashboardLayout';

<Dashboard />
```

---

## Accessibility

### WCAG 2.1 Level AA Compliance

- **Color Contrast**: All text meets 4.5:1 ratio minimum
- **Focus Indicators**: Visible focus rings on all interactive elements
- **Keyboard Navigation**: All features accessible via keyboard
- **Alt Text**: Meaningful alt text for all icons and images
- **ARIA Labels**: Proper ARIA labels for charts and complex components
- **Screen Reader**: Support for major screen readers

### Semantic HTML

- Use proper heading hierarchy
- Semantic HTML5 elements (nav, main, section, article)
- Form labels properly associated with inputs
- Button elements for clickable items

---

## Performance Optimization

### Image Optimization

- SVG for icons (vector, scalable)
- WebP format for photographs
- Lazy loading for images below fold
- Responsive images with srcset

### Chart Performance

- SVG rendering (hardware accelerated)
- React Memo for chart components
- Debounce resize/data updates
- Limit animation frame rate on mobile

### Bundle Size

- Tree-shake unused components
- Code split by page/route
- Lazy load chart libraries
- Minify and compress assets

---

## Component Checklist

- [x] Category Icons (12 icons)
- [x] Budget Progress Chart
- [x] Spending Trend Chart
- [x] Category Breakdown Chart
- [x] Dashboard Layout
- [x] Color tokens & design system
- [x] Typography system
- [x] Responsive grid system
- [ ] Additional page mockups (detailed Figma file)
- [ ] Interactive prototypes
- [ ] Animation library
- [ ] Accessibility audit

---

## Next Steps

1. **Integrate Components**: Use components in actual pages
2. **Create Figma Design File**: Full visual mockups and specifications
3. **Component Testing**: Test responsiveness and accessibility
4. **Design Review**: Get stakeholder feedback
5. **Documentation**: Update Storybook if using component library

---

## Files Created

- `frontend/src/assets/icons/categories.tsx` - 12 category icons
- `frontend/src/components/Charts/BudgetProgressChart.tsx` - Progress ring & multi-category chart
- `frontend/src/components/Charts/SpendingTrendChart.tsx` - Trend line chart
- `frontend/src/components/Charts/CategoryBreakdownChart.tsx` - Pie & bar charts
- `frontend/src/components/Dashboard/DashboardLayout.tsx` - Complete dashboard page

---

**Design System Version**: 1.0  
**Last Updated**: May 28, 2026  
**Status**: ✅ Complete and Ready for Implementation

