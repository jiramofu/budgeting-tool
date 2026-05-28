import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  TrendingUp,
  Settings,
  X,
} from 'lucide-react';

interface MobileNavProps {
  isAdmin?: boolean;
}

interface TabItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  id: string;
}

interface AdminModalItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isAdmin = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [iconOnlyMode, setIconOnlyMode] = useState(window.innerWidth < 400);

  React.useEffect(() => {
    const handleResize = () => {
      setIconOnlyMode(window.innerWidth < 400);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tabs: TabItem[] = [
    {
      label: 'Dashboard',
      path: '/',
      icon: <LayoutDashboard size={24} />,
      id: 'dashboard',
    },
    {
      label: 'Budgets',
      path: '/budgeting',
      icon: <Wallet size={24} />,
      id: 'budgets',
    },
    {
      label: 'Transactions',
      path: '/search',
      icon: <Receipt size={24} />,
      id: 'transactions',
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: <TrendingUp size={24} />,
      id: 'reports',
    },
  ];

  const adminModalItems: AdminModalItem[] = [
    {
      label: 'Organization',
      path: '/admin/organization',
      icon: <Settings size={20} />,
    },
    {
      label: 'Members',
      path: '/admin/members',
      icon: <Wallet size={20} />,
    },
    {
      label: 'Audit Logs',
      path: '/admin/audit-logs',
      icon: <Receipt size={20} />,
    },
    {
      label: 'Analytics',
      path: '/admin/analytics',
      icon: <TrendingUp size={20} />,
    },
  ];

  const handleTabClick = (path: string) => {
    navigate(path);
  };

  const handleAdminItemClick = (path: string) => {
    navigate(path);
    setIsAdminModalOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;
  const isAdminActive = location.pathname.startsWith('/admin');

  return (
    <>
      {/* Mobile Tab Bar */}
      <div
        className="
          fixed bottom-0 left-0 right-0 flex items-center justify-around h-20
          border-t border-color-border-primary bg-color-bg-primary
          md:hidden z-40 safe-area-bottom
        "
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderColor: 'var(--color-border-primary)',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        {/* Main Tabs */}
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.path)}
            className={`
              flex flex-col items-center justify-center flex-1 h-16 gap-1 transition-colors
              ${isActive(tab.path)
                ? 'text-primary'
                : 'text-color-text-tertiary'
              }
            `}
            title={tab.label}
          >
            {tab.icon}
            {!iconOnlyMode && (
              <span
                className="text-xs font-medium text-color-text-primary"
                style={{ fontSize: '10px' }}
              >
                {tab.label}
              </span>
            )}
          </button>
        ))}

        {/* Admin Tab (if user is admin) */}
        {isAdmin && (
          <button
            onClick={() => setIsAdminModalOpen(true)}
            className={`
              flex flex-col items-center justify-center flex-1 h-16 gap-1 transition-colors
              ${isAdminActive
                ? 'text-primary'
                : 'text-color-text-tertiary'
              }
            `}
            title="Admin"
          >
            <Settings size={24} />
            {!iconOnlyMode && (
              <span
                className="text-xs font-medium text-color-text-primary"
                style={{ fontSize: '10px' }}
              >
                Admin
              </span>
            )}
          </button>
        )}
      </div>

      {/* Admin Modal */}
      {isAdminModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-50 md:hidden"
            onClick={() => setIsAdminModalOpen(false)}
          />

          {/* Modal Sheet */}
          <div
            className="
              fixed bottom-0 left-0 right-0 bg-color-bg-primary rounded-t-2xl
              shadow-elevation-3 z-50 md:hidden animate-slide-up
              max-h-96 overflow-y-auto
            "
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              boxShadow: 'var(--shadow-elevation-3)',
              animation: 'slideUp 200ms ease-in-out',
            }}
          >
            {/* Modal Header */}
            <div
              className="sticky top-0 flex items-center justify-between h-16 px-6 border-b border-color-border-primary"
              style={{ borderColor: 'var(--color-border-primary)' }}
            >
              <h3 className="text-lg font-semibold text-color-text-primary">Administration</h3>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="p-2 hover:bg-color-bg-secondary rounded-lg transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-2">
              {adminModalItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleAdminItemClick(item.path)}
                  className={`
                    w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors
                    ${isActive(item.path)
                      ? 'bg-primary text-white'
                      : 'text-color-text-secondary hover:bg-color-bg-secondary'
                    }
                  `}
                >
                  {item.icon}
                  <span className="text-base font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default MobileNav;
