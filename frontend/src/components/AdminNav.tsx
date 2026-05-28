import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Cog,
  Users,
  FileText,
  BarChart3,
  ChevronDown,
} from 'lucide-react';

interface AdminNavProps {
  isDarkMode?: boolean;
}

export const AdminNav: React.FC<AdminNavProps> = ({ isDarkMode = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    {
      label: 'Organization',
      path: '/admin/organization',
      icon: Cog,
      description: 'Settings, rate limits',
    },
    {
      label: 'Members',
      path: '/admin/members',
      icon: Users,
      description: 'Team management',
    },
    {
      label: 'Audit Logs',
      path: '/admin/audit-logs',
      icon: FileText,
      description: 'Activity history',
    },
    {
      label: 'Analytics',
      path: '/admin/analytics',
      icon: BarChart3,
      description: 'Usage metrics',
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Dropdown */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-3 rounded-lg flex items-center justify-between font-medium transition ${
            isDarkMode
              ? 'bg-gray-800 text-white hover:bg-gray-700'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          <span>Admin Menu</span>
          <ChevronDown size={18} className={`transition ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className={`mt-2 rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 transition ${
                  isActive(item.path)
                    ? isDarkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-600 text-white'
                    : isDarkMode
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <item.icon size={18} />
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs opacity-75">{item.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Administration
          </h3>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 transition text-sm ${
                  isActive(item.path)
                    ? isDarkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-600 text-white'
                    : isDarkMode
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon size={16} />
                <div className="text-left">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs opacity-75">{item.description}</p>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default AdminNav;
