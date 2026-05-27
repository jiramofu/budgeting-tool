import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-primary cursor-pointer" onClick={() => navigate('/')}>
                💰 Budgeting Tool
              </h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => navigate('/')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    isActive('/') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/import')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    isActive('/import') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Import CSV
                </button>
                <button
                  onClick={() => navigate('/analytics')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    isActive('/analytics') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => navigate('/bills')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    isActive('/bills') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Bills
                </button>
                <button
                  onClick={() => navigate('/goals')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    isActive('/goals') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Goals
                </button>
                <button
                  onClick={() => navigate('/templates')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    isActive('/templates') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Templates
                </button>
                <button
                  onClick={() => navigate('/households')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    isActive('/households') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sharing
                </button>
                <button
                  onClick={() => navigate('/wellness')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    isActive('/wellness') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Wellness
                </button>
                <button
                  onClick={() => navigate('/smart-rules')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    isActive('/smart-rules') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Smart Rules
                </button>
                <button
                  onClick={() => navigate('/insights')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    isActive('/insights') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Insights
                </button>
                <button
                  onClick={() => navigate('/budgeting')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    isActive('/budgeting') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Advanced
                </button>
                <button
                  onClick={() => navigate('/investments')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    isActive('/investments') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Investments
                </button>
                <button
                  onClick={() => navigate('/subscriptions')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    isActive('/subscriptions') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Subscriptions
                </button>
                <button
                  onClick={() => navigate('/reports')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    isActive('/reports') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Reports
                </button>
                <button
                  onClick={() => navigate('/alerts')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    isActive('/alerts') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Alerts
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.email}</span>
              <NotificationBell />
              <button
                onClick={() => navigate('/settings')}
                className="px-3 py-2 text-gray-600 hover:text-gray-900"
                title="Settings"
              >
                ⚙️
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
