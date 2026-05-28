import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  TrendingUp,
  Settings,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

interface DesktopNavProps {
  isSidebarCollapsed: boolean;
  onToggleCollapse: () => void;
  isAdmin?: boolean;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  description: string;
}

interface AdminItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export const DesktopNav: React.FC<DesktopNavProps> = ({
  isSidebarCollapsed,
  onToggleCollapse,
  isAdmin = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const mainNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/',
      icon: <LayoutDashboard size={20} />,
      description: 'Overview',
    },
    {
      label: 'Budgets',
      path: '/budgeting',
      icon: <Wallet size={20} />,
      description: 'Plan & manage',
    },
    {
      label: 'Transactions',
      path: '/search',
      icon: <Receipt size={20} />,
      description: 'View & analyze',
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: <TrendingUp size={20} />,
      description: 'Insights & trends',
    },
  ];

  const adminItems: AdminItem[] = [
    {
      label: 'Organization',
      path: '/admin/organization',
      icon: <Settings size={18} />,
    },
    {
      label: 'Members',
      path: '/admin/members',
      icon: <Wallet size={18} />,
    },
    {
      label: 'Audit Logs',
      path: '/admin/audit-logs',
      icon: <Receipt size={18} />,
    },
    {
      label: 'Analytics',
      path: '/admin/analytics',
      icon: <TrendingUp size={18} />,
    },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isAdminActive = location.pathname.startsWith('/admin');

  return (
    <div
      className={`
        hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40 bg-color-bg-primary border-r border-color-border-primary transition-all duration-300
        ${isSidebarCollapsed ? 'w-20' : 'w-64'}
      `}
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        borderColor: 'var(--color-border-primary)',
      }}
    >
      {/* Header */}
      <div
        className={`
          flex items-center justify-between h-16 px-4 border-b border-color-border-primary
          ${isSidebarCollapsed ? 'justify-center' : ''}
        `}
        style={{ borderColor: 'var(--color-border-primary)' }}
      >
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">BT</span>
            </div>
            <span className="font-semibold text-sm text-color-text-primary">Budget</span>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-color-bg-secondary rounded-md transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          title={isSidebarCollapsed ? 'Expand' : 'Collapse'}
        >
          {isSidebarCollapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {mainNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                ${isActive(item.path)
                  ? 'bg-primary text-white'
                  : 'text-color-text-secondary hover:bg-color-bg-secondary'
                }
              `}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!isSidebarCollapsed && (
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium truncate">{item.label}</p>
                  <p className="text-xs opacity-75 truncate">{item.description}</p>
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-6 pt-6 border-t border-color-border-primary px-2">
            <button
              onClick={() => setIsAdminOpen(!isAdminOpen)}
              className={`
                w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors
                ${isAdminActive
                  ? 'bg-primary text-white'
                  : 'text-color-text-secondary hover:bg-color-bg-secondary'
                }
              `}
              title={isSidebarCollapsed ? 'Admin' : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Settings size={20} className="flex-shrink-0" />
                {!isSidebarCollapsed && <span className="text-sm font-medium">Admin</span>}
              </div>
              {!isSidebarCollapsed && (
                <ChevronDown
                  size={16}
                  className={`transition-transform ${isAdminOpen ? 'rotate-180' : ''}`}
                />
              )}
            </button>

            {/* Admin submenu */}
            {isAdminOpen && !isSidebarCollapsed && (
              <div className="mt-2 space-y-1">
                {adminItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                      ${isActive(item.path)
                        ? 'bg-primary text-white'
                        : 'text-color-text-tertiary hover:bg-color-bg-secondary'
                      }
                    `}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="border-t border-color-border-primary p-4"
        style={{ borderColor: 'var(--color-border-primary)' }}
      >
        <button
          onClick={() => navigate('/settings')}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
            ${isActive('/settings')
              ? 'bg-primary text-white'
              : 'text-color-text-secondary hover:bg-color-bg-secondary'
            }
          `}
          title={isSidebarCollapsed ? 'Settings' : undefined}
        >
          <Settings size={20} className="flex-shrink-0" />
          {!isSidebarCollapsed && <span className="text-sm font-medium">Settings</span>}
        </button>
      </div>
    </div>
  );
};

export default DesktopNav;
