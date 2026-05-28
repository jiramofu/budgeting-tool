import { useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * Hook for managing navigation state (sidebar collapse, responsive behavior)
 */
export function useNavigation() {
  // Sidebar collapse state (only for desktop)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage('navSidebarCollapsed', false);

  // Track viewport size for responsive behavior
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    // Initial check
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkScreenSize();

    // Add event listener for resize
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Get breakpoint state
  const isDesktop = !isMobile && !isTablet;

  // Toggle sidebar collapse (desktop only)
  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return {
    isSidebarCollapsed,
    toggleSidebarCollapse,
    isMobile,
    isTablet,
    isDesktop,
  };
}
