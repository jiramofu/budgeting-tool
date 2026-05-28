import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Moon,
  Sun,
  LogOut,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import SearchModal from '../ui/search/SearchModal';

interface TopHeaderProps {
  onToggleSidebar: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isDark, theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const searchResults = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      category: 'navigation' as const,
      icon: '📊',
      onSelect: () => navigate('/'),
    },
    {
      id: 'reports',
      title: 'Reports',
      category: 'navigation' as const,
      icon: '📈',
      onSelect: () => navigate('/reports'),
    },
    {
      id: 'budgets',
      title: 'Budgets',
      category: 'navigation' as const,
      icon: '💰',
      onSelect: () => navigate('/budgeting'),
    },
    {
      id: 'search',
      title: 'Advanced Search',
      category: 'navigation' as const,
      icon: '🔍',
      onSelect: () => navigate('/search'),
    },
  ];

  return (
    <>
      <header
        className={`
          h-16 fixed top-0 left-0 right-0 z-50 border-b transition-colors
          ${isDark
            ? 'bg-slate-950 border-slate-700'
            : 'bg-white border-slate-200'
          }
        `}
      >
        <div className="h-full px-4 flex items-center gap-4">
          {/* Hamburger Menu */}
          <button
            onClick={onToggleSidebar}
            className={`
              p-2 rounded-lg border transition-colors
              ${isDark
                ? 'hover:bg-slate-800 border-slate-700'
                : 'hover:bg-slate-100 border-slate-300'
              }
            `}
            title="Toggle sidebar"
          >
            <Menu size={20} />
          </button>

          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white
              bg-gradient-to-br from-blue-500 to-blue-600
            `}>
              💰
            </div>
            <span className={`
              text-base font-semibold
              ${isDark ? 'text-white' : 'text-slate-900'}
            `}>
              Budget
            </span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xs mx-4">
            <button
              onClick={() => setSearchOpen(true)}
              className={`
                w-full px-3 py-2 rounded-lg border flex items-center gap-2 text-sm transition-colors
                ${isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                  : 'bg-slate-50 border-slate-300 text-slate-500 hover:border-slate-400'
                }
              `}
            >
              <Search size={16} />
              <span>Search (⌘K)</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Notifications */}
            <button
              className={`
                p-2 rounded-lg border transition-colors
                ${isDark
                  ? 'hover:bg-slate-800 border-slate-700'
                  : 'hover:bg-slate-100 border-slate-300'
                }
              `}
              title="Notifications"
            >
              <Bell size={20} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`
                p-2 rounded-lg border transition-colors
                ${isDark
                  ? 'hover:bg-slate-800 border-slate-700'
                  : 'hover:bg-slate-100 border-slate-300'
                }
              `}
              title="Toggle theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* User Menu Dropdown */}
            <div className="group relative">
              <button
                className={`
                  p-2 rounded-lg border transition-colors
                  ${isDark
                    ? 'hover:bg-slate-800 border-slate-700'
                    : 'hover:bg-slate-100 border-slate-300'
                  }
                `}
                title="User profile"
              >
                <span className="text-lg">👤</span>
              </button>

              {/* Dropdown Menu */}
              <div
                className={`
                  absolute right-0 mt-2 w-48 rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all
                  ${isDark
                    ? 'bg-slate-900 border-slate-700'
                    : 'bg-white border-slate-200'
                  }
                `}
              >
                <div className={`
                  p-3 border-b
                  ${isDark ? 'border-slate-700' : 'border-slate-200'}
                `}>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {user?.email}
                  </p>
                </div>

                <button
                  onClick={() => navigate('/settings')}
                  className={`
                    w-full px-4 py-2 text-sm text-left flex items-center gap-2 transition-colors
                    ${isDark
                      ? 'hover:bg-slate-800 text-slate-200'
                      : 'hover:bg-slate-100 text-slate-700'
                    }
                  `}
                >
                  <SettingsIcon size={16} />
                  Settings
                </button>

                <button
                  onClick={handleLogout}
                  className={`
                    w-full px-4 py-2 text-sm text-left flex items-center gap-2 transition-colors border-t
                    ${isDark
                      ? 'border-slate-700 hover:bg-red-900/20 text-red-400'
                      : 'border-slate-200 hover:bg-red-50 text-red-600'
                    }
                  `}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        results={searchResults}
      />
    </>
  );
};

export default TopHeader;
