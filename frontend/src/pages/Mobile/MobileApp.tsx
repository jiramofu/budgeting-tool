/**
 * Mobile App Container
 * Main entry point for mobile experience - manages tab state and routing
 * Features: Tab-based navigation, smooth transitions, persistent state
 */

import React from 'react';
import { MobileHeader } from '../../components/Mobile/MobileHeader';
import { MobileNavigation } from '../../components/Mobile/MobileNavigation';
import { MobileDashboard } from './MobileDashboard';
import { MobileBudgets } from './MobileBudgets';
import { MobileTransactions } from './MobileTransactions';
import { MobileSettings } from './MobileSettings';

type TabType = 'dashboard' | 'budgets' | 'transactions' | 'settings';


/**
 * Main Mobile App Component
 */
export const MobileApp: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<TabType>('dashboard');

  // Handle tab changes with smooth transition
  const handleTabChange = (newTab: string) => {
    const validTab = newTab as TabType;
    if (validTab === activeTab) return; // Don't update if same tab
    setActiveTab(validTab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <MobileDashboard activeTab={activeTab} onTabChange={handleTabChange} />;
      case 'budgets':
        return <MobileBudgets activeTab={activeTab} onTabChange={handleTabChange} />;
      case 'transactions':
        return <MobileTransactions activeTab={activeTab} onTabChange={handleTabChange} />;
      case 'settings':
        return <MobileSettings activeTab={activeTab} onTabChange={handleTabChange} />;
      default:
        return <MobileDashboard activeTab={activeTab} onTabChange={handleTabChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {renderContent()}
    </div>
  );
};

export default MobileApp;
