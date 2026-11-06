import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ThemeMode } from '../types';
import { db, getOrCreatePreferences } from '../db';

interface ThemeContextType {
  theme: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // 1. Load preference from DB
    getOrCreatePreferences().then((prefs) => {
      if (prefs?.theme) {
        setThemeState(prefs.theme);
      }
    });

    // 2. Listen to system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const effectiveTheme: 'light' | 'dark' = theme === 'system' 
    ? (systemIsDark ? 'dark' : 'light') 
    : theme;

  useEffect(() => {
    // Update HTML attribute
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    
    // Update Meta theme color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', effectiveTheme === 'dark' ? '#0A0D14' : '#F7F4ED');
    }
  }, [effectiveTheme]);

  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    const prefs = await getOrCreatePreferences();
    await db.user_preferences.put({
      ...prefs,
      theme: newTheme
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
