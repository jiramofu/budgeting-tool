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
  Target,
  AlertCircle,
  FileText,
  Search,
  Home,
  Bell,
  Mail,
  Upload,
  Zap,
  Heart,
  BarChart3,
  Clock,
  DollarSign,
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

interface SectionItem {
  label: string;
  path: string;
  icon: React.ReactNode;
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
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    planning: false,
    analysis: false,
    management: false,
    tools: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

  const planningItems: SectionItem[] = [
    { label: 'Goals', path: '/goals', icon: <Target size={18} /> },
    { label: 'Projections', path: '/projections', icon: <Clock size={18} /> },
    { label: 'Investments', path: '/investments', icon: <DollarSign size={18} /> },
    { label: 'Subscriptions', path: '/subscriptions', icon: <Wallet size={18} /> },
    { label: 'Templates', path: '/templates', icon: <FileText size={18} /> },
  ];

  const analysisItems: SectionItem[] = [
    { label: 'Analytics', path: '/analytics', icon: <BarChart3 size={18} /> },
    { label: 'Insights', path: '/insights', icon: <TrendingUp size={18} /> },
    { label: 'Smart Rules', path: '/smart-rules', icon: <Zap size={18} /> },
  ];

  const managementItems: SectionItem[] = [
    { label: 'Bills', path: '/bills', icon: <Receipt size={18} /> },
    { label: 'Alerts', path: '/alerts', icon: <AlertCircle size={18} /> },
    { label: 'Wellness', path: '/wellness', icon: <Heart size={18} /> },
    { label: 'Households', path: '/households', icon: <Home size={18} /> },
  ];

  const toolsItems: SectionItem[] = [
    { label: 'Import CSV', path: '/import', icon: <Upload size={18} /> },
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
        hidden lg:flex flex-col fixed left-0 top-16 bottom-0 z-40 bg-color-bg-primary border-r border-color-border-primary transition-all duration-300
        ${isSidebarCollapsed ? 'w-20' : 'w-64'}
      `}
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        borderColor: 'var(--color-border-primary)',
      }}
    >

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
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

        {/* Planning Section */}
        {!isSidebarCollapsed && (
          <div className="mt-6 pt-6 border-t border-color-border-primary px-2">
            <button
              onClick={() => toggleSection('planning')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-color-text-secondary hover:bg-color-bg-secondary transition-colors"
            >
              <span>Planning</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${expandedSections.planning ? 'rotate-180' : ''}`}
              />
            </button>
            {expandedSections.planning && (
              <div className="mt-2 space-y-1">
                {planningItems.map((item) => (
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

        {/* Analysis Section */}
        {!isSidebarCollapsed && (
          <div className="mt-6 pt-6 border-t border-color-border-primary px-2">
            <button
              onClick={() => toggleSection('analysis')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-color-text-secondary hover:bg-color-bg-secondary transition-colors"
            >
              <span>Analysis</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${expandedSections.analysis ? 'rotate-180' : ''}`}
              />
            </button>
            {expandedSections.analysis && (
              <div className="mt-2 space-y-1">
                {analysisItems.map((item) => (
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

        {/* Management Section */}
        {!isSidebarCollapsed && (
          <div className="mt-6 pt-6 border-t border-color-border-primary px-2">
            <button
              onClick={() => toggleSection('management')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-color-text-secondary hover:bg-color-bg-secondary transition-colors"
            >
              <span>Management</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${expandedSections.management ? 'rotate-180' : ''}`}
              />
            </button>
            {expandedSections.management && (
              <div className="mt-2 space-y-1">
                {managementItems.map((item) => (
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

        {/* Tools Section */}
        {!isSidebarCollapsed && (
          <div className="mt-6 pt-6 border-t border-color-border-primary px-2">
            <button
              onClick={() => toggleSection('tools')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-color-text-secondary hover:bg-color-bg-secondary transition-colors"
            >
              <span>Tools</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${expandedSections.tools ? 'rotate-180' : ''}`}
              />
            </button>
            {expandedSections.tools && (
              <div className="mt-2 space-y-1">
                {toolsItems.map((item) => (
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
        className="border-t border-color-border-primary p-2"
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
