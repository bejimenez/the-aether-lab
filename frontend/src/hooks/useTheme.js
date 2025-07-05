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
  const [theme, setThemeState] = useState(defaultTheme);

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
  };

  return { theme, setTheme, themes };
};