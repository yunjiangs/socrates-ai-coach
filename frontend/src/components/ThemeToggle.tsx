import React, { useState, useEffect } from 'react';

type Theme = 'dark' | 'cyber';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme') as Theme;
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle('cyber-mode', saved === 'cyber');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'cyber' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('cyber-mode', newTheme === 'cyber');
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full cyber-card flex items-center justify-center text-xl hover:scale-110 transition-transform"
      title={theme === 'dark' ? '切换赛博模式' : '切换暗夜模式'}
    >
      {theme === 'dark' ? '🌃' : '☀️'}
    </button>
  );
}
