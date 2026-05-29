/**
 * Budget Category Icons - SVG Components
 * Professional, minimal icons for all budget categories
 */

import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

// Food & Dining
export const FoodIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 8h16v2H4z" fill={color} />
    <path d="M6 10c0-2 1-3 2-3s2 1 2 3v10H6V10z" fill={color} />
    <path d="M12 10c0-2 1-3 2-3s2 1 2 3v10h-4V10z" fill={color} />
    <path d="M18 10c0-2 1-3 2-3s2 1 2 3v10h-4V10z" fill={color} />
  </svg>
);

// Transportation
export const TransportationIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 9h18v7c0 1-1 2-2 2h-14c-1 0-2-1-2-2V9z" fill={color} opacity="0.3" />
    <path d="M5 9c1-2 3-4 7-4s6 2 7 4M6 16c0 1 .5 2 1.5 2s1.5-1 1.5-2M14 16c0 1 .5 2 1.5 2s1.5-1 1.5-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M2 16h20" stroke={color} strokeWidth="2" />
  </svg>
);

// Utilities
export const UtilitiesIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6h3v12H4z" fill={color} />
    <path d="M9 4h3v14H9z" fill={color} />
    <path d="M14 8h3v10h-3z" fill={color} />
    <path d="M19 2h1v16h-1z" fill={color} />
  </svg>
);

// Entertainment
export const EntertainmentIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6h16v12H4z" stroke={color} strokeWidth="2" fill={color} opacity="0.2" />
    <circle cx="12" cy="12" r="3" fill={color} />
    <path d="M8 10l-2-2M16 10l2-2M8 14l-2 2M16 14l2 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Healthcare
export const HealthcareIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="3" width="14" height="18" rx="1" stroke={color} strokeWidth="2" fill={color} opacity="0.1" />
    <path d="M12 8v8M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Shopping
export const ShoppingIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 4h2l2 16h14l2-16h2" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="8" cy="20" r="1" fill={color} />
    <circle cx="18" cy="20" r="1" fill={color} />
    <path d="M6 8h12" stroke={color} strokeWidth="2" opacity="0.5" />
  </svg>
);

// Home & Rent
export const HomeIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12l9-7 9 7v8c0 1-1 2-2 2H5c-1 0-2-1-2-2v-8z" fill={color} opacity="0.2" stroke={color} strokeWidth="2" />
    <rect x="8" y="12" width="8" height="8" fill={color} opacity="0.3" />
    <path d="M10 15h4v2h-4z" fill={color} />
  </svg>
);

// Savings/Investment
export const SavingsIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2c5.5 0 10 4.5 10 10s-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2z" stroke={color} strokeWidth="2" fill={color} opacity="0.1" />
    <path d="M12 6v12M9 9h6M9 15h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Education
export const EducationIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8l9-5 9 5v2H3V8z" fill={color} opacity="0.2" stroke={color} strokeWidth="2" />
    <path d="M5 10v10h14V10" stroke={color} strokeWidth="2" fill={color} opacity="0.1" />
    <path d="M9 14h6M9 17h6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Personal Care
export const PersonalCareIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" fill={color} opacity="0.2" />
    <path d="M5 12c0-2 2-3 7-3s7 1 7 3v8c0 1-1 2-2 2H7c-1 0-2-1-2-2v-8z" stroke={color} strokeWidth="2" fill={color} opacity="0.1" />
  </svg>
);

// Subscriptions
export const SubscriptionsIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="14" rx="1" stroke={color} strokeWidth="2" fill={color} opacity="0.1" />
    <path d="M3 9h18M7 18v2M17 18v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Income
export const IncomeIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12l4 4 10-10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 12l2-2m16 0l2 2" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
  </svg>
);

// Bills
export const BillsIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4h16c1 0 2 1 2 2v12c0 1-1 2-2 2H4c-1 0-2-1-2-2V6c0-1 1-2 2-2z" stroke={color} strokeWidth="2" fill={color} opacity="0.1" />
    <path d="M7 10h10M7 14h6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="18" cy="12" r="2" fill={color} opacity="0.5" />
  </svg>
);

// Generic Category Placeholder
export const CategoryPlaceholder: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill={color} opacity="0.1" />
    <path d="M12 8v8M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Icon Map for Easy Access
export const CATEGORY_ICONS: Record<string, React.FC<IconProps>> = {
  'food': FoodIcon,
  'dining': FoodIcon,
  'groceries': FoodIcon,
  'transportation': TransportationIcon,
  'gas': TransportationIcon,
  'public-transit': TransportationIcon,
  'utilities': UtilitiesIcon,
  'electricity': UtilitiesIcon,
  'water': UtilitiesIcon,
  'internet': UtilitiesIcon,
  'entertainment': EntertainmentIcon,
  'movies': EntertainmentIcon,
  'streaming': EntertainmentIcon,
  'games': EntertainmentIcon,
  'healthcare': HealthcareIcon,
  'medical': HealthcareIcon,
  'fitness': HealthcareIcon,
  'shopping': ShoppingIcon,
  'clothing': ShoppingIcon,
  'home': HomeIcon,
  'rent': HomeIcon,
  'mortgage': HomeIcon,
  'home-maintenance': HomeIcon,
  'savings': SavingsIcon,
  'investment': SavingsIcon,
  'education': EducationIcon,
  'tuition': EducationIcon,
  'personal-care': PersonalCareIcon,
  'beauty': PersonalCareIcon,
  'subscriptions': SubscriptionsIcon,
  'income': IncomeIcon,
  'salary': IncomeIcon,
  'bills': BillsIcon,
  'other': CategoryPlaceholder,
};

export default CATEGORY_ICONS;
