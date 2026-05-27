import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { DashboardSkeleton } from './components/SkeletonLoader';
import OfflineDetector from './components/OfflineDetector';
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
import Layout from './components/Layout';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <DashboardSkeleton />
        </div>
      </Layout>
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
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/import"
        element={
          <ProtectedRoute>
            <Layout>
              <ImportCSVPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Layout>
              <Analytics />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bills"
        element={
          <ProtectedRoute>
            <Layout>
              <BillsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/goals"
        element={
          <ProtectedRoute>
            <Layout>
              <GoalsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/templates"
        element={
          <ProtectedRoute>
            <Layout>
              <TemplatesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/households"
        element={
          <ProtectedRoute>
            <Layout>
              <HouseholdPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/wellness"
        element={
          <ProtectedRoute>
            <Layout>
              <WellnessPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/insights"
        element={
          <ProtectedRoute>
            <Layout>
              <InsightsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/budgeting"
        element={
          <ProtectedRoute>
            <Layout>
              <AdvancedBudgetingPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/investments"
        element={
          <ProtectedRoute>
            <Layout>
              <InvestmentsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscriptions"
        element={
          <ProtectedRoute>
            <Layout>
              <SubscriptionsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Layout>
              <NotificationsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Layout>
              <ReportsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/smart-rules"
        element={
          <ProtectedRoute>
            <Layout>
              <SmartRulesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <Layout>
              <AlertsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ThemeProvider>
          <Router>
            <AuthProvider>
              <OfflineDetector />
              <AppContent />
            </AuthProvider>
          </Router>
        </ThemeProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
