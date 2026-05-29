/**
 * Mobile Routes Configuration
 * Defines all mobile-specific routes for the budgeting app
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MobileApp } from '../pages/Mobile/MobileApp';
import { MobileDashboard } from '../pages/Mobile/MobileDashboard';
import { MobileBudgets } from '../pages/Mobile/MobileBudgets';
import { MobileTransactions } from '../pages/Mobile/MobileTransactions';
import MobileProfile from '../pages/Mobile/MobileProfile';
import MobileSettings from '../pages/Mobile/MobileSettings';

/**
 * Mobile Routes
 * Mount at /mobile in your main router
 *
 * Usage in App.tsx:
 * <Route path="/mobile/*" element={<MobileRoutes />} />
 */
export const MobileRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Main mobile app (tab-based navigation) */}
      <Route path="/" element={<MobileApp />} />

      {/* Individual pages (can be accessed directly or via tabs) */}
      <Route path="/dashboard" element={<MobileDashboard />} />
      <Route path="/budgets" element={<MobileBudgets />} />
      <Route path="/transactions" element={<MobileTransactions />} />

      {/* Profile and Settings */}
      <Route path="/profile" element={<MobileProfile />} />
      <Route path="/settings" element={<MobileSettings />} />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/mobile" replace />} />
    </Routes>
  );
};

export default MobileRoutes;
