import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider, ToastContainer } from './components/ui/toast';
import { DashboardSkeleton } from './components/SkeletonLoader';
import OfflineDetector from './components/OfflineDetector';
import { NavigationLayout } from './components/navigation';
import './styles/animations.css';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import ImportCSVPage from './pages/ImportCSVPage';
import Analytics from './pages/Analytics';
import BillsPage from './pages/BillsPage';
import GoalsPage from './pages/GoalsPage';
import TemplatesPage from './pages/TemplatesPage';
import { HouseholdPage } from './pages/HouseholdPage';
import WellnessPage from './pages/WellnessPage';
import InsightsPage from './pages/InsightsPage';
import AdvancedBudgetingPage from './pages/AdvancedBudgetingPage';
import InvestmentsPage from './pages/InvestmentsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import ReportsPage from './pages/ReportsPage';
import SmartRulesPage from './pages/SmartRulesPage';
import AlertsPage from './pages/AlertsPage';
import EmailPreferencesPage from './pages/EmailPreferencesPage';
import AdvancedSearchPage from './pages/AdvancedSearchPage';
import ProjectionsPage from './pages/ProjectionsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import MembersPage from './pages/MembersPage';
import OrganizationSettingsPage from './pages/OrganizationSettingsPage';
import { MobileRoutes } from './routes/MobileRoutes';
import { SettingsSync } from './components/SettingsSync';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <NavigationLayout>
        <div className="p-8">
          <DashboardSkeleton />
        </div>
      </NavigationLayout>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <NavigationLayout>{children}</NavigationLayout>;
};

const MobileProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated && <SettingsSync />}
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/import"
        element={
          <ProtectedRoute>
            <ImportCSVPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bills"
        element={
          <ProtectedRoute>
            <BillsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/goals"
        element={
          <ProtectedRoute>
            <GoalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/templates"
        element={
          <ProtectedRoute>
            <TemplatesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households"
        element={
          <ProtectedRoute>
            <HouseholdPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wellness"
        element={
          <ProtectedRoute>
            <WellnessPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/insights"
        element={
          <ProtectedRoute>
            <InsightsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/budgeting"
        element={
          <ProtectedRoute>
            <AdvancedBudgetingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/investments"
        element={
          <ProtectedRoute>
            <InvestmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscriptions"
        element={
          <ProtectedRoute>
            <SubscriptionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/smart-rules"
        element={
          <ProtectedRoute>
            <SmartRulesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <AlertsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/email-preferences"
        element={
          <ProtectedRoute>
            <EmailPreferencesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <AdvancedSearchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projections"
        element={
          <ProtectedRoute>
            <ProjectionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/phase4-analytics"
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/organization"
        element={
          <ProtectedRoute>
            <OrganizationSettingsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/members"
        element={
          <ProtectedRoute>
            <MembersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/audit-logs"
        element={
          <ProtectedRoute>
            <AuditLogsPage />
          </ProtectedRoute>
        }
      />

      {/* Mobile Experience - Optimized for phones/tablets */}
      <Route
        path="/mobile/*"
        element={
          <MobileProtectedRoute>
            <MobileRoutes />
          </MobileProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ThemeProvider>
          <CurrencyProvider>
            <Router>
              <AuthProvider>
                <OfflineDetector />
                <AppContent />
                <ToastContainer />
              </AuthProvider>
            </Router>
          </CurrencyProvider>
        </ThemeProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
