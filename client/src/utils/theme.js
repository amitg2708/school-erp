import { useState, useEffect } from 'react';

export const THEMES = [
  {
    id: 'executive',
    name: 'Executive Indigo',
    primaryColor: '#4f46e5',
    secondaryColor: '#06b6d4',
    badge: 'Default',
    description: 'Corporate royal indigo with vibrant cyan accents'
  },
  {
    id: 'prestige',
    name: 'Prestige Navy',
    primaryColor: '#1e40af',
    secondaryColor: '#0284c7',
    badge: 'Classic',
    description: 'Collegiate Oxford navy with dignified slate tones'
  },
  {
    id: 'emerald',
    name: 'Emerald Academy',
    primaryColor: '#059669',
    secondaryColor: '#0d9488',
    badge: 'Ivy League',
    description: 'Prestigious botanical emerald and sage highlights'
  },
  {
    id: 'obsidian',
    name: 'Obsidian Dark',
    primaryColor: '#818cf8',
    secondaryColor: '#38bdf8',
    badge: 'Dark Mode',
    description: 'Modern high-contrast dark theme with glowing neon accents'
  }
];

export function getCurrentTheme() {
  if (typeof window === 'undefined') return 'executive';
  return localStorage.getItem('erp_theme') || 'executive';
}

export function applyTheme(themeId) {
  if (typeof window === 'undefined') return;
  const valid = THEMES.some(t => t.id === themeId);
  const selected = valid ? themeId : 'executive';
  
  localStorage.setItem('erp_theme', selected);
  document.documentElement.setAttribute('data-theme', selected);
  
  // Dispatch custom event for cross-component sync
  window.dispatchEvent(new CustomEvent('erp_theme_changed', { detail: { theme: selected } }));
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => getCurrentTheme());

  useEffect(() => {
    // Ensure attribute matches current state
    document.documentElement.setAttribute('data-theme', theme);

    const handleThemeChange = (e) => {
      setThemeState(e.detail?.theme || getCurrentTheme());
    };

    window.addEventListener('erp_theme_changed', handleThemeChange);
    return () => window.removeEventListener('erp_theme_changed', handleThemeChange);
  }, [theme]);

  const changeTheme = (newTheme) => {
    applyTheme(newTheme);
    setThemeState(newTheme);
  };

  return { theme, setTheme: changeTheme, themes: THEMES };
}
