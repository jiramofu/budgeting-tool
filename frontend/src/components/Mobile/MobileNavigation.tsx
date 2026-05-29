/**
 * Mobile Bottom Navigation Component
 * Navigation bar for mobile with main sections: Dashboard, Transactions, Budgets, Settings
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface MobileNavigationProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/mobile/dashboard',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    ),
  },
  {
    id: 'transactions',
    label: 'Transactions',
    path: '/mobile/transactions',
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
      </svg>
    ),
  },
  {
    id: 'budgets',
    label: 'Budgets',
    path: '/mobile/budgets',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/mobile/settings',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l1.72-1.35c.15-.12.19-.34.1-.51l-1.63-2.83c-.12-.22-.37-.29-.59-.22l-2.03.81c-.42-.32-.9-.6-1.42-.82l-.3-2.16c-.04-.24-.25-.41-.5-.41h-3.26c-.25 0-.46.17-.49.41l-.3 2.16c-.52.23-1 .51-1.42.82l-2.03-.81c-.22-.09-.47 0-.59.22L2.74 8.87c-.12.22-.08.44.1.51l1.72 1.35c-.05.3-.07.62-.07.94s.02.64.07.94l-1.72 1.35c-.15.12-.19.34-.1.51l1.63 2.83c.12.22.37.29.59.22l2.03-.81c.42.32.9.6 1.42.82l.3 2.16c.03.24.24.41.49.41h3.26c.25 0 .46-.17.49-.41l.3-2.16c.52-.23 1-.51 1.42-.82l2.03.81c.22.09.47 0 .59-.22l1.63-2.83c.12-.22.08-.44-.1-.51l-1.72-1.35zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
      </svg>
    ),
  },
];

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from URL if not provided via prop
  const getCurrentTab = () => {
    if (activeTab) return activeTab;
    const path = location.pathname;
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/transactions')) return 'transactions';
    if (path.includes('/budgets')) return 'budgets';
    if (path.includes('/dashboard')) return 'dashboard';
    return 'dashboard';
  };

  const handleNavigation = (item: NavItem) => {
    if (onTabChange) {
      // Use parent callback if available (for MobileApp tab state)
      onTabChange(item.id);
    } else {
      // Use React Router navigation (for direct route access)
      navigate(item.path);
    }
  };

  const current = getCurrentTab();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item)}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors ${
              current === item.id
                ? 'text-blue-500 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
            aria-label={item.label}
            aria-current={current === item.id ? 'page' : undefined}
          >
            {item.icon}
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileNavigation;
