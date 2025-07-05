import { Palette } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const ThemeSwitcher = () => {
  const { theme, setTheme, themes } = useTheme();

  return (
    <div className="flex items-center gap-3">
      <Palette className="w-4 h-4" />
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-background text-foreground"
      >
        {themes.map(t => (
          <option key={t.value} value={t.value}>
            {t.icon} {t.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ThemeSwitcher;