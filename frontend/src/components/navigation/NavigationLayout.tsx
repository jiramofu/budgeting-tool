import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../hooks/useNavigation';
import DesktopNav from './DesktopNav';
import MobileNav from './MobileNav';

interface NavigationLayoutProps {
  children: React.ReactNode;
}

export const NavigationLayout: React.FC<NavigationLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const { isSidebarCollapsed, toggleSidebarCollapse, isDesktop } = useNavigation();
  const [isAdmin, setIsAdmin] = useState(false);

  // Determine if user is admin (has owner or admin role)
  useEffect(() => {
    // This would typically come from the user object
    // For now, check if user has admin/owner role
    if (user?.role && ['owner', 'admin'].includes(user.role)) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  return (
    <div className="flex h-screen bg-color-bg-primary" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Desktop Navigation */}
      {isDesktop && (
        <DesktopNav
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          isAdmin={isAdmin}
        />
      )}

      {/* Main Content */}
      <main
        className={`
          flex-1 overflow-y-auto pb-24 md:pb-0
          ${isDesktop && !isSidebarCollapsed ? 'ml-64' : ''}
          ${isDesktop && isSidebarCollapsed ? 'ml-20' : ''}
          transition-all duration-300
        `}
      >
        {children}
      </main>

      {/* Mobile Navigation */}
      {!isDesktop && <MobileNav isAdmin={isAdmin} />}
    </div>
  );
};

export default NavigationLayout;
