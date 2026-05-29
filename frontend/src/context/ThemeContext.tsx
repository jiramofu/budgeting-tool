import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    // Load from localStorage on initialization
    const saved = localStorage.getItem('theme') as ThemeMode | null;
    return saved || 'system';
  });

  const [isDark, setIsDark] = useState(false);

  // Handle theme changes
  const setTheme = (newTheme: ThemeMode) => {
    console.log('[ThemeContext] setTheme called with:', newTheme);
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // Apply theme to document
  const applyTheme = (themeMode: ThemeMode) => {
    console.log('[ThemeContext] applyTheme called with:', themeMode);
    const html = document.documentElement;

    if (themeMode === 'system') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        console.log('[ThemeContext] System prefers dark, adding dark class');
        html.classList.add('dark');
        setIsDark(true);
      } else {
        console.log('[ThemeContext] System prefers light, removing dark class');
        html.classList.remove('dark');
        setIsDark(false);
      }
    } else if (themeMode === 'dark') {
      console.log('[ThemeContext] Applying dark theme, adding dark class');
      html.classList.add('dark');
      setIsDark(true);
    } else {
      console.log('[ThemeContext] Applying light theme, removing dark class');
      html.classList.remove('dark');
      setIsDark(false);
    }
    console.log('[ThemeContext] Current dark classes:', html.classList.contains('dark'));
  };

  // Initialize theme on mount
  useEffect(() => {
    applyTheme(theme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
