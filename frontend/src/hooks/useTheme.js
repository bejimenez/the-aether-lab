import { useState, useEffect } from 'react';

const themes = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'white', label: 'White Mana', icon: '⚪' },
  { value: 'blue', label: 'Blue Mana', icon: '🔵' },
  { value: 'black', label: 'Black Mana', icon: '⚫' },
  { value: 'green', label: 'Green Mana', icon: '🟢' },
  { value: 'red', label: 'Red Mana', icon: '🔴' }
];

export const useTheme = (defaultTheme = 'light') => {
  // Read theme from localStorage on initialization, fallback to defaultTheme
  const [theme, setThemeState] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme && themes.some(t => t.value === savedTheme) ? savedTheme : defaultTheme;
    } catch (error) {
      console.warn('Failed to read theme from localStorage:', error);
      return defaultTheme;
    }
  });

  useEffect(() => {
    const root = document.documentElement;

    // Remove all theme classes before adding the new one
    // This is more robust than wiping the entire className
    themes.forEach(t => {
      if (t.value !== 'light') {
        root.classList.remove(t.value);
      }
    });

    // Add the new theme class (e.g., "dark", "blue")
    if (theme !== 'light') {
      root.classList.add(theme);
    }
    
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    // Save theme to localStorage
    try {
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  };

  return { theme, setTheme, themes };
};